"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearClientAuthState } from "@/features/auth/session-lifecycle";
import { setGlobalAuthFailureHandler } from "@/lib/api/auth-failure-handler";

type AuthLifecycleProviderProps = {
  children: React.ReactNode;
};

export function AuthLifecycleProvider({ children }: AuthLifecycleProviderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    return setGlobalAuthFailureHandler(() => {
      clearClientAuthState(queryClient);
      router.replace("/login?expired=1");
    });
  }, [queryClient, router]);

  return children;
}
