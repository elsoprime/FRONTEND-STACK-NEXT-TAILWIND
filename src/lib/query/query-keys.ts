export const queryKeys = {
  platformSettings: () => ["platform", "settings"] as const,
  tenantMine: () => ["platform", "tenant", "mine"] as const,
  tenantScope: (tenantId: string) => ["tenant", tenantId] as const,
  tenantSettings: (tenantId: string) => ["tenant", tenantId, "settings"] as const,
  tenantSettingsEffective: (tenantId: string) =>
    ["tenant", tenantId, "settings", "effective"] as const,
  billingPlans: () => ["billing", "plans"] as const,
  tenantBillingCheckout: (tenantId: string) => ["tenant", tenantId, "billing", "checkout"] as const,
  tenantSubscription: (tenantId: string) => ["tenant", tenantId, "subscription"] as const,
  inventoryCategories: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "categories"] as const,
  inventoryItems: (tenantId: string) => ["tenant", tenantId, "inventory", "items"] as const,
  inventoryLowStockAlerts: (tenantId: string) =>
    ["tenant", tenantId, "inventory", "alerts", "low-stock"] as const,
  crmCounters: (tenantId: string) => ["tenant", tenantId, "crm", "counters"] as const,
  crmOpportunities: (tenantId: string) => ["tenant", tenantId, "crm", "opportunities"] as const,
  hrEmployees: (tenantId: string) => ["tenant", tenantId, "hr", "employees"] as const,
};
