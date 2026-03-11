"use client";

import { ActionFormShell, FormField } from "@/components/forms/action-form-shell";
import { Plus } from "lucide-react";

export default function CustomConnectorPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ActionFormShell
        badge="Integración Personalizada"
        icon={Plus}
        title="Expanda su Ecosistema."
        description="¿Necesita conectar una herramienta propietaria o un sistema especializado? Nuestro equipo de ingeniería diseñará el conector ideal para usted."
      >
        <FormField label="Nombre del Desarrollador Principal" placeholder="Ej. Carlos Ruiz" />
        <FormField label="Correo de Ingeniería" placeholder="dev@empresa.com" type="email" />
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tipo de API / Protocolo
          </label>
          <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option>REST API (OpenAPI/Swagger)</option>
            <option>GraphQL</option>
            <option>gRPC / Protobuf</option>
            <option>Webhooks / Event-Driven</option>
            <option>Otro</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Descripción del Caso de Uso
          </label>
          <textarea
            placeholder="¿Qué datos desea sincronizar?"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white h-24"
          />
        </div>
      </ActionFormShell>
    </div>
  );
}
