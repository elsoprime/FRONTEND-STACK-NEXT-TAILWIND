"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCategories } from "@/lib/api/expenses.client";
import { queryKeys } from "@/lib/query/query-keys";
import { ExpenseCategoriesManager } from "@/modules/expenses/components/settings/ExpenseCategoriesManager";
import { ExpenseCategoryBulkCreateDialog } from "@/modules/expenses/components/settings/ExpenseCategoryBulkCreateDialog";

export function ExpenseCategoryCatalogManager({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <ExpenseCategoriesManager tenantId={tenantId} />

      <section className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-lg font-semibold tracking-tight text-foreground">Gobernanza de catalogo</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Estandariza nomenclatura de categorias y prepara estructura para subcategorias.
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
              Convencion activa
            </Badge>
            <Badge variant="outline" className="rounded-full border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100">
              Subcategorias: contrato pendiente API
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/80 bg-background/82">
              {existingKeys.length} keys controladas
            </Badge>
          </div>
        </header>

        <article className="mt-4 rounded-xl border border-border/70 bg-background/85 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Layers3 className="mt-0.5 size-4 text-primary" />
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">Regla propuesta de taxonomia</p>
              <p>1. Categoria principal en `snake_case` (ej: `travel`).</p>
              <p>2. Subcategoria por convencion de key (`travel_local`, `travel_hotel`).</p>
              <p>3. Al habilitar contrato backend de subcategorias, se migra sin romper keys historicas.</p>
            </div>
          </div>
        </article>

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
