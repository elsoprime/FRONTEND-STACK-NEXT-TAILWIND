import Cookies from "js-cookie";
import { z, type ZodTypeAny } from "zod";
import {
  apiErrorEnvelopeSchema,
  createApiSuccessEnvelopeSchema,
  type ApiErrorCode,
  type ApiErrorDetails,
  type ApiSuccessEnvelope,
} from "@/lib/api/contracts";
import { notifyGlobalAuthFailure } from "@/lib/api/auth-failure-handler";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const DEFAULT_CSRF_COOKIE = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token";
const DEFAULT_CSRF_HEADER = "X-CSRF-Token";
const DEFAULT_TENANT_HEADER = "X-Tenant-Id";
const REFRESH_BROWSER_PATH = "/api/v1/auth/refresh/browser";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ApiPath = "/health" | `/api/v1/${string}`;
type TenantScopedPath =
  | `/api/v1/audit${string}`
  | `/api/v1/tenant/settings${string}`
  | `/api/v1/modules/${string}`
  | "/api/v1/tenant/invitations"
  | "/api/v1/tenant/invitations/revoke"
  | "/api/v1/tenant/transfer-ownership"
  | "/api/v1/tenant/subscription"
  | "/api/v1/billing/checkout/session";

type ApiResponseFor<TDataSchema extends ZodTypeAny | undefined> = TDataSchema extends ZodTypeAny
  ? ApiSuccessEnvelope<z.infer<TDataSchema>>
  : ApiSuccessEnvelope<unknown>;

const MUTATING_METHODS: ReadonlySet<HttpMethod> = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type ApiRequestOptions<TDataSchema extends ZodTypeAny | undefined = undefined> = Omit<
  RequestInit,
  "method" | "body" | "headers" | "credentials"
> & {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  tenantId?: string | null;
  dataSchema?: TDataSchema;
  csrfCookieName?: string;
  csrfHeaderName?: string;
  withCsrf?: boolean;
  browserMode?: boolean;
  allowRefreshRetry?: boolean;
  onAuthFailure?: () => void;
};

type ApiRequestErrorInput = {
  status: number;
  code: ApiErrorCode;
  message: string;
  path?: string;
  details?: ApiErrorDetails;
  traceId?: string;
  retryable: boolean;
  payload?: unknown;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly path?: string;
  readonly details?: ApiErrorDetails;
  readonly traceId?: string;
  readonly retryable: boolean;
  readonly payload?: unknown;

  constructor(input: ApiRequestErrorInput) {
    super(input.message);
    this.name = "ApiRequestError";
    this.status = input.status;
    this.code = input.code;
    this.path = input.path;
    this.details = input.details;
    this.traceId = input.traceId;
    this.retryable = input.retryable;
    this.payload = input.payload;
  }
}

function normalizePath(path: string): ApiPath | string {
  if (path.startsWith("/")) {
    return path;
  }
  return `/${path}`;
}

function resolvePathname(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return new URL(path).pathname;
  }
  return normalizePath(path).split("?")[0] ?? "/";
}

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedPath = normalizePath(path);
  return `${API_BASE_URL}${normalizedPath}`;
}

function isTenantScopedPath(pathname: string): pathname is TenantScopedPath {
  return (
    pathname.startsWith("/api/v1/audit") ||
    pathname.startsWith("/api/v1/tenant/settings") ||
    pathname.startsWith("/api/v1/modules/") ||
    pathname === "/api/v1/tenant/invitations" ||
    pathname === "/api/v1/tenant/invitations/revoke" ||
    pathname === "/api/v1/tenant/transfer-ownership" ||
    pathname === "/api/v1/tenant/subscription" ||
    pathname === "/api/v1/billing/checkout/session"
  );
}

function shouldAttachCsrf(
  method: HttpMethod,
  optionsWithDefaults: Required<Pick<ApiRequestOptions, "browserMode" | "withCsrf">>,
): boolean {
  if (!optionsWithDefaults.browserMode || !optionsWithDefaults.withCsrf) {
    return false;
  }
  return MUTATING_METHODS.has(method);
}

function buildHeaders<TDataSchema extends ZodTypeAny | undefined>(
  pathname: string,
  method: HttpMethod,
  options: ApiRequestOptions<TDataSchema>,
): Headers {
  const headers = new Headers(options.headers);
  const isFormDataBody = options.body instanceof FormData;

  if (options.body !== undefined && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isTenantScopedPath(pathname)) {
    if (!options.tenantId) {
      throw new ApiRequestError({
        status: 400,
        code: "TENANT_HEADER_REQUIRED",
        message: `Missing tenant context for tenant-scoped request: ${pathname}`,
        retryable: false,
      });
    }
    headers.set(DEFAULT_TENANT_HEADER, options.tenantId);
  }

  if (
    shouldAttachCsrf(method, {
      browserMode: options.browserMode ?? true,
      withCsrf: options.withCsrf ?? true,
    })
  ) {
    const cookieName = options.csrfCookieName ?? DEFAULT_CSRF_COOKIE;
    const headerName = options.csrfHeaderName ?? DEFAULT_CSRF_HEADER;
    const csrfToken = Cookies.get(cookieName);

    if (!headers.has(headerName)) {
      if (!csrfToken) {
        throw new ApiRequestError({
          status: 403,
          code: "AUTH_CSRF_INVALID",
          message: "Missing CSRF token for mutating browser request.",
          path: pathname,
          retryable: false,
        });
      }

      headers.set(headerName, csrfToken);
    }
  }

  return headers;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (!contentType) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  if (contentType.includes("text/")) {
    return response.text();
  }

  return null;
}

function canAttemptRefresh(pathname: string, status: number, allowRefreshRetry: boolean): boolean {
  if (status !== 401 || !allowRefreshRetry) {
    return false;
  }
  return !pathname.startsWith(REFRESH_BROWSER_PATH);
}

function resolveFallbackCodeByStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "GEN_VALIDATION_ERROR";
    case 401:
      return "AUTH_UNAUTHENTICATED";
    case 403:
      return "RBAC_PERMISSION_DENIED";
    case 404:
      return "GEN_NOT_FOUND";
    case 423:
      return "AUTH_ACCOUNT_LOCKED";
    case 429:
      return "GEN_RATE_LIMITED";
    default:
      return "GEN_INTERNAL_ERROR";
  }
}

function resolveFallbackMessage(status: number, path: string, payload: unknown): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    if (payload.includes("<!DOCTYPE html>") || payload.includes("<html")) {
      if (status === 404 && path.startsWith("/api/v1/")) {
        return `API endpoint not found for ${path}. Check APP_URL rewrite or NEXT_PUBLIC_API_BASE_URL.`;
      }
      return `Unexpected HTML response for ${path}.`;
    }
  }

  return `Request failed with status ${status}`;
}

type LooseErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  traceId?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceDetails(value: unknown): ApiErrorDetails | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const normalized: Record<string, string[]> = {};

  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "string") {
      normalized[key] = [raw];
      continue;
    }

    if (Array.isArray(raw)) {
      const values = raw.filter((item): item is string => typeof item === "string");
      if (values.length > 0) {
        normalized[key] = values;
      }
      continue;
    }

    if (raw !== undefined && raw !== null) {
      normalized[key] = [String(raw)];
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function extractLooseError(payload: unknown): {
  code?: ApiErrorCode;
  message?: string;
  details?: ApiErrorDetails;
  traceId?: string;
} {
  if (!isRecord(payload)) {
    return {};
  }

  const envelope = payload as LooseErrorEnvelope;
  const errorObj = isRecord(envelope.error) ? envelope.error : undefined;

  const code =
    typeof errorObj?.code === "string"
      ? (errorObj.code as ApiErrorCode)
      : typeof payload.code === "string"
        ? (payload.code as ApiErrorCode)
        : undefined;

  const message =
    typeof errorObj?.message === "string"
      ? errorObj.message
      : typeof payload.message === "string"
        ? payload.message
        : undefined;

  const traceId =
    typeof envelope.traceId === "string"
      ? envelope.traceId
      : typeof payload.traceId === "string"
        ? payload.traceId
        : undefined;

  return {
    code,
    message,
    details: coerceDetails(errorObj?.details),
    traceId,
  };
}

function createFailureError(status: number, path: string, payload: unknown): ApiRequestError {
  const parsedError = apiErrorEnvelopeSchema.safeParse(payload);

  if (parsedError.success) {
    const isRateLimited = status === 429 || parsedError.data.error.code === "GEN_RATE_LIMITED";
    return new ApiRequestError({
      status,
      code: parsedError.data.error.code,
      message: parsedError.data.error.message,
      path,
      details: parsedError.data.error.details,
      traceId: parsedError.data.traceId,
      retryable: isRateLimited,
      payload,
    });
  }

  const looseError = extractLooseError(payload);

  if (looseError.code || looseError.message) {
    return new ApiRequestError({
      status,
      code: looseError.code ?? resolveFallbackCodeByStatus(status),
      message: looseError.message ?? resolveFallbackMessage(status, path, payload),
      path,
      details: looseError.details,
      traceId: looseError.traceId,
      retryable: status === 429 || looseError.code === "GEN_RATE_LIMITED",
      payload,
    });
  }

  return new ApiRequestError({
    status,
    code: resolveFallbackCodeByStatus(status),
    message: resolveFallbackMessage(status, path, payload),
    path,
    retryable: status >= 500,
    payload,
  });
}

async function handleAuthFailure(callback?: () => void): Promise<void> {
  try {
    await notifyGlobalAuthFailure();
  } catch {
    // Ignore cleanup handler failures to preserve the original auth error.
  }

  try {
    callback?.();
  } catch {
    // Ignore local cleanup handler failures to preserve the original auth error.
  }
}

export async function apiRequest<TDataSchema extends ZodTypeAny | undefined = undefined>(
  path: string,
  options: ApiRequestOptions<TDataSchema> = {},
): Promise<ApiResponseFor<TDataSchema>> {
  const method = options.method ?? "GET";
  const pathname = resolvePathname(path);
  const response = await fetch(resolveUrl(path), {
    ...options,
    method,
    credentials: "include",
    headers: buildHeaders(pathname, method, options),
    body:
      options.body !== undefined && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | null | undefined),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = createFailureError(response.status, pathname, payload);
    const browserMode = options.browserMode ?? true;
    const allowRefreshRetry = options.allowRefreshRetry ?? true;

    if (browserMode && canAttemptRefresh(pathname, response.status, allowRefreshRetry)) {
      try {
        await apiRequest(REFRESH_BROWSER_PATH, {
          method: "POST",
          allowRefreshRetry: false,
          browserMode: true,
          withCsrf: true,
          csrfCookieName: options.csrfCookieName,
          csrfHeaderName: options.csrfHeaderName,
        });
      } catch {
        await handleAuthFailure(options.onAuthFailure);
        throw error;
      }

      return apiRequest(path, {
        ...options,
        allowRefreshRetry: false,
      });
    }

    throw error;
  }

  const successSchema = createApiSuccessEnvelopeSchema(options.dataSchema ?? z.unknown());
  const parsedSuccess = successSchema.safeParse(payload);

  if (!parsedSuccess.success) {
    throw new ApiRequestError({
      status: response.status,
      code: "GEN_INTERNAL_ERROR",
      message: "Unexpected response envelope from API",
      retryable: false,
      payload,
    });
  }

  return parsedSuccess.data as ApiResponseFor<TDataSchema>;
}
