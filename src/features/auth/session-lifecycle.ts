import { type QueryClient } from "@tanstack/react-query";
import { refreshBrowserSession } from "@/features/auth/auth.service";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

let restoreBrowserSessionInFlight: Promise<string> | null = null;

export function clearClientAuthState(queryClient: QueryClient): void {
  useSessionStore.getState().clearSession();
  useTenantStore.getState().clearTenantContext();
  queryClient.clear();
}

export async function restoreBrowserSession(): Promise<string> {
  if (!restoreBrowserSessionInFlight) {
    restoreBrowserSessionInFlight = (async () => {
      const response = await refreshBrowserSession();

      useSessionStore.getState().setSessionFromLogin({
        session: response.data,
        traceId: response.traceId,
      });
      useSessionStore.getState().setLastTraceId(response.traceId);

      return response.traceId;
    })().finally(() => {
      restoreBrowserSessionInFlight = null;
    });
  }

  return restoreBrowserSessionInFlight;
}
