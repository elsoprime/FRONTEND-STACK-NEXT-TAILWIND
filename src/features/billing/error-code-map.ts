const BILLING_ERROR_COPY: Record<string, string> = {
  AUTH_UNAUTHENTICATED: "Tu sesion no es valida o expiro. Inicia sesion nuevamente.",
  AUTH_CSRF_INVALID: "La sesion de seguridad no es valida. Recarga la pagina e intenta otra vez.",
  RBAC_PERMISSION_DENIED: "No tienes permisos para administrar el plan del tenant.",
  RBAC_PLAN_DENIED: "El plan seleccionado no esta disponible para este tenant.",
  TENANT_HEADER_REQUIRED: "Falta el contexto tenant para completar la operacion.",
  TENANT_NOT_FOUND: "No pudimos encontrar el tenant solicitado.",
  GEN_VALIDATION_ERROR: "Revisa los datos ingresados e intenta nuevamente.",
  GEN_RATE_LIMITED: "Demasiados intentos. Espera un momento antes de reintentar.",
};

export function resolveBillingErrorMessage(code: string, fallbackMessage?: string): string {
  if (BILLING_ERROR_COPY[code]) {
    return BILLING_ERROR_COPY[code];
  }

  if (fallbackMessage && fallbackMessage.trim().length > 0) {
    return fallbackMessage;
  }

  return "No pudimos completar la operacion de aprovisionamiento del tenant.";
}
