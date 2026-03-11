import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
