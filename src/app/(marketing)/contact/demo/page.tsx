"use client";

import { ActionFormShell, FormField } from "@/components/forms/action-form-shell";
import { Zap } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ActionFormShell
        badge="Evaluación Gratuita"
        icon={Zap}
        title="Comience su Transformación Digital."
        description="Obtenga acceso prioritario a nuestro sandbox y descubra cómo ERP Solutions Media puede escalar su infraestructura operativa en tiempo récord."
      >
        <FormField label="Nombre Completo" placeholder="Ej. Juan Pérez" />
        <FormField label="Correo Corporativo" placeholder="juan@empresa.com" type="email" />
        <FormField label="Nombre de la Organización" placeholder="Empresa S.A." />
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Volumen Mensual de Operaciones
          </label>
          <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option>1 - 1,000</option>
            <option>1,000 - 10,000</option>
            <option>10,000+</option>
          </select>
        </div>
      </ActionFormShell>
    </div>
  );
}
