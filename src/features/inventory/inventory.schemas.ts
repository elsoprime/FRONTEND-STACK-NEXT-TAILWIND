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

export const inventoryCategoryDataSchema = z
  .object({
    category: inventoryCategorySchema,
  })
  .passthrough();

export type InventoryCategoryData = z.infer<typeof inventoryCategoryDataSchema>;

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

export const inventoryCategoryListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryCategoryListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryCategoryListEnvelope = z.infer<typeof inventoryCategoryListEnvelopeSchema>;

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

export type InventoryStockMovementListEnvelope = z.infer<typeof inventoryStockMovementListEnvelopeSchema>;

export const inventoryLowStockAlertListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: inventoryLowStockAlertListDataSchema,
  pagination: inventoryPaginationSchema,
  traceId: z.string(),
});

export type InventoryLowStockAlertListEnvelope = z.infer<typeof inventoryLowStockAlertListEnvelopeSchema>;

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

export type CreateInventoryStockMovementInput = z.infer<typeof createInventoryStockMovementInputSchema>;

export const inventoryIdInputSchema = z.string().trim().regex(objectIdRegex, "ID invalido");

export const listInventoryCategoriesInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
});

export type ListInventoryCategoriesInput = z.infer<typeof listInventoryCategoriesInputSchema>;

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

export type ListInventoryStockMovementsInput = z.infer<typeof listInventoryStockMovementsInputSchema>;

export const listInventoryLowStockAlertsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type ListInventoryLowStockAlertsInput = z.infer<typeof listInventoryLowStockAlertsInputSchema>;
