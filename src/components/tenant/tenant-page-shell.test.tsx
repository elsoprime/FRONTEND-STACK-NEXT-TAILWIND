import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";

describe("TenantPageShell", () => {
  it("renders inventory breadcrumb and back action inside the surface card context header", () => {
    render(
      <TenantPageShell
        eyebrow="Inventory"
        title="Items"
        description="Gestiona items del tenant activo."
        breadcrumbItems={[
          { label: "Dashboard", href: "/app" },
          { label: "Inventario", href: "/app/inventory" },
          { label: "Items" },
        ]}
        backHref="/app/inventory"
        backLabel="Volver a Panel principal"
      >
        <div>Contenido</div>
      </TenantPageShell>,
    );

    expect(screen.getByLabelText(/ruta activa/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/app");
    expect(screen.getByRole("link", { name: /inventario/i })).toHaveAttribute(
      "href",
      "/app/inventory",
    );
    expect(screen.getAllByText("Items")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /volver a panel principal/i })).toHaveAttribute(
      "href",
      "/app/inventory",
    );
  });
});
