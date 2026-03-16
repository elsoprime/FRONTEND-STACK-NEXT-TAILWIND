import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

type SimulatePaidBody = {
  tenantId?: unknown;
  checkoutSessionId?: unknown;
  planId?: unknown;
};

function normalizeApiBaseUrl(): string {
  const raw =
    process.env.INTERNAL_API_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";
  return raw.replace(/\/$/, "");
}

function isSimulationModeEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_BILLING_SIMULATION_MODE === "true" ||
    process.env.NODE_ENV !== "production"
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isSimulationModeEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SIMULATION_DISABLED",
          message: "Billing simulation is disabled in this environment.",
        },
      },
      { status: 403 },
    );
  }

  const apiBaseUrl = normalizeApiBaseUrl();
  const webhookSecret =
    process.env.BILLING_WEBHOOK_SECRET ?? process.env.NEXT_BILLING_WEBHOOK_SECRET ?? "";

  if (!apiBaseUrl || !webhookSecret) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SIMULATION_CONFIG_INVALID",
          message: "Missing API base URL or billing webhook secret for simulation.",
        },
      },
      { status: 500 },
    );
  }

  let body: SimulatePaidBody;

  try {
    body = (await request.json()) as SimulatePaidBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GEN_VALIDATION_ERROR",
          message: "Invalid simulation payload.",
        },
      },
      { status: 400 },
    );
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId.trim() : "";
  const checkoutSessionId =
    typeof body.checkoutSessionId === "string" ? body.checkoutSessionId.trim() : "";
  const planId = typeof body.planId === "string" ? body.planId.trim() : "";

  if (!tenantId || !checkoutSessionId || !planId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GEN_VALIDATION_ERROR",
          message: "tenantId, checkoutSessionId and planId are required.",
        },
      },
      { status: 400 },
    );
  }

  const eventPayload = {
    id: `evt_ui_${Date.now()}`,
    provider: "simulated",
    type: "billing.checkout.paid",
    data: {
      tenantId,
      planId,
      checkoutSessionId,
    },
  };

  const rawPayload = JSON.stringify(eventPayload);
  const timestampSeconds = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", webhookSecret)
    .update(`${timestampSeconds}.${rawPayload}`)
    .digest("hex");

  const upstream = await fetch(`${apiBaseUrl}/api/v1/billing/webhooks/provider`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Billing-Signature": signature,
      "X-Billing-Timestamp": String(timestampSeconds),
    },
    body: rawPayload,
    cache: "no-store",
  });

  const upstreamText = await upstream.text();
  let upstreamBody: unknown = upstreamText;

  try {
    upstreamBody = JSON.parse(upstreamText);
  } catch {
    // keep text payload for diagnostics
  }

  if (!upstream.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SIMULATION_UPSTREAM_ERROR",
          message: "Failed to process simulated paid webhook.",
        },
        data: {
          upstreamStatus: upstream.status,
          upstreamBody,
        },
      },
      { status: upstream.status },
    );
  }

  const traceId =
    typeof upstreamBody === "object" &&
    upstreamBody !== null &&
    "traceId" in upstreamBody &&
    typeof (upstreamBody as { traceId?: unknown }).traceId === "string"
      ? (upstreamBody as { traceId: string }).traceId
      : null;

  return NextResponse.json({
    success: true,
    data: {
      traceId,
      upstreamStatus: upstream.status,
      upstreamBody,
    },
  });
}
