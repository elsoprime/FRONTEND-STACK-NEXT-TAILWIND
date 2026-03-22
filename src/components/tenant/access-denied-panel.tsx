import { AccessStatePanel } from "@/components/ui/access-state-panel";

type AccessDeniedPanelProps = {
  title?: string;
  message: string;
  code?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function AccessDeniedPanel({
  title = "Acceso restringido",
  message,
  code,
  actionLabel,
  actionHref,
  className,
}: AccessDeniedPanelProps) {
  return (
    <AccessStatePanel
      title={title}
      description={message}
      code={code}
      primaryAction={
        actionHref && actionLabel
          ? {
              href: actionHref,
              label: actionLabel,
              variant: "outline",
            }
          : undefined
      }
      className={className}
    />
  );
}
