import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InventoryPaginationControlsProps = {
  page: number;
  totalPages: number;
  total: number;
  limit?: number;
  limitOptions?: number[];
  onPageChange: (next: number) => void;
  onLimitChange?: (next: number) => void;
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
  limit = 20,
  limitOptions = [10, 20, 50, 100],
  onPageChange,
  onLimitChange,
}: InventoryPaginationControlsProps) {
  if (totalPages <= 1 && !onLimitChange) {
    return null;
  }

  const pages = buildPaginationItems(page, totalPages);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card/88 p-5 shadow-[0_16px_30px_-24px_oklch(0.2_0.02_56/0.25)] sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Paginacion de registros</p>
        <p className="text-xs dashboard-text-muted">
          Pagina {page} de {Math.max(totalPages, 1)} | Total de registros: {total}
          {onLimitChange ? ` | ${limit} por pagina` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onLimitChange ? (
          <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Filas
            <select
              className={cn(
                "h-9 rounded-lg border border-border/80 bg-background/82 px-3 text-sm font-medium text-foreground outline-none transition-[border-color,box-shadow] duration-200",
                "focus:border-primary/35 focus:ring-3 focus:ring-primary/12",
              )}
              value={String(limit)}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              aria-label="Filas por pagina"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

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
    </div>
  );
}
