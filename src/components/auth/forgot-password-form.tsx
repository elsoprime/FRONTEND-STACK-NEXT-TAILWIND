"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Mail, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { resolveAuthErrorMessage } from "@/features/auth/error-code-map";
import { requestPasswordReset } from "@/features/auth/auth.service";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresa un email valido."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

type ForgotPasswordViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; email: string }
  | { status: "error"; code: string };

export function ForgotPasswordForm() {
  const [viewState, setViewState] = useState<ForgotPasswordViewState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setViewState({ status: "loading" });

    try {
      await requestPasswordReset({ email: values.email });
      setViewState({
        status: "success",
        email: values.email,
      });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 400 && error.details?.email?.[0]) {
          setError("email", {
            type: "server",
            message: error.details.email[0],
          });
        }

        setViewState({
          status: "error",
          code: error.code,
        });
        return;
      }

      setViewState({
        status: "error",
        code: "GEN_INTERNAL_ERROR",
      });
    }
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/40">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Recuperar contrasena</h1>
        <p className="text-sm text-slate-300">
          Ingresa tu email y enviaremos instrucciones si la cuenta es elegible.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Email de la cuenta
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500">
              <Mail className="size-4" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="owner@empresa.com"
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

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-md bg-blue-700 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] hover:bg-blue-600 active:scale-[0.98]"
          disabled={viewState.status === "loading"}
        >
          {viewState.status === "loading" ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              Enviando...
            </span>
          ) : (
            "Enviar instrucciones"
          )}
        </Button>
      </form>

      {viewState.status === "error" ? (
        <article
          role="alert"
          className="mt-6 animate-in slide-in-from-top-2 fade-in rounded-md border border-red-500/30 bg-red-500/10 p-4"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4 text-red-400" />
            <p className="text-sm font-semibold text-red-400">
              {resolveAuthErrorMessage(viewState.code)}
            </p>
          </div>
        </article>
      ) : null}

      {viewState.status === "success" ? (
        <article className="mt-6 animate-in zoom-in-95 fade-in rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4 text-emerald-400" />
            <p className="text-sm font-bold">Solicitud aceptada</p>
          </div>
          <p className="mt-1 text-[11px] opacity-80">
            Si la cuenta es elegible, enviamos instrucciones a{" "}
            <span className="font-semibold">{viewState.email}</span>.
          </p>
          <p className="mt-3 text-xs text-emerald-100/80">
            Recibiste el token? Continua en{" "}
            <Link
              href="/auth/reset-password"
              className="font-semibold text-emerald-200 underline-offset-2 hover:underline"
            >
              reset password
            </Link>
            .
          </p>
        </article>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-300">
        Volver a{" "}
        <Link href="/login" className="font-semibold text-blue-300 transition hover:text-blue-200">
          iniciar sesion
        </Link>
      </p>
    </section>
  );
}
