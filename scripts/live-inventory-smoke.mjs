import assert from "node:assert/strict";

const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  ""
).replace(/\/$/, "");
const TENANT_ID = process.env.QA_TENANT_ID ?? "";
const BEARER_TOKEN = process.env.QA_BEARER_TOKEN ?? "";
const TIMEOUT_MS = Number(process.env.QA_TIMEOUT_MS ?? 20_000);
const MUTATION_MODE = process.env.QA_INVENTORY_MUTATION_MODE === "true";

if (!API_BASE_URL) {
  throw new Error("Missing API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL)");
}

if (!TENANT_ID) {
  throw new Error("Missing QA_TENANT_ID");
}

if (!BEARER_TOKEN) {
  throw new Error("Missing QA_BEARER_TOKEN");
}

const headers = {
  "Content-Type": "application/json",
  "X-Tenant-Id": TENANT_ID,
  Authorization: `Bearer ${BEARER_TOKEN}`,
};

const summary = {
  baseUrl: API_BASE_URL,
  tenantId: TENANT_ID,
  checks: [],
  mutationMode: MUTATION_MODE,
};

async function apiGet(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);

    return {
      status: response.status,
      ok: response.ok,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function apiPost(path, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);

    return {
      status: response.status,
      ok: response.ok,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function recordCheck(name, response) {
  const traceId =
    response.body && typeof response.body === "object" ? (response.body.traceId ?? null) : null;

  summary.checks.push({
    name,
    status: response.status,
    ok: response.ok,
    traceId,
  });
}

function assertSuccessEnvelope(name, response) {
  assert.equal(response.ok, true, `${name} failed with status ${response.status}`);
  assert.ok(response.body && typeof response.body === "object", `${name} body is not JSON object`);
  assert.equal(response.body.success, true, `${name} success flag is not true`);
}

async function runReadOnlyChecks() {
  const checks = [
    ["health", "/health"],
    ["inventory.categories", "/api/v1/modules/inventory/categories?page=1&limit=5"],
    ["inventory.items", "/api/v1/modules/inventory/items?page=1&limit=5"],
    ["inventory.warehouses", "/api/v1/modules/inventory/warehouses?page=1&limit=5"],
    ["inventory.lots", "/api/v1/modules/inventory/lots?page=1&limit=5"],
    ["inventory.stockMovements", "/api/v1/modules/inventory/stock-movements?page=1&limit=5"],
    ["inventory.stocktakes", "/api/v1/modules/inventory/stocktakes?page=1&limit=5"],
    ["inventory.alerts.lowStock", "/api/v1/modules/inventory/alerts/low-stock?page=1&limit=5"],
    [
      "inventory.alerts.expiringLots",
      "/api/v1/modules/inventory/alerts/expiring-lots?page=1&limit=5&withinDays=30",
    ],
    ["inventory.reconciliation", "/api/v1/modules/inventory/reconciliation?sinceDays=7"],
    ["inventory.settings", "/api/v1/modules/inventory/settings"],
  ];

  for (const [name, path] of checks) {
    const response = await apiGet(path);
    recordCheck(name, response);
    assertSuccessEnvelope(name, response);
  }
}

async function runMutationProbe() {
  const sku = `QA-LIVE-${Date.now()}`;
  const response = await apiPost("/api/v1/modules/inventory/items", {
    sku,
    name: `Smoke ${sku}`,
    unit: "unit",
    isActive: true,
  });

  recordCheck("inventory.items.createProbe", response);
  assertSuccessEnvelope("inventory.items.createProbe", response);
}

async function run() {
  await runReadOnlyChecks();

  if (MUTATION_MODE) {
    await runMutationProbe();
  }

  console.log(JSON.stringify({ success: true, summary }, null, 2));
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        summary,
        error:
          error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
