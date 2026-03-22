import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";

describe("InventoryPaginationControls", () => {
  it("does not render when there is one page and no page size selector", () => {
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

  it("renders legend and numeric page buttons", () => {
    const onPageChange = vi.fn();

    render(
      <InventoryPaginationControls
        page={3}
        totalPages={8}
        total={160}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("Paginacion de registros")).toBeInTheDocument();
    expect(screen.getByText("Pagina 3 de 8 · Total de registros: 160")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("renders and handles page size selector when provided", () => {
    const onLimitChange = vi.fn();

    render(
      <InventoryPaginationControls
        page={1}
        totalPages={1}
        total={12}
        limit={20}
        onPageChange={() => {}}
        onLimitChange={onLimitChange}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Filas por pagina" }), {
      target: { value: "50" },
    });

    expect(screen.getByText("Pagina 1 de 1 · Total de registros: 12 · 20 por pagina")).toBeInTheDocument();
    expect(onLimitChange).toHaveBeenCalledWith(50);
  });
});
