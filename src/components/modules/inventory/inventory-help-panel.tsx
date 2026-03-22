import { BookOpenText } from "lucide-react";

type InventoryHelpPanelProps = {
  title?: string;
  items: readonly string[];
};

export function InventoryHelpPanel({ title = "Panel de ayuda", items }: InventoryHelpPanelProps) {
  return (
    <article className="rounded-2xl border border-border/80 bg-card/92 p-6 shadow-[0_18px_34px_-24px_oklch(0.2_0.02_56/0.25)]">
      <div className="flex items-center gap-2">
        <BookOpenText className="size-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
          {title}
        </h3>
      </div>
      <ol className="mt-4 space-y-2.5 text-sm dashboard-text-muted">
        {items.map((item, index) => (
          <li key={`${index}:${item}`}>
            {index + 1}. {item}
          </li>
        ))}
      </ol>
    </article>
  );
}
