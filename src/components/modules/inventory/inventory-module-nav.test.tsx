import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";

let pathnameMock = "/app/inventory";

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock,
}));

describe("InventoryModuleNav", () => {
  beforeEach(() => {
    pathnameMock = "/app/inventory";
  });

  it("highlights the active direct route", () => {
    pathnameMock = "/app/inventory/settings";

    render(<InventoryModuleNav />);

    expect(screen.getByRole("link", { name: /configuracion/i })).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: /panel principal/i })).not.toHaveClass(
      "text-primary",
    );
    expect(screen.getByRole("link", { name: /alertas/i })).not.toHaveClass("text-primary");
  });

  it("keeps parent section active for nested routes", () => {
    pathnameMock = "/app/inventory/reconciliation/history";

    render(<InventoryModuleNav />);

    expect(screen.getByRole("link", { name: /reconciliacion/i })).toHaveClass(
      "text-primary",
    );
  });
});
