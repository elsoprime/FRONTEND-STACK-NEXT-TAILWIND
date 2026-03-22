"use client";

type ExpenseCategoryBreakdown = {
  categoryKey: string;
  label: string;
  totalAmount: number;
  requests: number;
};

export function ExpensesCategoryDistribution({
  categories,
  currency = "CLP",
}: {
  categories: ExpenseCategoryBreakdown[];
  currency?: string;
}) {
  const maxAmount = Math.max(1, ...categories.map((category) => category.totalAmount));

  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5" data-testid="expenses-dashboard-categories">
      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">Categorias top</h4>
      <p className="mt-2 text-sm text-muted-foreground">Distribucion por monto en las categorias con mayor peso.</p>

      <div className="mt-4 space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos de categorias para el filtro seleccionado.</p>
        ) : (
          categories.map((category) => {
            const width = Math.max(6, Math.round((category.totalAmount / maxAmount) * 100));
            return (
              <div key={category.categoryKey} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium text-foreground">{category.label}</p>
                  <p className="text-muted-foreground">{category.requests} solicitudes</p>
                </div>
                <div className="h-2 rounded-full bg-border/50">
                  <div className="h-2 rounded-full bg-cyan-500/70" style={{ width: `${width}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{formatAmount(category.totalAmount, currency)}</p>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}