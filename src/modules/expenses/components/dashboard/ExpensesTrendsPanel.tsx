"use client";

type ExpenseTrendPoint = {
  day: string;
  requested: number;
  approved: number;
  rejected: number;
};

export function ExpensesTrendsPanel({ trends }: { trends: ExpenseTrendPoint[] }) {
  const maxValue = Math.max(1, ...trends.map((trend) => trend.requested));

  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5" data-testid="expenses-dashboard-trends">
      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">Tendencia operativa</h4>
      <p className="mt-2 text-sm text-muted-foreground">Volumen diario de solicitudes en el rango seleccionado.</p>
      <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10 xl:grid-cols-15">
        {trends.map((trend) => {
          const height = Math.max(8, Math.round((trend.requested / maxValue) * 72));
          return (
            <div key={trend.day} className="space-y-2 text-center">
              <div className="flex h-20 items-end justify-center rounded-md border border-border/60 bg-background/80 px-1 pb-1">
                <div className="w-full rounded-sm bg-primary/70" style={{ height }} title={`Solicitudes: ${trend.requested}`} />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">{trend.day}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}