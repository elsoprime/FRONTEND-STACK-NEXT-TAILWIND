"use client";

import { type ComponentType, useMemo, useState } from "react";
import { CheckCircle2, ListPlus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryFormModal } from "@/components/ui/inventory-form-modal";
import {
  InventoryCell,
  InventoryDataTable,
  InventoryRow,
} from "@/components/ui/inventory-records-shell";
import { createCategoriesBulkGuided } from "@/lib/api/expenses.client";
import type { CreateExpenseCategoryInput } from "@/lib/api/expenses.types";

type ParsedBulkLine = {
  id: string;
  key: string;
  name: string;
  requiresAttachment: boolean;
  monthlyLimit: number | null;
  status: "valid" | "invalid" | "created" | "failed";
  errorMessage?: string;
};

type BulkCreateResult = {
  processed: number;
  succeeded: number;
  failed: number;
};

type ExpenseCategoryBulkCreateDialogProps = {
  open: boolean;
  tenantId: string;
  existingKeys: string[];
  onOpenChange: (open: boolean) => void;
  onCompleted: (result: BulkCreateResult) => void;
};

export function ExpenseCategoryBulkCreateDialog({
  open,
  tenantId,
  existingKeys,
  onOpenChange,
  onCompleted,
}: ExpenseCategoryBulkCreateDialogProps) {
  const [rawLines, setRawLines] = useState("");
  const [rows, setRows] = useState<ParsedBulkLine[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    const valid = rows.filter((row) => row.status === "valid").length;
    const invalid = rows.filter((row) => row.status === "invalid").length;
    const created = rows.filter((row) => row.status === "created").length;
    const failed = rows.filter((row) => row.status === "failed").length;

    return { valid, invalid, created, failed };
  }, [rows]);

  const hasReadyRows = rows.some((row) => row.status === "valid");

  const parseLines = () => {
    const parsed = parseBulkLines(rawLines, existingKeys);
    setRows(parsed);
    setFeedback(null);
  };

  const resetState = () => {
    setRawLines("");
    setRows([]);
    setFeedback(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }

    onOpenChange(nextOpen);
  };

  const executeBulkCreate = async () => {
    const validRows = rows.filter((row) => row.status === "valid");
    if (validRows.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const nextRows = [...rows];
    const payloads: CreateExpenseCategoryInput[] = validRows.map((row) => ({
      key: row.key,
      name: row.name,
      requiresAttachment: row.requiresAttachment,
      monthlyLimit: row.monthlyLimit,
    }));

    const result = await createCategoriesBulkGuided(tenantId, payloads);

    for (const item of result.results) {
      const row = validRows.find((current) => current.key === item.key);
      if (!row) {
        continue;
      }

      const index = nextRows.findIndex((current) => current.id === row.id);
      if (index < 0) {
        continue;
      }

      nextRows[index] = {
        ...nextRows[index],
        status: item.success ? "created" : "failed",
        errorMessage: item.success ? undefined : item.message,
      };
    }

    setRows(nextRows);
    setIsSubmitting(false);

    const processed = validRows.length;
    setFeedback(`Alta masiva finalizada. Exitos: ${result.succeeded}. Fallos: ${result.failed}.`);
    onCompleted({ processed, succeeded: result.succeeded, failed: result.failed });
  };

  return (
    <InventoryFormModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Alta masiva guiada"
      description="Crea categorias en lote desde lineas estructuradas sin archivo CSV."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void executeBulkCreate()}
            disabled={!hasReadyRows || isSubmitting}
          >
            <ListPlus className="size-4" />
            {isSubmitting ? "Creando..." : "Ejecutar alta"}
          </Button>
        </>
      }
    >
      <section className="space-y-4">
        <article className="rounded-xl border border-border/70 bg-background/85 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Formato de linea</p>
          <p className="mt-2">
            Usa una linea por categoria: <code>key|name|requiresAttachment|monthlyLimit</code>
          </p>
          <p>
            Ejemplo: <code>travel_local|Viajes locales|si|350000</code>
          </p>
          <p>Campos opcionales: `requiresAttachment` (default `no`) y `monthlyLimit` (default vacio).</p>
        </article>

        <div className="rounded-xl border border-border/70 bg-background/88 p-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">Lineas de carga</span>
            <textarea
              data-testid="expenses-category-bulk-lines-input"
              value={rawLines}
              onChange={(event) => setRawLines(event.target.value)}
              className="h-36 w-full rounded-md border border-border/80 bg-background/90 px-3 py-2 font-mono text-xs"
              placeholder={"travel|Viajes|si|250000\noffice|Oficina|no|"}
            />
          </label>

          <div className="mt-3 flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={parseLines}>
              Validar lineas
            </Button>
            <SummaryPill icon={CheckCircle2} label={`Validas: ${summary.valid}`} tone="default" />
            <SummaryPill icon={TriangleAlert} label={`Invalidas: ${summary.invalid}`} tone="warning" />
            <SummaryPill icon={CheckCircle2} label={`Creadas: ${summary.created}`} tone="success" />
            <SummaryPill icon={TriangleAlert} label={`Fallidas: ${summary.failed}`} tone="danger" />
          </div>

          {feedback ? <p className="mt-3 text-sm text-muted-foreground">{feedback}</p> : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/88">
          <InventoryDataTable
            hasRows={rows.length > 0}
            empty="Sin lineas validadas."
            columns={
              <>
                <InventoryCell header>Key</InventoryCell>
                <InventoryCell header>Nombre</InventoryCell>
                <InventoryCell header>Adjunto</InventoryCell>
                <InventoryCell header>Limite</InventoryCell>
                <InventoryCell header>Estado</InventoryCell>
                <InventoryCell header>Detalle</InventoryCell>
              </>
            }
          >
            {rows.map((row) => (
              <InventoryRow key={row.id}>
                <InventoryCell>{row.key}</InventoryCell>
                <InventoryCell>{row.name}</InventoryCell>
                <InventoryCell>{row.requiresAttachment ? "si" : "no"}</InventoryCell>
                <InventoryCell>{row.monthlyLimit === null ? "-" : String(row.monthlyLimit)}</InventoryCell>
                <InventoryCell>
                  <span className={resolveStatusClassName(row.status)}>{resolveStatusLabel(row.status)}</span>
                </InventoryCell>
                <InventoryCell>{row.errorMessage ?? "-"}</InventoryCell>
              </InventoryRow>
            ))}
          </InventoryDataTable>
        </div>
      </section>
    </InventoryFormModal>
  );
}

function parseBulkLines(raw: string, existingKeys: string[]): ParsedBulkLine[] {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const seen = new Set<string>(existingKeys.map((key) => key.toLowerCase()));
  const parsed: ParsedBulkLine[] = [];

  lines.forEach((line, index) => {
    const cells = line.split("|").map((cell) => cell.trim());
    const key = (cells[0] ?? "").toLowerCase();
    const name = cells[1] ?? "";
    const requiresAttachment = parseBoolean(cells[2] ?? "");
    const monthlyLimit = parseMonthlyLimit(cells[3] ?? "");

    let errorMessage: string | undefined;

    if (key.length < 2) {
      errorMessage = "key invalida";
    } else if (!/^[a-z0-9][a-z0-9_-]*$/.test(key)) {
      errorMessage = "key solo admite [a-z0-9_-]";
    } else if (seen.has(key)) {
      errorMessage = "key ya existe";
    } else if (name.length < 2) {
      errorMessage = "nombre invalido";
    } else if (requiresAttachment === null) {
      errorMessage = "requiresAttachment invalido";
    } else if (monthlyLimit !== null && (!Number.isFinite(monthlyLimit) || monthlyLimit < 0)) {
      errorMessage = "monthlyLimit invalido";
    }

    if (!errorMessage) {
      seen.add(key);
    }

    parsed.push({
      id: `line-${index + 1}`,
      key,
      name,
      requiresAttachment: requiresAttachment ?? false,
      monthlyLimit,
      status: errorMessage ? "invalid" : "valid",
      errorMessage,
    });
  });

  return parsed;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (["", "no", "false", "0", "n"].includes(normalized)) {
    return false;
  }
  if (["si", "yes", "true", "1", "y"].includes(normalized)) {
    return true;
  }
  return null;
}

function parseMonthlyLimit(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

function resolveStatusLabel(status: ParsedBulkLine["status"]): string {
  if (status === "valid") return "lista";
  if (status === "invalid") return "invalida";
  if (status === "created") return "creada";
  return "fallida";
}

function resolveStatusClassName(status: ParsedBulkLine["status"]): string {
  if (status === "valid") {
    return "rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary";
  }
  if (status === "created") {
    return "rounded-full border border-emerald-300/35 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-100";
  }
  if (status === "failed") {
    return "rounded-full border border-destructive/35 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive";
  }
  return "rounded-full border border-amber-300/35 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-100";
}

function SummaryPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: "default" | "success" | "warning" | "danger";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100"
      : tone === "warning"
        ? "border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100"
        : tone === "danger"
          ? "border-destructive/35 bg-destructive/10 text-destructive"
          : "border-primary/25 bg-primary/10 text-primary";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${toneClassName}`}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
