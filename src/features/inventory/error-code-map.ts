const INVENTORY_ERROR_COPY: Record<string, string> = {
  INV_CATEGORY_ALREADY_EXISTS: "Ya existe una categoria con esos datos.",
  INV_CATEGORY_NOT_FOUND: "No encontramos la categoria solicitada.",
  INV_CATEGORY_IN_USE: "No se puede eliminar una categoria en uso.",
  INV_ITEM_ALREADY_EXISTS: "Ya existe un item con esos datos.",
  INV_ITEM_NOT_FOUND: "No encontramos el item solicitado.",
  INV_STOCK_CONFLICT: "El stock cambio mientras editabas. Refresca e intenta nuevamente.",
  INV_STOCK_UNDERFLOW: "La operacion dejaria stock negativo. Ajusta la cantidad.",
  INV_STOCKTAKE_INVALID_STATE: "La sesion de conteo no permite esta transicion.",
  INV_STOCKTAKE_NOT_FOUND: "No encontramos la sesion de conteo solicitada.",
  RBAC_PERMISSION_DENIED: "No tienes permisos para operar Inventory.",
  RBAC_MODULE_DENIED: "El modulo Inventory no esta habilitado para este tenant.",
  RBAC_PLAN_DENIED: "El plan actual no habilita Inventory.",
  AUTH_UNAUTHENTICATED: "Tu sesion no es valida o expiro. Inicia sesion nuevamente.",
  GEN_VALIDATION_ERROR: "Revisa los datos ingresados e intenta nuevamente.",
  GEN_RATE_LIMITED: "Demasiadas solicitudes. Espera e intenta nuevamente.",
  GEN_INTERNAL_ERROR: "No pudimos completar la operacion de inventario.",
};

export function resolveInventoryErrorMessage(code: string, fallbackMessage?: string): string {
  if (INVENTORY_ERROR_COPY[code]) {
    return INVENTORY_ERROR_COPY[code];
  }

  if (fallbackMessage && fallbackMessage.trim().length > 0) {
    return fallbackMessage;
  }

  return "No pudimos completar la operacion de inventario.";
}
