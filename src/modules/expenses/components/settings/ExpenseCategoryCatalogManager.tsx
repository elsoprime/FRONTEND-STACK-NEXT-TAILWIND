"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import { listCategories } from "@/lib/api/expenses.client";
import { queryKeys } from "@/lib/query/query-keys";
import { ExpenseCategoriesManager } from "@/modules/expenses/components/settings/ExpenseCategoriesManager";
import { ExpenseCategoryBulkCreateDialog } from "@/modules/expenses/components/settings/ExpenseCategoryBulkCreateDialog";


type ExpenseSubcategoryItem = {
  id: string;
  tenantId: string;
  categoryId: string;
  key: string;
  name: string;
  requiresAttachment: boolean;
  isActive: boolean;
  monthlyLimit: number | null;
};

async function listSubcategoriesApi(tenantId: string, categoryId: string): Promise<ExpenseSubcategoryItem[]> {
  const response = await apiRequest(`/api/v1/modules/expenses/subcategories?categoryId=${categoryId}&page=1&limit=100&includeInactive=true`, {
    tenantId,
  });
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
        row.monthlyLimit === null || row.monthlyLimit === undefined
          ? null
          : Number(row.monthlyLimit),
    };
  });
}

async function createSubcategoryApi(
  tenantId: string,
  input: {
    categoryId: string;
    key: string;
    name: string;
    requiresAttachment: boolean;
    monthlyLimit: number | null;
  },
): Promise<void> {
  await apiRequest(`/api/v1/modules/expenses/subcategories`, {
    method: "POST",
    tenantId,
    body: input,
  });
}
export function ExpenseCategoryCatalogManager({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subcategoryKey, setSubcategoryKey] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [requiresAttachment, setRequiresAttachment] = useState(true);
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const categoriesQuery = useQuery({
    queryKey: queryKeys.expenseCatalogGovernance(tenantId),
    queryFn: async () =>
      listCategories(tenantId, {
        page: 1,
        limit: 100,
        includeInactive: true,
      }),
  });

  const existingKeys = useMemo(
    () => (categoriesQuery.data?.items ?? []).map((item) => item.key),
    [categoriesQuery.data?.items],
  );

  const selectedCategory = useMemo(
    () => (categoriesQuery.data?.items ?? []).find((item) => item.id === selectedCategoryId) ?? null,
    [categoriesQuery.data?.items, selectedCategoryId],
  );

  const subcategoriesQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "subcategories", selectedCategoryId],
    enabled: selectedCategoryId.length > 0,
    queryFn: async () => listSubcategoriesApi(tenantId, selectedCategoryId),
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategoryId) {
        throw new Error("Debes seleccionar una categoria.");
      }

      return createSubcategoryApi(tenantId, {
        categoryId: selectedCategoryId,
        key: subcategoryKey.trim(),
        name: subcategoryName.trim(),
        requiresAttachment,
        monthlyLimit: monthlyLimit.trim().length > 0 ? Number(monthlyLimit) : null,
      });
    },
    onSuccess: async () => {
      setFeedback("Subcategoria creada correctamente.");
      setSubcategoryKey("");
      setSubcategoryName("");
      setMonthlyLimit("");
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "expenses", "subcategories", selectedCategoryId] });
    },
    onError: (error: unknown) => {
      setFeedback(error instanceof Error ? error.message : "No se pudo crear la subcategoria.");
    },
  });

  return (
    <div className="space-y-4">
      <ExpenseCategoriesManager tenantId={tenantId} />

      <section className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-lg font-semibold tracking-tight text-foreground">Gobernanza de catalogo</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Estandariza nomenclatura y administra subcategorias reales por categoria.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setBulkCreateOpen(true)}
              data-testid="expenses-category-governance-bulk-create-button"
            >
              <Sparkles className="size-4" />
              Alta masiva guiada
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-cyan-300/35 bg-cyan-400/10 text-cyan-700 dark:text-cyan-100">
              Catalogo jerarquico activo
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/80 bg-background/82">
              {existingKeys.length} categorias controladas
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/80 bg-background/82">
              {(subcategoriesQuery.data ?? []).length} subcategorias visibles
            </Badge>
          </div>
        </header>

        <article className="mt-4 rounded-xl border border-border/70 bg-background/85 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Layers3 className="mt-0.5 size-4 text-primary" />
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">Regla vigente de taxonomia</p>
              <p>1. Selecciona categoria padre.</p>
              <p>2. Crea subcategorias reales (`categoryId + key`).</p>
              <p>3. Mantiene trazabilidad operativa y prepara reglas por subcategoria.</p>
            </div>
          </div>
        </article>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-foreground">Categoria padre</span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              data-testid="expenses-subcategory-parent-select"
            >
              <option value="">Selecciona una categoria</option>
              {(categoriesQuery.data?.items ?? [])
                .filter((item) => item.isActive)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-foreground">Key subcategoria</span>
            <Input
              value={subcategoryKey}
              onChange={(event) => setSubcategoryKey(event.target.value)}
              placeholder="travel_hotel"
              data-testid="expenses-subcategory-key-input"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-foreground">Nombre</span>
            <Input
              value={subcategoryName}
              onChange={(event) => setSubcategoryName(event.target.value)}
              placeholder="Hoteles"
              data-testid="expenses-subcategory-name-input"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-foreground">Limite mensual (opcional)</span>
            <Input
              type="number"
              min="0"
              value={monthlyLimit}
              onChange={(event) => setMonthlyLimit(event.target.value)}
              placeholder="250000"
              data-testid="expenses-subcategory-limit-input"
            />
          </label>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={requiresAttachment}
            onChange={(event) => setRequiresAttachment(event.target.checked)}
            data-testid="expenses-subcategory-requires-attachment"
          />
          Requiere adjunto
        </label>

        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="primary"
            onClick={() => createSubcategoryMutation.mutate()}
            disabled={createSubcategoryMutation.isPending}
            data-testid="expenses-subcategory-create-button"
          >
            {createSubcategoryMutation.isPending ? "Creando..." : "Crear subcategoria"}
          </Button>
        </div>

        {selectedCategory ? (
          <div className="mt-4 rounded-xl border border-border/70 bg-background/80 p-4">
            <p className="text-sm font-semibold text-foreground">
              Subcategorias de: <span className="text-primary">{selectedCategory.name}</span>
            </p>
            <div className="mt-3 space-y-2">
              {(subcategoriesQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin subcategorias registradas.</p>
              ) : (
                (subcategoriesQuery.data ?? []).map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-background px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.key}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{item.isActive ? "Activa" : "Inactiva"}</Badge>
                      <Badge variant="outline">{item.requiresAttachment ? "Adjunto" : "Sin adjunto"}</Badge>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        ) : null}

        {feedback ? (
          <article className="mt-4 rounded-xl border border-border/80 bg-background/82 px-4 py-3 text-sm text-muted-foreground" role="status">
            {feedback}
          </article>
        ) : null}
      </section>

      <ExpenseCategoryBulkCreateDialog
        open={bulkCreateOpen}
        tenantId={tenantId}
        existingKeys={existingKeys}
        onOpenChange={setBulkCreateOpen}
        onCompleted={async (result) => {
          setFeedback(
            `Gobernanza aplicada. Procesadas: ${result.processed}. Exitos: ${result.succeeded}. Fallos: ${result.failed}.`,
          );
          await queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories(tenantId) });
          await queryClient.invalidateQueries({ queryKey: queryKeys.expenseCatalogGovernance(tenantId) });
        }}
      />
    </div>
  );
}
