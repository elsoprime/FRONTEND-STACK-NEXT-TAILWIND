import { z } from "zod";

const objectIdRegex = /^[a-f0-9]{24}$/i;
const skuRegex = /^[a-zA-Z0-9._-]+$/;

export const inventoryPaginationSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .passthrough();

export type InventoryPagination = z.infer<typeof inventoryPaginationSchema>;

export const inventoryCategorySchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    isActive: z.boolean(),
  })
  .passthrough();

export type InventoryCategory = z.infer<typeof inventoryCategorySchema>;

export const inventoryWarehouseSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    isActive: z.boolean(),
  })
  .passthrough();

export type InventoryWarehouse = z.infer<typeof inventoryWarehouseSchema>;

export const inventoryLotSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    itemId: z.string(),
    warehouseId: z.string(),
    lotCode: z.string(),
    receivedAt: z.string(),
    expiresAt: z.string().nullable(),
    initialQuantity: z.number().int().min(0),
    currentQuantity: z.number().int().min(0),
    isActive: z.boolean(),
  })
  .passthrough();

export type InventoryLot = z.infer<typeof inventoryLotSchema>;

export const inventoryStocktakeLineSchema = z
  .object({
    itemId: z.string(),
    countedStock: z.number().int().min(0),
    lotId: z.string().nullable(),
  })
  .passthrough();

export type InventoryStocktakeLine = z.infer<typeof inventoryStocktakeLineSchema>;

export const inventoryStocktakeSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    warehouseId: z.string(),
    name: z.string(),
    status: z.enum(["draft", "in_progress", "review", "applied", "cancelled"]),
    lines: z.array(inventoryStocktakeLineSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export type InventoryStocktake = z.infer<typeof inventoryStocktakeSchema>;

export const inventoryItemSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    categoryId: z.string(),
    sku: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    currentStock: z.number().int().min(0),
    minStock: z.number().int().min(0),
    isLowStock: z.boolean(),
    isActive: z.boolean(),
  })
  .passthrough();

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const inventoryStockMovementSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    itemId: z.string(),
    direction: z.enum(["in", "out"]),
    quantity: z.number().int().min(1),
    stockBefore: z.number().int().min(0),
    stockAfter: z.number().int().min(0),
    reason: z.string(),
    performedByUserId: z.string().nullable(),
    createdAt: z.string(),
  })
  .passthrough();

export type InventoryStockMovement = z.infer<typeof inventoryStockMovementSchema>;

export const inventoryLowStockAlertSchema = z
  .object({
    item: inventoryItemSchema,
    deficit: z.number().int().min(0),
  })
  .passthrough();

export type InventoryLowStockAlert = z.infer<typeof inventoryLowStockAlertSchema>;

export const inventoryExpiringLotAlertSchema = z
  .object({
    lot: inventoryLotSchema,
    daysToExpiry: z.number().int(),
  })
  .passthrough();

export type InventoryExpiringLotAlert = z.infer<typeof inventoryExpiringLotAlertSchema>;

export const inventoryCapabilitiesSchema = z
  .object({
    warehouses: z.boolean(),
    lots: z.boolean(),
    stocktakes: z.boolean(),
  })
  .passthrough();

export type InventoryCapabilities = z.infer<typeof inventoryCapabilitiesSchema>;

export const inventorySettingsSchema = z
  .object({
    tenantId: z.string(),
    lotAllocationPolicy: z.enum(["FIFO", "FEFO"]),
    rolloutPhase: z.enum(["pilot", "cohort", "general"]),
    capabilities: inventoryCapabilitiesSchema,
  })
  .passthrough();

export type InventorySettings = z.infer<typeof inventorySettingsSchema>;

export const inventoryReconciliationSchema = z
  .object({
    tenantId: z.string(),
    comparedAt: z.string(),
    movementCount: z.number().int().min(0),
    movementIn: z.number().int().min(0),
    movementOut: z.number().int().min(0),
    balanceTotal: z.number().int(),
    itemStockTotal: z.number().int(),
    drift: z.number().int(),
    status: z.enum(["ok", "drift_detected"]),
  })
  .passthrough();

export type InventoryReconciliation = z.infer<typeof inventoryReconciliationSchema>;

export const inventoryCategoryDataSchema = z
  .object({
    category: inventoryCategorySchema,
  })
  .passthrough();

export type InventoryCategoryData = z.infer<typeof inventoryCategoryDataSchema>;

export const inventoryWarehouseDataSchema = z
  .object({
    warehouse: inventoryWarehouseSchema,
  })
  .passthrough();

export type InventoryWarehouseData = z.infer<typeof inventoryWarehouseDataSchema>;

export const inventoryLotDataSchema = z
  .object({
    lot: inventoryLotSchema,
  })
  .passthrough();

export type InventoryLotData = z.infer<typeof inventoryLotDataSchema>;

export const inventoryStocktakeDataSchema = z
  .object({
    stocktake: inventoryStocktakeSchema,
  })
  .passthrough();

export type InventoryStocktakeData = z.infer<typeof inventoryStocktakeDataSchema>;

export const inventorySettingsDataSchema = z
  .object({
    settings: inventorySettingsSchema,
  })
  .passthrough();

export type InventorySettingsData = z.infer<typeof inventorySettingsDataSchema>;

export const inventoryReconciliationDataSchema = z
  .object({
    report: inventoryReconciliationSchema,
  })
  .passthrough();

export type InventoryReconciliationData = z.infer<typeof inventoryReconciliationDataSchema>;

export const inventoryItemDataSchema = z
  .object({
    item: inventoryItemSchema,
  })
  .passthrough();

export type InventoryItemData = z.infer<typeof inventoryItemDataSchema>;

export const inventoryStockMovementDataSchema = z
  .object({
    movement: inventoryStockMovementSchema,
  })
  .passthrough();

export type InventoryStockMovementData = z.infer<typeof inventoryStockMovementDataSchema>;

export const inventoryCategoryListDataSchema = z
  .object({
    items: z.array(inventoryCategorySchema),
  })
  .passthrough();

export const inventoryWarehouseListDataSchema = z
  .object({
    items: z.array(inventoryWarehouseSchema),
  })
  .passthrough();

export const inventoryLotListDataSchema = z
  .object({
    items: z.array(inventoryLotSchema),
  })
  .passthrough();

export const inventoryStocktakeListDataSchema = z
  .object({
    items: z.array(inventoryStocktakeSchema),
  })
  .passthrough();

export const inventoryItemListDataSchema = z
  .object({
    items: z.array(inventoryItemSchema),
  })
  .passthrough();

export const inventoryStockMovementListDataSchema = z
  .object({
    items: z.array(inventoryStockMovementSchema),
  })
  .passthrough();

export const inventoryLowStockAlertListDataSchema = z
  .object({
    items: z.array(inventoryLowStockAlertSchema),
  })
  .passthrough();

export const inventoryExpiringLotAlertListDataSchema = z
  .object({
    items: z.array(inventoryExpiringLotAlertSchema),
  })
  .passthrough();

export const inventoryCategoryListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryCategoryListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryCategoryListEnvelope = z.infer<typeof inventoryCategoryListEnvelopeSchema>;

export const inventoryWarehouseListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryWarehouseListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryWarehouseListEnvelope = z.infer<typeof inventoryWarehouseListEnvelopeSchema>;

export const inventoryLotListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryLotListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryLotListEnvelope = z.infer<typeof inventoryLotListEnvelopeSchema>;

export const inventoryStocktakeListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryStocktakeListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryStocktakeListEnvelope = z.infer<typeof inventoryStocktakeListEnvelopeSchema>;

export const inventoryExpiringLotAlertListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryExpiringLotAlertListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryExpiringLotAlertListEnvelope = z.infer<
  typeof inventoryExpiringLotAlertListEnvelopeSchema
>;

export const inventoryItemListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryItemListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryItemListEnvelope = z.infer<typeof inventoryItemListEnvelopeSchema>;

export const inventoryStockMovementListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryStockMovementListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryStockMovementListEnvelope = z.infer<
  typeof inventoryStockMovementListEnvelopeSchema
>;

export const inventoryLowStockAlertListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryLowStockAlertListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryLowStockAlertListEnvelope = z.infer<
  typeof inventoryLowStockAlertListEnvelopeSchema
>;

export const createInventoryCategoryInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
});

export type CreateInventoryCategoryInput = z.infer<typeof createInventoryCategoryInputSchema>;

export const updateInventoryCategoryInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .refine((value) => value.name !== undefined || value.description !== undefined, {
    message: "Debes enviar al menos un campo para actualizar la categoria.",
  });

export type UpdateInventoryCategoryInput = z.infer<typeof updateInventoryCategoryInputSchema>;

export const createInventoryWarehouseInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
});

export type CreateInventoryWarehouseInput = z.infer<typeof createInventoryWarehouseInputSchema>;

export const updateInventoryWarehouseInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined || value.description !== undefined || value.isActive !== undefined,
    {
      message: "Debes enviar al menos un campo para actualizar la bodega.",
    },
  );

export type UpdateInventoryWarehouseInput = z.infer<typeof updateInventoryWarehouseInputSchema>;

export const createInventoryLotInputSchema = z.object({
  itemId: z.string().trim().regex(objectIdRegex, "Item invalido"),
  warehouseId: z.string().trim().regex(objectIdRegex, "Bodega invalida"),
  lotCode: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9._:-]+$/, "Codigo de lote invalido"),
  quantity: z.number().int().min(1),
  receivedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export type CreateInventoryLotInput = z.infer<typeof createInventoryLotInputSchema>;

export const updateInventoryLotInputSchema = z
  .object({
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.expiresAt !== undefined || value.isActive !== undefined, {
    message: "Debes enviar al menos un campo para actualizar el lote.",
  });

export type UpdateInventoryLotInput = z.infer<typeof updateInventoryLotInputSchema>;

export const createInventoryStocktakeInputSchema = z.object({
  warehouseId: z.string().trim().regex(objectIdRegex, "Bodega invalida"),
  name: z.string().trim().min(1).max(140),
  lines: z.array(inventoryStocktakeLineSchema).optional(),
});

export type CreateInventoryStocktakeInput = z.infer<typeof createInventoryStocktakeInputSchema>;

export const upsertInventoryStocktakeCountsInputSchema = z.object({
  lines: z.array(inventoryStocktakeLineSchema),
});

export type UpsertInventoryStocktakeCountsInput = z.infer<
  typeof upsertInventoryStocktakeCountsInputSchema
>;

export const updateInventorySettingsInputSchema = z
  .object({
    lotAllocationPolicy: z.enum(["FIFO", "FEFO"]).optional(),
    rolloutPhase: z.enum(["pilot", "cohort", "general"]).optional(),
    capabilities: inventoryCapabilitiesSchema.partial().optional(),
  })
  .refine(
    (value) =>
      value.lotAllocationPolicy !== undefined ||
      value.rolloutPhase !== undefined ||
      value.capabilities !== undefined,
    {
      message: "Debes enviar al menos un campo para actualizar settings.",
    },
  );

export type UpdateInventorySettingsInput = z.infer<typeof updateInventorySettingsInputSchema>;

export const createInventoryItemInputSchema = z.object({
  categoryId: z.string().trim().regex(objectIdRegex, "Categoria invalida"),
  sku: z.string().trim().min(1).max(64).regex(skuRegex, "SKU invalido"),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(500).nullable().optional(),
  initialStock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemInputSchema>;

export const updateInventoryItemInputSchema = z
  .object({
    categoryId: z.string().trim().regex(objectIdRegex, "Categoria invalida").optional(),
    sku: z.string().trim().min(1).max(64).regex(skuRegex, "SKU invalido").optional(),
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().max(500).nullable().optional(),
    minStock: z.number().int().min(0).optional(),
  })
  .refine(
    (value) =>
      value.categoryId !== undefined ||
      value.sku !== undefined ||
      value.name !== undefined ||
      value.description !== undefined ||
      value.minStock !== undefined,
    {
      message: "Debes enviar al menos un campo para actualizar el item.",
    },
  );

export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemInputSchema>;

export const createInventoryStockMovementInputSchema = z.object({
  itemId: z.string().trim().regex(objectIdRegex, "Item invalido"),
  direction: z.enum(["in", "out"]),
  quantity: z.number().int().min(1),
  reason: z.string().trim().min(1).max(240),
});

export type CreateInventoryStockMovementInput = z.infer<
  typeof createInventoryStockMovementInputSchema
>;

export const inventoryIdInputSchema = z.string().trim().regex(objectIdRegex, "ID invalido");

export const listInventoryCategoriesInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
});

export type ListInventoryCategoriesInput = z.infer<typeof listInventoryCategoriesInputSchema>;

export const listInventoryWarehousesInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
});

export type ListInventoryWarehousesInput = z.infer<typeof listInventoryWarehousesInputSchema>;

export const listInventoryLotsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  itemId: z.string().trim().regex(objectIdRegex, "Item invalido").optional(),
  warehouseId: z.string().trim().regex(objectIdRegex, "Bodega invalida").optional(),
  expiringBefore: z.string().datetime().optional(),
});

export type ListInventoryLotsInput = z.infer<typeof listInventoryLotsInputSchema>;

export const listInventoryStocktakesInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  warehouseId: z.string().trim().regex(objectIdRegex, "Bodega invalida").optional(),
  status: z.enum(["draft", "in_progress", "review", "applied", "cancelled"]).optional(),
});

export type ListInventoryStocktakesInput = z.infer<typeof listInventoryStocktakesInputSchema>;

export const listInventoryItemsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  categoryId: z.string().trim().regex(objectIdRegex, "Categoria invalida").optional(),
  search: z.string().trim().min(1).optional(),
  lowStockOnly: z.boolean().optional(),
});

export type ListInventoryItemsInput = z.infer<typeof listInventoryItemsInputSchema>;

export const listInventoryStockMovementsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  itemId: z.string().trim().regex(objectIdRegex, "Item invalido").optional(),
});

export type ListInventoryStockMovementsInput = z.infer<
  typeof listInventoryStockMovementsInputSchema
>;

export const listInventoryLowStockAlertsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type ListInventoryLowStockAlertsInput = z.infer<
  typeof listInventoryLowStockAlertsInputSchema
>;

export const listInventoryExpiringLotAlertsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  withinDays: z.number().int().min(1).max(365).optional(),
  warehouseId: z.string().trim().regex(objectIdRegex, "Bodega invalida").optional(),
  itemId: z.string().trim().regex(objectIdRegex, "Item invalido").optional(),
});

export type ListInventoryExpiringLotAlertsInput = z.infer<
  typeof listInventoryExpiringLotAlertsInputSchema
>;

export const getInventoryReconciliationInputSchema = z.object({
  sinceDays: z.number().int().min(1).max(30).optional(),
});

export type GetInventoryReconciliationInput = z.infer<typeof getInventoryReconciliationInputSchema>;
