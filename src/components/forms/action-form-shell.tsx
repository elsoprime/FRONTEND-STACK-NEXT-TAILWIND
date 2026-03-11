"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ActionFormShellProps {
  badge: string;
  title: string;
  description: string;
  children: React.ReactNode;
  icon: React.ElementType;
}

export function ActionFormShell({
  badge,
  title,
  description,
  children,
  icon: Icon,
}: ActionFormShellProps) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="border-primary/25 bg-primary/10 text-primary dark:border-primary/35"
          >
            {badge}
          </Badge>

          <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary text-primary-foreground shadow-xl shadow-primary/28">
            <Icon className="size-7" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          <div className="surface-card border-dashed px-5 py-4">
            <p className="label-kicker text-muted-foreground">Confianza enterprise</p>
            <ul className="mt-4 space-y-2 text-sm text-foreground/85">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Cumplimiento SOC2 y GDPR.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" />
                Integracion asistida por especialista.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                Respuesta inicial en menos de 24 horas.
              </li>
            </ul>
          </div>
        </div>

        <div className="surface-card relative overflow-hidden p-7 sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/14 to-transparent" />

          <form className="relative space-y-5" onSubmit={(event) => event.preventDefault()}>
            {children}

            <Button
              className="mt-3 h-12 w-full rounded-xl text-base font-bold"
              size="lg"
              type="submit"
            >
              Enviar solicitud
            </Button>

            <p className="text-center text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
              Su informacion se procesa bajo controles de seguridad empresariales.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export function FormField({
  label,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <label className="field-label">
        {label} {required ? <span className="text-primary">*</span> : null}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-11 rounded-xl bg-card/80"
      />
    </div>
  );
}
