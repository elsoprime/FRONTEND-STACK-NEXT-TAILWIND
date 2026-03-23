"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventorySelectClassName } from "@/components/ui/inventory-records-shell";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import {
  createRequest,
  getSettings,
  listCategories,
  submitRequest,
  updateRequest,
} from "@/lib/api/expenses.client";
import {
  type CreateExpenseRequestInput,
  type ExpenseRequest,
  type UpdateExpenseRequestInput,
} from "@/lib/api/expenses.types";
import { ExpenseActionFeedback } from "@/modules/expenses/components/shared/ExpenseActionFeedback";

const expenseRequestFormSchema = z.object({
  title: z.string().trim().min(3, "El titulo debe tener al menos 3 caracteres."),
  categoryKey: z.string().trim().min(2, "Debes indicar una categoria."),
  subcategoryId: z.string().trim().optional(),
  amount: z
    .string()
    .trim()
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, "El monto debe ser mayor a 0."),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "La moneda debe tener formato ISO de 3 letras."),
  expenseDate: z.string().trim().min(1, "Debes indicar la fecha del gasto."),
  description: z.string().trim().max(2_000, "La descripcion excede el maximo permitido.").optional(),
});

type ExpenseRequestFormValues = z.infer<typeof expenseRequestFormSchema>;
type ExpenseRequestFormMode = "create" | "update";
type SaveIntent = "save" | "submit";

type ExpenseSubcategoryOption = {
  id: string;
  tenantId: string;
  categoryId: string;
  key: string;
  name: string;
  requiresAttachment: boolean;
  isActive: boolean;
  monthlyLimit: number | null;
};

export type ExpenseRequestFormInitialData = {
  requestId?: string;
  title?: string;
  categoryKey?: string;
  amount?: number;
  currency?: string;
  expenseDate?: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  subcategoryId?: string;
};

function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

async function listSubcategoriesApi(
  tenantId: string,
  categoryId: string,
): Promise<ExpenseSubcategoryOption[]> {
  const response = await apiRequest(
    `/api/v1/modules/expenses/subcategories?categoryId=${encodeURIComponent(categoryId)}&page=1&limit=100&includeInactive=false`,
    { tenantId },
  );
  const payload = response.data as { items?: unknown[] };

  return (payload.items ?? []).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id),
      tenantId: String(row.tenantId),
      categoryId: String(row.categoryId),
      key: String(row.key),
      name: String(row.name),
      requiresAttachment: Boolean(row.requiresAttachment),
      isActive: Boolean(row.isActive),
      monthlyLimit:
        row.monthlyLimit === null || row.monthlyLimit === undefined ? null : Number(row.monthlyLimit),
    };
  });
}

function buildRequestMetadata(
  values: ExpenseRequestFormValues,
  initialMetadata: Record<string, unknown> | undefined,
  selectedCategoryId: string | null,
  selectedSubcategory: ExpenseSubcategoryOption | null,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = { ...(initialMetadata ?? {}) };
  metadata.taxonomy = {
    categoryKey: values.categoryKey.trim(),
    categoryId: selectedCategoryId,
    subcategoryId: selectedSubcategory?.id ?? null,
    subcategoryKey: selectedSubcategory?.key ?? null,
  };

  return metadata;
}

function toCreatePayload(
  input: ExpenseRequestFormValues,
  metadata: Record<string, unknown>,
): CreateExpenseRequestInput {
  const normalizedDate = `${input.expenseDate}T00:00:00.000Z`;

  return {
    title: input.title.trim(),
    categoryKey: input.categoryKey.trim(),
    amount: Number(input.amount),
    currency: input.currency.trim().toUpperCase(),
    expenseDate: normalizedDate,
    description: input.description?.trim().length ? input.description.trim() : null,
    metadata,
  };
}

function toUpdatePayload(
  input: ExpenseRequestFormValues,
  metadata: Record<string, unknown>,
): UpdateExpenseRequestInput {
  return toCreatePayload(input, metadata);
}

type ExpenseRequestFormProps = {
  tenantId: string;
  mode: ExpenseRequestFormMode;
  initialData?: ExpenseRequestFormInitialData;
  onCompleted: (request: ExpenseRequest) => void;
  onCancel: () => void;
};

export function ExpenseRequestForm({
  tenantId,
  mode,
  initialData,
  onCompleted,
  onCancel,
}: ExpenseRequestFormProps) {
  const queryClient = useQueryClient();
  const [saveIntent, setSaveIntent] = useState<SaveIntent>("save");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "categories", "request-form"],
    queryFn: async () =>
      listCategories(tenantId, {
        page: 1,
        limit: 100,
        includeInactive: false,
      }),
  });

  const settingsQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "settings", "request-form"],
    queryFn: async () => getSettings(tenantId),
  });
  const defaultValues = useMemo<ExpenseRequestFormValues>(
    () => ({
      title: initialData?.title ?? "",
      categoryKey: initialData?.categoryKey ?? "",
      subcategoryId: initialData?.subcategoryId ?? "",
      amount: initialData?.amount !== undefined ? String(initialData.amount) : "",
      currency: (initialData?.currency ?? "CLP").toUpperCase(),
      expenseDate: toDateInputValue(initialData?.expenseDate),
      description: initialData?.description ?? "",
    }),
    [initialData],
  );

  const activeItems = categoriesQuery.data?.items ?? [];
  const categoryOptions =
    !initialData?.categoryKey || activeItems.some((item) => item.key === initialData.categoryKey)
      ? activeItems
      : [
          {
            id: "legacy-category",
            key: initialData.categoryKey,
            name: `${initialData.categoryKey} (historica)`,
            isActive: false,
            requiresAttachment: false,
            monthlyLimit: null,
            createdAt: "",
            updatedAt: "",
          },
          ...activeItems,
        ];

  const form = useForm<ExpenseRequestFormValues>({
    resolver: zodResolver(expenseRequestFormSchema),
    defaultValues,
  });

  const selectedCategoryKey = useWatch({
    control: form.control,
    name: "categoryKey",
  });
  const selectedCategory = useMemo(
    () => categoryOptions.find((item) => item.key === selectedCategoryKey) ?? null,
    [categoryOptions, selectedCategoryKey],
  );

  const subcategoriesQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "subcategories", "request-form", selectedCategory?.id ?? "none"],
    enabled: Boolean(selectedCategory?.id) && selectedCategory?.id !== "legacy-category",
    queryFn: async () => listSubcategoriesApi(tenantId, selectedCategory!.id),
  });
  const subcategoryOptions = useMemo(() => subcategoriesQuery.data ?? [], [subcategoriesQuery.data]);

  const policyCurrency = (settingsQuery.data?.allowedCurrencies[0] ?? "CLP").toUpperCase();

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    form.setValue("currency", policyCurrency, {
      shouldDirty: false,
      shouldValidate: true,
      shouldTouch: false,
    });
  }, [form, mode, policyCurrency]);

  useEffect(() => {
    const currentSubcategoryId = form.getValues("subcategoryId");
    if (!currentSubcategoryId) {
      return;
    }

    const selectedExists = subcategoryOptions.some((item) => item.id === currentSubcategoryId);
    if (!selectedExists) {
      form.setValue("subcategoryId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, subcategoryOptions]);

  const mutation = useMutation({
    mutationFn: async (values: ExpenseRequestFormValues) => {
      if (subcategoryOptions.length > 0 && !values.subcategoryId?.trim()) {
        form.setError("subcategoryId", {
          type: "manual",
          message: "Debes seleccionar una subcategoria para la categoria elegida.",
        });
        throw new Error("Subcategoria requerida por politica de catalogo.");
      }

      const selectedSubcategory =
        subcategoryOptions.find((item) => item.id === values.subcategoryId?.trim()) ?? null;
      const metadata = buildRequestMetadata(
        values,
        initialData?.metadata,
        selectedCategory?.id ?? null,
        selectedSubcategory,
      );

      let request: ExpenseRequest;

      if (mode === "create") {
        request = await createRequest(tenantId, toCreatePayload(values, metadata));
      } else {
        const requestId = initialData?.requestId;
        if (!requestId) {
          throw new Error("No se encontro el id de la solicitud a actualizar.");
        }

        request = await updateRequest(tenantId, requestId, toUpdatePayload(values, metadata));
      }

      if (saveIntent === "submit") {
        return submitRequest(tenantId, request.id);
      }

      return request;
    },
    onSuccess: async (request) => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "expenses"] });
      setFeedbackMessage(
        saveIntent === "submit" ? "Solicitud enviada a revision." : "Solicitud guardada en borrador.",
      );
      onCompleted(request);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError || error instanceof Error) {
        setFeedbackMessage(error.message);
        return;
      }

      setFeedbackMessage("No fue posible guardar la solicitud.");
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));
  const title = mode === "create" ? "Nueva solicitud de gasto" : "Editar solicitud de gasto";

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <header className="space-y-2">
        <h4 className="text-base font-semibold tracking-tight text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">
          Completa la informacion base y decide si deseas guardar en borrador o enviar al flujo.
        </p>
      </header>

      <FormSection
        title="Datos base"
        description="Identificacion operativa de la solicitud y categoria contable."
      >
        <FieldLabel htmlFor="expense-title" label="Titulo">
          <Input id="expense-title" {...form.register("title")} placeholder="Ej: Hotel visita cliente" />
          <FieldError message={form.formState.errors.title?.message} />
        </FieldLabel>

        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel htmlFor="expense-category" label="Categoria">
            <select
              id="expense-category"
              className={inventorySelectClassName}
              {...form.register("categoryKey")}
              disabled={categoriesQuery.isLoading || categoriesQuery.isError}
            >
              <option value="">
                {categoriesQuery.isLoading ? "Cargando categorias..." : "Selecciona una categoria"}
              </option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.key}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesQuery.isError ? (
              <p className="text-xs text-destructive">No se pudo cargar el catalogo de categorias.</p>
            ) : null}
            <FieldError message={form.formState.errors.categoryKey?.message} />
          </FieldLabel>
          <FieldLabel htmlFor="expense-currency" label="Moneda">
            <Input id="expense-currency" {...form.register("currency")} placeholder="CLP" disabled readOnly />
            {settingsQuery.isError ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                No se pudo resolver politicas del modulo. Se aplica fallback CLP.
              </p>
            ) : null}
            <FieldError message={form.formState.errors.currency?.message} />
          </FieldLabel>
        </div>

        <FieldLabel htmlFor="expense-subcategory" label="Subcategoria">
          <select
            id="expense-subcategory"
            className={inventorySelectClassName}
            {...form.register("subcategoryId")}
            disabled={!selectedCategory?.id || subcategoriesQuery.isLoading || subcategoriesQuery.isError}
          >
            <option value="">
              {!selectedCategory?.id
                ? "Primero selecciona una categoria"
                : subcategoriesQuery.isLoading
                  ? "Cargando subcategorias..."
                  : subcategoryOptions.length === 0
                    ? "Sin subcategorias activas (opcional)"
                    : "Selecciona una subcategoria"}
            </option>
            {subcategoryOptions.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          {subcategoriesQuery.isError ? (
            <p className="text-xs text-destructive">No se pudo cargar el catalogo de subcategorias.</p>
          ) : null}
          <FieldError message={form.formState.errors.subcategoryId?.message} />
        </FieldLabel>
      </FormSection>

      <FormSection
        title="Control financiero"
        description="Monto y fecha efectiva del gasto para el workflow del modulo."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel htmlFor="expense-amount" label="Monto">
            <Input id="expense-amount" type="number" step="0.01" min="0" {...form.register("amount")} />
            <FieldError message={form.formState.errors.amount?.message} />
          </FieldLabel>
          <FieldLabel htmlFor="expense-date" label="Fecha de gasto">
            <Input id="expense-date" type="date" {...form.register("expenseDate")} />
            <FieldError message={form.formState.errors.expenseDate?.message} />
          </FieldLabel>
        </div>
      </FormSection>

      <FormSection
        title="Descripcion"
        description="Contexto adicional para la revision y aprobacion de la solicitud."
      >
        <FieldLabel htmlFor="expense-description" label="Descripcion (opcional)">
          <textarea
            id="expense-description"
            className="min-h-24 w-full rounded-xl border border-border/80 bg-background/75 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/35"
            placeholder="Detalle del gasto"
            {...form.register("description")}
          />
          <FieldError message={form.formState.errors.description?.message} />
        </FieldLabel>
      </FormSection>

      {feedbackMessage ? (
        <ExpenseActionFeedback
          title="Resultado de la operacion"
          description={feedbackMessage}
          status={mutation.isError ? "error" : "success"}
          className="mt-1"
        />
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="secondary"
          disabled={mutation.isPending}
          onClick={() => setSaveIntent("save")}
        >
          {mutation.isPending && saveIntent === "save" ? "Guardando..." : "Guardar borrador"}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={mutation.isPending}
          onClick={() => setSaveIntent("submit")}
        >
          {mutation.isPending && saveIntent === "submit" ? "Enviando..." : "Guardar y enviar"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-border/80 bg-background/82 p-4">
      <div className="space-y-1">
        <h5 className="text-sm font-semibold text-foreground">{title}</h5>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="space-y-2 text-sm font-medium text-foreground">
      <span className="block py-2">{label}</span>
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}
