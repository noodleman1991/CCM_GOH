import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Friendly, consistent empty state for workspace tabs (reuses the app Card). */
export function WorkspaceEmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-ccm-sky/20 text-ccm-sea">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-heading font-semibold text-ccm-midnight">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{body}</p>
      </div>
      {action}
    </Card>
  );
}
