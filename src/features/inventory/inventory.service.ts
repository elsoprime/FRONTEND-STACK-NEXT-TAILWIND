import { tenantApiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  createInventoryCategoryInputSchema,
  createInventoryItemInputSchema,
  createInventoryLotInputSchema,
  createInventoryStockMovementInputSchema,
  createInventoryStocktakeInputSchema,
  createInventoryWarehouseInputSchema,
  inventoryCategoryDataSchema,
  inventoryCategoryListDataSchema,
  inventoryCategoryListEnvelopeSchema,
  inventoryIdInputSchema,
  inventoryItemDataSchema,
  inventoryItemListDataSchema,
  inventoryItemListEnvelopeSchema,
  inventoryLotDataSchema,
  inventoryLotListDataSchema,
  inventoryLotListEnvelopeSchema,
  inventoryLowStockAlertListDataSchema,
  inventoryLowStockAlertListEnvelopeSchema,
  inventoryExpiringLotAlertListDataSchema,
  inventoryExpiringLotAlertListEnvelopeSchema,
  inventoryReconciliationDataSchema,
  inventorySettingsDataSchema,
  inventoryStockMovementDataSchema,
  inventoryStockMovementListDataSchema,
  inventoryStockMovementListEnvelopeSchema,
  inventoryStocktakeDataSchema,
  inventoryStocktakeListDataSchema,
  inventoryStocktakeListEnvelopeSchema,
  inventoryWarehouseDataSchema,
  inventoryWarehouseListDataSchema,
  inventoryWarehouseListEnvelopeSchema,
  listInventoryCategoriesInputSchema,
  listInventoryItemsInputSchema,
  listInventoryLotsInputSchema,
  listInventoryLowStockAlertsInputSchema,
  listInventoryExpiringLotAlertsInputSchema,
  getInventoryReconciliationInputSchema,
  listInventoryStockMovementsInputSchema,
  listInventoryStocktakesInputSchema,
  listInventoryWarehousesInputSchema,
  updateInventoryCategoryInputSchema,
  updateInventoryItemInputSchema,
  updateInventoryLotInputSchema,
  updateInventoryWarehouseInputSchema,
  updateInventorySettingsInputSchema,
  upsertInventoryStocktakeCountsInputSchema,
  type CreateInventoryCategoryInput,
  type CreateInventoryItemInput,
  type CreateInventoryLotInput,
  type CreateInventoryStockMovementInput,
  type CreateInventoryStocktakeInput,
  type CreateInventoryWarehouseInput,
  type InventoryCategoryData,
  type InventoryCategoryListEnvelope,
  type InventoryItemData,
  type InventoryItemListEnvelope,
  type InventoryLotData,
  type InventoryLotListEnvelope,
  type InventoryLowStockAlertListEnvelope,
  type InventoryExpiringLotAlertListEnvelope,
  type InventoryReconciliationData,
  type InventorySettingsData,
  type InventoryStockMovementData,
  type InventoryStockMovementListEnvelope,
  type InventoryStocktakeData,
  type InventoryStocktakeListEnvelope,
  type InventoryWarehouseData,
  type InventoryWarehouseListEnvelope,
  type ListInventoryCategoriesInput,
  type ListInventoryItemsInput,
  type ListInventoryLotsInput,
  type ListInventoryLowStockAlertsInput,
  type ListInventoryExpiringLotAlertsInput,
  type GetInventoryReconciliationInput,
  type ListInventoryStockMovementsInput,
  type ListInventoryStocktakesInput,
  type ListInventoryWarehousesInput,
  type UpdateInventoryCategoryInput,
  type UpdateInventoryItemInput,
  type UpdateInventoryLotInput,
  type UpdateInventoryWarehouseInput,
  type UpdateInventorySettingsInput,
  type UpsertInventoryStocktakeCountsInput,
} from "@/features/inventory/inventory.schemas";

const INVENTORY_ENDPOINTS = {
  categories: "/api/v1/modules/inventory/categories",
  warehouses: "/api/v1/modules/inventory/warehouses",
  lots: "/api/v1/modules/inventory/lots",
  stocktakes: "/api/v1/modules/inventory/stocktakes",
  items: "/api/v1/modules/inventory/items",
  stockMovements: "/api/v1/modules/inventory/stock-movements",
  lowStockAlerts: "/api/v1/modules/inventory/alerts/low-stock",
  expiringLotAlerts: "/api/v1/modules/inventory/alerts/expiring-lots",
  settings: "/api/v1/modules/inventory/settings",
  reconciliation: "/api/v1/modules/inventory/reconciliation",
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

function warehouseByIdPath(warehouseId: string): string {
  return `${INVENTORY_ENDPOINTS.warehouses}/${inventoryIdInputSchema.parse(warehouseId)}`;
}

function lotByIdPath(lotId: string): string {
  return `${INVENTORY_ENDPOINTS.lots}/${inventoryIdInputSchema.parse(lotId)}`;
}

function stocktakeByIdPath(stocktakeId: string): string {
  return `${INVENTORY_ENDPOINTS.stocktakes}/${inventoryIdInputSchema.parse(stocktakeId)}`;
}

function itemByIdPath(itemId: string): string {
  return `${INVENTORY_ENDPOINTS.items}/${inventoryIdInputSchema.parse(itemId)}`;
}

export async function listInventoryCategories(
  tenantId: string,
  filters: ListInventoryCategoriesInput = {},
): Promise<InventoryCategoryListEnvelope> {
  const parsedFilters = listInventoryCategoriesInputSchema.parse(filters);

  const response = await tenantApiRequest(
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
  return tenantApiRequest(INVENTORY_ENDPOINTS.categories, {
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
  return tenantApiRequest(categoryByIdPath(categoryId), {
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
  return tenantApiRequest(categoryByIdPath(categoryId), {
    method: "DELETE",
    tenantId,
    dataSchema: inventoryCategoryDataSchema,
  });
}

export async function listInventoryWarehouses(
  tenantId: string,
  filters: ListInventoryWarehousesInput = {},
): Promise<InventoryWarehouseListEnvelope> {
  const parsedFilters = listInventoryWarehousesInputSchema.parse(filters);

  const response = await tenantApiRequest(
    `${INVENTORY_ENDPOINTS.warehouses}${buildQueryString({
      page: parsedFilters.page,
      limit: parsedFilters.limit,
      search: parsedFilters.search,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryWarehouseListDataSchema,
    },
  );

  return inventoryWarehouseListEnvelopeSchema.parse(response);
}

export async function createInventoryWarehouse(
  tenantId: string,
  payload: CreateInventoryWarehouseInput,
): Promise<ApiSuccessEnvelope<InventoryWarehouseData>> {
  return tenantApiRequest(INVENTORY_ENDPOINTS.warehouses, {
    method: "POST",
    tenantId,
    body: createInventoryWarehouseInputSchema.parse(payload),
    dataSchema: inventoryWarehouseDataSchema,
  });
}

export async function updateInventoryWarehouse(
  tenantId: string,
  warehouseId: string,
  payload: UpdateInventoryWarehouseInput,
): Promise<ApiSuccessEnvelope<InventoryWarehouseData>> {
  return tenantApiRequest(warehouseByIdPath(warehouseId), {
    method: "PATCH",
    tenantId,
    body: updateInventoryWarehouseInputSchema.parse(payload),
    dataSchema: inventoryWarehouseDataSchema,
  });
}

export async function listInventoryLots(
  tenantId: string,
  filters: ListInventoryLotsInput = {},
): Promise<InventoryLotListEnvelope> {
  const parsedFilters = listInventoryLotsInputSchema.parse(filters);

  const response = await tenantApiRequest(
    `${INVENTORY_ENDPOINTS.lots}${buildQueryString({
      page: parsedFilters.page,
      limit: parsedFilters.limit,
      itemId: parsedFilters.itemId,
      warehouseId: parsedFilters.warehouseId,
      expiringBefore: parsedFilters.expiringBefore,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryLotListDataSchema,
    },
  );

  return inventoryLotListEnvelopeSchema.parse(response);
}

export async function createInventoryLot(
  tenantId: string,
  payload: CreateInventoryLotInput,
): Promise<ApiSuccessEnvelope<InventoryLotData>> {
  return tenantApiRequest(INVENTORY_ENDPOINTS.lots, {
    method: "POST",
    tenantId,
    body: createInventoryLotInputSchema.parse(payload),
    dataSchema: inventoryLotDataSchema,
  });
}

export async function updateInventoryLot(
  tenantId: string,
  lotId: string,
  payload: UpdateInventoryLotInput,
): Promise<ApiSuccessEnvelope<InventoryLotData>> {
  return tenantApiRequest(lotByIdPath(lotId), {
    method: "PATCH",
    tenantId,
    body: updateInventoryLotInputSchema.parse(payload),
    dataSchema: inventoryLotDataSchema,
  });
}

export async function listInventoryStocktakes(
  tenantId: string,
  filters: ListInventoryStocktakesInput = {},
): Promise<InventoryStocktakeListEnvelope> {
  const parsedFilters = listInventoryStocktakesInputSchema.parse(filters);

  const response = await tenantApiRequest(
    `${INVENTORY_ENDPOINTS.stocktakes}${buildQueryString({
      page: parsedFilters.page,
      limit: parsedFilters.limit,
      warehouseId: parsedFilters.warehouseId,
      status: parsedFilters.status,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryStocktakeListDataSchema,
    },
  );

  return inventoryStocktakeListEnvelopeSchema.parse(response);
}

export async function createInventoryStocktake(
  tenantId: string,
  payload: CreateInventoryStocktakeInput,
): Promise<ApiSuccessEnvelope<InventoryStocktakeData>> {
  return tenantApiRequest(INVENTORY_ENDPOINTS.stocktakes, {
    method: "POST",
    tenantId,
    body: createInventoryStocktakeInputSchema.parse(payload),
    dataSchema: inventoryStocktakeDataSchema,
  });
}

export async function getInventoryStocktake(
  tenantId: string,
  stocktakeId: string,
): Promise<ApiSuccessEnvelope<InventoryStocktakeData>> {
  return tenantApiRequest(stocktakeByIdPath(stocktakeId), {
    method: "GET",
    tenantId,
    dataSchema: inventoryStocktakeDataSchema,
  });
}

export async function upsertInventoryStocktakeCounts(
  tenantId: string,
  stocktakeId: string,
  payload: UpsertInventoryStocktakeCountsInput,
): Promise<ApiSuccessEnvelope<InventoryStocktakeData>> {
  return tenantApiRequest(`${stocktakeByIdPath(stocktakeId)}/counts`, {
    method: "PUT",
    tenantId,
    body: upsertInventoryStocktakeCountsInputSchema.parse(payload),
    dataSchema: inventoryStocktakeDataSchema,
  });
}

export async function applyInventoryStocktake(
  tenantId: string,
  stocktakeId: string,
): Promise<ApiSuccessEnvelope<InventoryStocktakeData>> {
  return tenantApiRequest(`${stocktakeByIdPath(stocktakeId)}/apply`, {
    method: "POST",
    tenantId,
    dataSchema: inventoryStocktakeDataSchema,
  });
}

export async function cancelInventoryStocktake(
  tenantId: string,
  stocktakeId: string,
): Promise<ApiSuccessEnvelope<InventoryStocktakeData>> {
  return tenantApiRequest(`${stocktakeByIdPath(stocktakeId)}/cancel`, {
    method: "POST",
    tenantId,
    dataSchema: inventoryStocktakeDataSchema,
  });
}
export async function listInventoryItems(
  tenantId: string,
  filters: ListInventoryItemsInput = {},
): Promise<InventoryItemListEnvelope> {
  const parsedFilters = listInventoryItemsInputSchema.parse(filters);

  const response = await tenantApiRequest(
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
  return tenantApiRequest(INVENTORY_ENDPOINTS.items, {
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
  return tenantApiRequest(itemByIdPath(itemId), {
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
  return tenantApiRequest(itemByIdPath(itemId), {
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
  return tenantApiRequest(itemByIdPath(itemId), {
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

  const response = await tenantApiRequest(
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
  return tenantApiRequest(INVENTORY_ENDPOINTS.stockMovements, {
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

  const response = await tenantApiRequest(
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

export async function listInventoryExpiringLotAlerts(
  tenantId: string,
  filters: ListInventoryExpiringLotAlertsInput = {},
): Promise<InventoryExpiringLotAlertListEnvelope> {
  const parsedFilters = listInventoryExpiringLotAlertsInputSchema.parse(filters);

  const response = await tenantApiRequest(
    `${INVENTORY_ENDPOINTS.expiringLotAlerts}${buildQueryString({
      page: parsedFilters.page,
      limit: parsedFilters.limit,
      withinDays: parsedFilters.withinDays,
      warehouseId: parsedFilters.warehouseId,
      itemId: parsedFilters.itemId,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryExpiringLotAlertListDataSchema,
    },
  );

  return inventoryExpiringLotAlertListEnvelopeSchema.parse(response);
}

export async function getInventorySettings(
  tenantId: string,
): Promise<ApiSuccessEnvelope<InventorySettingsData>> {
  return tenantApiRequest(INVENTORY_ENDPOINTS.settings, {
    method: "GET",
    tenantId,
    dataSchema: inventorySettingsDataSchema,
  });
}

export async function updateInventorySettings(
  tenantId: string,
  payload: UpdateInventorySettingsInput,
): Promise<ApiSuccessEnvelope<InventorySettingsData>> {
  return tenantApiRequest(INVENTORY_ENDPOINTS.settings, {
    method: "PUT",
    tenantId,
    body: updateInventorySettingsInputSchema.parse(payload),
    dataSchema: inventorySettingsDataSchema,
  });
}

export async function getInventoryReconciliation(
  tenantId: string,
  filters: GetInventoryReconciliationInput = {},
): Promise<ApiSuccessEnvelope<InventoryReconciliationData>> {
  const parsedFilters = getInventoryReconciliationInputSchema.parse(filters);

  return tenantApiRequest(
    `${INVENTORY_ENDPOINTS.reconciliation}${buildQueryString({
      sinceDays: parsedFilters.sinceDays,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: inventoryReconciliationDataSchema,
    },
  );
}
