import { Cloud, Code2, Globe2 } from "lucide-react";
import React from "react";

export default function FooterPage() {
  return (
    <>
      <footer className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4 lg:grid-cols-5">
            <div className="md:col-span-1 lg:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <Cloud className="size-6 text-blue-700" />
                <span className="text-xl font-bold tracking-tight text-slate-900 uppercase dark:text-white">
                  ELSOMEDIA One
                </span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Plataforma SaaS enterprise para operar, auditar y escalar procesos de negocio en
                una sola experiencia.
              </p>

              <div className="mt-8 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Code2 className="size-4" />
                  <span className="text-xs font-bold tracking-widest uppercase">Desarrollado por</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">ELSOMEDIA</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Esteban Soto Ojeda - @elsoprimeDev
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="mb-6 font-bold text-slate-900 dark:text-white">Soluciones</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="transition hover:text-blue-700">Soberania de datos</a></li>
                <li><a href="#" className="transition hover:text-blue-700">Cumplimiento SOC2</a></li>
                <li><a href="#" className="transition hover:text-blue-700">Integracion SaaS</a></li>
                <li><a href="#" className="transition hover:text-blue-700">IA predictiva</a></li>
              </ul>
            </div>

            <div>
              <h5 className="mb-6 font-bold text-slate-900 dark:text-white">Compania</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="transition hover:text-blue-700">Sobre nosotros</a></li>
                <li><a href="#" className="transition hover:text-blue-700">Prensa</a></li>
                <li><a href="#" className="transition hover:text-blue-700">Carreras</a></li>
                <li><a href="#" className="transition hover:text-blue-700">Contacto</a></li>
              </ul>
            </div>

            <div>
              <h5 className="mb-6 font-bold text-slate-900 dark:text-white">Legal</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="transition hover:text-blue-700">Privacidad</a></li>
                <li><a href="#" className="transition hover:text-blue-700">Terminos</a></li>
                <li><a href="#" className="transition hover:text-blue-700">Seguridad</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 dark:border-slate-800 md:flex-row">
            <p className="text-xs text-slate-400">
              © 2026 ELSOMEDIA One. Todos los derechos reservados. Certificado SOC2.
            </p>
            <div className="flex gap-6 text-slate-400">
              <a href="#" className="hover:text-slate-600">
                <Globe2 className="size-5" />
              </a>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="text-xs font-bold tracking-widest uppercase">ELSOMEDIA</div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
