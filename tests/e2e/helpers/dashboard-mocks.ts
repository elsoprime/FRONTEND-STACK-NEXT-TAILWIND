import type { Page } from "@playwright/test";

type ApiEnvelope<Data, Pagination = undefined> = {
  success: true;
  data: Data;
  traceId: string;
} & (Pagination extends undefined ? Record<never, never> : { pagination: Pagination });

type AuditScope = "recent" | "critical";

type AuditLog = {
  id: string;
  scope: "platform" | "tenant";
  action: string;
  severity: "info" | "warning" | "critical";
  traceId: string;
  actor: {
    kind: "user" | "system" | "unknown";
    userId?: string;
    systemId?: string;
    label?: string;
    sessionId?: string;
    scope?: string[];
    reason?: "http_unauthenticated" | "external_unresolved" | "internal_unresolved";
  };
  tenant?: {
    tenantId: string;
    membershipId?: string;
    roleKey?: string;
    isOwner?: boolean;
    effectiveRoleKeys?: string[];
  };
  resource: {
    type: string;
    label?: string;
  };
  createdAt: string;
};

type AuditPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const DEFAULT_TENANT_ID = "507f191e810c19729de860ea";

const AUDIT_SEVERITY: Record<AuditScope, "info" | "warning" | "critical"> = {
  recent: "warning",
  critical: "critical",
};

function buildAuditLog(scope: AuditScope, index: number): AuditLog {
  return {
    id: `audit-${scope}-${index}`,
    scope: "tenant",
    actor: {
      kind: "user",
      userId: "usr_owner_01",
      sessionId: "sess_01",
      scope: ["tenant"],
    },
    tenant: {
      tenantId: DEFAULT_TENANT_ID,
      membershipId: "mem_01",
      roleKey: "tenant:owner",
      isOwner: true,
      effectiveRoleKeys: ["tenant:owner"],
    },
    action: scope === "critical" ? "settings.updated" : "module.accessed",
    severity: AUDIT_SEVERITY[scope],
    traceId: `trace-audit-${scope}-${index}`,
    resource: {
      type: scope === "critical" ? "tenant" : "modules",
      label: scope === "critical" ? "billing" : "inventory",
    },
    createdAt: new Date(Date.now() - index * 1000 * 60).toISOString(),
  };
}

function buildAuditResponse<TScope extends AuditScope>(scope: TScope): ApiEnvelope<{ items: AuditLog[] }, AuditPagination> {
  const items = Array.from({ length: scope === "critical" ? 1 : 3 }, (_, index) => buildAuditLog(scope, index));

  return {
    success: true,
    data: {
      items,
    },
    pagination: {
      page: 1,
      limit: items.length,
      total: items.length,
      totalPages: 1,
    },
    traceId: `trace-audit-${scope}`,
  };
}

const DEFAULT_TENANT_SETTINGS_EFFECTIVE = {
  success: true,
  data: {
    settings: {
      tenantId: "507f191e810c19729de860ea",
      branding: {
        displayName: "Acme Corp",
        supportEmail: "ops@acme.dev",
        supportUrl: "https://support.acme.dev",
      },
      localization: {
        defaultTimezone: "America/Santiago",
        defaultCurrency: "CLP",
        defaultLanguage: "es",
      },
      contact: {
        primaryEmail: "ops@acme.dev",
        phone: "+56 9 0000 0000",
        websiteUrl: "https://acme.dev",
      },
      billing: {
        billingEmail: "billing@acme.dev",
        legalName: "Acme Corporation",
        taxId: "123456789",
      },
      runtime: {
        planId: "plan:growth",
        activeModuleKeys: ["inventory", "crm", "hr"],
        enabledModuleKeys: ["inventory", "crm", "hr"],
        featureFlagKeys: ["inventory:analytics", "crm:base"],
      },
    },
  },
  traceId: "trace-tenant-settings-effective",
};

const DEFAULT_BILLING_PLANS = {
  success: true,
  data: {
    items: [
      {
        key: "plan:start",
        name: "Start",
        description: "Entry plan",
        rank: 1,
        allowedModuleKeys: ["inventory"],
        featureFlagKeys: [],
        memberLimit: 50,
      },
      {
        key: "plan:growth",
        name: "Growth",
        description: "Ops plan",
        rank: 2,
        allowedModuleKeys: ["inventory", "crm", "hr"],
        featureFlagKeys: ["inventory:analytics", "crm:base"],
        memberLimit: 200,
      },
    ],
  },
  traceId: "trace-billing-plans",
};

const INVENTORY_LOW_STOCK_RESPONSE = {
  success: true,
  data: {
    items: [
      { item: { id: "item-1", name: "Widget A" }, deficit: 5 },
    ],
  },
  pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
  traceId: "trace-inventory-alerts",
};

const CRM_COUNTERS_RESPONSE = {
  success: true,
  data: {
    counters: {
      tenantId: "507f191e810c19729de860ea",
      contactsActive: 32,
      organizationsActive: 14,
      opportunitiesOpen: 8,
      opportunitiesWon: 2,
      opportunitiesLost: 1,
    },
  },
  traceId: "trace-crm-counters",
};

const HR_EMPLOYEES_RESPONSE = {
  success: true,
  data: {
    items: [
      {
        id: "emp-1",
        tenantId: "507f191e810c19729de860ea",
        employeeCode: "E-01",
        firstName: "Rafael",
        lastName: "Acme",
        status: "active",
        isActive: true,
      },
    ],
  },
  pagination: { page: 1, limit: 1, total: 1, totalPages: 1 },
  traceId: "trace-hr-employees",
};

export function attachTenantDashboardMocks(page: Page) {
  page.route("**/api/v1/tenant/settings/effective", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DEFAULT_TENANT_SETTINGS_EFFECTIVE),
    });
  });

  page.route("**/api/v1/billing/plans", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DEFAULT_BILLING_PLANS),
    });
  });

  page.route("**/api/v1/modules/inventory/alerts/low-stock", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(INVENTORY_LOW_STOCK_RESPONSE),
    });
  });

  page.route("**/api/v1/modules/crm/counters", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(CRM_COUNTERS_RESPONSE),
    });
  });

  page.route("**/api/v1/modules/hr/employees", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(HR_EMPLOYEES_RESPONSE),
    });
  });

  page.route("**/api/v1/audit**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const severity = requestUrl.searchParams.get("severity");
    const scope: AuditScope = severity === "critical" ? "critical" : "recent";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildAuditResponse(scope)),
    });
  });
}

