import Link from "next/link";
import { Orbit } from "lucide-react";

export function PortalHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8 sm:px-10">
      <Link
        href="/"
        className="inline-flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
      >
        <span className="inline-flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Orbit className="size-4" />
        </span>
        <span className="truncate font-display text-xl leading-none font-semibold tracking-tight sm:text-2xl">
          NexoStack
        </span>
      </Link>

      <nav aria-label="Navegacion de portal" className="hidden items-center gap-1 md:flex">
        <Link href="/#capabilities" className="nav-link-pill">
          Plataforma
        </Link>
        <Link href="/solutions/logistics" className="nav-link-pill">
          Logistica
        </Link>
        <Link href="/pricing" className="nav-link-pill">
          Precios
        </Link>
        <Link href="/#proof" className="nav-link-pill">
          Clientes
        </Link>
        <Link href="/developers" className="nav-link-pill">
          Developers
        </Link>
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/login"
          className="hidden h-10 items-center rounded-full px-4 text-sm font-medium text-foreground/75 transition hover:bg-card/70 hover:text-foreground sm:flex"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-md border border-primary/35 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/35 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105"
        >
          Empezar
        </Link>
      </div>
    </header>
  );
}
