export type CsvHeader<T> = {
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  const normalized = value == null ? "" : String(value);
  if (!/[",\n]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

export function downloadCsv<T>(filename: string, headers: CsvHeader<T>[], rows: T[]): void {
  const lines = [
    headers.map((header) => escapeCsvValue(header.label)).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(header.value(row))).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
