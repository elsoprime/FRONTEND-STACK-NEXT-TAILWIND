"use client";

import { type ReactNode, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventorySelectClassName } from "@/components/ui/inventory-records-shell";
import { ApiRequestError } from "@/lib/api/client";
import {
  createRequest,
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

export type ExpenseRequestFormInitialData = {
  requestId?: string;
  title?: string;
  categoryKey?: string;
  amount?: number;
  currency?: string;
  expenseDate?: string;
  description?: string | null;
};

function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function toCreatePayload(input: ExpenseRequestFormValues): CreateExpenseRequestInput {
  return {
    title: input.title.trim(),
    categoryKey: input.categoryKey.trim(),
    amount: Number(input.amount),
    currency: input.currency.trim().toUpperCase(),
    expenseDate: input.expenseDate,
    description: input.description?.trim().length ? input.description.trim() : null,
  };
}

function toUpdatePayload(input: ExpenseRequestFormValues): UpdateExpenseRequestInput {
  return toCreatePayload(input);
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

  const defaultValues = useMemo<ExpenseRequestFormValues>(
    () => ({
      title: initialData?.title ?? "",
      categoryKey: initialData?.categoryKey ?? "",
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

  const mutation = useMutation({
    mutationFn: async (values: ExpenseRequestFormValues) => {
      let request: ExpenseRequest;

      if (mode === "create") {
        request = await createRequest(tenantId, toCreatePayload(values));
      } else {
        const requestId = initialData?.requestId;
        if (!requestId) {
          throw new Error("No se encontro el id de la solicitud a actualizar.");
        }

        request = await updateRequest(tenantId, requestId, toUpdatePayload(values));
      }

      if (saveIntent === "submit") {
        return submitRequest(tenantId, request.id);
      }

      return request;
    },
    onSuccess: async (request) => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "expenses"] });
      setFeedbackMessage(
        saveIntent === "submit"
          ? "Solicitud enviada a revision."
          : "Solicitud guardada en borrador.",
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
            <Input id="expense-currency" {...form.register("currency")} placeholder="CLP" />
            <FieldError message={form.formState.errors.currency?.message} />
          </FieldLabel>
        </div>
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
      <span>{label}</span>
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

