import { create } from "zustand";
import { type LoginBrowserData, type SessionUser } from "@/features/auth/auth.schemas";

type AuthMode = "browser" | "headless";

type SessionState = {
  isAuthenticated: boolean;
  authMode: AuthMode;
  user: SessionUser | null;
  sessionId: string | null;
  sessionExpiresAt: string | null;
  lastTraceId: string | null;
  setSessionFromLogin: (input: { session: LoginBrowserData; traceId?: string }) => void;
  setLastTraceId: (traceId: string | null) => void;
  clearSession: () => void;
};

const initialSessionState = {
  isAuthenticated: false,
  authMode: "browser" as const,
  user: null,
  sessionId: null,
  sessionExpiresAt: null,
  lastTraceId: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialSessionState,
  setSessionFromLogin: ({ session, traceId }) =>
    set({
      isAuthenticated: true,
      authMode: "browser",
      user: session.user,
      sessionId: session.session.id,
      sessionExpiresAt: session.session.expiresAt,
      lastTraceId: traceId ?? null,
    }),
  setLastTraceId: (traceId) => set({ lastTraceId: traceId }),
  clearSession: () => set(initialSessionState),
}));
