"use client";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  Layers3,
  Package,
  PieChart as PieChartIcon,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  listInventoryExpiringLotAlerts,
  listInventoryItems,
  listInventoryLots,
  listInventoryLowStockAlerts,
  listInventoryStocktakes,
  listInventoryWarehouses,
} from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";

type InventoryDashboardHubProps = {
  tenantId: string;
};

const MOVEMENT_SERIES = [
  { label: "Lun", incoming: 42, outgoing: 31 },
  { label: "Mar", incoming: 55, outgoing: 28 },
  { label: "Mie", incoming: 38, outgoing: 34 },
  { label: "Jue", incoming: 61, outgoing: 40 },
  { label: "Vie", incoming: 48, outgoing: 36 },
  { label: "Sab", incoming: 28, outgoing: 18 },
] as const;

const STOCK_BY_WAREHOUSE = [
  { label: "Central", value: 36, color: "#22c55e" },
  { label: "Norte", value: 24, color: "#38bdf8" },
  { label: "Sur", value: 18, color: "#f59e0b" },
  { label: "Transit", value: 22, color: "#a855f7" },
] as const;

const INVENTORY_HEALTH_SERIES = [
  { label: "Normal", value: 62, color: "#22c55e" },
  { label: "Bajo stock", value: 18, color: "#f59e0b" },
  { label: "Por vencer", value: 12, color: "#f97316" },
  { label: "En conteo", value: 8, color: "#38bdf8" },
] as const;

function resolveErrorCopy(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return resolveInventoryErrorMessage(error.code, error.message);
  }

  return resolveInventoryErrorMessage("GEN_INTERNAL_ERROR");
}

export function InventoryDashboardHub({ tenantId }: InventoryDashboardHubProps) {
  const warehousesQuery = useQuery({
    queryKey: [...queryKeys.inventoryWarehouses(tenantId), "dashboard-summary"],
    queryFn: async () => listInventoryWarehouses(tenantId, { page: 1, limit: 100 }),
  });

  const lotsQuery = useQuery({
    queryKey: [...queryKeys.inventoryLots(tenantId), "dashboard-summary"],
    queryFn: async () => listInventoryLots(tenantId, { page: 1, limit: 100 }),
  });

  const stocktakesQuery = useQuery({
    queryKey: [...queryKeys.inventoryStocktakes(tenantId), "dashboard-summary"],
    queryFn: async () => listInventoryStocktakes(tenantId, { page: 1, limit: 100 }),
  });

  const itemsQuery = useQuery({
    queryKey: [...queryKeys.inventoryItems(tenantId), "dashboard-summary"],
    queryFn: async () => listInventoryItems(tenantId, { page: 1, limit: 100 }),
  });

  const lowStockQuery = useQuery({
    queryKey: [...queryKeys.inventoryLowStockAlerts(tenantId), "dashboard-summary"],
    queryFn: async () => listInventoryLowStockAlerts(tenantId, { page: 1, limit: 20 }),
  });

  const expiringQuery = useQuery({
    queryKey: [...queryKeys.inventoryExpiringLotAlerts(tenantId), "dashboard-summary"],
    queryFn: async () =>
      listInventoryExpiringLotAlerts(tenantId, { page: 1, limit: 20, withinDays: 30 }),
  });

  if (
    warehousesQuery.isLoading ||
    lotsQuery.isLoading ||
    stocktakesQuery.isLoading ||
    itemsQuery.isLoading ||
    lowStockQuery.isLoading ||
    expiringQuery.isLoading
  ) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando panel de inventario..."
        hint="Sincronizando resumen operativo y accesos rapidos."
      />
    );
  }

  const firstError =
    warehousesQuery.error ??
    lotsQuery.error ??
    stocktakesQuery.error ??
    itemsQuery.error ??
    lowStockQuery.error ??
    expiringQuery.error;

  if (firstError) {
    return (
      <article className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        <p className="text-sm font-semibold">{resolveErrorCopy(firstError)}</p>
      </article>
    );
  }

  const warehouses = warehousesQuery.data?.data.items ?? [];
  const warehousesCount = warehouses.filter((warehouse) => warehouse.isActive).length;
  const lotsCount = lotsQuery.data?.pagination.total ?? 0;
  const stocktakesCount = stocktakesQuery.data?.pagination.total ?? 0;
  const itemsCount = itemsQuery.data?.pagination.total ?? 0;
  const lowStockCount = lowStockQuery.data?.pagination.total ?? 0;
  const lowStockItems = lowStockQuery.data?.data.items ?? [];
  const expiringCount = expiringQuery.data?.pagination.total ?? 0;
  const stocktakes = stocktakesQuery.data?.data.items ?? [];
  const stockUnits = 2840;
  const urgentAlerts = lowStockCount + expiringCount;

  return (
    <div className="space-y-7">
      <section className="border-b border-border/85 pb-7">
        {/** Grid de tarjetas de lanzamiento a sub modulos activos dentro del modulo de inventory */}
        <article>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Resumen ejecutivo
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">KPIs del modulo</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Bodegas activas" value={String(warehousesCount)} icon={Warehouse} />
            <MetricCard label="Lotes" value={String(lotsCount)} icon={Layers3} />
            <MetricCard label="Conteos" value={String(stocktakesCount)} icon={ClipboardCheck} />
            <MetricCard
              label="Stock consolidado"
              value={stockUnits.toLocaleString("es-CL")}
              icon={Boxes}
            />
            <MetricCard label="Items" value={String(itemsCount)} icon={Package} />
            <MetricCard label="Alertas activas" value={String(urgentAlerts)} icon={AlertTriangle} />
          </div>
        </article>
      </section>
      {/* Las siguientes secciones de este dashboard son ejemplos estaticos para ilustrar el diseÃ±o y la experiencia, en una implementacion real se deberian conectar a datos reales y actualizar dinamicamente segun la operacion del tenant. Se recomienda priorizar la integracion de datos en la seccion de accesos rapidos y estado operativo, ya que son las mas criticas para la supervisiÃ³n diaria. Las secciones de movimientos de la semana y salud del inventario pueden ser implementadas en fases posteriores una vez que los datos historicos y de trazabilidad esten disponibles. */}
      <section className="grid gap-5 xl:grid-cols-3">
        <article className="surface-card rounded-2xl border-border/90 bg-card/92 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Movimientos de la semana
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Entradas y salidas</h2>
            </div>
          </div>
          {/* Grafica de movimientos */}
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOVEMENT_SERIES} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.18)" }}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.96)",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: "16px",
                    color: "#e2e8f0",
                  }}
                />
                <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: "12px" }} />
                <Bar dataKey="incoming" name="Entrante" radius={[8, 8, 0, 0]} fill="#38bdf8" />
                <Bar dataKey="outgoing" name="Saliente" radius={[8, 8, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        {/* Grafico de stock por bodega, ideal para visualizar la distribucion del inventario y detectar posibles cuellos de botella o sobrecargas en ciertas ubicaciones */}
        <article className="surface-card rounded-2xl border-border/90 bg-card/92 p-6">
          <div className="flex items-center gap-2">
            <PieChartIcon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Stock por bodega
            </h2>
          </div>

          {/* Este grafico es un ejemplo estatico, en una implementacion real se deberia calcular el porcentaje de stock por bodega en base a la capacidad y el stock actual. */}
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={STOCK_BY_WAREHOUSE}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.14)"
                  horizontal={false}
                />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${String(value ?? 0)}%`, "Stock"]}
                  cursor={{ fill: "rgba(15, 23, 42, 0.18)" }}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.96)",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: "16px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {STOCK_BY_WAREHOUSE.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface-card rounded-2xl border-border/90 bg-card/92 p-6">
          <div className="flex items-center gap-2">
            <PieChartIcon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Salud del inventario
            </h2>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={INVENTORY_HEALTH_SERIES}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={48}
                    outerRadius={74}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {INVENTORY_HEALTH_SERIES.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${String(value ?? 0)}%`, "Estado"]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.96)",
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      borderRadius: "16px",
                      color: "#e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {INVENTORY_HEALTH_SERIES.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/80 bg-background/60 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="text-sm text-muted-foreground">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        {/* Actividad reciente */}
        <article className="surface-card rounded-2xl border-border/90 bg-card/92 p-6">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Actividad reciente
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            {stocktakes.slice(0, 3).map((stocktake) => (
              <div
                key={stocktake.id}
                className="rounded-md border border-border/80 bg-background/60 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{stocktake.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {warehouses.find((warehouse) => warehouse.id === stocktake.warehouseId)
                        ?.name ?? "Bodega no disponible"}
                    </p>
                  </div>
                  <span className="dashboard-chip capitalize">{stocktake.status}</span>
                </div>
              </div>
            ))}

            {stocktakes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad reciente registrada.</p>
            ) : null}

            {lowStockItems.slice(0, 2).map((alert) => (
              <div
                key={alert.item.id}
                className="rounded-xl border border-amber-300/70 bg-amber-100/55 px-4 py-3 text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/14 dark:text-amber-100"
              >
                <p className="text-sm font-semibold">{alert.item.name}</p>
                <p className="mt-1 text-xs opacity-80">Deficit actual: {alert.deficit}</p>
              </div>
            ))}
          </div>
        </article>
        {/* Estado operativo */}
        <article className="surface-card rounded-2xl border-border/90 bg-card/92 p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Estado operativo
            </h2>
          </div>

          <div className="mt-4 grid gap-3">
            <StatusRow
              icon={TrendingUp}
              label="Entradas estables"
              detail="Recepcion semanal dentro del rango esperado."
            />
            <StatusRow
              icon={TrendingDown}
              label="Salidas controladas"
              detail="Despachos sin alertas de underflow en el panel actual."
            />
            <StatusRow
              icon={AlertTriangle}
              label="Alertas por revisar"
              detail={`${urgentAlerts} eventos entre bajo stock y lotes proximos a vencer.`}
            />
          </div>
        </article>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Package;
}) {
  return (
    <article className="surface-card surface-card-hover rounded-2xl border-border/85 bg-card/92 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
          <Icon className="size-4" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</p>
    </article>
  );
}

function StatusRow({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof TrendingUp;
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-border/80 bg-background/60 p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
