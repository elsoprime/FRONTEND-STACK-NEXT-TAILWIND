import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Contacto",
    template: "%s | Contacto | ELSOMEDIA One",
  },
  description:
    "Solicite demo, estrategia o plan para implementar ELSOMEDIA One en su organizacion.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
