import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

type SearchParamValue = string | string[] | undefined;

type VerifyEmailPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

function resolveSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const initialToken = resolveSearchParamValue(params.token);
  const initialEmail = resolveSearchParamValue(params.email);

  return (
    <AuthPageShell>
      <VerifyEmailForm initialToken={initialToken ?? ""} initialEmail={initialEmail ?? ""} />
    </AuthPageShell>
  );
}
