const ACTION_LABELS: Record<string, string> = {
  "tenant.switch_active": "Cambio de tenant activo",
  "tenant.create": "Creacion de tenant",
  "tenant.settings.update": "Actualizacion de configuracion del tenant",
  "tenant.invitation.create": "Invitacion enviada",
  "tenant.invitation.revoke": "Invitacion revocada",
  "tenant.membership.update": "Actualizacion de membresia",
  "tenant.membership.delete": "Membresia eliminada",

  "auth.session.create": "Inicio de sesion",
  "auth.session.refresh": "Renovacion de sesion",
  "auth.session.revoke": "Cierre de sesion",
  "auth.password.change": "Cambio de contrasena",

  "inventory.item.create": "Item de inventario creado",
  "inventory.item.update": "Item de inventario actualizado",
  "inventory.item.delete": "Item de inventario eliminado",
  "inventory.category.create": "Categoria de inventario creada",
  "inventory.category.update": "Categoria de inventario actualizada",
  "inventory.category.delete": "Categoria de inventario eliminada",
  "inventory.warehouse.create": "Bodega creada",
  "inventory.warehouse.update": "Bodega actualizada",
  "inventory.stock.move": "Movimiento de stock",
  "inventory.stocktake.create": "Inventario ciclico creado",
  "inventory.stocktake.apply": "Inventario ciclico aplicado",
  "inventory.stocktake.cancel": "Inventario ciclico cancelado",

  "crm.contact.create": "Contacto creado",
  "crm.contact.update": "Contacto actualizado",
  "crm.contact.delete": "Contacto eliminado",
  "crm.organization.create": "Organizacion creada",
  "crm.organization.update": "Organizacion actualizada",
  "crm.organization.delete": "Organizacion eliminada",
  "crm.opportunity.create": "Oportunidad creada",
  "crm.opportunity.update": "Oportunidad actualizada",
  "crm.opportunity.delete": "Oportunidad eliminada",
  "crm.opportunity.stage.change": "Cambio de etapa de oportunidad",
  "crm.activity.create": "Actividad CRM creada",

  "hr.employee.create": "Empleado creado",
  "hr.employee.update": "Empleado actualizado",
  "hr.employee.delete": "Empleado eliminado",
  "hr.compensation.update": "Compensacion actualizada",

  "billing.subscription.assign": "Suscripcion asignada",
  "billing.subscription.cancel": "Suscripcion cancelada",
  "billing.checkout.session.create": "Sesion de pago iniciada",

  "expenses.request.create": "Solicitud de gasto creada",
  "expenses.request.update": "Solicitud de gasto actualizada",
  "expenses.request.submit": "Solicitud de gasto enviada",
  "expenses.request.review": "Solicitud de gasto en revision",
  "expenses.request.approve": "Solicitud de gasto aprobada",
  "expenses.request.reject": "Solicitud de gasto rechazada",
  "expenses.request.cancel": "Solicitud de gasto cancelada",
  "expenses.request.mark_paid": "Solicitud de gasto marcada como pagada",
  "expenses.category.create": "Categoria de gasto creada",
  "expenses.category.update": "Categoria de gasto actualizada",
  "expenses.settings.update": "Configuracion de gastos actualizada",
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  tenant: "Tenant",
  auth_session: "Sesion de autenticacion",
  session: "Sesion",
  user: "Usuario",
  membership: "Membresia",
  invitation: "Invitacion",
  settings: "Configuracion",
  inventory_item: "Item de inventario",
  inventory_lot: "Lote de inventario",
  inventory_movement: "Movimiento de inventario",
  crm_contact: "Contacto",
  crm_organization: "Organizacion",
  crm_opportunity: "Oportunidad",
  hr_employee: "Empleado",
  expense_request: "Solicitud de gasto",
  expense_category: "Categoria de gasto",
};

function toHumanLabel(value: string): string {
  const normalized = value.replace(/[._:]/g, " ").replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return "Evento";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatAuditActionLabel(action: string): string {
  const normalized = action.trim();

  if (normalized.length === 0) {
    return "Evento";
  }

  const direct = ACTION_LABELS[normalized.toLowerCase()];
  if (direct) {
    return direct;
  }

  return toHumanLabel(normalized);
}

export function formatAuditResourceTypeLabel(resourceType: string): string {
  const normalized = resourceType.trim();

  if (normalized.length === 0) {
    return "Recurso";
  }

  const direct = RESOURCE_TYPE_LABELS[normalized.toLowerCase()];
  if (direct) {
    return direct;
  }

  return toHumanLabel(normalized);
}

export function formatAuditResourceLabel(resourceType: string, resourceLabel?: string): string {
  const typeLabel = formatAuditResourceTypeLabel(resourceType);

  if (!resourceLabel || resourceLabel.trim().length === 0) {
    return typeLabel;
  }

  return `${typeLabel} - ${resourceLabel.trim()}`;
}

export function formatTraceIdShort(traceId: string, visibleStart = 8, visibleEnd = 6): string {
  const value = traceId.trim();

  if (value.length === 0) {
    return "sin-traza";
  }

  const minLengthToShorten = visibleStart + visibleEnd + 1;
  if (value.length <= minLengthToShorten) {
    return value;
  }

  return `${value.slice(0, visibleStart)}...${value.slice(-visibleEnd)}`;
}
