import {
  type ActiveTenantContext,
  type TenantShellBootstrapResult,
} from "@/features/tenant/tenant-context.schemas";
import {
  getMyTenantMembershipSummaries,
  switchActiveTenant,
} from "@/features/tenant/tenant.service";

export type TenantEntryRoute = "/app" | "/app/tenants/create" | "/app/tenants/select";

export function resolveTenantEntryRoute(count: number): TenantEntryRoute {
  if (count === 0) {
    return "/app/tenants/create";
  }

  if (count === 1) {
    return "/app";
  }

  return "/app/tenants/select";
}

export async function bootstrapTenantShell(): Promise<TenantShellBootstrapResult> {
  const { items, traceId } = await getMyTenantMembershipSummaries();

  if (items.length === 0) {
    return {
      status: "no_tenants",
      items: [],
      traceId,
    };
  }

  const activeItem = items.find((item) => item.isActive);

  if (activeItem) {
    return {
      status: "ready",
      tenant: activeItem.tenant,
      membership: activeItem.membership,
      traceId,
      switched: false,
      items,
    };
  }

  if (items.length === 1) {
    const switched = await switchActiveTenant({
      tenantId: items[0].tenant.id,
    });

    return {
      status: "ready",
      tenant: switched.data.tenant,
      membership: switched.data.membership,
      traceId: switched.traceId,
      switched: true,
      items,
    };
  }

  return {
    status: "selection_required",
    items,
    traceId,
  };
}

export function toActiveTenantContext(input: ActiveTenantContext): ActiveTenantContext {
  return {
    tenant: input.tenant,
    membership: input.membership,
  };
}
