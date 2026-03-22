export const EXPENSE_ATTACHMENT_MAX_SIZE_BYTES = 26_214_400;

const EXPENSE_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

const EXPENSE_ATTACHMENT_EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  heic: "image/heic",
  heif: "image/heif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const EXPENSE_ATTACHMENT_ACCEPT = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
  ".svg",
  ".heic",
  ".heif",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
].join(",");

export function resolveExpenseAttachmentMimeType(file: File): string {
  if (
    file.type &&
    EXPENSE_ATTACHMENT_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof EXPENSE_ATTACHMENT_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXPENSE_ATTACHMENT_EXTENSION_MIME_MAP[extension] ?? file.type;
}

export function isAllowedExpenseAttachmentMimeType(mimeType: string): boolean {
  return EXPENSE_ATTACHMENT_ALLOWED_MIME_TYPES.includes(
    mimeType as (typeof EXPENSE_ATTACHMENT_ALLOWED_MIME_TYPES)[number],
  );
}

export function validateExpenseAttachmentFile(file: File): string | null {
  if (file.size < 1) {
    return "El archivo seleccionado esta vacio.";
  }

  if (file.size > EXPENSE_ATTACHMENT_MAX_SIZE_BYTES) {
    return "El archivo supera el maximo permitido de 25 MB.";
  }

  const resolvedMimeType = resolveExpenseAttachmentMimeType(file);

  if (!resolvedMimeType || !isAllowedExpenseAttachmentMimeType(resolvedMimeType)) {
    return "Solo se permiten adjuntos PDF, imagenes y documentos Office.";
  }

  return null;
}

export async function computeSha256Hex(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

