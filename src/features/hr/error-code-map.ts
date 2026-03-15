const HR_ERROR_COPY: Record<string, string> = {
  HR_EMPLOYEE_ALREADY_EXISTS: "Ya existe un empleado con ese codigo.",
  HR_EMPLOYEE_NOT_FOUND: "No encontramos el empleado solicitado.",
  HR_EMPLOYEE_HIERARCHY_INVALID: "La jerarquia indicada no es valida.",
  HR_EMPLOYEE_HIERARCHY_CYCLE: "La jerarquia crea un ciclo de reporte.",
  HR_COMPENSATION_NOT_FOUND: "No encontramos compensacion para este empleado.",
  HR_COMPENSATION_INVALID: "Los datos de compensacion no son validos.",
  RBAC_PERMISSION_DENIED: "No tienes permisos para operar HR.",
  RBAC_MODULE_DENIED: "El modulo HR no esta habilitado para este tenant.",
  RBAC_PLAN_DENIED: "El plan actual no habilita HR.",
  AUTH_UNAUTHENTICATED: "Tu sesion no es valida o expiro. Inicia sesion nuevamente.",
  GEN_VALIDATION_ERROR: "Revisa los datos ingresados e intenta nuevamente.",
  GEN_RATE_LIMITED: "Demasiadas solicitudes. Espera e intenta nuevamente.",
  GEN_INTERNAL_ERROR: "No pudimos completar la operacion de HR.",
};

export function resolveHrErrorMessage(code: string, fallbackMessage?: string): string {
  if (HR_ERROR_COPY[code]) {
    return HR_ERROR_COPY[code];
  }

  if (fallbackMessage && fallbackMessage.trim().length > 0) {
    return fallbackMessage;
  }

  return "No pudimos completar la operacion de HR.";
}
