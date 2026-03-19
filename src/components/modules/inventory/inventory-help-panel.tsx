import { BookOpenText } from "lucide-react";

type InventoryHelpPanelProps = {
  title?: string;
  items: readonly string[];
};

export function InventoryHelpPanel({ title = "Panel de ayuda", items }: InventoryHelpPanelProps) {
  return (
    <article className="rounded-md bg-card/96 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <BookOpenText className="size-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
          {title}
        </h3>
      </div>
      <ol className="mt-3 space-y-2 text-sm dashboard-text-muted">
        {items.map((item, index) => (
          <li key={`${index}:${item}`}>
            {index + 1}. {item}
          </li>
        ))}
      </ol>
    </article>
  );
}
