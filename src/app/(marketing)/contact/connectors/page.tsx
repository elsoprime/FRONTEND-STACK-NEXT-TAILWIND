"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlugZap } from "lucide-react";
import { ActionFormShell, FormField } from "@/components/forms/action-form-shell";

function ConnectorsSetupContent() {
  const searchParams = useSearchParams();
  const selectedIntegration = searchParams.get("integration");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ActionFormShell
        badge="Configuracion de Conectores"
        icon={PlugZap}
        title="Configure conectores con soporte experto."
        description="Cuente como desea sincronizar sus sistemas y le guiaremos con una propuesta tecnica para una configuracion segura y escalable."
      >
        {selectedIntegration ? (
          <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
            Conector seleccionado: <span className="font-semibold">{selectedIntegration}</span>
          </div>
        ) : null}

        <FormField label="Nombre del Responsable" placeholder="Ej. Daniela Soto" />
        <FormField label="Correo de Trabajo" placeholder="daniela@empresa.com" type="email" />
        <FormField label="Nombre del Sistema" placeholder="Ej. SAP S/4HANA" />

        <div className="space-y-2">
          <label className="field-label">Tipo de Integracion</label>
          <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option>API REST</option>
            <option>Webhooks</option>
            <option>Batch / ETL</option>
            <option>Conector Legacy</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="field-label">Detalle Tecnico</label>
          <textarea
            placeholder="Comparta endpoints disponibles, autenticacion y volumen estimado."
            className="h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </ActionFormShell>
    </div>
  );
}

export default function ConnectorsSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <ConnectorsSetupContent />
    </Suspense>
  );
}
