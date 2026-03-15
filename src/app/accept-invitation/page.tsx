"use client";

import { Suspense, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { acceptTenantInvitation } from "@/features/tenant/tenant.service";
import { ApiRequestError } from "@/lib/api/client";
import { useSessionStore } from "@/store/session-store";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [token, setToken] = useState(() => searchParams.get("token") ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token.trim()) {
        throw new Error("Debes ingresar el token de invitacion.");
      }
      return acceptTenantInvitation({ token: token.trim() });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFeedback("Invitacion aceptada. Ya puedes acceder al tenant.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback(resolveTenantErrorMessage(error.code, error.message));
        return;
      }
      setFeedback(error instanceof Error ? error.message : resolveTenantErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-xl space-y-6 rounded-2xl border border-border/80 bg-card/80 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Aceptar invitacion</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa el token recibido por correo para activar tu acceso al tenant.
          </p>
        </div>

        <div className="space-y-2">
          <label className="field-label">Token</label>
          <Input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="token-invitacion"
          />
        </div>

        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Aceptar invitacion
        </Button>

        {feedback ? (
          <div className="rounded-md border border-border/80 bg-background/70 p-3 text-sm text-foreground">
            {feedback}
          </div>
        ) : null}

        <div className="text-sm text-muted-foreground">
          <Link href="/auth/login" className="text-primary underline-offset-2 hover:underline">
            Ir a login
          </Link>
          <span className="mx-2">|</span>
          <Link href="/app" className="text-primary underline-offset-2 hover:underline">
            Ir al dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

function AcceptInvitationFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <div className="w-full max-w-xl animate-pulse rounded-2xl border border-border/80 bg-card/80 p-6">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="mt-3 h-4 w-full rounded bg-muted" />
        <div className="mt-8 h-10 w-full rounded bg-muted" />
      </div>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<AcceptInvitationFallback />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
