"use client";

type ExpenseDashboardAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
};

export function ExpensesOperationalAlerts({ alerts }: { alerts: ExpenseDashboardAlert[] }) {
  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5" data-testid="expenses-dashboard-alerts">
      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">Alertas operativas</h4>
      <div className="mt-3 space-y-2.5">
        {alerts.map((alert) => (
          <div key={alert.id} className={`rounded-xl border px-3 py-2 text-sm ${resolveTone(alert.severity)}`}>
            <p className="font-semibold">{alert.title}</p>
            <p className="mt-1 text-xs opacity-90">{alert.description}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function resolveTone(severity: ExpenseDashboardAlert["severity"]): string {
  if (severity === "critical") {
    return "border-destructive/35 bg-destructive/10 text-destructive";
  }

  if (severity === "warning") {
    return "border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100";
  }

  return "border-primary/25 bg-primary/10 text-primary";
}