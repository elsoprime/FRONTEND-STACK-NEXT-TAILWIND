"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, ShieldAlert, ShieldCheck, Building2, Hash, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  createTenantInputSchema,
  type CreateTenantInput,
} from "@/features/tenant/tenant-context.schemas";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { createTenant, switchActiveTenant } from "@/features/tenant/tenant.service";
import { ApiRequestError } from "@/lib/api/client";
import { clearPreviousTenantScopedQueries } from "@/lib/query/tenant-cache";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type CreateTenantViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; tenantName: string }
  | { status: "error"; code: string };

export function TenantCreateForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousTenantId = useTenantStore((state) => state.tenantId);
  const setActiveTenantContext = useTenantStore((state) => state.setActiveTenantContext);
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [viewState, setViewState] = useState<CreateTenantViewState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantInputSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const onSubmit = async (values: CreateTenantInput) => {
    setViewState({ status: "loading" });

    try {
      const created = await createTenant(values);
      const switched = await switchActiveTenant({
        tenantId: created.data.tenant.id,
      });

      clearPreviousTenantScopedQueries(queryClient, previousTenantId);
      setActiveTenantContext({
        tenant: switched.data.tenant,
        membership: switched.data.membership,
      });
      setLastTraceId(switched.traceId);
      setViewState({
        status: "success",
        tenantName: switched.data.tenant.name,
      });
      void router.replace("/app");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);

        if (error.status === 400 && error.details) {
          for (const [field, messages] of Object.entries(error.details)) {
            if ((field === "name" || field === "slug") && messages.length > 0) {
              setError(field, {
                type: "server",
                message: messages[0],
              });
            }
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

  const isLoading = viewState.status === "loading";
  const errorMessage =
    viewState.status === "error" ? resolveTenantErrorMessage(viewState.code) : null;

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="tenant-name"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Nombre del tenant
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
              <Building2 className="size-4" />
            </div>
            <input
              id="tenant-name"
              type="text"
              placeholder="Acme Holdings"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.name && "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("name")}
            />
          </div>
          {errors.name ? (
            <p className="text-xs font-medium text-red-500">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tenant-slug"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Slug publico
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
              <Hash className="size-4" />
            </div>
            <input
              id="tenant-slug"
              type="text"
              placeholder="acme-holdings"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.slug && "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("slug")}
            />
          </div>
          {errors.slug ? (
            <p className="text-xs font-medium text-red-500">{errors.slug.message}</p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Opcional. Si lo dejas vacio, el backend puede resolverlo automaticamente.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 rounded-md bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              Creando tenant...
            </span>
          ) : (
            "Crear tenant y activar contexto"
          )}
        </Button>
      </form>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">
            Esta pantalla ejecuta `create tenant` y luego `tenant/switch` para dejar la sesion con
            contexto activo real antes de volver al shell.
          </p>
        </div>
      </div>

      {viewState.status === "error" ? (
        <article className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
        </article>
      ) : null}

      {viewState.status === "success" ? (
        <article className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4" />
            <p className="text-sm font-semibold">
              Tenant creado y activado: {viewState.tenantName}
            </p>
          </div>
        </article>
      ) : null}
    </div>
  );
}
