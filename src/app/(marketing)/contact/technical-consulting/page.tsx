"use client";

import { Cpu } from "lucide-react";
import { ActionFormShell, FormField } from "@/components/forms/action-form-shell";

export default function TechnicalConsultingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ActionFormShell
        badge="Consultoria Tecnica"
        icon={Cpu}
        title="Agende una consultoria tecnica especializada."
        description="Nuestro equipo de arquitectura revisa su escenario actual y define una ruta de integracion compatible con sus restricciones operativas."
      >
        <FormField label="Nombre y Cargo" placeholder="Ej. Marco Diaz - Arquitecto TI" />
        <FormField label="Correo Corporativo" placeholder="marco@empresa.com" type="email" />
        <FormField label="Empresa" placeholder="Ej. Holding Andino" />

        <div className="space-y-2">
          <label className="field-label">Objetivo Principal</label>
          <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option>Arquitectura de Integracion</option>
            <option>Escalabilidad y Performance</option>
            <option>Seguridad y Gobierno</option>
            <option>Plan de Migracion</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="field-label">Contexto Tecnico</label>
          <textarea
            placeholder="Comparta su stack actual, volumen de datos y principales desafios."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white h-24"
          />
        </div>
      </ActionFormShell>
    </div>
  );
}
