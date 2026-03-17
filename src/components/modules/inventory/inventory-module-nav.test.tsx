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
    pathnameMock = "/app/inventory/stock";

    render(<InventoryModuleNav />);

    expect(screen.getByRole("link", { name: /stock/i })).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: /panel principal/i })).not.toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: /items/i })).not.toHaveClass("text-primary");
  });

  it("keeps parent section active for detail routes", () => {
    pathnameMock = "/app/inventory/categories/507f191e810c19729de860eb";

    render(<InventoryModuleNav />);

    expect(screen.getByRole("link", { name: /categorias/i })).toHaveClass("text-primary");
  });
});
