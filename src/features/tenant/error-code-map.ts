const TENANT_ERROR_COPY: Record<string, string> = {
  TENANT_SLUG_ALREADY_EXISTS: "El slug elegido ya esta en uso. Prueba con otra opcion.",
  TENANT_NOT_FOUND: "No pudimos encontrar el tenant solicitado.",
  TENANT_INACTIVE: "El tenant seleccionado no esta activo.",
  TENANT_MEMBERSHIP_REQUIRED: "Tu usuario no pertenece al tenant solicitado.",
  TENANT_MEMBERSHIP_INACTIVE: "Tu membresia en este tenant no esta activa.",
  TENANT_ACCESS_DENIED: "No tienes acceso al tenant solicitado.",
  TENANT_MEMBER_LIMIT_REACHED:
    "Se alcanzo el limite de miembros del plan. Actualiza el plan o libera cupos antes de invitar.",
  TENANT_MEMBERSHIP_NOT_FOUND:
    "No pudimos encontrar la membresia solicitada dentro del tenant activo.",
  TENANT_MEMBERSHIP_OWNER_PROTECTED:
    "El owner efectivo del tenant no puede removerse ni modificarse desde esta superficie.",
  TENANT_SUBSCRIPTION_PAYMENT_REQUIRED:
    "La suscripcion del tenant requiere pago para habilitar esta funcionalidad. Ve a Billing para regularizar.",
  TENANT_SCOPE_MISMATCH: "Tu contexto tenant actual no coincide con el recurso solicitado.",
  TENANT_HEADER_REQUIRED: "Falta contexto tenant para completar la operacion.",
  GEN_VALIDATION_ERROR: "Revisa los datos ingresados e intenta nuevamente.",
  RBAC_PERMISSION_DENIED: "Tu usuario no tiene permisos suficientes para completar esta accion.",
  RBAC_PLAN_DENIED: "El plan actual no habilita esta funcionalidad.",
  RBAC_MODULE_DENIED: "El modulo no esta habilitado para este tenant.",
  AUTH_UNAUTHENTICATED: "Tu sesion no es valida o expiro. Inicia sesion nuevamente.",
};

const PLATFORM_SETTINGS_DEPENDENCY_FRAGMENT =
  "platform settings must be initialized before resolving effective tenant settings";

function resolveDependencyMessage(rawMessage?: string): string | null {
  if (!rawMessage) {
    return null;
  }

  if (rawMessage.toLowerCase().includes(PLATFORM_SETTINGS_DEPENDENCY_FRAGMENT)) {
    return "Dependencia abierta: la configuracion de plataforma no esta inicializada. Solicita inicializar Platform Settings antes de cargar la vista efectiva del tenant.";
  }

  return null;
}

export function resolveTenantErrorMessage(code: string, rawMessage?: string): string {
  const dependencyMessage = resolveDependencyMessage(rawMessage);
  if (dependencyMessage) {
    return dependencyMessage;
  }

  return TENANT_ERROR_COPY[code] ?? "No pudimos completar la operacion tenant. Intenta nuevamente.";
}
