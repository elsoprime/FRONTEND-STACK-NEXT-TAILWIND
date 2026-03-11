"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  MailCheck,
  Info,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { resolveAuthErrorMessage } from "@/features/auth/error-code-map";
import { resendVerification, verifyEmailToken } from "@/features/auth/auth.service";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const verifyEmailSchema = z.object({
  email: z.string().email("Ingresa un email valido."),
  token: z.string().min(6, "Ingresa un token valido."),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

type VerifyViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; code: string; statusCode?: number };

type ResendViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; email: string }
  | { status: "error"; code: string; statusCode?: number };

type VerifyEmailFormProps = {
  initialToken?: string;
  initialEmail?: string;
};

export function VerifyEmailForm({ initialToken = "", initialEmail = "" }: VerifyEmailFormProps) {
  const router = useRouter();
  const [viewState, setViewState] = useState<VerifyViewState>({ status: "idle" });
  const [resendState, setResendState] = useState<ResendViewState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: initialEmail,
      token: initialToken,
    },
  });

  const onSubmit = async (values: VerifyEmailFormValues) => {
    setViewState({ status: "loading" });
    setResendState({ status: "idle" });

    try {
      await verifyEmailToken({
        email: values.email,
        token: values.token,
      });

      setViewState({ status: "success" });
      setTimeout(() => {
        router.push("/login?verified=1");
      }, 600);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 400 && error.details) {
          const fieldMap = {
            email: "email",
            token: "token",
          } satisfies Record<string, keyof VerifyEmailFormValues>;

          for (const [field, messages] of Object.entries(error.details)) {
            const target = field in fieldMap ? fieldMap[field as keyof typeof fieldMap] : undefined;

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

  const handleResend = async () => {
    const email = getValues("email").trim();
    const parsedEmail = z.string().email().safeParse(email);

    if (!parsedEmail.success) {
      setError("email", {
        type: "server",
        message: "Ingresa un email valido para reenviar la verificacion.",
      });
      setResendState({
        status: "error",
        code: "GEN_VALIDATION_ERROR",
        statusCode: 400,
      });
      return;
    }

    setResendState({ status: "loading" });

    try {
      await resendVerification({
        email,
      });

      setResendState({
        status: "success",
        email,
      });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setResendState({
          status: "error",
          code: error.code,
          statusCode: error.status,
        });
        return;
      }

      setResendState({
        status: "error",
        code: "GEN_INTERNAL_ERROR",
      });
    }
  };

  const isLoading = viewState.status === "loading";
  const isResendLoading = resendState.status === "loading";
  const isInvalidToken =
    viewState.status === "error" && viewState.code === "AUTH_EMAIL_VERIFICATION_INVALID";

  const errorCopy =
    viewState.status === "error"
      ? isInvalidToken
        ? "El enlace de verificacion no es valido o ya expiro. Solicita uno nuevo."
        : resolveAuthErrorMessage(viewState.code)
      : "";

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/40">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Verifica tu email</h1>
        <p className="text-sm text-slate-300">
          Confirma el token de verificacion para habilitar tu acceso.
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
            Token de verificacion
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500">
              <KeyRound className="size-4" />
            </div>
            <input
              id="token"
              type="text"
              autoComplete="one-time-code"
              placeholder="Pega aqui tu token"
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
            "Confirmar verificacion"
          )}
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-400" />
          <p className="text-[11px] leading-relaxed text-blue-100/80">
            {initialEmail
              ? `Usa el enlace o el token enviado a ${initialEmail}.`
              : "Necesitas el email y el token enviados durante la verificacion para activar la cuenta."}
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
            <p className="text-sm font-bold">Email verificado correctamente</p>
          </div>
          <p className="mt-1 text-[11px] opacity-80">
            Tu cuenta ya esta lista. Redirigiendo a login...
          </p>
        </article>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-300">
        Ya verificaste tu cuenta?{" "}
        <Link href="/login" className="font-semibold text-blue-300 transition hover:text-blue-200">
          Iniciar sesion
        </Link>
      </p>

      <p className="mt-2 text-center text-xs text-slate-400">
        <MailCheck className="mr-1 inline size-3.5" />
        Si no recibiste correo o el enlace ya no sirve, solicita un nuevo envio.
      </p>

      <div className="mt-4 flex justify-center">
        <Button
          type="button"
          variant="outline"
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          disabled={isResendLoading}
          onClick={handleResend}
        >
          {isResendLoading ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              Reenviando...
            </span>
          ) : (
            "Reenviar verificacion"
          )}
        </Button>
      </div>

      {resendState.status === "success" ? (
        <article className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
          <p className="text-sm font-semibold">Solicitud aceptada.</p>
          <p className="mt-1 text-[11px] opacity-80">
            Si la cuenta es elegible, enviamos nuevas instrucciones a{" "}
            <span className="font-semibold">{resendState.email}</span>.
          </p>
        </article>
      ) : null}

      {resendState.status === "error" ? (
        <article className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-red-100">
          <p className="text-sm font-semibold text-red-400">
            {resolveAuthErrorMessage(resendState.code)}
          </p>
        </article>
      ) : null}

      {isInvalidToken ? (
        <p className="mt-3 text-center text-xs text-slate-400">
          El token puede haber expirado, sido reemplazado o ya estar usado.
        </p>
      ) : null}
    </section>
  );
}
