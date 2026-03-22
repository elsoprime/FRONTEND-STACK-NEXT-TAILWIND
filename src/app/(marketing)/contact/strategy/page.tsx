"use client";

import { ActionFormShell, FormField } from "@/components/forms/action-form-shell";
import { Users } from "lucide-react";

export default function StrategyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ActionFormShell
        badge="Reunión Estratégica"
        icon={Users}
        title="Hablemos de su Visión Empresarial."
        description="Agende una sesión con nuestros consultores expertos para alinear ELSOMEDIA One con sus objetivos de negocio a largo plazo."
      >
        <FormField label="Nombre y Cargo" placeholder="Ej. Juan Pérez - CTO" />
        <FormField label="Correo Corporativo" placeholder="juan@empresa.com" type="email" />
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Área de Interés Principal
          </label>
          <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option>Infraestructura & Seguridad</option>
            <option>Optimización Logística</option>
            <option>Gobernanza de Datos</option>
            <option>Otro</option>
          </select>
        </div>
        <FormField label="Fecha Sugerida" placeholder="" type="date" />
      </ActionFormShell>
    </div>
  );
}
