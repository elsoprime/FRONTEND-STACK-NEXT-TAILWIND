"use client";

import { ActionFormShell, FormField } from "@/components/forms/action-form-shell";
import { FileSearch } from "lucide-react";

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ActionFormShell
        badge="Solicitud de Metodología"
        icon={FileSearch}
        title="Diseñemos su Hoja de Ruta."
        description="Reciba un plan detallado de implementación técnica ajustado a sus sistemas actuales y tiempos de despliegue esperados."
      >
        <FormField label="Persona de Contacto IT" placeholder="Ej. Ana García" />
        <FormField label="Correo Corporativo" placeholder="ana@empresa.com" type="email" />
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Sistemas Legados a Integrar
          </label>
          <textarea
            placeholder="Ej. SAP, Oracle, Excel Spreadsheets..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white h-24"
          />
        </div>
        <FormField label="Fecha Estimada de Inicio" placeholder="" type="date" />
      </ActionFormShell>
    </div>
  );
}
