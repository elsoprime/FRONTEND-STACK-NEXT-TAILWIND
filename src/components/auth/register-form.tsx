"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, ShieldAlert, ShieldCheck, Mail, Lock, UserRound, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { resolveAuthErrorMessage } from "@/features/auth/error-code-map";
import { registerUser } from "@/features/auth/auth.service";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "Ingresa al menos 2 caracteres."),
    lastName: z.string().optional(),
    email: z.string().email("Ingresa un email valido."),
    password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirma la contrasena."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegisterViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; email: string }
  | { status: "error"; code: string; statusCode?: number };

export function RegisterForm() {
  const [viewState, setViewState] = useState<RegisterViewState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setViewState({ status: "loading" });

    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName?.trim() ? values.lastName : null,
        email: values.email,
        password: values.password,
      });

      setViewState({
        status: "success",
        email: values.email,
      });
      reset();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 400 && error.details) {
          const fieldMap: Record<string, keyof RegisterFormValues> = {
            firstName: "firstName",
            lastName: "lastName",
            email: "email",
            password: "password",
            confirmPassword: "confirmPassword",
          };

          for (const [field, messages] of Object.entries(error.details)) {
            const target = fieldMap[field];
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
  const errorCopy = viewState.status === "error" ? resolveAuthErrorMessage(viewState.code) : "";

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/40">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Crea tu cuenta</h1>
        <p className="text-sm text-slate-300">
          Crea tu cuenta y confirma tu correo antes de ingresar al entorno.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Nombre
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500">
                <UserRound className="size-4" />
              </div>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Ana"
                className={cn(
                  "h-11 w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10",
                  errors.firstName && "border-red-500/50 focus:ring-red-500/10",
                )}
                {...register("firstName")}
              />
            </div>
            {errors.firstName ? (
              <p className="mt-1 text-xs font-medium text-red-400">{errors.firstName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Apellido
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Diaz"
              className={cn(
                "h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10",
                errors.lastName && "border-red-500/50 focus:ring-red-500/10",
              )}
              {...register("lastName")}
            />
            {errors.lastName ? (
              <p className="mt-1 text-xs font-medium text-red-400">{errors.lastName.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Email corporativo
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Contrasena
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500">
                <Lock className="size-4" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
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

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Confirmar contrasena
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="********"
              className={cn(
                "h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10",
                errors.confirmPassword && "border-red-500/50 focus:ring-red-500/10",
              )}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs font-medium text-red-400">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
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
              Registrando...
            </span>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-400" />
          <p className="text-[11px] leading-relaxed text-blue-100/80">
            Despues del registro te pediremos verificar tu email antes de habilitar el acceso.
          </p>
        </div>
      </div>

      {viewState.status === "error" ? (
        <article
          role="alert"
          className="mt-6 animate-in slide-in-from-top-2 fade-in rounded-md border border-red-500/30 bg-red-500/10 p-4"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4 text-red-400" />
            <p className="text-sm font-semibold text-red-400">{errorCopy}</p>
          </div>
        </article>
      ) : null}

      {viewState.status === "success" ? (
        <article className="mt-6 animate-in zoom-in-95 fade-in rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4 text-emerald-400" />
            <p className="text-sm font-bold">Revisa tu correo</p>
          </div>
          <p className="mt-1 text-[11px] opacity-80">
            Si la cuenta es elegible, enviamos instrucciones de verificacion a{" "}
            <span className="font-semibold">{viewState.email}</span>.
          </p>
          <p className="mt-3 text-xs text-emerald-100/85">
            Por seguridad, continua manualmente en la pantalla de verificacion de email.
          </p>
        </article>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-300">
        Ya tienes una cuenta?{" "}
        <Link href="/login" className="font-semibold text-blue-300 transition hover:text-blue-200">
          Iniciar sesion
        </Link>
      </p>
    </section>
  );
}
