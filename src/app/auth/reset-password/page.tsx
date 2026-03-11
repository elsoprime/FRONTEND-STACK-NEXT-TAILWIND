import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type SearchParamValue = string | string[] | undefined;

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

function resolveSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const initialEmail = resolveSearchParamValue(params.email) ?? "";
  const initialToken = resolveSearchParamValue(params.token) ?? "";

  return (
    <AuthPageShell>
      <ResetPasswordForm initialEmail={initialEmail} initialToken={initialToken} />
    </AuthPageShell>
  );
}
