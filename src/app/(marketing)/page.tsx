import type { Metadata } from "next";
import { SaasCorporate } from "@/components/landing/saas-corporate";
import FooterPage from "@/components/landing/footer-page";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "ELSOMEDIA One unifica operaciones, seguridad y trazabilidad en una plataforma SaaS enterprise.",
};

export default function Home() {
  return (
    <>
      <SaasCorporate />
      <FooterPage />
    </>
  );
}
