"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronRight,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import {
  createTenantInvitation,
  revokeTenantInvitation,
  transferTenantOwnership,
} from "@/features/tenant/tenant.service";
import { type MembershipView, type TenantSummary } from "@/features/tenant/tenant.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";

type MembersWorkspaceProps = {
  tenant: TenantSummary;
  membership: MembershipView;
  initialTab?: MembersTabKey;
};

type TeamMemberRow = {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  status: string;
  source: "runtime" | "mock";
};

export type MembersTabKey = "team" | "invitations" | "ownership" | "roadmap";

export function resolveMembersTabKey(value: string | null): MembersTabKey {
  switch (value) {
    case "invitations":
    case "ownership":
    case "roadmap":
      return value;
    default:
      return "team";
  }
}

type MembersTabItem = {
  key: MembersTabKey;
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MEMBERS_TABS: readonly MembersTabItem[] = [
  {
    key: "team",
    label: "Equipo",
    summary: "Miembros y accesos actuales",
    icon: Users,
  },
  {
    key: "invitations",
    label: "Invitaciones",
    summary: "Onboarding y revocacion",
    icon: UserPlus,
  },
  {
    key: "ownership",
    label: "Ownership",
    summary: "Transferencia de titularidad",
    icon: UserCog,
  },
  {
    key: "roadmap",
    label: "En desarrollo",
    summary: "Gobierno y acceso futuro",
    icon: Sparkles,
  },
] as const;

function buildMockTeamRows(
  tenant: TenantSummary,
  membership: MembershipView,
  user: ReturnType<typeof useSessionStore.getState>["user"],
): TeamMemberRow[] {
  const currentName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Usuario autenticado";
  const currentEmail = user?.email ?? "usuario@tenant.local";

  return [
    {
      id: membership.id,
      name: currentName,
      email: currentEmail,
      roleKey: membership.roleKey,
      status: membership.status,
      source: "runtime",
    },
    {
      id: `${tenant.id}-ops-01`,
      name: "Alicia Torres",
      email: "alicia.torres@demo.local",
      roleKey: "tenant:admin",
      status: "active",
      source: "mock",
    },
    {
      id: `${tenant.id}-ops-02`,
      name: "Bruno Caceres",
      email: "bruno.caceres@demo.local",
      roleKey: "tenant:member",
      status: "active",
      source: "mock",
    },
    {
      id: `${tenant.id}-ops-03`,
      name: "Camila Rojas",
      email: "camila.rojas@demo.local",
      roleKey: "tenant:member",
      status: "suspended",
      source: "mock",
    },
    {
      id: `${tenant.id}-ops-04`,
      name: "Diego Marin",
      email: "diego.marin@demo.local",
      roleKey: "tenant:admin",
      status: "active",
      source: "mock",
    },
    {
      id: `${tenant.id}-ops-05`,
      name: "Elena Soto",
      email: "elena.soto@demo.local",
      roleKey: "tenant:member",
      status: "active",
      source: "mock",
    },
    {
      id: `${tenant.id}-ops-06`,
      name: "Felipe Nunez",
      email: "felipe.nunez@demo.local",
      roleKey: "tenant:member",
      status: "active",
      source: "mock",
    },
    {
      id: `${tenant.id}-ops-07`,
      name: "Gabriela Vera",
      email: "gabriela.vera@demo.local",
      roleKey: "tenant:member",
      status: "suspended",
      source: "mock",
    },
  ];
}

export function MembersWorkspace({
  tenant,
  membership,
  initialTab = "team",
}: MembersWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<MembersTabKey>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <MembersWorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="overflow-hidden sm:p-5">
        {activeTab === "team" ? <MembersTeamTab tenant={tenant} membership={membership} /> : null}
        {activeTab === "invitations" ? (
          <MembersInvitationsTab tenant={tenant} membership={membership} />
        ) : null}
        {activeTab === "ownership" ? (
          <MembersOwnershipTab tenant={tenant} membership={membership} />
        ) : null}
        {activeTab === "roadmap" ? <MembersRoadmapTab /> : null}
      </section>
    </div>
  );
}

function MembersWorkspaceTabs({
  activeTab,
  onChange,
}: {
  activeTab: MembersTabKey;
  onChange: (key: MembersTabKey) => void;
}) {
  return (
    <section className="overflow-hidden rounded-md border-border/90 bg-card/96 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">Workspace Members</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Invitaciones, ownership y gobierno de acceso
          </h2>
          <p className="max-w-3xl text-sm dashboard-text-muted">
            Centraliza la administracion de miembros del tenant en una sola superficie y evita
            separar ownership e invitaciones en rutas aisladas.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Tabs del modulo members" className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-border/85 px-1">
          {MEMBERS_TABS.map((tab) => {
            const active = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`members-panel-${tab.key}`}
                onClick={() => startTransition(() => onChange(tab.key))}
                className={cn(
                  "group relative flex min-w-37.5 flex-col gap-1 px-4 py-3 text-left transition-colors",
                  active
                    ? "rounded-t-md border-b border-primary bg-white/10 text-primary shadow-lg"
                    : "text-foreground/58 hover:text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <tab.icon className={cn("size-4", active ? "text-primary" : "text-foreground/45")} />
                  {tab.label}
                </span>
                <span className={cn("text-xs text-foreground/60", active ? "font-bold" : "font-extralight")}>
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

function MembersTeamTab({
  tenant,
  membership,
}: {
  tenant: TenantSummary;
  membership: MembershipView;
}) {
  const user = useSessionStore((state) => state.user);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const rows = useMemo(() => buildMockTeamRows(tenant, membership, user), [membership, tenant, user]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div id="members-panel-team" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Equipo</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Miembros de acceso del tenant
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Vista paginada del equipo asociado al tenant activo. Mientras no exista endpoint de
          listado de miembros, esta tabla mezcla tu membresia real con registros mock visibles.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)]">
        <article className="surface-card overflow-hidden rounded-[1.5rem] border-border/90 bg-background/82">
          <div className="border-b border-border/70 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold tracking-tight text-foreground">
                  Equipo visible del tenant
                </h4>
                <p className="mt-1 text-sm dashboard-text-muted">
                  Tenant activo: {tenant.name}
                </p>
              </div>
              <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
                Fuente temporal: runtime + mock
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto px-5 py-4 sm:px-6">
            <table className="min-w-full divide-y divide-border/70 text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/58">
                  <th className="pb-3 pr-4">Nombre</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Rol</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3">Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-4 font-semibold text-foreground">{row.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="font-semibold">
                        {row.roleKey}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]",
                          row.status === "active"
                            ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-100"
                            : "border-border/80 bg-muted/30 text-muted-foreground",
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs font-medium text-foreground/60">{row.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border/70 px-5 py-4 sm:px-6">
            <InventoryPaginationControls
              page={safePage}
              totalPages={totalPages}
              total={rows.length}
              onPageChange={(nextPage) => setPage(Math.max(1, Math.min(totalPages, nextPage)))}
            />
          </div>
        </article>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Estado de la integracion
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>No existe todavia un endpoint para listar todos los miembros del tenant.</p>
              <p>La primera fila representa la membresia real de la sesion actual.</p>
              <p>El resto de registros son mock para validar layout, paginacion y jerarquia visual.</p>
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Siguiente accion recomendada
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Usa Invitaciones para onboarding y Ownership para cambios administrativos sensibles.</p>
            </div>
            <Link href="/app/members?tab=invitations" className="mt-5 inline-flex">
              <Button variant="secondary">
                <UserPlus className="size-4" />
                Abrir invitaciones
              </Button>
            </Link>
          </article>
        </aside>
      </div>
    </div>
  );
}

function MembersInvitationsTab({
  tenant,
  membership,
}: {
  tenant: TenantSummary;
  membership: MembershipView;
}) {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("tenant:member");
  const [revokeId, setRevokeId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const canInvite = hasTenantPermission(membership.roleKey, TENANT_PERMISSION_KEYS.INVITATIONS_CREATE);
  const canRevoke = hasTenantPermission(membership.roleKey, TENANT_PERMISSION_KEYS.INVITATIONS_REVOKE);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!canInvite) {
        throw new Error(resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"));
      }
      return createTenantInvitation(tenant.id, {
        email: inviteEmail.trim(),
        roleKey: inviteRole as "tenant:member" | "tenant:admin" | "tenant:owner",
      });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFeedback(`Invitacion enviada a ${response.data.invitation.email}.`);
      setInviteEmail("");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback(resolveTenantErrorMessage(error.code, error.message));
        return;
      }
      setFeedback(error instanceof Error ? error.message : resolveTenantErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!canRevoke) {
        throw new Error(resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"));
      }
      return revokeTenantInvitation(tenant.id, { invitationId: revokeId.trim() });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFeedback(`Invitacion revocada: ${response.data.invitation.email}.`);
      setRevokeId("");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback(resolveTenantErrorMessage(error.code, error.message));
        return;
      }
      setFeedback(error instanceof Error ? error.message : resolveTenantErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  return (
    <div id="members-panel-invitations" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Invitaciones</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Onboarding de miembros del tenant
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Envía invitaciones y revoca accesos pendientes desde una sola vista operativa para el
          tenant activo.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="space-y-4">
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
            <div className="space-y-2">
              <h4 className="text-base font-semibold tracking-tight text-foreground">
                Enviar invitacion
              </h4>
              <p className="text-sm dashboard-text-muted">
                Invita a un nuevo miembro al tenant {tenant.name} y define su rol inicial.
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">Email</label>
                <Input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Rol</label>
                <select
                  className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value)}
                >
                  <option value="tenant:member">tenant:member</option>
                  <option value="tenant:admin">tenant:admin</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
                Enviar invitacion
              </Button>
              {!canInvite ? (
                <p className="text-xs text-muted-foreground">
                  Esta accion requiere permisos de invitacion.
                </p>
              ) : null}
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
            <div className="space-y-2">
              <h4 className="text-base font-semibold tracking-tight text-foreground">
                Revocar invitacion
              </h4>
              <p className="text-sm dashboard-text-muted">
                Revoca una invitacion pendiente mediante su identificador.
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">ID de invitacion</label>
                <Input
                  value={revokeId}
                  onChange={(event) => setRevokeId(event.target.value)}
                  placeholder="507f191e810c19729de860ea"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => revokeMutation.mutate()}
                disabled={revokeMutation.isPending}
              >
                Revocar invitacion
              </Button>
              {!canRevoke ? (
                <p className="text-xs text-muted-foreground">
                  Esta accion requiere permisos de revocacion.
                </p>
              ) : null}
            </div>
          </article>

          {feedback ? (
            <article className="rounded-md border border-border/80 bg-background/70 p-3 text-sm text-foreground">
              {feedback}
            </article>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Estado del acceso
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Rol actual: {membership.roleKey}</p>
              <p>El tenant activo es {tenant.name}.</p>
              <p>Las invitaciones nuevas deben mantenerse alineadas a la politica vigente del equipo.</p>
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Siguiente superficie
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Usa Ownership solo para cambios controlados de titularidad del tenant.</p>
            </div>
            <Link href="/app/members?tab=ownership" className="mt-5 inline-flex">
              <Button variant="tertiary">
                <UserCog className="size-4" />
                Abrir ownership
              </Button>
            </Link>
          </article>
        </aside>
      </div>
    </div>
  );
}

function MembersOwnershipTab({
  tenant,
  membership,
}: {
  tenant: TenantSummary;
  membership: MembershipView;
}) {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [targetUserId, setTargetUserId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const canTransfer = hasTenantPermission(membership.roleKey, TENANT_PERMISSION_KEYS.OWNERSHIP_TRANSFER);

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!canTransfer) {
        throw new Error(resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"));
      }
      return transferTenantOwnership(tenant.id, { targetUserId: targetUserId.trim() });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFeedback("Ownership transferido correctamente.");
      setTargetUserId("");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback(resolveTenantErrorMessage(error.code, error.message));
        return;
      }
      setFeedback(error instanceof Error ? error.message : resolveTenantErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  return (
    <div id="members-panel-ownership" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Ownership</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Transferencia de titularidad del tenant
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Realiza cambios de ownership en una superficie controlada y separada del flujo de
          invitaciones ordinarias.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
          <div className="space-y-2">
            <h4 className="text-base font-semibold tracking-tight text-foreground">
              Usuario destino
            </h4>
            <p className="text-sm dashboard-text-muted">
              Ingresa el ID del usuario que recibirá el ownership del tenant {tenant.name}.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="field-label">User ID</label>
              <Input
                value={targetUserId}
                onChange={(event) => setTargetUserId(event.target.value)}
                placeholder="507f191e810c19729de860ea"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => transferMutation.mutate()} disabled={transferMutation.isPending}>
              Transferir ownership
            </Button>
            {!canTransfer ? (
              <p className="text-xs text-muted-foreground">
                Esta accion requiere permisos de ownership.
              </p>
            ) : null}
          </div>

          {feedback ? (
            <article className="mt-4 rounded-md border border-border/80 bg-background/70 p-3 text-sm text-foreground">
              {feedback}
            </article>
          ) : null}
        </article>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Consideraciones
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Esta accion cambia el control administrativo principal del tenant.</p>
              <p>Debe usarse solo para cambios operativos reales y validados.</p>
              <p>El rol actual para esta sesion es {membership.roleKey}.</p>
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Vuelve a invitaciones
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Gestiona onboarding y revocacion sin mezclarlo con la transferencia de ownership.</p>
            </div>
            <Link href="/app/members?tab=invitations" className="mt-5 inline-flex">
              <Button variant="secondary">
                <ChevronRight className="size-4" />
                Abrir invitaciones
              </Button>
            </Link>
          </article>
        </aside>
      </div>
    </div>
  );
}

function MembersRoadmapTab() {
  return (
    <div id="members-panel-roadmap" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">En desarrollo</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Gobierno y acceso futuro del tenant
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Superficie evolutiva para politicas de acceso, auditoria de membresias y aprobaciones de
          cambios sensibles.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MembersRoadmapCard
          title="Politicas de invitacion"
          description="Aprobacion previa por rol, expiracion automatica y restricciones por dominio corporativo."
        />
        <MembersRoadmapCard
          title="Auditoria de accesos"
          description="Trazabilidad de invitaciones, revocaciones y transferencias de ownership por actor y timestamp."
        />
        <MembersRoadmapCard
          title="Aprobaciones sensibles"
          description="Flujo de doble confirmacion para ownership y cambios administrativos de alto impacto."
        />
      </div>
    </div>
  );
}

function MembersRoadmapCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
      <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
        No disponible
      </Badge>
      <div className="mt-4 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <ShieldCheck className="size-4" />
      </div>
      <h4 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed dashboard-text-muted">{description}</p>
    </article>
  );
}
