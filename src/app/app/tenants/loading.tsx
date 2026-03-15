import { LoadingScreen } from "@/components/ui/loading-screen";

export default function TenantRoutesLoading() {
  return (
    <LoadingScreen
      label="Cargando sección tenant..."
      hint="Preparando selector, membresías y controles del tenant activo."
    />
  );
}
