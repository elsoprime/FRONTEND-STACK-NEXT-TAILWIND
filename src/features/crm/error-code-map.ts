const CRM_ERROR_COPY: Record<string, string> = {
  CRM_CONTACT_ALREADY_EXISTS: "Ya existe un contacto con esos datos.",
  CRM_CONTACT_NOT_FOUND: "No encontramos el contacto solicitado.",
  CRM_ORGANIZATION_ALREADY_EXISTS: "Ya existe una organizacion con esos datos.",
  CRM_ORGANIZATION_NOT_FOUND: "No encontramos la organizacion solicitada.",
  CRM_ORGANIZATION_IN_USE: "No se puede eliminar una organizacion en uso.",
  CRM_OPPORTUNITY_NOT_FOUND: "No encontramos la oportunidad solicitada.",
  CRM_OPPORTUNITY_STAGE_INVALID: "La etapa indicada no es valida.",
  CRM_OPPORTUNITY_STAGE_TRANSITION_INVALID:
    "La transicion de etapa no esta permitida para esta oportunidad.",
  CRM_ACTIVITY_REFERENCE_INVALID:
    "La actividad referencia recursos invalidos. Corrige la referencia.",
  RBAC_PERMISSION_DENIED: "No tienes permisos para operar CRM.",
  RBAC_MODULE_DENIED: "El modulo CRM no esta habilitado para este tenant.",
  RBAC_PLAN_DENIED: "El plan actual no habilita CRM.",
  AUTH_UNAUTHENTICATED: "Tu sesion no es valida o expiro. Inicia sesion nuevamente.",
  GEN_VALIDATION_ERROR: "Revisa los datos ingresados e intenta nuevamente.",
  GEN_RATE_LIMITED: "Demasiadas solicitudes. Espera e intenta nuevamente.",
  GEN_INTERNAL_ERROR: "No pudimos completar la operacion de CRM.",
};

export function resolveCrmErrorMessage(code: string, fallbackMessage?: string): string {
  if (CRM_ERROR_COPY[code]) {
    return CRM_ERROR_COPY[code];
  }

  if (fallbackMessage && fallbackMessage.trim().length > 0) {
    return fallbackMessage;
  }

  return "No pudimos completar la operacion de CRM.";
}
