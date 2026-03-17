"use client";

import { useQuery } from "@tanstack/react-query";
import { AccessDeniedPanel } from "@/components/tenant/access-denied-panel";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { resolvePlanAllowedModuleKeys } from "@/features/billing/plan-catalog";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import {
  hasAllTenantPermissions,
  TENANT_PERMISSION_KEYS,
} from "@/features/tenant/tenant-permissions";
import {
  resolveTenantModuleState,
  type TenantModuleState,
} from "@/features/tenant/tenant-runtime-guards";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { type MembershipView, type TenantView } from "@/features/tenant/tenant.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

export type ModuleGateConfig = {
  moduleKey: string;
  requiredPermissions: readonly string[];
  skipModuleState?: boolean;
};

function resolveModuleErrorCopy(state: TenantModuleState, moduleLabel: string): string {
  if (state === "enabled") {
    return `${moduleLabel} esta habilitado en el runtime pero aun no esta activo.`;
  }

  return `${moduleLabel} no esta habilitado para este tenant.`;
}

type TenantModuleGateProps = {
  tenant: TenantView;
  membership: MembershipView;
  moduleLabel: string;
  config: ModuleGateConfig;
  children: React.ReactNode;
};

export function TenantModuleGate({
  tenant,
  membership,
  moduleLabel,
  config,
  children,
}: TenantModuleGateProps) {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const setEffectiveRuntime = useTenantStore((state) => state.setEffectiveRuntime);

  const runtimeQuery = useQuery({
    queryKey: queryKeys.tenantSettingsEffective(tenant.id),
    queryFn: async () => {
      const response = await getTenantSettingsEffective(tenant.id);
      setLastTraceId(response.traceId);
      setEffectiveRuntime(response.data.settings.runtime ?? null);
      return response.data.settings.runtime ?? null;
    },
  });

  if (runtimeQuery.isLoading || (runtimeQuery.isFetching && !runtimeQuery.data)) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-6"
        label="Validando permisos y runtime..."
        hint="Sincronizando modulo y contexto tenant."
      />
    );
  }

  if (runtimeQuery.error) {
    const code =
      runtimeQuery.error instanceof ApiRequestError
        ? runtimeQuery.error.code
        : "GEN_INTERNAL_ERROR";
    const message =
      runtimeQuery.error instanceof ApiRequestError
        ? resolveTenantErrorMessage(runtimeQuery.error.code, runtimeQuery.error.message)
        : resolveTenantErrorMessage("GEN_INTERNAL_ERROR");
    const isPaymentRequired = code === "TENANT_SUBSCRIPTION_PAYMENT_REQUIRED";

    return (
      <AccessDeniedPanel
        title={isPaymentRequired ? "Suscripcion con pago pendiente" : "Error de runtime"}
        message={message}
        code={code}
        actionLabel={isPaymentRequired ? "Ir a Billing" : undefined}
        actionHref={isPaymentRequired ? "/app/settings/billing" : undefined}
      />
    );
  }

  const runtime = runtimeQuery.data;
  const moduleState = resolveTenantModuleState(runtime, config.moduleKey);
  const hasPermission = hasAllTenantPermissions(membership.roleKey, config.requiredPermissions);

  if (!hasPermission) {
    return (
      <AccessDeniedPanel
        message={resolveTenantErrorMessage("RBAC_PERMISSION_DENIED")}
        code="RBAC_PERMISSION_DENIED"
      />
    );
  }

  if (!config.skipModuleState && moduleState !== "active") {
    if (runtimeQuery.isFetching) {
      return (
        <LoadingScreen
          variant="inline"
          className="mt-6"
          label="Sincronizando estado del modulo..."
          hint="Verificando runtime efectivo del tenant."
        />
      );
    }

    const effectivePlanId = runtime?.planId ?? tenant.planId ?? null;
    const expectedModules = resolvePlanAllowedModuleKeys(effectivePlanId);
    const shouldBeEnabledByPlan = expectedModules.includes(config.moduleKey);
    const tenantHintsModuleActive = tenant.activeModuleKeys.includes(config.moduleKey);

    if (!runtime && tenantHintsModuleActive) {
      return (
        <LoadingScreen
          variant="inline"
          className="mt-6"
          label="Sincronizando estado del modulo..."
          hint="Aplicando contexto efectivo del tenant seleccionado."
        />
      );
    }

    if (shouldBeEnabledByPlan || tenantHintsModuleActive) {
      // Runtime can lag behind tenant switch/refresh. Avoid false UI denial and let backend enforce.
      return <>{children}</>;
    }
    return (
      <AccessDeniedPanel
        message={resolveModuleErrorCopy(moduleState, moduleLabel)}
        code={moduleState === "enabled" ? "RBAC_MODULE_DENIED" : "RBAC_PLAN_DENIED"}
      />
    );
  }

  return <>{children}</>;
}

export const MODULE_GUARDS = {
  inventory: {
    moduleKey: "inventory",
    requiredPermissions: [TENANT_PERMISSION_KEYS.MODULE_INVENTORY_USE],
  },
  crm: {
    moduleKey: "crm",
    requiredPermissions: [TENANT_PERMISSION_KEYS.MODULE_CRM_USE],
  },
  hr: {
    moduleKey: "hr",
    requiredPermissions: [TENANT_PERMISSION_KEYS.MODULE_HR_USE],
  },
  audit: {
    moduleKey: "audit",
    requiredPermissions: [TENANT_PERMISSION_KEYS.AUDIT_READ],
    skipModuleState: true,
  },
} as const;
