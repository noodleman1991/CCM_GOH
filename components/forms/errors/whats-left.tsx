"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, Circle, Lightbulb, ListChecks } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { fieldId } from "@/components/forms/errors/field-id";
import { cn } from "@/lib/utils";

export type WhatsLeftItem = { id: string; label: string; done: boolean; target: string; severity: "required" | "nudge" };

export const requiredLeft = (items: WhatsLeftItem[]) =>
  items.filter((item) => item.severity === "required" && !item.done).length;

function jump(target: string) {
  const element = document.getElementById(fieldId(target));
  element?.scrollIntoView({ block: "center", behavior: "smooth" });
  element?.focus({ preventScroll: true });
}

function Checklist({ items, onJump }: { items: WhatsLeftItem[]; onJump?: () => void }) {
  const t = useTranslations("forms.whatsLeft");
  const visible = items.filter((item) => item.severity === "required" || !item.done);
  return (
    <ul className="space-y-1">
      {visible.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => { jump(item.target); onJump?.(); }}
            className={cn(
              "flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-2 text-start text-sm transition-colors hover:bg-muted",
              item.done ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {item.severity === "nudge" ? (
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-ccm-amber" aria-label={t("suggestion")} />
            ) : item.done ? (
              <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className={cn(item.done && item.severity === "required" && "line-through decoration-muted-foreground/40")}>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** "What's left": a sticky side panel on desktop, a bottom bar + drawer on phones. */
export function WhatsLeft({ items, status, actions }: { items: WhatsLeftItem[]; status?: ReactNode; actions: ReactNode }) {
  const t = useTranslations("forms.whatsLeft");
  const left = requiredLeft(items);
  const summary = left === 0 ? t("allDone") : t("left", { count: left });
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-24 hidden w-72 shrink-0 self-start rounded-2xl border bg-card p-4 shadow-sm lg:block" aria-label={t("heading")}>
        <h2 className="font-heading text-sm font-semibold text-ccm-midnight">{t("heading")}</h2>
        <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{summary}</p>
        <div className="mt-3"><Checklist items={items} /></div>
        {status && <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">{status}</div>}
        <div className="mt-3 grid gap-2">{actions}</div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-start text-sm" aria-label={t("open")}>
                <ListChecks className="size-4 shrink-0 text-ccm-water" aria-hidden />
                <span className="truncate font-medium" aria-live="polite">{summary}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85dvh] overflow-y-auto px-4 pb-6">
              <DrawerHeader className="px-0 text-start"><DrawerTitle>{t("heading")}</DrawerTitle></DrawerHeader>
              <Checklist items={items} onJump={() => setOpen(false)} />
              {status && <div className="mt-4 text-xs text-muted-foreground">{status}</div>}
            </DrawerContent>
          </Drawer>
          <div className="flex shrink-0 gap-2">{actions}</div>
        </div>
      </div>
    </>
  );
}
