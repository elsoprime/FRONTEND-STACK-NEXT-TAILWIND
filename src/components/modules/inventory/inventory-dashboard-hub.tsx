"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  Layers3,
  Package,
  PieChart as PieChartIcon,
  ShieldCheck,
  Tags,
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
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

type InventoryDashboardHubProps = {
  tenantId: string;
};

type QuickAccessCard = {
  title: string;
  description: string;
  href: string;
  icon: typeof Package;
  imageSrc: string;
  imageAlt: string;
  imageClassName?: string;
  overlayClassName: string;
  accentClassName: string;
};

const QUICK_ACCESS_CARDS: readonly QuickAccessCard[] = [
  {
    title: "Items",
    description: "Administra catalogo, SKU y stock minimo del tenant.",
    href: "/app/inventory/items",
    icon: Package,
    imageSrc: "/images/box-items.avif",
    imageAlt: "Vista operativa de items de inventario",
    imageClassName: "object-center",
    overlayClassName: "from-slate-950/92 via-slate-900/70 to-sky-700/40",
    accentClassName: "text-sky-100 border-sky-200/20 bg-sky-300/12",
  },
  {
    title: "Categorias",
    description: "Ordena familias de productos y mejora la clasificacion.",
    href: "/app/inventory/categories",
    icon: Tags,
    imageSrc: "/images/box-categories.avif",
    imageAlt: "Clasificacion de categorias de inventario",
    imageClassName: "object-center",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-violet-700/35",
    accentClassName: "text-violet-100 border-violet-200/20 bg-violet-300/12",
  },
  {
    title: "Bodegas",
    description: "Controla ubicaciones activas para la operacion diaria.",
    href: "/app/inventory/warehouses",
    icon: Warehouse,
    imageSrc: "/images/box-warehouse.avif",
    imageAlt: "Bodega principal del modulo inventario",
    imageClassName: "object-center",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-emerald-700/35",
    accentClassName: "text-emerald-100 border-emerald-200/20 bg-emerald-300/12",
  },
  {
    title: "Lotes",
    description: "Gestiona trazabilidad, vencimientos y disponibilidad.",
    href: "/app/inventory/lots",
    icon: Layers3,
    imageSrc: "/images/box-lots.avif",
    imageAlt: "Seguimiento de lotes y vencimientos",
    imageClassName: "object-[center_62%]",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-amber-700/35",
    accentClassName: "text-amber-100 border-amber-200/20 bg-amber-300/12",
  },
  {
    title: "Conteo",
    description: "Abre y supervisa sesiones de stocktake por bodega.",
    href: "/app/inventory/stocktakes",
    icon: ClipboardCheck,
    imageSrc: "/images/box-stocktakes.avif",
    imageAlt: "Conteo de inventario por bodega",
    imageClassName: "object-[center_38%]",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-rose-700/35",
    accentClassName: "text-rose-100 border-rose-200/20 bg-rose-300/12",
  },
  {
    title: "Stock",
    description: "Registra entradas y salidas de inventario con control operativo.",
    href: "/app/inventory/stock",
    icon: ArrowRightLeft,
    imageSrc: "/images/box-stock.avif",
    imageAlt: "Movimientos de stock del inventario",
    imageClassName: "object-[center_58%]",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-cyan-700/35",
    accentClassName: "text-cyan-100 border-cyan-200/20 bg-cyan-300/12",
  },
] as const;

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
  const expiringCount = expiringQuery.data?.pagination.total ?? 0;
  const stockUnits = 2840;
  const urgentAlerts = lowStockCount + expiringCount;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <article className="surface-card rounded-2xl border-border/85 bg-card/92 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Resumen ejecutivo
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">KPIs del modulo</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

        <article className="surface-card rounded-2xl border-border/85 bg-card/92 p-5">
          <div className="flex items-center gap-2">
            <PieChartIcon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Stock por bodega
            </h2>
          </div>

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
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
        <article className="surface-card rounded-2xl border-border/85 bg-card/92 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Movimientos de la semana
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Entradas y salidas</h2>
            </div>
          </div>

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

        <article className="surface-card rounded-2xl border-border/85 bg-card/92 p-5">
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

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Accesos rapidos
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">Submodulos operativos</h2>
          </div>
          <Link href="/app/audit">
            <Button size="sm" variant="toolbar">
              <ShieldCheck className="size-4" />
              Ir a auditoria
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACCESS_CARDS.map((card) => (
            <article
              key={card.href}
              className="surface-card surface-card-hover group relative flex min-h-[260px] overflow-hidden rounded-2xl border-border/85 bg-card/92"
            >
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                fill
                className={cn(
                  "object-cover transition-transform duration-500 group-hover:scale-105",
                  card.imageClassName,
                )}
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                priority={false}
              />
              <div className={cn("absolute inset-0 bg-gradient-to-br", card.overlayClassName)} />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/90 to-transparent" />

              <div className="relative z-10 flex h-full w-full flex-col justify-between p-5 text-white">
                <div>
                  <div
                    className={cn(
                      "inline-flex rounded-xl border p-3 backdrop-blur-sm",
                      card.accentClassName,
                    )}
                  >
                    <card.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-100/88">
                    {card.description}
                  </p>
                </div>

                <Link href={card.href} className="mt-5 inline-flex w-fit">
                  <Button size="default" variant="dashboard" className="pr-2.5">
                    Abrir modulo
                    <ArrowUpRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <article className="surface-card rounded-2xl border-border/85 bg-card/92 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
            Estado operativo
          </h2>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
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
    <div className="rounded-xl border border-border/80 bg-background/60 p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
