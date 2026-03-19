"use client";

import type { ChangeEvent, ReactNode } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const inventorySelectClassName =
  "h-10 w-full rounded-md border border-border/80 bg-background/80 px-3 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary/35 focus:ring-3 focus:ring-primary/12";

type InventoryRecordsShellProps = {
  title: string;
  description: string;
  badgeLabel: string;
  countLabel: string;
  countValue: string;
  onCreate: () => void;
  createLabel: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  table: ReactNode;
  pagination?: ReactNode;
  exportAction?: () => void;
  importAction?: () => void;
  className?: string;
};

export function InventoryRecordsShell({
  title,
  description,
  badgeLabel,
  countLabel,
  countValue,
  onCreate,
  createLabel,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters,
  table,
  pagination,
  exportAction,
  importAction,
  className,
}: InventoryRecordsShellProps) {
  return (
    <section className={cn("surface-card overflow-hidden border-border/80 p-0", className)}>
      <div className="border-b border-border/70 bg-linear-to-r from-background via-background to-muted/35 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="rounded-lg border-primary/20 bg-primary/8 px-2.5 text-primary"
            >
              {badgeLabel}
            </Badge>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          <div className="min-w-[180px] rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {countLabel}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {countValue}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            {onSearchChange ? (
              <Input
                value={searchValue}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onSearchChange(event.target.value)
                }
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-md bg-background/85 lg:max-w-sm"
              />
            ) : null}
            {filters ? (
              <div className="flex flex-1 flex-wrap items-center gap-2">{filters}</div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="toolbar" onClick={importAction}>
              <Upload className="size-4" />
              Importar
            </Button>
            <Button type="button" variant="toolbar" onClick={exportAction}>
              <Download className="size-4" />
              Exportar
            </Button>
            <Button type="button" onClick={onCreate}>
              <Plus className="size-4" />
              {createLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 sm:px-4">
        <div className="overflow-hidden rounded-md border border-border/70 bg-background/85">
          {table}
        </div>
      </div>

      {pagination ? (
        <div className="border-t border-border/70 px-5 py-4 sm:px-6">{pagination}</div>
      ) : null}
    </section>
  );
}

type InventoryDataTableProps = {
  columns: ReactNode;
  children: ReactNode;
  empty?: ReactNode;
  hasRows: boolean;
};

export function InventoryDataTable({ columns, children, empty, hasRows }: InventoryDataTableProps) {
  if (!hasRows) {
    return (
      <div className="px-6 py-12 text-center text-sm text-muted-foreground">
        {empty ?? "Sin registros disponibles."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-muted/45 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <tr>{columns}</tr>
        </thead>
        <tbody className="[&_tr:last-child_td]:border-b-0">{children}</tbody>
      </table>
    </div>
  );
}

type InventoryRowProps = {
  children: ReactNode;
};

export function InventoryRow({ children }: InventoryRowProps) {
  return (
    <tr className="bg-background/80 transition-colors duration-200 hover:bg-muted/25">
      {children}
    </tr>
  );
}

type InventoryCellProps = {
  children: ReactNode;
  className?: string;
  header?: boolean;
};

export function InventoryCell({ children, className, header = false }: InventoryCellProps) {
  const Tag = header ? "th" : "td";
  return (
    <Tag
      className={cn(
        "border-b border-border/65 px-4 py-3 align-middle",
        header ? "font-semibold text-foreground" : "text-foreground/90",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
