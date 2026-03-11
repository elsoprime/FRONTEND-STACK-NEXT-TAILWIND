"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearClientAuthState, restoreBrowserSession } from "@/features/auth/session-lifecycle";
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
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
            <LoaderCircle className="size-5 animate-spin" />
            <p className="text-sm font-semibold">Restaurando sesion segura...</p>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-300/70 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p className="text-sm">
              Estamos validando tus cookies de sesion y tu token CSRF antes de mostrar contenido
              protegido.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
