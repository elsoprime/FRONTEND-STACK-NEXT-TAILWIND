import { type QueryClient } from "@tanstack/react-query";
import { refreshBrowserSession } from "@/features/auth/auth.service";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

export function clearClientAuthState(queryClient: QueryClient): void {
  useSessionStore.getState().clearSession();
  useTenantStore.getState().clearTenantContext();
  queryClient.clear();
}

export async function restoreBrowserSession(): Promise<string> {
  const response = await refreshBrowserSession();

  useSessionStore.getState().setSessionFromLogin({
    session: response.data,
    traceId: response.traceId,
  });
  useSessionStore.getState().setLastTraceId(response.traceId);

  return response.traceId;
}
