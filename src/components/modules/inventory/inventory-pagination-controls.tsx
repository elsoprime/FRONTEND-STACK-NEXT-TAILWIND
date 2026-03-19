import { Button } from "@/components/ui/button";

type InventoryPaginationControlsProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (next: number) => void;
};

type PaginationItem = number | "ellipsis";

function buildPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const normalizedPages = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationItem[] = [];

  normalizedPages.forEach((value, index) => {
    const previous = normalizedPages[index - 1];
    if (typeof previous === "number" && value - previous > 1) {
      items.push("ellipsis");
    }
    items.push(value);
  });

  return items;
}

export function InventoryPaginationControls({
  page,
  totalPages,
  total,
  onPageChange,
}: InventoryPaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPaginationItems(page, totalPages);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Paginacion de registros</p>
        <p className="text-xs dashboard-text-muted">
          Pagina {page} de {totalPages} · Total de registros: {total}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Anterior
        </Button>

        <div className="flex flex-wrap items-center gap-1.5" aria-label="Paginas disponibles">
          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm font-semibold text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={item}
                size="sm"
                variant={item === page ? "primary" : "outline"}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ),
          )}
        </div>

        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
