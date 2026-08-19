"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Client wrapper that hides the announcement bar once a visitor dismisses it,
 * remembering the choice per-message via localStorage (so a NEW announcement
 * shows again). Mirrors the cookie-consent dismiss pattern.
 */
export function AnnouncementDismiss({
  announcementKey,
  dismissible,
  dismissLabel,
  children,
}: {
  announcementKey: string;
  dismissible: boolean;
  dismissLabel: string;
  children: React.ReactNode;
}) {
  const storageKey = `ccm-announcement-dismissed:${announcementKey}`;
  // Start hidden until we've read localStorage, to avoid a flash for users who
  // already dismissed it (and to avoid hydration mismatch we render after mount).
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate mount gate: render only after localStorage is read to avoid a flash / hydration mismatch
    setMounted(true);
    if (dismissible) {
      try {
        setDismissed(localStorage.getItem(storageKey) === "1");
      } catch {
        /* ignore */
      }
    }
  }, [storageKey, dismissible]);

  if (!mounted || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative">
      {children}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={dismissLabel}
          className="absolute end-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-md text-current/80 transition hover:bg-black/10 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
