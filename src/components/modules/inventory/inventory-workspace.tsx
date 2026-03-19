"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  Box,
  ChevronRight,
  LayoutGrid,
  Package,
  ScanSearch,
  Settings2,
  Warehouse,
} from "lucide-react";
import { InventoryDashboardHub } from "@/components/modules/inventory/inventory-dashboard-hub";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import {
  getInventoryReconciliation,
  getInventorySettings,
  listInventoryExpiringLotAlerts,
  listInventoryLowStockAlerts,
  updateInventorySettings,
} from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import Image from "next/image";

type InventoryWorkspaceProps = {
  tenantId: string;
  initialTab?: InventoryTabKey;
};

export type InventoryTabKey = "principal" | "submodules" | "reconciliation" | "alerts" | "settings";

export function resolveInventoryTabKey(value: string | null): InventoryTabKey {
  switch (value) {
    case "submodules":
    case "reconciliation":
    case "alerts":
    case "settings":
      return value;
    default:
      return "principal";
  }
}

type InventoryTabItem = {
  key: InventoryTabKey;
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
};

const INVENTORY_TABS: readonly InventoryTabItem[] = [
  {
    key: "principal",
    label: "Panel Principal",
    summary: "Entrada ejecutiva del modulo",
    icon: LayoutGrid,
  },
  {
    key: "submodules",
    label: "Sub Modulos",
    summary: "Grid de modulos activos",
    icon: Box,
  },
  {
    key: "reconciliation",
    label: "Reconciliacion",
    summary: "Balance y drift operativo",
    icon: ScanSearch,
  },
  {
    key: "alerts",
    label: "Alertas",
    summary: "Bajo stock y vencimientos",
    icon: BellRing,
  },
  {
    key: "settings",
    label: "Configuracion",
    summary: "Politicas y capacidades",
    icon: Settings2,
  },
] as const;

type InventoryLaunchCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  imageSrc?: string;
  imageAlt?: string;
  imageClassName?: string;
  overlayClassName?: string;
  accentClassName?: string;
};

const INVENTORY_LAUNCH_CARDS: readonly InventoryLaunchCard[] = [
  {
    title: "Categorias",
    description: "Clasificacion del inventario para busqueda y orden interno.",
    href: "/app/inventory/categories",
    icon: LayoutGrid,
    imageSrc: "/images/box-categories.avif",
    imageAlt: "Vista operativa de items de inventario",
    imageClassName: "object-center",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-violet-700/35",
    accentClassName: "text-violet-100 border-violet-200/20 bg-violet-300/12",
  },
  {
    title: "Items",
    description: "Catalogo, SKU y stock minimo desde una vista operativa.",
    href: "/app/inventory/items",
    icon: Package,
    imageSrc: "/images/box-items.avif",
    imageAlt: "Vista operativa de items de inventario",
    imageClassName: "object-center",
    overlayClassName: "from-slate-950/92 via-slate-900/70 to-sky-700/40",
    accentClassName: "text-sky-100 border-sky-200/20 bg-sky-300/12",
  },
  {
    title: "Bodegas",
    description: "Control de ubicaciones activas y operacion distribuida.",
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
    description: "Trazabilidad, vencimientos y disponibilidad por item.",
    href: "/app/inventory/lots",
    icon: Box,
    imageSrc: "/images/box-lots.avif",
    imageAlt: "Seguimiento de lotes y vencimientos",
    imageClassName: "object-[center_62%]",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-amber-700/35",
    accentClassName: "text-amber-100 border-amber-200/20 bg-amber-300/12",
  },
  {
    title: "Conteo",
    description: "Sesiones de stocktake y conciliacion por bodega.",
    href: "/app/inventory/stocktakes",
    icon: ScanSearch,
    imageSrc: "/images/box-stocktakes.avif",
    imageAlt: "Conteo de inventario por bodega",
    imageClassName: "object-[center_38%]",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-rose-700/35",
    accentClassName: "text-rose-100 border-rose-200/20 bg-rose-300/12",
  },
  {
    title: "Movimientos",
    description: "Entradas y salidas con foco en continuidad operativa.",
    href: "/app/inventory/stock",
    icon: ChevronRight,
    imageSrc: "/images/box-stock.avif",
    imageAlt: "Movimientos de stock del inventario",
    imageClassName: "object-[center_58%]",
    overlayClassName: "from-slate-950/92 via-slate-900/68 to-cyan-700/35",
    accentClassName: "text-cyan-100 border-cyan-200/20 bg-cyan-300/12",
  },
] as const;

export function InventoryWorkspace({
  tenantId,
  initialTab = "principal",
}: InventoryWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<InventoryTabKey>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <InventoryWorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="overflow-hidden sm:p-5">
        {activeTab === "principal" ? <InventoryDashboardHub tenantId={tenantId} /> : null}
        {activeTab === "submodules" ? <InventorySubmodulesTab /> : null}
        {activeTab === "reconciliation" ? <InventoryReconciliationTab tenantId={tenantId} /> : null}
        {activeTab === "alerts" ? <InventoryAlertsTab tenantId={tenantId} /> : null}
        {activeTab === "settings" ? <InventorySettingsTab tenantId={tenantId} /> : null}
      </section>
    </div>
  );
}

function InventoryWorkspaceTabs({
  activeTab,
  onChange,
}: {
  activeTab: InventoryTabKey;
  onChange: (key: InventoryTabKey) => void;
}) {
  return (
    <section className="overflow-hidden rounded-md border-border/90 bg-card/96 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">Workspace Inventory</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Navegacion interna del modulo
          </h2>
          <p className="max-w-3xl text-sm dashboard-text-muted">
            Cada vista se renderiza dentro de la misma ruta para mantener continuidad operativa y
            lectura fluida del contexto.
          </p>
        </div>
      </div>

      {/** Tabs de navegacion interna del workspace, con enfoque en lectura y continuidad del contexto */}
      <div role="tablist" aria-label="Tabs del modulo inventory" className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 px-1 border-b border-border/85">
          {INVENTORY_TABS.map((tab) => {
            const active = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`inventory-panel-${tab.key}`}
                onClick={() => startTransition(() => onChange(tab.key))}
                className={cn(
                  "group relative flex min-w-37.5 flex-col gap-1 px-4 py-3 text-left transition-colors",
                  active
                    ? "rounded-t-md border-b border-primary text-primary bg-white/10 shadow-lg"
                    : "text-foreground/58 hover:text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <tab.icon
                    className={cn("size-4", active ? "text-primary" : "text-foreground/45")}
                  />
                  {tab.label}
                </span>
                <span
                  className={cn(
                    "text-xs text-foreground/60",
                    active ? "font-bold" : "font-extralight",
                  )}
                >
                  {tab.summary}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InventorySubmodulesTab() {
  return (
    <div id="inventory-panel-submodules" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Sub Modulos</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Grid de accesos activos
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Vista de lanzamiento para las superficies operativas del modulo, con un lenguaje visual
          consistente con el dashboard y sin transformar los tabs en botones.
        </p>
      </header>

      {/** Grid de tarjetas de lanzamiento a sub modulos activos dentro del modulo de inventory */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INVENTORY_LAUNCH_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="surface-card surface-card-hover group relative isolate overflow-hidden rounded-[1.5rem] border-border/90 bg-card/96 p-5"
          >
            <Image
              src={card.imageSrc ?? "/images/box-items.avif"}
              alt={card.imageAlt ?? "Imagen del modulo"}
              fill
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-105 opacity-20",
                card.imageClassName,
              )}
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              priority={false}
            />
            <div className={cn("absolute inset-0 bg-linear-to-r ", card.overlayClassName)} />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-slate-950/90 to-transparent" />
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-r",
                card.accentClassName,
              )}
            />
            <div className="relative flex h-full min-h-45 flex-col justify-between">
              <div className="space-y-4">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <card.icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold tracking-tight text-foreground">
                    {card.title}
                  </h4>
                  <p className="text-sm leading-relaxed dashboard-text-muted">{card.description}</p>
                </div>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Abrir modulo
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function InventoryReconciliationTab({ tenantId }: { tenantId: string }) {
  const [sinceDays, setSinceDays] = useState(7);

  const reportQuery = useQuery({
    queryKey: [...queryKeys.inventoryReconciliation(tenantId), "embedded-report", sinceDays],
    queryFn: async () => getInventoryReconciliation(tenantId, { sinceDays }),
  });

  return (
    <div id="inventory-panel-reconciliation" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Reconciliacion</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Balance operativo y drift
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Compara movimientos y balance consolidado sin abandonar el contexto principal del modulo.
        </p>
      </header>

      <div className="border-b border-border/85">
        <div className="flex flex-wrap gap-5">
          {[1, 7, 30].map((days) => (
            <button
              key={days}
              type="button"
              className={cn(
                "border-b-2 pb-3 text-sm font-semibold transition-colors",
                sinceDays === days
                  ? "border-primary text-foreground"
                  : "border-transparent text-foreground/58 hover:text-foreground",
              )}
              onClick={() => setSinceDays(days)}
            >
              Ventana {days} dia{days > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {reportQuery.isLoading ? (
        <LoadingScreen
          variant="inline"
          label="Cargando reconciliacion..."
          hint="Comparando movimientos, balances y drift del tenant activo."
        />
      ) : null}

      {reportQuery.error ? <InlineInventoryError error={reportQuery.error} /> : null}

      {reportQuery.data ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <InventoryInfoCard
              label="Estado"
              value={reportQuery.data.data.report.status}
              hint="Resultado actual de la reconciliacion."
            />
            <InventoryInfoCard
              label="Drift"
              value={String(reportQuery.data.data.report.drift)}
              hint="Diferencia entre movimientos y balance."
            />
            <InventoryInfoCard
              label="Movimientos"
              value={String(reportQuery.data.data.report.movementCount)}
              hint="Eventos considerados en la ventana activa."
            />
            <InventoryInfoCard
              label="Balance total"
              value={String(reportQuery.data.data.report.balanceTotal)}
              hint="Total consolidado segun balance operativo."
            />
            <InventoryInfoCard
              label="Stock total items"
              value={String(reportQuery.data.data.report.itemStockTotal)}
              hint="Stock agregado desde el catalogo."
            />
            <InventoryInfoCard
              label="Comparado"
              value={formatSpanishLongDate(reportQuery.data.data.report.comparedAt)}
              hint="Marca temporal del ultimo cruce."
            />
          </section>

          <aside className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Lectura recomendada
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Usa ventanas cortas para aislar desviaciones operativas puntuales.</p>
              <p>
                Si el estado indica drift, cruza el `traceId` en auditoria antes de ajustar stock.
              </p>
              <p>Trabaja primero sobre bodegas o items con mayor impacto operativo.</p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function InventoryAlertsTab({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const [withinDays, setWithinDays] = useState(30);
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const limit = 8;

  const lowStockQuery = useQuery({
    queryKey: [...queryKeys.inventoryLowStockAlerts(tenantId), "embedded-list", page, limit],
    queryFn: async () => listInventoryLowStockAlerts(tenantId, { page, limit }),
  });

  const expiringLotsQuery = useQuery({
    queryKey: [
      ...queryKeys.inventoryExpiringLotAlerts(tenantId),
      "embedded-list",
      page,
      limit,
      withinDays,
    ],
    queryFn: async () =>
      listInventoryExpiringLotAlerts(tenantId, {
        page,
        limit,
        withinDays,
      }),
  });

  useEffect(() => {
    const traceId = lowStockQuery.data?.traceId ?? expiringLotsQuery.data?.traceId ?? null;
    if (traceId) {
      setLastTraceId(traceId);
    }
  }, [expiringLotsQuery.data?.traceId, lowStockQuery.data?.traceId, setLastTraceId]);

  return (
    <div id="inventory-panel-alerts" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Alertas</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Riesgos de continuidad operativa
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Bajo stock y proximidad de vencimiento dentro de una misma superficie, sin cambiar de
          ruta.
        </p>
      </header>

      <div className="flex items-center gap-3 border-b border-border/85 pb-3">
        <label className="text-sm font-semibold text-foreground">Vencimientos:</label>
        <select
          className="h-10 rounded-xl border border-border/85 bg-background/90 px-3 text-sm text-foreground"
          value={withinDays}
          onChange={(event) => {
            setWithinDays(Number(event.target.value));
            setPage(1);
          }}
        >
          <option value={7}>Proximos 7 dias</option>
          <option value={30}>Proximos 30 dias</option>
          <option value={90}>Proximos 90 dias</option>
        </select>
      </div>

      {lowStockQuery.isLoading || expiringLotsQuery.isLoading ? (
        <LoadingScreen
          variant="inline"
          label="Cargando alertas..."
          hint="Validando niveles de stock y fechas de vencimiento."
        />
      ) : null}

      {lowStockQuery.error || expiringLotsQuery.error ? (
        <InlineInventoryError error={lowStockQuery.error ?? expiringLotsQuery.error} />
      ) : null}

      {!lowStockQuery.isLoading &&
      !expiringLotsQuery.isLoading &&
      !lowStockQuery.error &&
      !expiringLotsQuery.error ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <InventoryListSurface
            title="Bajo stock"
            emptyLabel="No hay alertas de bajo stock."
            items={(lowStockQuery.data?.data.items ?? []).map((alert) => ({
              id: alert.item.id,
              title: alert.item.name,
              meta: `Deficit actual: ${alert.deficit}`,
            }))}
          />

          <InventoryListSurface
            title="Lotes proximos a vencer"
            emptyLabel="No hay lotes proximos a vencer."
            items={(expiringLotsQuery.data?.data.items ?? []).map((alert) => ({
              id: alert.lot.id,
              title: alert.lot.lotCode,
              meta: alert.lot.expiresAt
                ? `${formatSpanishLongDate(alert.lot.expiresAt)} - ${alert.daysToExpiry} dias`
                : `Sin fecha - ${alert.daysToExpiry} dias`,
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}

function InventorySettingsTab({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: [...queryKeys.inventorySettings(tenantId), "embedded-current"],
    queryFn: async () => getInventorySettings(tenantId),
  });

  const mutation = useMutation({
    mutationFn: async (payload: Parameters<typeof updateInventorySettings>[1]) =>
      updateInventorySettings(tenantId, payload),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventorySettings(tenantId) });
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
        return;
      }

      setErrorMessage(resolveInventoryErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  return (
    <div id="inventory-panel-settings" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Configuracion</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Politicas y capacidades del modulo
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Ajustes de asignacion y rollout en una superficie de lectura clara y foco operativo.
        </p>
      </header>

      {settingsQuery.isLoading ? (
        <LoadingScreen variant="inline" label="Cargando configuracion..." />
      ) : null}

      {settingsQuery.error || !settingsQuery.data ? (
        settingsQuery.isLoading ? null : (
          <InlineInventoryError error={settingsQuery.error} />
        )
      ) : null}

      {settingsQuery.data ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InventoryInfoCard
                label="Politica lotes"
                value={settingsQuery.data.data.settings.lotAllocationPolicy}
                hint="Asigna prioridad de salida por politica activa."
              />
              <InventoryInfoCard
                label="Rollout"
                value={settingsQuery.data.data.settings.rolloutPhase}
                hint="Fase vigente del despliegue del modulo."
              />
              <InventoryInfoCard
                label="Bodegas"
                value={String(settingsQuery.data.data.settings.capabilities.warehouses)}
                hint="Capabilidad del tenant para ubicaciones."
              />
              <InventoryInfoCard
                label="Lotes"
                value={String(settingsQuery.data.data.settings.capabilities.lots)}
                hint="Capabilidad operativa de lotes."
              />
              <InventoryInfoCard
                label="Stocktakes"
                value={String(settingsQuery.data.data.settings.capabilities.stocktakes)}
                hint="Capacidad de conteo fisico activo."
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border/85 pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    lotAllocationPolicy:
                      settingsQuery.data?.data.settings.lotAllocationPolicy === "FIFO"
                        ? "FEFO"
                        : "FIFO",
                  })
                }
              >
                Alternar FIFO/FEFO
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    capabilities: {
                      lots: !settingsQuery.data?.data.settings.capabilities.lots,
                    },
                  })
                }
              >
                Alternar capabilidad lotes
              </Button>
            </div>

            {errorMessage ? (
              <article className="rounded-xl border border-red-300/80 bg-red-100/70 p-4 text-sm text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
                {errorMessage}
              </article>
            ) : null}
          </section>

          <aside className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Guia operativa
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>FIFO prioriza las entradas mas antiguas y mantiene rotacion estable.</p>
              <p>FEFO favorece lotes con vencimiento cercano cuando la operacion lo exige.</p>
              <p>Activa capacidades por tenant de forma gradual para evitar drift funcional.</p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function InventoryInfoCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="surface-card rounded-[1.35rem] border-border/90 bg-background/82 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/62">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm dashboard-text-muted">{hint}</p>
    </article>
  );
}

function InventoryListSurface({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: Array<{ id: string; title: string; meta: string }>;
}) {
  return (
    <section className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
      <h4 className="text-base font-semibold tracking-tight text-foreground">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-4 text-sm dashboard-text-muted">{emptyLabel}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border/85 bg-card/92 px-4 py-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs dashboard-text-muted">{item.meta}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function InlineInventoryError({ error }: { error: unknown }) {
  return (
    <article className="rounded-xl border border-red-300/80 bg-red-100/70 p-4 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
      <p className="text-sm font-semibold">
        {error instanceof ApiRequestError
          ? resolveInventoryErrorMessage(error.code, error.message)
          : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR")}
      </p>
    </article>
  );
}
