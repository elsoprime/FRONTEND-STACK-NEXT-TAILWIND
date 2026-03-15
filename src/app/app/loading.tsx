import { LoadingScreen } from "@/components/ui/loading-screen";

export default function AppLoading() {
  return (
    <LoadingScreen
      label="Preparando dashboard..."
      hint="Sincronizando módulos, sesión y contexto tenant."
    />
  );
}
