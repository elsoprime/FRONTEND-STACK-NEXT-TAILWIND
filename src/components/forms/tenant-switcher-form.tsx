"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/store/tenant-store";

const tenantSchema = z.object({
  tenantId: z
    .string()
    .min(2, "Ingresa al menos 2 caracteres")
    .max(50, "Maximo 50 caracteres")
    .regex(/^[a-zA-Z0-9-_]+$/, "Usa solo letras, numeros, guion y guion bajo"),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

export function TenantSwitcherForm() {
  const tenantId = useTenantStore((state) => state.tenantId);
  const setTenantId = useTenantStore((state) => state.setTenantId);
  const clearTenantId = useTenantStore((state) => state.clearTenantId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { tenantId: tenantId ?? "" },
  });

  const onSubmit = (values: TenantFormValues) => {
    setTenantId(values.tenantId);
  };

  const onClear = () => {
    clearTenantId();
    setValue("tenantId", "");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border p-4">
      <label htmlFor="tenant-id" className="text-sm font-medium">
        X-Tenant-Id
      </label>
      <input
        id="tenant-id"
        placeholder="acme-tenant"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus-visible:ring-[3px]"
        {...register("tenantId")}
      />
      {errors.tenantId ? (
        <p className="text-sm text-destructive">{errors.tenantId.message}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Este valor se puede inyectar como header en tu cliente API.
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          Guardar tenant
        </Button>
        <Button type="button" variant="outline" onClick={onClear}>
          Limpiar
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Tenant actual: <span className="font-mono">{tenantId ?? "sin definir"}</span>
      </p>
    </form>
  );
}
