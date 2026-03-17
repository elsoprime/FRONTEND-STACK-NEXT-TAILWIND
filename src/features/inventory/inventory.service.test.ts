import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  createInventoryCategory,
  createInventoryItem,
  createInventoryLot,
  createInventoryStockMovement,
  createInventoryStocktake,
  createInventoryWarehouse,
  deleteInventoryCategory,
  deleteInventoryItem,
  getInventoryItem,
  listInventoryCategories,
  listInventoryItems,
  listInventoryLots,
  listInventoryLowStockAlerts,
  listInventoryExpiringLotAlerts,
  listInventoryStockMovements,
  listInventoryStocktakes,
  listInventoryWarehouses,
  updateInventoryCategory,
  updateInventoryItem,
  updateInventoryLot,
  updateInventoryWarehouse,
  applyInventoryStocktake,
  cancelInventoryStocktake,
  getInventoryStocktake,
  getInventoryReconciliation,
  getInventorySettings,
  upsertInventoryStocktakeCounts,
  updateInventorySettings,
} from "@/features/inventory/inventory.service";
import { server } from "@/mocks/server";

const TENANT_ID = "507f191e810c19729de860ea";
const CATEGORY_ID = "507f191e810c19729de860eb";
const ITEM_ID = "507f191e810c19729de860ec";
const WAREHOUSE_ID = "507f191e810c19729de860ed";
const LOT_ID = "507f191e810c19729de860ee";
const STOCKTAKE_ID = "507f191e810c19729de860ef";

const categoryFixture = {
  id: CATEGORY_ID,
  tenantId: TENANT_ID,
  name: "Hardware",
  description: "Hardware base",
  isActive: true,
};

const warehouseFixture = {
  id: WAREHOUSE_ID,
  tenantId: TENANT_ID,
  name: "Bodega Central",
  description: "Principal",
  isActive: true,
};

const lotFixture = {
  id: LOT_ID,
  tenantId: TENANT_ID,
  itemId: ITEM_ID,
  warehouseId: WAREHOUSE_ID,
  lotCode: "LOT-2026-001",
  receivedAt: "2026-03-17T00:00:00.000Z",
  expiresAt: "2026-06-17T00:00:00.000Z",
  initialQuantity: 20,
  currentQuantity: 18,
  isActive: true,
};

const stocktakeFixture = {
  id: STOCKTAKE_ID,
  tenantId: TENANT_ID,
  warehouseId: WAREHOUSE_ID,
  name: "Conteo mensual",
  status: "draft",
  lines: [
    {
      itemId: ITEM_ID,
      countedStock: 9,
      lotId: LOT_ID,
    },
  ],
  createdAt: "2026-03-17T00:00:00.000Z",
  updatedAt: "2026-03-17T00:00:00.000Z",
};

const settingsFixture = {
  tenantId: TENANT_ID,
  lotAllocationPolicy: "FIFO",
  rolloutPhase: "general",
  capabilities: {
    warehouses: true,
    lots: true,
    stocktakes: true,
  },
};

const reconciliationFixture = {
  tenantId: TENANT_ID,
  comparedAt: "2026-03-17T01:00:00.000Z",
  movementCount: 12,
  movementIn: 8,
  movementOut: 4,
  balanceTotal: 120,
  itemStockTotal: 120,
  drift: 0,
  status: "ok",
};

const itemFixture = {
  id: ITEM_ID,
  tenantId: TENANT_ID,
  categoryId: CATEGORY_ID,
  sku: "SKU-001",
  name: "Router Pro",
  description: "Router de borde",
  currentStock: 10,
  minStock: 3,
  isLowStock: false,
  isActive: true,
};

describe("inventory.service", () => {
  it("lists inventory categories with tenant header and query", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/inventory/categories", ({ request }) => {
        capturedUrl = request.url;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            items: [categoryFixture],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-inv-categories-list",
        });
      }),
    );

    const result = await listInventoryCategories(TENANT_ID, {
      page: 1,
      limit: 20,
      search: "hard",
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("search")).toBe("hard");
    expect(result.data.items[0]?.id).toBe(CATEGORY_ID);
    expect(result.pagination.total).toBe(1);
  });

  it("creates inventory category", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/modules/inventory/categories", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json(
          {
            success: true,
            data: {
              category: categoryFixture,
            },
            traceId: "trace-inv-categories-create",
          },
          { status: 201 },
        );
      }),
    );

    const result = await createInventoryCategory(TENANT_ID, {
      name: "Hardware",
      description: "Hardware base",
    });

    expect(body).toEqual({ name: "Hardware", description: "Hardware base" });
    expect(result.data.category.id).toBe(CATEGORY_ID);
  });

  it("updates inventory category", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.patch(`*/api/v1/modules/inventory/categories/${CATEGORY_ID}`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          success: true,
          data: {
            category: {
              ...categoryFixture,
              description: "Hardware actualizado",
            },
          },
          traceId: "trace-inv-categories-update",
        });
      }),
    );

    const result = await updateInventoryCategory(TENANT_ID, CATEGORY_ID, {
      description: "Hardware actualizado",
    });

    expect(body).toEqual({ description: "Hardware actualizado" });
    expect(result.data.category.description).toBe("Hardware actualizado");
  });

  it("deletes inventory category", async () => {
    server.use(
      http.delete(`*/api/v1/modules/inventory/categories/${CATEGORY_ID}`, ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            category: categoryFixture,
          },
          traceId: "trace-inv-categories-delete",
        });
      }),
    );

    const result = await deleteInventoryCategory(TENANT_ID, CATEGORY_ID);

    expect(result.data.category.id).toBe(CATEGORY_ID);
  });

  it("lists inventory warehouses with search", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/inventory/warehouses", ({ request }) => {
        capturedUrl = request.url;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            items: [warehouseFixture],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-inv-warehouses-list",
        });
      }),
    );

    const result = await listInventoryWarehouses(TENANT_ID, {
      page: 1,
      limit: 20,
      search: "central",
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("search")).toBe("central");
    expect(result.data.items[0]?.id).toBe(WAREHOUSE_ID);
  });

  it("creates inventory warehouse", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/modules/inventory/warehouses", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          {
            success: true,
            data: {
              warehouse: warehouseFixture,
            },
            traceId: "trace-inv-warehouses-create",
          },
          { status: 201 },
        );
      }),
    );

    const result = await createInventoryWarehouse(TENANT_ID, {
      name: "Bodega Central",
      description: "Principal",
    });

    expect(body).toEqual({ name: "Bodega Central", description: "Principal" });
    expect(result.data.warehouse.id).toBe(WAREHOUSE_ID);
  });

  it("updates inventory warehouse", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.patch(`*/api/v1/modules/inventory/warehouses/${WAREHOUSE_ID}`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          success: true,
          data: {
            warehouse: {
              ...warehouseFixture,
              isActive: false,
            },
          },
          traceId: "trace-inv-warehouses-update",
        });
      }),
    );

    const result = await updateInventoryWarehouse(TENANT_ID, WAREHOUSE_ID, {
      isActive: false,
    });

    expect(body).toEqual({ isActive: false });
    expect(result.data.warehouse.isActive).toBe(false);
  });

  it("lists inventory lots with filters", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/inventory/lots", ({ request }) => {
        capturedUrl = request.url;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            items: [lotFixture],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-inv-lots-list",
        });
      }),
    );

    const result = await listInventoryLots(TENANT_ID, {
      itemId: ITEM_ID,
      warehouseId: WAREHOUSE_ID,
      page: 1,
      limit: 20,
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("itemId")).toBe(ITEM_ID);
    expect(parsed.searchParams.get("warehouseId")).toBe(WAREHOUSE_ID);
    expect(result.data.items[0]?.id).toBe(LOT_ID);
  });

  it("creates inventory lot", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/modules/inventory/lots", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          {
            success: true,
            data: {
              lot: lotFixture,
            },
            traceId: "trace-inv-lots-create",
          },
          { status: 201 },
        );
      }),
    );

    const result = await createInventoryLot(TENANT_ID, {
      itemId: ITEM_ID,
      warehouseId: WAREHOUSE_ID,
      lotCode: "LOT-2026-001",
      quantity: 20,
      expiresAt: "2026-06-17T00:00:00.000Z",
    });

    expect(body).toEqual({
      itemId: ITEM_ID,
      warehouseId: WAREHOUSE_ID,
      lotCode: "LOT-2026-001",
      quantity: 20,
      expiresAt: "2026-06-17T00:00:00.000Z",
    });
    expect(result.data.lot.id).toBe(LOT_ID);
  });

  it("updates inventory lot", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.patch(`*/api/v1/modules/inventory/lots/${LOT_ID}`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          success: true,
          data: {
            lot: {
              ...lotFixture,
              isActive: false,
            },
          },
          traceId: "trace-inv-lots-update",
        });
      }),
    );

    const result = await updateInventoryLot(TENANT_ID, LOT_ID, {
      isActive: false,
    });

    expect(body).toEqual({ isActive: false });
    expect(result.data.lot.isActive).toBe(false);
  });
  it("lists inventory stocktakes", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/inventory/stocktakes", ({ request }) => {
        capturedUrl = request.url;

        return HttpResponse.json({
          success: true,
          data: {
            items: [stocktakeFixture],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-inv-stocktakes-list",
        });
      }),
    );

    const result = await listInventoryStocktakes(TENANT_ID, {
      warehouseId: WAREHOUSE_ID,
      status: "draft",
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("warehouseId")).toBe(WAREHOUSE_ID);
    expect(parsed.searchParams.get("status")).toBe("draft");
    expect(result.data.items[0]?.id).toBe(STOCKTAKE_ID);
  });

  it("creates inventory stocktake", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/modules/inventory/stocktakes", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          {
            success: true,
            data: {
              stocktake: stocktakeFixture,
            },
            traceId: "trace-inv-stocktake-create",
          },
          { status: 201 },
        );
      }),
    );

    const result = await createInventoryStocktake(TENANT_ID, {
      warehouseId: WAREHOUSE_ID,
      name: "Conteo mensual",
    });

    expect(body).toEqual({ warehouseId: WAREHOUSE_ID, name: "Conteo mensual" });
    expect(result.data.stocktake.id).toBe(STOCKTAKE_ID);
  });

  it("gets inventory stocktake", async () => {
    server.use(
      http.get(`*/api/v1/modules/inventory/stocktakes/${STOCKTAKE_ID}`, () =>
        HttpResponse.json({
          success: true,
          data: {
            stocktake: stocktakeFixture,
          },
          traceId: "trace-inv-stocktake-get",
        }),
      ),
    );

    const result = await getInventoryStocktake(TENANT_ID, STOCKTAKE_ID);
    expect(result.data.stocktake.id).toBe(STOCKTAKE_ID);
  });

  it("upserts inventory stocktake counts", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.put(
        `*/api/v1/modules/inventory/stocktakes/${STOCKTAKE_ID}/counts`,
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;

          return HttpResponse.json({
            success: true,
            data: {
              stocktake: {
                ...stocktakeFixture,
                status: "review",
              },
            },
            traceId: "trace-inv-stocktake-counts",
          });
        },
      ),
    );

    const result = await upsertInventoryStocktakeCounts(TENANT_ID, STOCKTAKE_ID, {
      lines: [
        {
          itemId: ITEM_ID,
          countedStock: 9,
          lotId: LOT_ID,
        },
      ],
    });

    expect(body).toEqual({
      lines: [
        {
          itemId: ITEM_ID,
          countedStock: 9,
          lotId: LOT_ID,
        },
      ],
    });
    expect(result.data.stocktake.status).toBe("review");
  });

  it("applies and cancels inventory stocktake", async () => {
    server.use(
      http.post(`*/api/v1/modules/inventory/stocktakes/${STOCKTAKE_ID}/apply`, () =>
        HttpResponse.json({
          success: true,
          data: {
            stocktake: {
              ...stocktakeFixture,
              status: "applied",
            },
          },
          traceId: "trace-inv-stocktake-apply",
        }),
      ),
      http.post(`*/api/v1/modules/inventory/stocktakes/${STOCKTAKE_ID}/cancel`, () =>
        HttpResponse.json({
          success: true,
          data: {
            stocktake: {
              ...stocktakeFixture,
              status: "cancelled",
            },
          },
          traceId: "trace-inv-stocktake-cancel",
        }),
      ),
    );

    const applied = await applyInventoryStocktake(TENANT_ID, STOCKTAKE_ID);
    const cancelled = await cancelInventoryStocktake(TENANT_ID, STOCKTAKE_ID);

    expect(applied.data.stocktake.status).toBe("applied");
    expect(cancelled.data.stocktake.status).toBe("cancelled");
  });
  it("lists inventory items with filters", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/inventory/items", ({ request }) => {
        capturedUrl = request.url;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            items: [itemFixture],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-inv-items-list",
        });
      }),
    );

    const result = await listInventoryItems(TENANT_ID, {
      categoryId: CATEGORY_ID,
      search: "router",
      lowStockOnly: false,
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("categoryId")).toBe(CATEGORY_ID);
    expect(parsed.searchParams.get("search")).toBe("router");
    expect(parsed.searchParams.get("lowStockOnly")).toBe("false");
    expect(result.data.items[0]?.id).toBe(ITEM_ID);
  });

  it("creates inventory item", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/modules/inventory/items", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          {
            success: true,
            data: {
              item: itemFixture,
            },
            traceId: "trace-inv-items-create",
          },
          { status: 201 },
        );
      }),
    );

    const result = await createInventoryItem(TENANT_ID, {
      categoryId: CATEGORY_ID,
      sku: "SKU-001",
      name: "Router Pro",
      description: "Router de borde",
      initialStock: 10,
      minStock: 3,
    });

    expect(body).toEqual({
      categoryId: CATEGORY_ID,
      sku: "SKU-001",
      name: "Router Pro",
      description: "Router de borde",
      initialStock: 10,
      minStock: 3,
    });
    expect(result.data.item.id).toBe(ITEM_ID);
  });

  it("gets inventory item by id", async () => {
    server.use(
      http.get(`*/api/v1/modules/inventory/items/${ITEM_ID}`, ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            item: itemFixture,
          },
          traceId: "trace-inv-items-get",
        });
      }),
    );

    const result = await getInventoryItem(TENANT_ID, ITEM_ID);

    expect(result.data.item.id).toBe(ITEM_ID);
  });

  it("updates inventory item", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.patch(`*/api/v1/modules/inventory/items/${ITEM_ID}`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          success: true,
          data: {
            item: {
              ...itemFixture,
              minStock: 5,
            },
          },
          traceId: "trace-inv-items-update",
        });
      }),
    );

    const result = await updateInventoryItem(TENANT_ID, ITEM_ID, {
      minStock: 5,
    });

    expect(body).toEqual({ minStock: 5 });
    expect(result.data.item.minStock).toBe(5);
  });

  it("deletes inventory item", async () => {
    server.use(
      http.delete(`*/api/v1/modules/inventory/items/${ITEM_ID}`, () =>
        HttpResponse.json({
          success: true,
          data: {
            item: itemFixture,
          },
          traceId: "trace-inv-items-delete",
        }),
      ),
    );

    const result = await deleteInventoryItem(TENANT_ID, ITEM_ID);

    expect(result.data.item.id).toBe(ITEM_ID);
  });

  it("lists stock movements", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/inventory/stock-movements", ({ request }) => {
        capturedUrl = request.url;

        return HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                id: "507f191e810c19729de860ed",
                tenantId: TENANT_ID,
                itemId: ITEM_ID,
                direction: "out",
                quantity: 2,
                stockBefore: 10,
                stockAfter: 8,
                reason: "Venta",
                performedByUserId: "507f191e810c19729de860ff",
                createdAt: "2026-03-10T18:00:00.000Z",
              },
            ],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-inv-stock-list",
        });
      }),
    );

    const result = await listInventoryStockMovements(TENANT_ID, {
      itemId: ITEM_ID,
      page: 1,
      limit: 20,
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("itemId")).toBe(ITEM_ID);
    expect(result.data.items[0]?.direction).toBe("out");
  });

  it("creates stock movement", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/modules/inventory/stock-movements", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          {
            success: true,
            data: {
              movement: {
                id: "507f191e810c19729de860ed",
                tenantId: TENANT_ID,
                itemId: ITEM_ID,
                direction: "in",
                quantity: 3,
                stockBefore: 8,
                stockAfter: 11,
                reason: "Ajuste",
                performedByUserId: "507f191e810c19729de860ff",
                createdAt: "2026-03-10T19:00:00.000Z",
              },
            },
            traceId: "trace-inv-stock-create",
          },
          { status: 201 },
        );
      }),
    );

    const result = await createInventoryStockMovement(TENANT_ID, {
      itemId: ITEM_ID,
      direction: "in",
      quantity: 3,
      reason: "Ajuste",
    });

    expect(body).toEqual({
      itemId: ITEM_ID,
      direction: "in",
      quantity: 3,
      reason: "Ajuste",
    });
    expect(result.data.movement.stockAfter).toBe(11);
  });

  it("lists low stock alerts", async () => {
    server.use(
      http.get("*/api/v1/modules/inventory/alerts/low-stock", ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                item: {
                  ...itemFixture,
                  isLowStock: true,
                  currentStock: 2,
                  minStock: 3,
                },
                deficit: 1,
              },
            ],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-inv-low-stock-list",
        });
      }),
    );

    const result = await listInventoryLowStockAlerts(TENANT_ID, {
      page: 1,
      limit: 20,
    });

    expect(result.data.items[0]?.deficit).toBe(1);
    expect(result.pagination.total).toBe(1);
  });

  it("lists expiring lot alerts", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/inventory/alerts/expiring-lots", ({ request }) => {
        capturedUrl = request.url;

        return HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                lot: lotFixture,
                daysToExpiry: 12,
              },
            ],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-inv-expiring-lots",
        });
      }),
    );

    const result = await listInventoryExpiringLotAlerts(TENANT_ID, {
      withinDays: 30,
      warehouseId: WAREHOUSE_ID,
    });
    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("withinDays")).toBe("30");
    expect(parsed.searchParams.get("warehouseId")).toBe(WAREHOUSE_ID);
    expect(result.data.items[0]?.daysToExpiry).toBe(12);
  });

  it("gets and updates inventory settings", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.get("*/api/v1/modules/inventory/settings", () =>
        HttpResponse.json({
          success: true,
          data: { settings: settingsFixture },
          traceId: "trace-inv-settings-get",
        }),
      ),
      http.put("*/api/v1/modules/inventory/settings", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          success: true,
          data: {
            settings: {
              ...settingsFixture,
              lotAllocationPolicy: "FEFO",
            },
          },
          traceId: "trace-inv-settings-update",
        });
      }),
    );

    const got = await getInventorySettings(TENANT_ID);
    const updated = await updateInventorySettings(TENANT_ID, { lotAllocationPolicy: "FEFO" });

    expect(got.data.settings.tenantId).toBe(TENANT_ID);
    expect(body).toEqual({ lotAllocationPolicy: "FEFO" });
    expect(updated.data.settings.lotAllocationPolicy).toBe("FEFO");
  });

  it("gets reconciliation report", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/inventory/reconciliation", ({ request }) => {
        capturedUrl = request.url;

        return HttpResponse.json({
          success: true,
          data: {
            report: reconciliationFixture,
          },
          traceId: "trace-inv-reconciliation",
        });
      }),
    );

    const result = await getInventoryReconciliation(TENANT_ID, { sinceDays: 7 });
    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("sinceDays")).toBe("7");
    expect(result.data.report.status).toBe("ok");
  });
});
