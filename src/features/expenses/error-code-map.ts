const EXPENSES_ERROR_COPY: Record<string, string> = {
  EXPENSES_REQUEST_NOT_FOUND: "No encontramos la solicitud de gasto solicitada.",
  EXPENSES_ATTACHMENT_NOT_FOUND: "No encontramos el adjunto solicitado.",
  EXPENSES_ATTACHMENT_INVALID_TYPE: "El archivo no cumple con los tipos permitidos para adjuntos.",
  EXPENSES_ATTACHMENT_INVALID_SIZE: "El archivo supera el tamano maximo permitido.",
  EXPENSES_ATTACHMENT_DUPLICATE: "Ya existe un adjunto equivalente para esta solicitud.",
  EXPENSES_BULK_LIMIT_EXCEEDED: "El lote supera el maximo permitido por operacion.",
  EXPENSES_BULK_PARTIAL_FAILURE: "La operacion se completo de forma parcial.",
  RBAC_PERMISSION_DENIED: "No tienes permisos para operar Expenses.",
  RBAC_MODULE_DENIED: "El modulo Expenses no esta habilitado para este tenant.",
  RBAC_PLAN_DENIED: "El plan actual no habilita Expenses.",
  AUTH_UNAUTHENTICATED: "Tu sesion no es valida o expiro. Inicia sesion nuevamente.",
  GEN_VALIDATION_ERROR: "Revisa los datos ingresados e intenta nuevamente.",
  GEN_RATE_LIMITED: "Demasiadas solicitudes. Espera e intenta nuevamente.",
  GEN_INTERNAL_ERROR: "No pudimos completar la operacion de gastos.",
};

export function resolveExpensesErrorMessage(code: string, fallbackMessage?: string): string {
  if (EXPENSES_ERROR_COPY[code]) {
    return EXPENSES_ERROR_COPY[code];
  }

  if (fallbackMessage && fallbackMessage.trim().length > 0) {
    return fallbackMessage;
  }

  return "No pudimos completar la operacion de gastos.";
}
