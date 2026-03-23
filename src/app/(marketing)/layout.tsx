import type { Metadata } from "next";
import { MarketingHeader } from "./_marketing-header";
import { MarketingThemeProvider } from "./marketing-theme-provider";

export const metadata: Metadata = {
  title: {
    default: "ELSOMEDIA One | Plataforma SaaS Enterprise",
    template: "%s | ELSOMEDIA One",
  },
  description:
    "Plataforma SaaS enterprise para gestionar operaciones, seguridad, auditoria y crecimiento modular desde una sola base.",
  openGraph: {
    title: "ELSOMEDIA One | Plataforma SaaS Enterprise",
    description:
      "Control operativo, seguridad y escalabilidad modular para empresas modernas.",
    type: "website",
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    title: "ELSOMEDIA One | Plataforma SaaS Enterprise",
    description:
      "Control operativo, seguridad y escalabilidad modular para empresas modernas.",
  },
  keywords: [
    "saas enterprise",
    "plataforma empresarial",
    "multi tenant",
    "dashboard de operaciones",
    "seguridad SOC2",
    "auditoria empresarial",
  ],
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingThemeProvider>
      <MarketingHeader />
      {children}
    </MarketingThemeProvider>
  );
}
