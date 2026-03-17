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
    <div className="reveal-up space-y-6 [--reveal-delay:60ms]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="tenant-name" className="field-label">
            Nombre del tenant
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
              <Building2 className="size-4" />
            </div>
            <input
              id="tenant-name"
              type="text"
              placeholder="Acme Holdings"
              className={cn(
                "h-11 w-full rounded-xl border border-border/80 bg-background/70 pl-10 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/20",
                errors.name && "border-destructive focus:ring-destructive/25",
              )}
              {...register("name")}
            />
          </div>
          {errors.name ? (
            <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="tenant-slug" className="field-label">
            Slug publico
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
              <Hash className="size-4" />
            </div>
            <input
              id="tenant-slug"
              type="text"
              placeholder="acme-holdings"
              className={cn(
                "h-11 w-full rounded-xl border border-border/80 bg-background/70 pl-10 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/20",
                errors.slug && "border-destructive focus:ring-destructive/25",
              )}
              {...register("slug")}
            />
          </div>
          {errors.slug ? (
            <p className="text-xs font-medium text-destructive">{errors.slug.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Opcional. Si lo dejas vacio, el backend puede resolverlo automaticamente.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl font-semibold sm:w-auto"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Creando tenant...
            </>
          ) : (
            "Crear tenant y activar contexto"
          )}
        </Button>
      </form>

      <div className="rounded-xl border border-primary/35 bg-primary/14 p-4 text-primary">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">
            Esta pantalla ejecuta <code className="font-mono font-bold">create tenant</code> y luego{" "}
            <code className="font-mono font-bold">tenant/switch</code> para dejar la sesion con
            contexto activo real antes de volver al shell.
          </p>
        </div>
      </div>

      {viewState.status === "error" ? (
        <article className="rounded-xl border border-red-300/80 bg-red-100/70 p-4 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
        </article>
      ) : null}

      {viewState.status === "success" ? (
        <article className="rounded-xl border border-emerald-300/80 bg-emerald-100/70 p-4 text-emerald-950 dark:border-emerald-400/55 dark:bg-emerald-500/14 dark:text-emerald-100">
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
