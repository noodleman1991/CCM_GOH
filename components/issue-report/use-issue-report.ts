"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  ACCEPTED_SCREENSHOT_TYPES,
  MAX_SCREENSHOT_BYTES,
  deriveAreaFromPath,
  describeBrowser,
  describeDevice,
  describeOs,
} from "@/lib/issue-report";
import { afterNextPaint, canCaptureScreen, captureCurrentTab, isCaptureCancelled } from "@/components/issue-report/capture-screen";

/**
 * The report form's state and actions, shared by the hub's widget and the
 * Payload admin's. Each supplies its own translate function and toasts, so
 * this module stays free of next-intl and of either design system.
 */

export type Translate = (key: string, values?: Record<string, string | number>) => string;
export type Notify = {
  error: (message: string) => void;
  success: (title: string, options?: { description?: string }) => void;
};

export type Screenshot = { filename: string; contentType: string; dataBase64: string; previewUrl: string };

export type CapturedContext = {
  url: string;
  pageTitle: string;
  locale: string;
  browser: string;
  device: string;
  os: string;
  viewport: string;
  userAgent: string;
};

export function captureContext(locale: string): CapturedContext {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const width = typeof window === "undefined" ? 0 : window.innerWidth;
  const height = typeof window === "undefined" ? 0 : window.innerHeight;
  return {
    url: typeof window === "undefined" ? "" : window.location.href,
    pageTitle: typeof document === "undefined" ? "" : document.title,
    locale,
    browser: describeBrowser(ua),
    device: describeDevice(ua, width),
    os: describeOs(ua),
    viewport: width && height ? `${width}×${height}` : "",
    // Trimmed to the schema's cap; the parsed fields above carry the meaning.
    userAgent: ua.slice(0, 500),
  };
}

const noSubscription = () => () => {};

export function useIssueReport({
  t,
  notify,
  locale,
  pathname,
}: {
  t: Translate;
  notify: Notify;
  locale: string;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [whatShouldHappen, setWhatShouldHappen] = useState("");
  const [urgency, setUrgency] = useState<string>("annoying");
  const [area, setArea] = useState<string>("other");
  const [wasSignedIn, setWasSignedIn] = useState(true);
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
  const [context, setContext] = useState<CapturedContext | null>(null);
  const [sending, setSending] = useState(false);
  const [capturing, setCapturing] = useState(false);
  // False on the server and in the first client render, so markup matches.
  const canCapture = useSyncExternalStore(noSubscription, canCaptureScreen, () => false);
  // Reopening after a capture must not re-snapshot the page or reset the area.
  const resumingRef = useRef(false);

  // Snapshot the page the moment the panel opens, before any of it can change.
  useEffect(() => {
    if (!open) return;
    if (resumingRef.current) {
      resumingRef.current = false;
      return;
    }
    setContext(captureContext(locale));
    setArea(deriveAreaFromPath(pathname || "/"));
  }, [open, locale, pathname]);

  // Object URLs for the preview thumbnail must be released by hand.
  useEffect(() => {
    return () => {
      if (screenshot?.previewUrl) URL.revokeObjectURL(screenshot.previewUrl);
    };
  }, [screenshot?.previewUrl]);

  const removeScreenshot = useCallback(() => {
    setScreenshot((previous) => {
      if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
      return null;
    });
  }, []);

  const reset = useCallback(() => {
    setSummary("");
    setWhatHappened("");
    setWhatShouldHappen("");
    setUrgency("annoying");
    setWasSignedIn(true);
    removeScreenshot();
  }, [removeScreenshot]);

  const acceptImage = useCallback(
    (file: File) => {
      if (!(ACCEPTED_SCREENSHOT_TYPES as readonly string[]).includes(file.type)) {
        notify.error(t("screenshotWrongType"));
        return;
      }
      if (file.size > MAX_SCREENSHOT_BYTES) {
        notify.error(t("screenshotTooBig", { mb: Math.round(MAX_SCREENSHOT_BYTES / 1024 / 1024) }));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const dataBase64 = result.slice(result.indexOf(",") + 1);
        // Created outside the updater: React may run updaters twice in dev, and
        // a second createObjectURL would leak the first blob URL.
        const previewUrl = URL.createObjectURL(file);
        setScreenshot((previous) => {
          if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
          return { filename: file.name || "screenshot.png", contentType: file.type, dataBase64, previewUrl };
        });
      };
      reader.onerror = () => notify.error(t("screenshotFailed"));
      reader.readAsDataURL(file);
    },
    [notify, t],
  );

  // The panel steps aside while the browser captures the page, then comes back
  // with the picture attached and everything typed so far intact.
  const capture = useCallback(async () => {
    setCapturing(true);
    resumingRef.current = true;
    setOpen(false);
    try {
      // The share prompt must not show the panel; the click's user activation
      // outlasts a frame, so getDisplayMedia is still allowed afterwards.
      await afterNextPaint();
      acceptImage(await captureCurrentTab(MAX_SCREENSHOT_BYTES));
    } catch (error) {
      if (!isCaptureCancelled(error)) notify.error(t("screenshotCaptureFailed"));
    } finally {
      setCapturing(false);
      setOpen(true);
    }
  }, [acceptImage, notify, t]);

  const firstImage = (files: FileList | undefined | null) =>
    Array.from(files || []).find((file) => file.type.startsWith("image/"));

  // Paste straight from the OS screenshot shortcut.
  const onPaste = useCallback(
    (event: React.ClipboardEvent) => {
      const file = firstImage(event.clipboardData?.files);
      if (file) {
        event.preventDefault();
        acceptImage(file);
      }
    },
    [acceptImage],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const file = firstImage(event.dataTransfer?.files);
      if (file) {
        event.preventDefault();
        acceptImage(file);
      }
    },
    [acceptImage],
  );

  const canSubmit = summary.trim().length >= 3 && whatHappened.trim().length >= 3 && !sending;

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSending(true);
    try {
      const response = await fetch("/api/issue-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          whatHappened,
          whatShouldHappen,
          urgency,
          area,
          wasSignedIn,
          context: context ?? captureContext(locale),
          screenshot: screenshot
            ? { filename: screenshot.filename, contentType: screenshot.contentType, dataBase64: screenshot.dataBase64 }
            : null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        notify.error(payload?.error || t("errorGeneric"));
        return;
      }
      notify.success(t("successTitle"), { description: t("successBody") });
      reset();
      setOpen(false);
    } catch {
      notify.error(t("errorGeneric"));
    } finally {
      setSending(false);
    }
  }, [canSubmit, summary, whatHappened, whatShouldHappen, urgency, area, wasSignedIn, context, locale, screenshot, reset, notify, t]);

  return {
    open,
    setOpen,
    summary,
    setSummary,
    whatHappened,
    setWhatHappened,
    whatShouldHappen,
    setWhatShouldHappen,
    urgency,
    setUrgency,
    area,
    setArea,
    wasSignedIn,
    setWasSignedIn,
    screenshot,
    removeScreenshot,
    acceptImage,
    onPaste,
    onDrop,
    context,
    canSubmit,
    sending,
    submit,
    canCapture,
    capturing,
    capture,
  };
}
