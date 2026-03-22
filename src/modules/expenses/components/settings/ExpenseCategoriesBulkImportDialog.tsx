"use client";

import { type ComponentType, useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { InventoryFormModal } from "@/components/ui/inventory-form-modal";
import { Button } from "@/components/ui/button";
import {
  InventoryCell,
  InventoryDataTable,
  InventoryRow,
} from "@/components/ui/inventory-records-shell";
import { createCategory } from "@/lib/api/expenses.client";
import type { CreateExpenseCategoryInput } from "@/lib/api/expenses.types";

type ParsedRow = {
  id: string;
  key: string;
  name: string;
  requiresAttachment: boolean;
  monthlyLimit: number | null;
  status: "valid" | "invalid" | "created" | "failed";
  errorMessage?: string;
};

type BulkImportResult = {
  processed: number;
  succeeded: number;
  failed: number;
};

type ExpenseCategoriesBulkImportDialogProps = {
  open: boolean;
  tenantId: string;
  onOpenChange: (open: boolean) => void;
  onCompleted: (result: BulkImportResult) => void;
};

export function ExpenseCategoriesBulkImportDialog({
  open,
  tenantId,
  onOpenChange,
  onCompleted,
}: ExpenseCategoriesBulkImportDialogProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const summary = useMemo(() => {
    const valid = rows.filter((row) => row.status === "valid").length;
    const invalid = rows.filter((row) => row.status === "invalid").length;
    const created = rows.filter((row) => row.status === "created").length;
    const failed = rows.filter((row) => row.status === "failed").length;

    return { valid, invalid, created, failed };
  }, [rows]);

  const hasReadyRows = rows.some((row) => row.status === "valid");

  const resetState = () => {
    setRows([]);
    setFileName(null);
    setFeedback(null);
    setIsImporting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }

    onOpenChange(nextOpen);
  };

  const handleCsvFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    const rawText = await file.text();
    const parsed = parseCsvRows(rawText);

    setFileName(file.name);
    setRows(parsed);
    setFeedback(null);
  };

  const executeImport = async () => {
    const validRows = rows.filter((row) => row.status === "valid");

    if (validRows.length === 0 || isImporting) {
      return;
    }

    setIsImporting(true);

    const nextRows = [...rows];
    let succeeded = 0;
    let failed = 0;

    for (const row of validRows) {
      const payload: CreateExpenseCategoryInput = {
        key: row.key,
        name: row.name,
        requiresAttachment: row.requiresAttachment,
        monthlyLimit: row.monthlyLimit,
      };

      try {
        await createCategory(tenantId, payload);
        succeeded += 1;

        const index = nextRows.findIndex((current) => current.id === row.id);
        if (index >= 0) {
          nextRows[index] = {
            ...nextRows[index],
            status: "created",
            errorMessage: undefined,
          };
        }
      } catch (error) {
        failed += 1;

        const index = nextRows.findIndex((current) => current.id === row.id);
        if (index >= 0) {
          nextRows[index] = {
            ...nextRows[index],
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Fallo de creacion",
          };
        }
      }
    }

    setRows(nextRows);
    setIsImporting(false);

    const processed = validRows.length;
    setFeedback(`Importacion finalizada. Exitos: ${succeeded}. Fallos: ${failed}.`);
    onCompleted({ processed, succeeded, failed });
  };

  return (
    <InventoryFormModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Importar categorias desde CSV"
      description="Carga categorias en lote con validacion previa por fila."
      size="lg"
      alert={
        <div className="rounded-xl border border-border/80 bg-background/80 p-3 text-sm text-muted-foreground">
          Formato esperado: `key,name,requiresAttachment,monthlyLimit`. Acepta delimitador `,` o `;`.
        </div>
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void executeImport()}
            disabled={!hasReadyRows || isImporting}
          >
            <Upload className="size-4" />
            {isImporting ? "Importando..." : "Ejecutar import"}
          </Button>
        </>
      }
    >
      <section className="space-y-4">
        <div className="rounded-2xl border border-border/80 bg-background/82 p-4">
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Archivo CSV de categorias</span>
            <input
              data-testid="expenses-categories-csv-input"
              type="file"
              accept=".csv,text/csv"
              className="block w-full rounded-md border border-border/80 bg-background/90 px-3 py-2 text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleCsvFile(file);
              }}
            />
          </label>

          {fileName ? (
            <p className="mt-2 text-xs text-muted-foreground">Archivo cargado: {fileName}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <StatusPill icon={FileSpreadsheet} label={`Validas: ${summary.valid}`} tone="default" />
            <StatusPill icon={TriangleAlert} label={`Invalidas: ${summary.invalid}`} tone="warning" />
            <StatusPill icon={CheckCircle2} label={`Creadas: ${summary.created}`} tone="success" />
            <StatusPill icon={TriangleAlert} label={`Fallidas: ${summary.failed}`} tone="danger" />
          </div>

          {feedback ? <p className="mt-3 text-sm text-muted-foreground">{feedback}</p> : null}
        </div>

        <article className="rounded-xl border border-border/70 bg-background/85 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Reglas CSV</p>
          <p className="mt-2">Encabezado obligatorio: `key,name,requiresAttachment,monthlyLimit`</p>
          <p>- `key`: minimo 2 caracteres, solo `[a-z0-9_-]`</p>
          <p>- `requiresAttachment`: `si/no` o `true/false`</p>
          <p>- `monthlyLimit`: numero mayor o igual a 0, vacio = sin limite</p>
          <p>- Separador admitido: `,` o `;`</p>
          <p className="mt-2 font-medium text-foreground">Ejemplo:</p>
          <pre className="mt-1 overflow-x-auto rounded-md border border-border/70 bg-background/90 px-3 py-2 text-xs text-foreground">
{`key,name,requiresAttachment,monthlyLimit
travel,Viajes,si,250000
office,Oficina,no,`}
          </pre>
        </article>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/88">
          <InventoryDataTable
            hasRows={rows.length > 0}
            empty="Sin filas cargadas aun."
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
                  <span className={statusClassName(row.status)}>
                    {statusLabel(row.status)}
                  </span>
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

function statusLabel(status: ParsedRow["status"]): string {
  switch (status) {
    case "valid":
      return "lista";
    case "invalid":
      return "invalida";
    case "created":
      return "creada";
    case "failed":
      return "fallida";
    default:
      return status;
  }
}

function statusClassName(status: ParsedRow["status"]): string {
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

function parseCsvRows(rawText: string): ParsedRow[] {
  const normalized = rawText.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();

  if (normalized.length === 0) {
    return [];
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = splitCsvLine(lines[0], delimiter).map((cell) => cell.trim().toLowerCase());

  const keyIndex = headerCells.indexOf("key");
  const nameIndex = headerCells.indexOf("name");
  const attachmentIndex = headerCells.indexOf("requiresattachment");
  const limitIndex = headerCells.indexOf("monthlylimit");

  return lines.slice(1).map((line, rowIndex) => {
    const cells = splitCsvLine(line, delimiter).map((cell) => cell.trim());

    const key = readCell(cells, keyIndex).toLowerCase();
    const name = readCell(cells, nameIndex);
    const requiresAttachmentRaw = readCell(cells, attachmentIndex).toLowerCase();
    const monthlyLimitRaw = readCell(cells, limitIndex);

    const parsedAttachment = parseBoolean(requiresAttachmentRaw);
    const parsedLimit = parseMonthlyLimit(monthlyLimitRaw);

    const errorMessage = validateRow({ key, name, parsedAttachment, parsedLimit });

    return {
      id: `row-${rowIndex + 1}`,
      key,
      name,
      requiresAttachment: parsedAttachment ?? false,
      monthlyLimit: parsedLimit,
      status: errorMessage ? "invalid" : "valid",
      errorMessage,
    };
  });
}

function validateRow({
  key,
  name,
  parsedAttachment,
  parsedLimit,
}: {
  key: string;
  name: string;
  parsedAttachment: boolean | null;
  parsedLimit: number | null;
}): string | undefined {
  if (key.length < 2) {
    return "key invalida";
  }

  if (!/^[a-z0-9][a-z0-9_-]*$/.test(key)) {
    return "key solo admite [a-z0-9_-]";
  }

  if (name.length < 2) {
    return "nombre invalido";
  }

  if (parsedAttachment === null) {
    return "requiresAttachment invalido (usa si/no o true/false)";
  }

  if (parsedLimit !== null && (!Number.isFinite(parsedLimit) || parsedLimit < 0)) {
    return "monthlyLimit invalido";
  }

  return undefined;
}

function parseBoolean(value: string): boolean | null {
  if (["true", "1", "si", "yes", "y"].includes(value)) {
    return true;
  }

  if (["false", "0", "no", "n", ""].includes(value)) {
    return false;
  }

  return null;
}

function parseMonthlyLimit(value: string): number | null {
  if (value.length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

function detectDelimiter(headerLine: string): "," | ";" {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: "," | ";"): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function readCell(cells: string[], index: number): string {
  if (index < 0 || index >= cells.length) {
    return "";
  }

  return cells[index] ?? "";
}

function StatusPill({
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
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold ${toneClassName}`}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
