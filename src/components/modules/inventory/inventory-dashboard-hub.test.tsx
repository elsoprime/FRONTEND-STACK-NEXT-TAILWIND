import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryDashboardHub } from "@/components/modules/inventory/inventory-dashboard-hub";
import {
  listInventoryExpiringLotAlerts,
  listInventoryItems,
  listInventoryLots,
  listInventoryLowStockAlerts,
  listInventoryStocktakes,
  listInventoryWarehouses,
} from "@/features/inventory/inventory.service";

vi.mock("@/features/inventory/inventory.service", () => ({
  listInventoryWarehouses: vi.fn(),
  listInventoryLots: vi.fn(),
  listInventoryStocktakes: vi.fn(),
  listInventoryItems: vi.fn(),
  listInventoryLowStockAlerts: vi.fn(),
  listInventoryExpiringLotAlerts: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <InventoryDashboardHub tenantId="tenant-1" />
    </QueryClientProvider>,
  );
}

describe("InventoryDashboardHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(listInventoryWarehouses).mockResolvedValue({
      success: true,
      traceId: "trace-1",
      data: {
        items: [
          { id: "w1", tenantId: "tenant-1", name: "Central", description: null, isActive: true },
          { id: "w2", tenantId: "tenant-1", name: "Secundaria", description: null, isActive: false },
        ],
      },
      pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });

    vi.mocked(listInventoryLots).mockResolvedValue({
      success: true,
      traceId: "trace-2",
      data: { items: [] },
      pagination: { page: 1, limit: 100, total: 8, totalPages: 1 },
    });

    vi.mocked(listInventoryStocktakes).mockResolvedValue({
      success: true,
      traceId: "trace-3",
      data: { items: [] },
      pagination: { page: 1, limit: 100, total: 5, totalPages: 1 },
    });

    vi.mocked(listInventoryItems).mockResolvedValue({
      success: true,
      traceId: "trace-4",
      data: { items: [] },
      pagination: { page: 1, limit: 100, total: 14, totalPages: 1 },
    });

    vi.mocked(listInventoryLowStockAlerts).mockResolvedValue({
      success: true,
      traceId: "trace-5",
      data: { items: [] },
      pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
    });

    vi.mocked(listInventoryExpiringLotAlerts).mockResolvedValue({
      success: true,
      traceId: "trace-6",
      data: { items: [] },
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  });

  it("renders dashboard metrics and quick access cards", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Bodegas activas")).toBeInTheDocument();
    expect(screen.getByText("Stock consolidado")).toBeInTheDocument();
    expect(screen.getByText("Alertas activas")).toBeInTheDocument();
    expect(screen.getByText("2.840")).toBeInTheDocument();
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Submodulos operativos")).toBeInTheDocument();

    expect(screen.getAllByText("Items").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Categorias").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bodegas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Lotes").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Conteo").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Stock").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /abrir/i })).toHaveLength(6);
    expect(screen.getByRole("link", { name: /ir a auditoria/i })).toHaveAttribute(
      "href",
      "/app/audit",
    );
  });
});
