"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SearchDialogResults } from "@/components/search-dialog-results";
import { useSearchStore } from "@/stores/search-store";

/**
 * Universal search = ONE modal (SearchModal, rendered once in the shell) + any
 * number of triggers (SearchTrigger). All open-state lives in a Zustand store,
 * so the keyboard shortcut and every trigger open the SAME modal — fixing the
 * previous double-instance "stuck overlay" bug (two modals stacking on ⌘K).
 */

export function SearchTrigger({
  variant = "icon",
}: {
  /** "icon" = compact icon button (topbar); "pill" = full-width labelled pill. */
  variant?: "icon" | "pill";
}) {
  const t = useTranslations("navigation");
  const setOpen = useSearchStore((s) => s.setOpen);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("searchPlaceholder")}
        aria-keyshortcuts="Meta+K Control+K"
        className="flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-keyshortcuts="Meta+K Control+K"
      // Clean radius + box height matching the original (app radius, centered
      // icon/label). Every 2 minutes the label "types" itself out (ccmtype) and
      // then a small wiggle nudge fires (ccmwiggle) for the brand's "alive" feel;
      // both settle on hover/focus and for reduced motion.
      className="flex w-full origin-center items-center gap-2 rounded-lg bg-background px-3.5 py-2.5 text-sm text-slate-500 transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary motion-safe:animate-ccmwiggle hover:[animation-play-state:paused] focus-visible:[animation-play-state:paused]"
    >
      <Search className="size-4 shrink-0 text-slate-500" />
      {/* Typewriter label: an overflow-clipped inline-block whose max-width is
          animated in steps, with a blinking caret while it types. The text is
          fully present for a11y / no-motion; only its reveal is animated. */}
      <span className="inline-flex items-center overflow-hidden whitespace-nowrap">
        <span className="overflow-hidden whitespace-nowrap motion-safe:max-w-0 motion-safe:animate-ccmtype motion-reduce:max-w-none">
          {t("searchPlaceholder")}
        </span>
        <span
          aria-hidden="true"
          className="ms-px hidden w-px self-stretch bg-slate-400 motion-safe:inline-block motion-safe:animate-ccmcaret"
        />
      </span>
      <kbd className="ms-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
        ⌘K
      </kbd>
    </button>
  );
}

/** The single search modal. Render exactly once (in the app shell). */
export function SearchModal() {
  const t = useTranslations("navigation");
  const router = useRouter();
  // No useAuth() here: this shell is always mounted, and with ClerkProvider
  // `dynamic` reading the promise-backed auth store during hydration skewed
  // the useId tree of later layout siblings (see SearchDialogResults, which
  // reads it after the dialog opens instead).
  const open = useSearchStore((s) => s.open);
  const setOpen = useSearchStore((s) => s.setOpen);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  // Global open shortcuts: ⌘K / Ctrl-K anywhere; "/" unless typing. Toggles to
  // the store's single modal — no per-instance state, so no stacking.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isCmdK || (e.key === "/" && !typing && !useSearchStore.getState().open)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    handleOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="top-[10%] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] translate-y-0 gap-0 overflow-hidden rounded-xl p-0 sm:w-full sm:max-w-xl"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">{t("searchTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("searchDescription")}</DialogDescription>
        {/* The dialog header IS the field (no nested pill box) — icon and
            sizing match SearchInput's language so ⌘K reads as the same
            search control as everywhere else in the hub. */}
        <form onSubmit={submit} className="relative flex items-center border-b border-border">
          <Search
            className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            // pe-12 alone clears the dialog's own close (×) button, which sits
            // fixed at end-4 top-4 regardless of this row's layout; sm:pe-20
            // makes room for the ↵ kbd hint once it appears too.
            className="h-11 w-full bg-transparent ps-10 pe-12 text-base text-foreground outline-none placeholder:text-muted-foreground sm:pe-20"
          />
          <kbd className="absolute end-12 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ↵
          </kbd>
        </form>

        <SearchDialogResults
          query={query}
          onNavigate={() => handleOpenChange(false)}
          footerHref={`/search?q=${encodeURIComponent(query.trim())}`}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Back-compat: the old <SearchDialog variant/> is now just a trigger. */
export function SearchDialog({ variant = "icon" }: { variant?: "icon" | "pill" }) {
  return <SearchTrigger variant={variant} />;
}

export default SearchDialog;
