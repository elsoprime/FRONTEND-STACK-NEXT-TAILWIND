import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, Cloud, Shield, Zap } from "lucide-react";

type AuthPageShellProps = {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function AuthPageShell({
  children,
  backHref = "/",
  backLabel = "Volver al inicio",
}: AuthPageShellProps) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-slate-50 font-sans dark:bg-slate-950">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.05),transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="hidden flex-col items-start lg:flex">
            <Link
              href="/"
              className="group mb-12 flex items-center gap-2 transition-transform hover:scale-105"
            >
              <div className="flex size-10 items-center justify-center rounded bg-blue-700 text-white shadow-lg shadow-blue-700/20">
                <Cloud className="size-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                ELSOMEDIA One
              </span>
            </Link>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white xl:text-5xl">
              Tome el control total de sus
              <br />
              <span className="text-blue-700">operaciones digitales.</span>
            </h1>

            <p className="mb-10 max-w-md text-lg text-slate-600 dark:text-slate-400">
              Acceda a su ecosistema unificado de gestion, analiticas en tiempo real y seguridad de
              grado empresarial.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Seguridad SOC2
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Datos protegidos bajo estandares globales.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Alta Velocidad
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Latencia minima en procesos criticos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <BarChart3 className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Analiticas IA
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Insights predictivos para su negocio.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Uptime 99.9%</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Disponibilidad garantizada por SLA.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-16 h-72 w-full opacity-90 group">
              <div className="absolute inset-0 bg-blue-600/5 blur-3xl transition-colors group-hover:bg-blue-600/10" />
              <Image
                src="/backgrounds/login-illustration.svg"
                alt="Gestion de operaciones SaaS"
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center lg:items-end">
            <div className="w-full max-w-md">
              <div className="mb-8 flex flex-col items-center lg:hidden">
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded bg-blue-700 text-white">
                    <Cloud className="size-6" />
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    ELSOMEDIA One
                  </span>
                </Link>
              </div>

              {children}

              <div className="mt-8 text-center lg:text-right">
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <ArrowLeft className="size-4" />
                  {backLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 w-full -translate-x-1/2 px-6 text-center text-slate-400 lg:left-8 lg:w-auto lg:translate-x-0 lg:text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
          Desarrollado por ELSOMEDIA - Esteban Soto Ojeda - @elsoprimeDev
        </p>
      </div>
    </main>
  );
}
