"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Lock, KeyRound, Mail, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { resolveAuthErrorMessage } from "@/features/auth/error-code-map";
import { resetPasswordWithToken } from "@/features/auth/auth.service";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Ingresa un email valido."),
    token: z.string().min(1, "Ingresa un token valido."),
    newPassword: z.string().min(8, "La nueva contrasena debe tener al menos 8 caracteres."),
    confirmNewPassword: z.string().min(8, "Confirma la nueva contrasena."),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmNewPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type ResetPasswordViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; revokedSessions: number }
  | { status: "error"; code: string };

type ResetPasswordFormProps = {
  initialEmail?: string;
  initialToken?: string;
};

export function ResetPasswordForm({
  initialEmail = "",
  initialToken = "",
}: ResetPasswordFormProps) {
  const [viewState, setViewState] = useState<ResetPasswordViewState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      token: initialToken,
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setViewState({ status: "loading" });

    try {
      const response = await resetPasswordWithToken({
        email: values.email,
        token: values.token,
        newPassword: values.newPassword,
      });

      setViewState({
        status: "success",
        revokedSessions: response.data.revokedSessionIds.length,
      });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 400 && error.details) {
          const fieldMap = {
            email: "email",
            token: "token",
            newPassword: "newPassword",
            password: "newPassword",
          } satisfies Record<string, keyof ResetPasswordFormValues>;

          for (const [field, messages] of Object.entries(error.details)) {
            const target = fieldMap[field as keyof typeof fieldMap];
            if (!target || messages.length === 0) {
              continue;
            }

            setError(target, {
              type: "server",
              message: messages[0],
            });
          }
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
        <h1 className="text-2xl font-bold tracking-tight text-white">Restablecer contrasena</h1>
        <p className="text-sm text-slate-300">
          Ingresa email, token y una nueva contrasena segura.
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

        <div className="space-y-2">
          <label
            htmlFor="token"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Token de recuperacion
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500">
              <KeyRound className="size-4" />
            </div>
            <input
              id="token"
              type="text"
              autoComplete="one-time-code"
              placeholder="Pega el token recibido"
              className={cn(
                "h-11 w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10",
                errors.token && "border-red-500/50 focus:ring-red-500/10",
              )}
              {...register("token")}
            />
          </div>
          {errors.token ? (
            <p className="mt-1 text-xs font-medium text-red-400">{errors.token.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="newPassword"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Nueva contrasena
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500">
                <Lock className="size-4" />
              </div>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="********"
                className={cn(
                  "h-11 w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10",
                  errors.newPassword && "border-red-500/50 focus:ring-red-500/10",
                )}
                {...register("newPassword")}
              />
            </div>
            {errors.newPassword ? (
              <p className="mt-1 text-xs font-medium text-red-400">{errors.newPassword.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmNewPassword"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Confirmar contrasena
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              placeholder="********"
              className={cn(
                "h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10",
                errors.confirmNewPassword && "border-red-500/50 focus:ring-red-500/10",
              )}
              {...register("confirmNewPassword")}
            />
            {errors.confirmNewPassword ? (
              <p className="mt-1 text-xs font-medium text-red-400">
                {errors.confirmNewPassword.message}
              </p>
            ) : null}
          </div>
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
              Aplicando cambios...
            </span>
          ) : (
            "Restablecer contrasena"
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
            <p className="text-sm font-bold">Contrasena actualizada</p>
          </div>
          <p className="mt-1 text-[11px] opacity-80">
            Se revocaron {viewState.revokedSessions} sesiones activas asociadas a la cuenta.
          </p>
          <p className="mt-3 text-xs text-emerald-100/80">
            Continúa en{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-200 underline-offset-2 hover:underline"
            >
              login
            </Link>
            .
          </p>
        </article>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-300">
        No tienes token?{" "}
        <Link
          href="/auth/forgot-password"
          className="font-semibold text-blue-300 transition hover:text-blue-200"
        >
          Solicitar recuperacion
        </Link>
      </p>
    </section>
  );
}
