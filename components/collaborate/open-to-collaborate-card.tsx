"use client";

import { useId, useState, useSyncExternalStore, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Handshake } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useCollaboration } from "@/hooks/use-collaboration";
import { setOpenToCollaborate } from "@/lib/actions/open-to-collaborate";
import { LIMITS } from "@/lib/validation/limits";

const DISMISSED = "ccm:open-card-dismissed";
const noop = () => () => {};
/** "Not now" on this device — read only in the browser, so the server render and first pass agree (nothing shown). */
function useDismissed(): boolean | null {
  return useSyncExternalStore(
    noop,
    () => {
      try {
        return localStorage.getItem(DISMISSED) === "1";
      } catch {
        return false;
      }
    },
    () => null,
  );
}

/**
 * Asks a member whether they're open to collaborating (opening-collaboration
 * spec C4) — shown while Settings → Collaboration has "Open to collaborate"
 * on and the member hasn't said yes or "Not now".
 */
export function OpenToCollaborateCard({ initiallyOpen }: { initiallyOpen: boolean }) {
  const t = useTranslations("collaborate.openCard");
  const access = useCollaboration();
  const storedDismissal = useDismissed();
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<"ask" | "done">("ask");
  const [interests, setInterests] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const fieldId = useId();

  // The confirmation first: saving refreshes the page, which then says the member is already open.
  if (state === "done") {
    return (
      <section className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950" aria-live="polite">
        <Handshake className="size-5 shrink-0" aria-hidden />
        <p className="font-semibold">{t("done")}</p>
        <Link href="/dashboard/profile/edit" className="inline-flex min-h-11 items-center font-bold text-ccm-sea hover:underline">
          {t("edit")}
        </Link>
      </section>
    );
  }

  if (!access.people || initiallyOpen || storedDismissal !== false || dismissed) return null;

  const yes = () =>
    start(async () => {
      setError(false);
      const res = await setOpenToCollaborate(true, interests);
      if (res.ok) setState("done");
      else setError(true);
    });
  const notNow = () => {
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Private window: the card just comes back next visit.
    }
    setDismissed(true);
  };

  return (
    <section aria-labelledby={`${fieldId}-title`} className="space-y-3 rounded-2xl border border-ccm-midnight/10 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ccm-sky/25 text-ccm-sea" aria-hidden>
          <Handshake className="size-5" />
        </span>
        <div className="space-y-1">
          <h2 id={`${fieldId}-title`} className="font-heading text-lg font-bold text-ccm-midnight">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("body")}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="text-sm font-semibold text-ccm-midnight">
          {t("interestsLabel")}
        </label>
        <textarea
          id={fieldId}
          value={interests}
          maxLength={LIMITS.profile.collaborationInterests}
          rows={2}
          onChange={(e) => setInterests(e.target.value)}
          placeholder={t("interestsPlaceholder")}
          className="w-full rounded-lg border border-ccm-midnight/15 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-sea"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {t("saveError")}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={yes} disabled={pending} className="min-h-11">
          {t("yes")}
        </Button>
        <Button type="button" variant="ghost" onClick={notNow} disabled={pending} className="min-h-11">
          {t("notNow")}
        </Button>
      </div>
    </section>
  );
}
