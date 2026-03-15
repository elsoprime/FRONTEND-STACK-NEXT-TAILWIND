import { Cloud, Code2, Globe2 } from "lucide-react";
import React from "react";

export default function FooterPage() {
  return (
    <>
      {/* Footer Estilo Corporativo con Desarrolladora */}
      <footer className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4 lg:grid-cols-5">
            <div className="md:col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Cloud className="size-6 text-blue-700" />
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                  ERP Solutions Media
                </span>
              </div>
              <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Plataforma de infraestructura inteligente para la gestión de datos y operaciones
                empresariales a escala global.
              </p>

              <div className="mt-8 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Code2 className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Desarrollado por
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ELSOMEDIA
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Esteban Soto Ojeda — @elsoprimeDev
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white mb-6">Soluciones</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Soberanía de Datos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Cumplimiento SOC2
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Integración ERP
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    IA Predictiva
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white mb-6">Compañía</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Prensa
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Carreras
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white mb-6">Legal</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Términos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Seguridad
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t border-slate-100 pt-8 dark:border-slate-800 flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-slate-400">
              © 2026 ERP Solutions Media. Todos los derechos reservados. Certificado SOC2.
            </p>
            <div className="flex gap-6 text-slate-400">
              <a href="#" className="hover:text-slate-600">
                <Globe2 className="size-5" />
              </a>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="text-xs font-bold uppercase tracking-widest">ELSOMEDIA</div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
