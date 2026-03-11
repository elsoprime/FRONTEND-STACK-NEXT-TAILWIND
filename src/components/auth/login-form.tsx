"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, ShieldAlert, ShieldCheck, Mail, Lock, Info } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { resolveAuthErrorMessage } from "@/features/auth/error-code-map";
import { loginAndBootstrapSession, type PostLoginRoute } from "@/features/auth/auth.service";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email valido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; nextRoute: PostLoginRoute }
  | { status: "error"; code: string; statusCode?: number };

function resolveSuccessCopy(nextRoute: PostLoginRoute): string {
  if (nextRoute === "/app/tenants/create") {
    return "Sesion iniciada. Redirigiendo a onboarding de tenant...";
  }

  if (nextRoute === "/app/tenants/select") {
    return "Sesion iniciada. Redirigiendo al selector de tenant...";
  }

  return "Sesion iniciada. Redirigiendo al dashboard...";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearTenantContext = useTenantStore((state) => state.clearTenantContext);
  const setSessionFromLogin = useSessionStore((state) => state.setSessionFromLogin);
  const clearSession = useSessionStore((state) => state.clearSession);
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  const [viewState, setViewState] = useState<LoginViewState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setViewState({ status: "loading" });

    try {
      const result = await loginAndBootstrapSession(values);

      setSessionFromLogin({
        session: result.session,
        traceId: result.traceIds.login,
      });
      setLastTraceId(result.traceIds.tenantMine);
      clearTenantContext();

      setViewState({
        status: "success",
        nextRoute: result.nextRoute,
      });

      void router.push(result.nextRoute);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);

        if (error.status === 401 && error.code === "AUTH_UNAUTHENTICATED") {
          clearSession();
          clearTenantContext();
        }

        setViewState({
          status: "error",
          code: error.code,
          statusCode: error.status,
        });
        return;
      }

      setViewState({
        status: "error",
        code: "GEN_INTERNAL_ERROR",
      });
    }
  };

  const isLoading = viewState.status === "loading";
  const isVerifiedRedirect = searchParams.get("verified") === "1";
  const logoutStatus = searchParams.get("loggedOut");
  const isExpiredRedirect = searchParams.get("expired") === "1";
  const isLoggedOutRedirect = logoutStatus === "1" || logoutStatus === "all";
  const errorUserMessage =
    viewState.status === "error" ? resolveAuthErrorMessage(viewState.code) : "";

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/40">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Acceso a la plataforma</h1>
        <p className="text-sm text-slate-300">
          Ingrese sus credenciales de cliente para gestionar sus operaciones.
        </p>
      </header>

      {isVerifiedRedirect ? (
        <article className="mb-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            <p className="text-sm font-semibold">
              Email verificado correctamente. Ya puedes iniciar sesion.
            </p>
          </div>
        </article>
      ) : isExpiredRedirect ? (
        <article className="mb-6 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-300" />
            <p className="text-sm font-semibold">
              Tu sesion expiro o ya no es valida. Inicia sesion nuevamente.
            </p>
          </div>
        </article>
      ) : isLoggedOutRedirect ? (
        <article className="mb-6 rounded-md border border-blue-500/30 bg-blue-500/10 p-4 text-blue-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-blue-300" />
            <p className="text-sm font-semibold">
              {logoutStatus === "all"
                ? "Se cerraron todas tus sesiones activas correctamente."
                : "La sesion actual se cerro correctamente."}
            </p>
          </div>
        </article>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Direccion de Email
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500">
              <Mail className="size-4" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="owner@acme.dev"
              className={cn(
                "h-11 w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10",
                errors.email && "border-red-500/50 focus:ring-red-500/10",
              )}
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p className="mt-1 text-xs font-medium text-red-400">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Contrasena
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Olvido su contrasena?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500">
              <Lock className="size-4" />
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              className={cn(
                "h-11 w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10",
                errors.password && "border-red-500/50 focus:ring-red-500/10",
              )}
              {...register("password")}
            />
          </div>
          {errors.password ? (
            <p className="mt-1 text-xs font-medium text-red-400">{errors.password.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-md bg-blue-700 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] hover:bg-blue-600 active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              Verificando...
            </span>
          ) : (
            "Iniciar Sesion"
          )}
        </Button>
      </form>

      <div className="mt-8 rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-400" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Credenciales de Acceso
            </p>
            <p className="text-[11px] leading-relaxed text-blue-100/70">
              Para propositos de evaluacion, utilice:
              <br />
              <span className="font-mono text-white">owner@acme.dev / Demo123!</span>
            </p>
          </div>
        </div>
      </div>

      {viewState.status === "error" ? (
        <article
          role="alert"
          className="mt-6 animate-in slide-in-from-top-2 fade-in rounded-md border border-red-500/30 bg-red-500/10 p-4"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4 text-red-400" />
            <p className="text-sm font-semibold text-red-400">{errorUserMessage}</p>
          </div>
        </article>
      ) : null}

      {viewState.status === "success" ? (
        <article className="mt-6 animate-in zoom-in-95 fade-in rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4 text-emerald-400" />
            <p className="text-sm font-bold">Sesion autorizada correctamente</p>
          </div>
          <p className="mt-1 text-[11px] opacity-70">{resolveSuccessCopy(viewState.nextRoute)}</p>
        </article>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-300">
        No tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-300 transition hover:text-blue-200"
        >
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
