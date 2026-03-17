import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";

describe("InventoryPaginationControls", () => {
  it("does not render when there is one page", () => {
    const { container } = render(
      <InventoryPaginationControls page={1} totalPages={1} total={3} onPageChange={() => {}} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("handles previous and next page interactions", () => {
    const onPageChange = vi.fn();

    render(
      <InventoryPaginationControls
        page={2}
        totalPages={4}
        total={80}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it("disables edge navigation buttons on limits", () => {
    const onPageChange = vi.fn();

    const { rerender } = render(
      <InventoryPaginationControls
        page={1}
        totalPages={3}
        total={60}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).not.toBeDisabled();

    rerender(
      <InventoryPaginationControls
        page={3}
        totalPages={3}
        total={60}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Anterior" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
