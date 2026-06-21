"use client";

import * as React from "react";
import { Search, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Accessible, mobile-friendly universal search.
 *
 * A compact trigger (icon, or icon + label) opens a modal with a single search
 * field that routes to /search?q=… on submit. Built on the Radix Dialog
 * (focus-trap, ESC, aria, RTL-aware) so it works on mobile and with a keyboard.
 *
 * Global shortcuts open it from anywhere: ⌘K / Ctrl-K, and "/" when not typing
 * in a field. Renders its own trigger; pass `variant` to control its look.
 */
export function SearchDialog({
  variant = "icon",
}: {
  /** "icon" = compact icon button (sidebar); "pill" = full-width labelled pill. */
  variant?: "icon" | "pill";
}) {
  const t = useTranslations("navigation");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global open shortcuts: ⌘K / Ctrl-K anywhere; "/" unless already typing.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isCmdK || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("searchPlaceholder")}
          aria-keyshortcuts="Meta+K Control+K"
          className="flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-keyshortcuts="Meta+K Control+K"
          className="flex w-full items-center gap-2 rounded-full bg-background px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          <Search className="size-4 shrink-0 text-slate-500" />
          <span className="truncate">{t("searchPlaceholder")}</span>
          <kbd className="ms-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
            ⌘K
          </kbd>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="top-[12%] translate-y-0 gap-0 p-0 sm:max-w-xl"
          onOpenAutoFocus={(e) => {
            // Focus the search field, not the close button.
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {/* Required for Radix Dialog a11y; visually hidden — the input is the UI. */}
          <DialogTitle className="sr-only">{t("searchTitle")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("searchDescription")}
          </DialogDescription>
          <form onSubmit={submit} className="flex items-center gap-3 px-4 py-3">
            <Search className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              autoComplete="off"
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              aria-label={t("searchSubmit")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <ArrowRight className="size-4 rtl:-scale-x-100" />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SearchDialog;
