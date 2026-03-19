import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";

let pathnameMock = "/app/inventory";
let searchParamsMock = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock,
  useSearchParams: () => searchParamsMock,
}));

describe("InventoryModuleNav", () => {
  beforeEach(() => {
    pathnameMock = "/app/inventory";
    searchParamsMock = new URLSearchParams();
  });

  it("highlights the active tab route", () => {
    searchParamsMock = new URLSearchParams("tab=settings");

    render(<InventoryModuleNav />);

    expect(screen.getByRole("link", { name: /configuracion/i })).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: /alertas/i })).not.toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: /reconciliacion/i })).not.toHaveClass("text-primary");
  });

  it("renders links with inventory tab query params", () => {
    render(<InventoryModuleNav />);

    expect(screen.getByRole("link", { name: /alertas/i })).toHaveAttribute(
      "href",
      "/app/inventory?tab=alerts",
    );
    expect(screen.getByRole("link", { name: /reconciliacion/i })).toHaveAttribute(
      "href",
      "/app/inventory?tab=reconciliation",
    );
    expect(screen.getByRole("link", { name: /configuracion/i })).toHaveAttribute(
      "href",
      "/app/inventory?tab=settings",
    );
  });
});
