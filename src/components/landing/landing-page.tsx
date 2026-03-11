import Link from "next/link";
import {
  ArrowRight,
  ChartColumnIncreasing,
  Layers3,
  LockKeyhole,
  Orbit,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tractionStats = [
  { value: "2.4k+", label: "equipos activos" },
  { value: "18k+", label: "tenants operando" },
  { value: "99.95%", label: "uptime mensual" },
];

const partnerMarks = ["ORBIT OPS", "ATLAS CRM", "NORTE HR", "PIVOT BOARD", "VECTOR CLOUD"];

const capabilityCards = [
  {
    title: "Contrato primero",
    description:
      "Cada decision de UI nace desde integracion por contrato y control de cambios entre backend y frontend.",
    icon: ShieldAlert,
  },
  {
    title: "Sectores Verticales",
    description:
      "Modulos optimizados para Logistica y Operaciones, integrados nativamente con trazabilidad avanzada.",
    icon: LockKeyhole,
  },
  {
    title: "Escala Multitenant",
    description:
      "Inventory, CRM y HR se despliegan por modulo y plan con aislamiento total de datos garantizado.",
    icon: Layers3,
  },
];

const testimonials = [
  {
    quote:
      "Pasamos de 5 pantallas aisladas a una experiencia unificada con reglas de acceso claras por tenant.",
    author: "Camila Vargas",
    role: "Head of Product, Orbit Ops",
  },
  {
    quote:
      "El salto de calidad estuvo en estandarizar errores por codigo y exponer traceId desde frontend.",
    author: "Javier Mena",
    role: "Engineering Manager, Lattice Hub",
  },
  {
    quote:
      "La plataforma quedo lista para crecer por etapas sin rehacer la base visual ni la capa de sesion.",
    author: "Elisa Correa",
    role: "CTO, Scaleworks",
  },
];

const faqs = [
  {
    question: "Que incluye esta etapa inicial?",
    answer:
      "Landing de producto + sesion de Auth maquetada con estados de loading, success y error por error.code.",
  },
  {
    question: "Por que no hay integracion real de endpoints todavia?",
    answer:
      "La integracion real se gobierna desde el OpenAPI local sincronizado con backend y el cliente HTTP tipado del proyecto.",
  },
  {
    question: "Como se conecta luego la sesion browser?",
    answer:
      "La siguiente etapa conecta login/refresh/logout sobre cliente unico con credentials include y un solo retry de refresh.",
  },
  {
    question: "Que evita fuga de datos entre tenants?",
    answer:
      "Keys de cache con tenantId, invalidacion en tenant switch y limpieza total de estado en logout o refresh fallido.",
  },
];

import { PortalHeader } from "./portal-header";

export function LandingPage() {
  return (
    <main className="relative overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,oklch(0.82_0.07_40/.18),transparent_34%),radial-gradient(circle_at_90%_12%,oklch(0.8_0.08_214/.18),transparent_36%)]" />

      <PortalHeader />

      <section className="mx-auto mt-10 grid w-full max-w-6xl gap-8 px-6 sm:px-10 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="reveal-up space-y-6 [--reveal-delay:80ms]">
          <Badge
            variant="secondary"
            className="rounded-md px-3 py-1 text-[11px] tracking-[0.2em] uppercase"
          >
            Plataforma SaaS B2B
          </Badge>

          <h1 className="font-display max-w-2xl text-5xl leading-[0.9] font-semibold tracking-tight text-balance sm:text-7xl">
            Controla tu operacion SaaS sin romper contratos de integracion.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">
            Un stack frontend para equipos que necesitan gobernanza real: auth, permisos, modulos y
            trazabilidad bajo una sola direccion visual.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
            >
              Abrir sesion Auth
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#capabilities"
              className="inline-flex h-11 items-center rounded-md border border-foreground/20 bg-white/70 px-6 text-sm font-medium transition hover:bg-white"
            >
              Ver arquitectura UI
            </a>
          </div>

          <p className="label-kicker text-foreground/55">
            OpenAPI pendiente en repo frontend. Integracion real bloqueada hasta publicar contrato.
          </p>
        </article>

        <aside className="reveal-up panel-paper rounded-2xl p-6 shadow-[0_24px_50px_rgba(25,20,14,.14)] [--reveal-delay:220ms]">
          <p className="label-kicker text-foreground/55">Control cockpit</p>
          <h2 className="font-display mt-2 text-2xl leading-tight font-semibold">
            Sesion, tenant y guardas en un mismo tablero.
          </h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-foreground/12 bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Auth health</p>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                  stable
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-foreground/10">
                <div className="h-full w-[84%] rounded-full bg-accent" />
              </div>
              <p className="mt-2 text-xs text-foreground/62">refresh recovery target: 84%</p>
            </div>

            <div className="rounded-xl border border-foreground/12 bg-foreground px-4 py-4 text-background">
              <p className="text-sm font-medium">Tenant isolation checks</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-background/78">
                <span className="rounded border border-background/22 px-2 py-1">cache scoped</span>
                <span className="rounded border border-background/22 px-2 py-1">
                  logout cleanup
                </span>
                <span className="rounded border border-background/22 px-2 py-1">rbac guard</span>
                <span className="rounded border border-background/22 px-2 py-1">
                  traceId surfaced
                </span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section id="proof" className="mx-auto mt-14 w-full max-w-6xl px-6 sm:px-10">
        <div className="panel-paper reveal-up rounded-2xl p-5 [--reveal-delay:80ms]">
          <div className="flex flex-wrap items-center gap-5">
            {partnerMarks.map((mark) => (
              <span
                key={mark}
                className="text-xs font-semibold tracking-[0.2em] text-foreground/62"
              >
                {mark}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {tractionStats.map((stat, index) => (
              <article
                key={stat.label}
                className="rounded-xl border border-foreground/12 bg-background/75 px-4 py-4"
                style={{ animationDelay: `${160 + index * 110}ms` }}
              >
                <p className="font-display text-3xl leading-none font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs tracking-wide text-foreground/62">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto mt-16 w-full max-w-6xl px-6 sm:px-10">
        <div className="mb-7 max-w-3xl space-y-2">
          <p className="label-kicker text-foreground/60">Capacidades clave</p>
          <h2 className="font-display text-4xl leading-[0.95] font-semibold text-balance">
            Una base visual sobria, tecnica y lista para producto real.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {capabilityCards.map((card, index) => (
            <article
              key={card.title}
              className="reveal-up panel-paper rounded-2xl p-5 shadow-[0_12px_26px_rgba(25,20,14,.08)] [--reveal-delay:100ms]"
              style={{ animationDelay: `${100 + index * 90}ms` }}
            >
              <card.icon className="size-5 text-primary" />
              <h3 className="font-display mt-4 text-2xl leading-tight font-semibold">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/72">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 w-full max-w-6xl px-6 sm:px-10">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h2 className="font-display text-4xl leading-[0.95] font-semibold">
            Equipos que ya escalaron
          </h2>
          <ChartColumnIncreasing className="hidden size-7 text-primary md:block" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <article
              key={item.author}
              className="reveal-up rounded-2xl border border-foreground/12 bg-foreground px-5 py-5 text-background [--reveal-delay:80ms]"
              style={{ animationDelay: `${80 + index * 100}ms` }}
            >
              <p className="text-sm leading-relaxed text-background/82">&quot;{item.quote}&quot;</p>
              <p className="font-display mt-4 text-lg font-semibold">{item.author}</p>
              <p className="text-xs text-background/70">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto mt-16 w-full max-w-4xl px-6 sm:px-10">
        <h2 className="font-display text-center text-4xl leading-[0.95] font-semibold">
          FAQ operativa
        </h2>
        <div className="mt-6 space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="reveal-up panel-paper rounded-xl px-5 py-4 [--reveal-delay:70ms] open:bg-white"
              style={{ animationDelay: `${70 + index * 80}ms` }}
            >
              <summary className="font-display cursor-pointer list-none text-xl leading-tight font-semibold">
                {faq.question}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-foreground/72">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-18 w-full max-w-6xl px-6 sm:px-10">
        <article className="reveal-up rounded-2xl border border-foreground/18 bg-foreground px-6 py-9 text-background shadow-[0_26px_56px_rgba(25,20,14,.24)] [--reveal-delay:90ms] sm:px-9">
          <p className="label-kicker text-background/62">Roadmap activo</p>
          <h2 className="font-display mt-3 max-w-3xl text-4xl leading-[0.95] font-semibold text-balance sm:text-5xl">
            Primera parada: UX solida. Siguiente parada: Auth real contra contrato OpenAPI.
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
            >
              Ir a sesion
            </Link>
            <a
              href="#faq"
              className="inline-flex h-11 items-center rounded-md border border-background/28 px-6 text-sm font-medium text-background transition hover:bg-background/8"
            >
              Revisar preguntas
            </a>
          </div>
        </article>
      </section>

      <footer className="mx-auto mt-16 w-full max-w-6xl px-6 pb-8 sm:px-10">
        <div className="panel-paper grid gap-6 rounded-2xl p-6 text-sm md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold">NexoStack</p>
            <p className="mt-2 text-foreground/72">
              Frontend multitenant para equipos SaaS que no negocian seguridad ni consistencia.
            </p>
          </div>
          <div>
            <p className="font-display text-base font-semibold">Portal</p>
            <ul className="mt-2 space-y-1 text-foreground/72">
              <li>
                <Link href="/solutions/logistics" className="hover:text-primary transition">
                  Logística
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/developers" className="hover:text-primary transition">
                  Desarrolladores
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-base font-semibold">Legal</p>
            <ul className="mt-2 space-y-1 text-foreground/72">
              <li>Terminos de servicio</li>
              <li>Politica de privacidad</li>
              <li>Politica de seguridad</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
