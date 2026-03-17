import { Button } from "@/components/ui/button";

type InventoryPaginationControlsProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (next: number) => void;
};

export function InventoryPaginationControls({
  page,
  totalPages,
  total,
  onPageChange,
}: InventoryPaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/80 p-3">
      <p className="text-xs dashboard-text-muted">
        Total: {total} - Pagina {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
