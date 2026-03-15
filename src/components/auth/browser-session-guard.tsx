"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearClientAuthState, restoreBrowserSession } from "@/features/auth/session-lifecycle";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ApiRequestError } from "@/lib/api/client";
import { useSessionStore } from "@/store/session-store";

type BrowserSessionGuardProps = {
  children: React.ReactNode;
};

export function BrowserSessionGuard({ children }: BrowserSessionGuardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    let isActive = true;

    void restoreBrowserSession()
      .then(() => undefined)
      .catch((error: unknown) => {
        if (error instanceof ApiRequestError) {
          setLastTraceId(error.traceId ?? null);
        }

        clearClientAuthState(queryClient);

        if (isActive) {
          router.replace("/login?expired=1");
        }
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, queryClient, router, setLastTraceId]);

  if (!isAuthenticated) {
    return (
      <LoadingScreen
        label="Restaurando sesion segura..."
        hint="Validando credenciales y proteccion CSRF antes de acceder al dashboard."
      />
    );
  }

  return <>{children}</>;
}
