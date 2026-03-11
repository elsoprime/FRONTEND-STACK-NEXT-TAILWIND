"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutAllSessions, logoutCurrentSession } from "@/features/auth/auth.service";
import { clearClientAuthState } from "@/features/auth/session-lifecycle";
import { ApiRequestError } from "@/lib/api/client";
import { useSessionStore } from "@/store/session-store";

type LogoutMode = "current" | "all";

type LogoutFlowProps = {
  mode: LogoutMode;
};

type LogoutViewState = { status: "loading" } | { status: "error"; traceId: string | null };

function resolveCopy(mode: LogoutMode): {
  heading: string;
  description: string;
  successRedirect: string;
} {
  if (mode === "all") {
    return {
      heading: "Cerrando todas las sesiones",
      description:
        "Revocamos todas las sesiones activas y limpiaremos el estado local al finalizar.",
      successRedirect: "/login?loggedOut=all",
    };
  }

  return {
    heading: "Cerrando sesion",
    description: "Estamos revocando la sesion activa y limpiando el estado local del navegador.",
    successRedirect: "/login?loggedOut=1",
  };
}

export function LogoutFlow({ mode }: LogoutFlowProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [attempt, setAttempt] = useState(0);
  const [viewState, setViewState] = useState<LogoutViewState>({ status: "loading" });

  useEffect(() => {
    let isActive = true;
    const { successRedirect } = resolveCopy(mode);

    async function executeLogout(): Promise<void> {
      setViewState({ status: "loading" });

      try {
        const response = mode === "all" ? await logoutAllSessions() : await logoutCurrentSession();
        setLastTraceId(response.traceId);
        clearClientAuthState(queryClient);

        if (isActive) {
          router.replace(successRedirect);
        }
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setLastTraceId(error.traceId ?? null);

          if (error.status === 401 || error.status === 403) {
            clearClientAuthState(queryClient);

            if (isActive) {
              router.replace(successRedirect);
            }
            return;
          }

          if (isActive) {
            setViewState({
              status: "error",
              traceId: error.traceId ?? null,
            });
          }
          return;
        }

        if (isActive) {
          setViewState({
            status: "error",
            traceId: null,
          });
        }
      }
    }

    void executeLogout();

    return () => {
      isActive = false;
    };
  }, [attempt, mode, queryClient, router, setLastTraceId]);

  const copy = resolveCopy(mode);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
          Sesion segura
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{copy.heading}</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{copy.description}</p>

        {viewState.status === "loading" ? (
          <div className="mt-8 inline-flex items-center gap-3 rounded-md border border-blue-300/70 bg-blue-50/70 px-4 py-3 text-sm font-semibold text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            <LoaderCircle className="size-4 animate-spin" />
            Procesando cierre de sesion...
          </div>
        ) : null}

        {viewState.status === "error" ? (
          <article className="mt-8 rounded-md border border-red-300/70 bg-red-50/70 p-4 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  No pudimos cerrar la sesion en este momento. Reintenta la operacion.
                </p>
                {viewState.traceId ? (
                  <p className="text-xs opacity-80">Referencia tecnica: {viewState.traceId}</p>
                ) : null}
                <div className="flex gap-3">
                  <Button type="button" onClick={() => setAttempt((current) => current + 1)}>
                    Reintentar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/app")}>
                    Volver al shell
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
