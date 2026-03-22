"use client";

import { cn } from "@/lib/utils";

type ExpenseDashboardKpis = {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  pendingAmount: number;
};

export function ExpensesKpiStrip({
  kpis,
  currency = "CLP",
}: {
  kpis: ExpenseDashboardKpis;
  currency?: string;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="expenses-dashboard-kpis">
      <KpiCard label="Solicitudes" value={kpis.totalRequests.toLocaleString("es-CL")} tone="default" />
      <KpiCard label="Pendientes" value={kpis.pendingRequests.toLocaleString("es-CL")} tone="warning" />
      <KpiCard label="Aprobadas" value={kpis.approvedRequests.toLocaleString("es-CL")} tone="success" />
      <KpiCard label="Rechazadas" value={kpis.rejectedRequests.toLocaleString("es-CL")} tone="warning" />
      <KpiCard label="Monto total" value={formatAmount(kpis.totalAmount, currency)} tone="default" />
      <KpiCard label="Monto pendiente" value={formatAmount(kpis.pendingAmount, currency)} tone="muted" />
    </section>
  );
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warning" | "success" | "muted";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-400/35 bg-amber-400/10"
      : tone === "success"
        ? "border-emerald-400/35 bg-emerald-400/10"
        : tone === "muted"
          ? "border-border/80 bg-background/65"
          : "border-primary/25 bg-primary/10";

  return (
    <article className={cn("surface-card rounded-[1.35rem] border-border/90 p-4", toneClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/62">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </article>
  );
}