import { type QueryKey, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

function matchesTenantScopedQueryKey(queryKey: QueryKey, tenantId: string): boolean {
  const [first, second] = queryKey;

  if (first === "tenant" && second === tenantId) {
    return true;
  }

  if (typeof first === "string") {
    return first.startsWith(`tenant:${tenantId}:`);
  }

  return false;
}

export function clearPreviousTenantScopedQueries(
  queryClient: QueryClient,
  previousTenantId: string | null,
): void {
  if (!previousTenantId) {
    return;
  }

  queryClient.removeQueries({
    predicate: (query) => matchesTenantScopedQueryKey(query.queryKey, previousTenantId),
  });
}

export async function invalidateTenantRuntimeQueries(
  queryClient: QueryClient,
  tenantId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.tenantSettings(tenantId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.tenantSettingsEffective(tenantId) }),
  ]);
}
