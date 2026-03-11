import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  createInventoryCategory,
  createInventoryItem,
  createInventoryStockMovement,
  deleteInventoryCategory,
  deleteInventoryItem,
  getInventoryItem,
  listInventoryCategories,
  listInventoryItems,
  listInventoryLowStockAlerts,
  listInventoryStockMovements,
  updateInventoryCategory,
  updateInventoryItem,
} from "@/features/inventory/inventory.service";
import { server } from "@/mocks/server";

const TENANT_ID = "507f191e810c19729de860ea";
const CATEGORY_ID = "507f191e810c19729de860eb";
const ITEM_ID = "507f191e810c19729de860ec";

const categoryFixture = {
  id: CATEGORY_ID,
  tenantId: TENANT_ID,
  name: "Hardware",
  description: "Hardware base",
  isActive: true,
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
});
