import { apiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  createInventoryCategoryInputSchema,
  createInventoryItemInputSchema,
  createInventoryStockMovementInputSchema,
  inventoryCategoryDataSchema,
  inventoryCategoryListDataSchema,
  inventoryCategoryListEnvelopeSchema,
  inventoryIdInputSchema,
  inventoryItemDataSchema,
  inventoryItemListDataSchema,
  inventoryItemListEnvelopeSchema,
  inventoryLowStockAlertListDataSchema,
  inventoryLowStockAlertListEnvelopeSchema,
  inventoryStockMovementDataSchema,
  inventoryStockMovementListDataSchema,
  inventoryStockMovementListEnvelopeSchema,
  listInventoryCategoriesInputSchema,
  listInventoryItemsInputSchema,
  listInventoryLowStockAlertsInputSchema,
  listInventoryStockMovementsInputSchema,
  updateInventoryCategoryInputSchema,
  updateInventoryItemInputSchema,
  type CreateInventoryCategoryInput,
  type CreateInventoryItemInput,
  type CreateInventoryStockMovementInput,
  type InventoryCategoryData,
  type InventoryCategoryListEnvelope,
  type InventoryItemData,
  type InventoryItemListEnvelope,
  type InventoryLowStockAlertListEnvelope,
  type InventoryStockMovementData,
  type InventoryStockMovementListEnvelope,
  type ListInventoryCategoriesInput,
  type ListInventoryItemsInput,
  type ListInventoryLowStockAlertsInput,
  type ListInventoryStockMovementsInput,
  type UpdateInventoryCategoryInput,
  type UpdateInventoryItemInput,
} from "@/features/inventory/inventory.schemas";

const INVENTORY_ENDPOINTS = {
  categories: "/api/v1/modules/inventory/categories",
  items: "/api/v1/modules/inventory/items",
  stockMovements: "/api/v1/modules/inventory/stock-movements",
  lowStockAlerts: "/api/v1/modules/inventory/alerts/low-stock",
} as const;

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}

function categoryByIdPath(categoryId: string): string {
  return `${INVENTORY_ENDPOINTS.categories}/${inventoryIdInputSchema.parse(categoryId)}`;
}

function itemByIdPath(itemId: string): string {
  return `${INVENTORY_ENDPOINTS.items}/${inventoryIdInputSchema.parse(itemId)}`;
}

export async function listInventoryCategories(
  tenantId: string,
  filters: ListInventoryCategoriesInput = {},
): Promise<InventoryCategoryListEnvelope> {
  const parsedFilters = listInventoryCategoriesInputSchema.parse(filters);

  const response = await apiRequest(
    `${INVENTORY_ENDPOINTS.categories}${buildQueryString({
      page: parsedFilters.page,
      limit: parsedFilters.limit,
      search: parsedFilters.search,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryCategoryListDataSchema,
    },
  );

  return inventoryCategoryListEnvelopeSchema.parse(response);
}

export async function createInventoryCategory(
  tenantId: string,
  payload: CreateInventoryCategoryInput,
): Promise<ApiSuccessEnvelope<InventoryCategoryData>> {
  return apiRequest(INVENTORY_ENDPOINTS.categories, {
    method: "POST",
    tenantId,
    body: createInventoryCategoryInputSchema.parse(payload),
    dataSchema: inventoryCategoryDataSchema,
  });
}

export async function updateInventoryCategory(
  tenantId: string,
  categoryId: string,
  payload: UpdateInventoryCategoryInput,
): Promise<ApiSuccessEnvelope<InventoryCategoryData>> {
  return apiRequest(categoryByIdPath(categoryId), {
    method: "PATCH",
    tenantId,
    body: updateInventoryCategoryInputSchema.parse(payload),
    dataSchema: inventoryCategoryDataSchema,
  });
}

export async function deleteInventoryCategory(
  tenantId: string,
  categoryId: string,
): Promise<ApiSuccessEnvelope<InventoryCategoryData>> {
  return apiRequest(categoryByIdPath(categoryId), {
    method: "DELETE",
    tenantId,
    dataSchema: inventoryCategoryDataSchema,
  });
}

export async function listInventoryItems(
  tenantId: string,
  filters: ListInventoryItemsInput = {},
): Promise<InventoryItemListEnvelope> {
  const parsedFilters = listInventoryItemsInputSchema.parse(filters);

  const response = await apiRequest(
    `${INVENTORY_ENDPOINTS.items}${buildQueryString({
      page: parsedFilters.page,
      limit: parsedFilters.limit,
      categoryId: parsedFilters.categoryId,
      search: parsedFilters.search,
      lowStockOnly: parsedFilters.lowStockOnly,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryItemListDataSchema,
    },
  );

  return inventoryItemListEnvelopeSchema.parse(response);
}

export async function createInventoryItem(
  tenantId: string,
  payload: CreateInventoryItemInput,
): Promise<ApiSuccessEnvelope<InventoryItemData>> {
  return apiRequest(INVENTORY_ENDPOINTS.items, {
    method: "POST",
    tenantId,
    body: createInventoryItemInputSchema.parse(payload),
    dataSchema: inventoryItemDataSchema,
  });
}

export async function getInventoryItem(
  tenantId: string,
  itemId: string,
): Promise<ApiSuccessEnvelope<InventoryItemData>> {
  return apiRequest(itemByIdPath(itemId), {
    method: "GET",
    tenantId,
    dataSchema: inventoryItemDataSchema,
  });
}

export async function updateInventoryItem(
  tenantId: string,
  itemId: string,
  payload: UpdateInventoryItemInput,
): Promise<ApiSuccessEnvelope<InventoryItemData>> {
  return apiRequest(itemByIdPath(itemId), {
    method: "PATCH",
    tenantId,
    body: updateInventoryItemInputSchema.parse(payload),
    dataSchema: inventoryItemDataSchema,
  });
}

export async function deleteInventoryItem(
  tenantId: string,
  itemId: string,
): Promise<ApiSuccessEnvelope<InventoryItemData>> {
  return apiRequest(itemByIdPath(itemId), {
    method: "DELETE",
    tenantId,
    dataSchema: inventoryItemDataSchema,
  });
}

export async function listInventoryStockMovements(
  tenantId: string,
  filters: ListInventoryStockMovementsInput = {},
): Promise<InventoryStockMovementListEnvelope> {
  const parsedFilters = listInventoryStockMovementsInputSchema.parse(filters);

  const response = await apiRequest(
    `${INVENTORY_ENDPOINTS.stockMovements}${buildQueryString({
      page: parsedFilters.page,
      limit: parsedFilters.limit,
      itemId: parsedFilters.itemId,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryStockMovementListDataSchema,
    },
  );

  return inventoryStockMovementListEnvelopeSchema.parse(response);
}

export async function createInventoryStockMovement(
  tenantId: string,
  payload: CreateInventoryStockMovementInput,
): Promise<ApiSuccessEnvelope<InventoryStockMovementData>> {
  return apiRequest(INVENTORY_ENDPOINTS.stockMovements, {
    method: "POST",
    tenantId,
    body: createInventoryStockMovementInputSchema.parse(payload),
    dataSchema: inventoryStockMovementDataSchema,
  });
}

export async function listInventoryLowStockAlerts(
  tenantId: string,
  filters: ListInventoryLowStockAlertsInput = {},
): Promise<InventoryLowStockAlertListEnvelope> {
  const parsedFilters = listInventoryLowStockAlertsInputSchema.parse(filters);

  const response = await apiRequest(
    `${INVENTORY_ENDPOINTS.lowStockAlerts}${buildQueryString({
      page: parsedFilters.page,
      limit: parsedFilters.limit,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryLowStockAlertListDataSchema,
    },
  );

  return inventoryLowStockAlertListEnvelopeSchema.parse(response);
}
