export const queryKeys = {
  platformSettings: () => ["platform", "settings"] as const,
  tenantMine: () => ["platform", "tenant", "mine"] as const,
  tenantScope: (tenantId: string) => ["tenant", tenantId] as const,
  tenantSettings: (tenantId: string) => ["tenant", tenantId, "settings"] as const,
  tenantSettingsEffective: (tenantId: string) =>
    ["tenant", tenantId, "settings", "effective"] as const,
  tenantMemberships: (tenantId: string) => ["tenant", tenantId, "memberships"] as const,
  billingPlans: () => ["billing", "plans"] as const,
  tenantBillingCheckout: (tenantId: string) => ["tenant", tenantId, "billing", "checkout"] as const,
  tenantSubscription: (tenantId: string) => ["tenant", tenantId, "subscription"] as const,
  inventoryCategories: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "categories"] as const,
  inventoryCategory: (tenantId: string, categoryId: string) =>
    ["tenant", tenantId, "inventory", "categories", categoryId] as const,
  inventoryWarehouses: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "warehouses"] as const,
  inventoryLots: (tenantId: string) => ["tenant", tenantId, "inventory", "lots"] as const,
  inventoryStocktakes: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "stocktakes"] as const,
  inventoryStocktake: (tenantId: string, stocktakeId: string) =>
    ["tenant", tenantId, "inventory", "stocktakes", stocktakeId] as const,
  inventoryItems: (tenantId: string) => ["tenant", tenantId, "inventory", "items"] as const,
  inventoryItem: (tenantId: string, itemId: string) =>
    ["tenant", tenantId, "inventory", "items", itemId] as const,
  inventoryStockMovements: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "stock-movements"] as const,
  inventoryLowStockAlerts: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "alerts", "low-stock"] as const,
  inventoryExpiringLotAlerts: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "alerts", "expiring-lots"] as const,
  inventorySettings: (tenantId: string) => ["tenant", tenantId, "inventory", "settings"] as const,
  inventoryReconciliation: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "reconciliation"] as const,
  crmCounters: (tenantId: string) => ["tenant", tenantId, "crm", "counters"] as const,
  crmContacts: (tenantId: string) => ["tenant", tenantId, "crm", "contacts"] as const,
  crmContact: (tenantId: string, contactId: string) =>
    ["tenant", tenantId, "crm", "contacts", contactId] as const,
  crmOrganizations: (tenantId: string) => ["tenant", tenantId, "crm", "organizations"] as const,
  crmOrganization: (tenantId: string, organizationId: string) =>
    ["tenant", tenantId, "crm", "organizations", organizationId] as const,
  crmOpportunities: (tenantId: string) => ["tenant", tenantId, "crm", "opportunities"] as const,
  crmOpportunity: (tenantId: string, opportunityId: string) =>
    ["tenant", tenantId, "crm", "opportunities", opportunityId] as const,
  crmActivities: (tenantId: string) => ["tenant", tenantId, "crm", "activities"] as const,
  hrEmployees: (tenantId: string) => ["tenant", tenantId, "hr", "employees"] as const,
  hrEmployee: (tenantId: string, employeeId: string) =>
    ["tenant", tenantId, "hr", "employees", employeeId] as const,
  hrCompensation: (tenantId: string, employeeId: string) =>
    ["tenant", tenantId, "hr", "employees", employeeId, "compensation"] as const,
  tenantAuditLogs: (tenantId: string, scope: "recent" | "critical") =>
    ["tenant", tenantId, "audit", scope] as const,
  expensesRequests: (tenantId: string) => ["tenant", tenantId, "expenses", "requests"] as const,
  expenseCategories: (tenantId: string) => ["tenant", tenantId, "expenses", "categories"] as const,
  expenseSettings: (tenantId: string) => ["tenant", tenantId, "expenses", "settings"] as const,
  expenseAttachments: (tenantId: string, requestId: string) =>
    ["tenant", tenantId, "expenses", "requests", requestId, "attachments"] as const,
};

