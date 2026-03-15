"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
    <main className="relative min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,oklch(0.6_0.08_42/0.18),transparent_38%),radial-gradient(circle_at_90%_6%,oklch(0.58_0.08_214/0.16),transparent_42%)]" />

      <section className="relative mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[920px] items-center justify-center">
        <article className="surface-card reveal-up w-full max-w-2xl overflow-hidden p-7 sm:p-8 [--reveal-delay:40ms]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/24 via-accent/16 to-transparent" />

          <div className="relative space-y-4">
            <Badge variant="outline" className="border-primary/35 bg-primary/12 text-primary">
              Sesion segura
            </Badge>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {copy.heading}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">{copy.description}</p>
            </div>

            {viewState.status === "loading" ? (
              <div className="rounded-xl border border-primary/35 bg-primary/14 px-4 py-3 text-primary">
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <LoaderCircle className="size-4 animate-spin" />
                  Procesando cierre de sesion...
                </div>
              </div>
            ) : null}

            {viewState.status === "error" ? (
              <article className="rounded-xl border border-destructive/45 bg-destructive/14 p-4 text-red-200">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">
                      No pudimos cerrar la sesion en este momento. Reintenta la operacion.
                    </p>
                    {viewState.traceId ? (
                      <p className="text-xs opacity-80">Referencia tecnica: {viewState.traceId}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => setAttempt((current) => current + 1)}>
                        Reintentar
                      </Button>
                      <Button type="button" variant="outline" onClick={() => router.push("/app")}>
                        Volver al dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            {viewState.status === "loading" ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                El estado local se limpia automaticamente al completar la operacion.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
