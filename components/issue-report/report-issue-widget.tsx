"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bug, ImagePlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_SCREENSHOT_TYPES,
  AREA_VALUES,
  MAX_SCREENSHOT_BYTES,
  URGENCY_VALUES,
  deriveAreaFromPath,
  describeBrowser,
  describeDevice,
  describeOs,
} from "@/lib/issue-report";

/**
 * Editor-only "Report a problem" widget. Rendered by the (main) layout solely
 * for staff, so it carries no gate of its own — the API re-checks.
 *
 * Everything the browser already knows (page, browser, device, screen, locale)
 * is captured rather than typed, which is the whole reason this beats a
 * spreadsheet: the reporter writes two sentences and nothing else.
 */

type Screenshot = { filename: string; contentType: string; dataBase64: string; previewUrl: string };

type CapturedContext = {
  url: string;
  pageTitle: string;
  locale: string;
  browser: string;
  device: string;
  os: string;
  viewport: string;
  userAgent: string;
};

function captureContext(locale: string): CapturedContext {
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

export function ReportIssueWidget() {
  const t = useTranslations("issueReport");
  const locale = useLocale();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Client-only mount: the trigger's Radix-generated aria-controls id is
  // position-derived, and streaming Suspense siblings (announcement bar, page
  // blocks) make the server's id sequence vary per request → intermittent
  // hydration mismatch. Skipping SSR removes the server id entirely; a floating
  // button that needs JS to do anything loses nothing by appearing post-mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Snapshot the page the moment the panel opens, before any of it can change.
  useEffect(() => {
    if (!open) return;
    setContext(captureContext(locale));
    setArea(deriveAreaFromPath(pathname || "/"));
  }, [open, locale, pathname]);

  // Object URLs for the preview thumbnail must be released by hand.
  useEffect(() => {
    return () => {
      if (screenshot?.previewUrl) URL.revokeObjectURL(screenshot.previewUrl);
    };
  }, [screenshot?.previewUrl]);

  const reset = useCallback(() => {
    setSummary("");
    setWhatHappened("");
    setWhatShouldHappen("");
    setUrgency("annoying");
    setWasSignedIn(true);
    setScreenshot((previous) => {
      if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
      return null;
    });
  }, []);

  const acceptImage = useCallback(
    (file: File) => {
      if (!(ACCEPTED_SCREENSHOT_TYPES as readonly string[]).includes(file.type)) {
        toast.error(t("screenshotWrongType"));
        return;
      }
      if (file.size > MAX_SCREENSHOT_BYTES) {
        toast.error(t("screenshotTooBig", { mb: Math.round(MAX_SCREENSHOT_BYTES / 1024 / 1024) }));
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
          return {
            filename: file.name || "screenshot.png",
            contentType: file.type,
            dataBase64,
            previewUrl,
          };
        });
      };
      reader.onerror = () => toast.error(t("screenshotFailed"));
      reader.readAsDataURL(file);
    },
    [t]
  );

  // Paste straight from the OS screenshot shortcut — the whole point.
  const onPaste = useCallback(
    (event: React.ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files || [])[0];
      if (file && file.type.startsWith("image/")) {
        event.preventDefault();
        acceptImage(file);
      }
    },
    [acceptImage]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const file = Array.from(event.dataTransfer?.files || [])[0];
      if (file && file.type.startsWith("image/")) {
        event.preventDefault();
        acceptImage(file);
      }
    },
    [acceptImage]
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
            ? {
                filename: screenshot.filename,
                contentType: screenshot.contentType,
                dataBase64: screenshot.dataBase64,
              }
            : null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(payload?.error || t("errorGeneric"));
        return;
      }
      toast.success(t("successTitle"), { description: t("successBody") });
      reset();
      setOpen(false);
    } catch {
      toast.error(t("errorGeneric"));
    } finally {
      setSending(false);
    }
  }, [
    canSubmit,
    summary,
    whatHappened,
    whatShouldHappen,
    urgency,
    area,
    wasSignedIn,
    context,
    locale,
    screenshot,
    reset,
    t,
  ]);

  const trigger = (
    <Button
      size="sm"
      variant="secondary"
      className="fixed bottom-4 end-4 z-40 gap-2 rounded-full shadow-lg backdrop-blur"
      aria-label={t("trigger")}
    >
      <Bug className="size-4" aria-hidden />
      <span className="hidden sm:inline">{t("trigger")}</span>
    </Button>
  );

  const form = (
    <div
      className="grid gap-4 px-4 pb-4 sm:px-0 sm:pb-0"
      onPaste={onPaste}
      onDrop={onDrop}
      onDragOver={(event) => event.preventDefault()}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="ir-summary">{t("summaryLabel")}</Label>
        <Input
          id="ir-summary"
          autoFocus
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder={t("summaryPlaceholder")}
          maxLength={200}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="ir-happened">{t("whatHappenedLabel")}</Label>
        <Textarea
          id="ir-happened"
          rows={3}
          value={whatHappened}
          onChange={(event) => setWhatHappened(event.target.value)}
          placeholder={t("whatHappenedPlaceholder")}
          maxLength={5000}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="ir-should">{t("whatShouldHappenLabel")}</Label>
        <Textarea
          id="ir-should"
          rows={2}
          value={whatShouldHappen}
          onChange={(event) => setWhatShouldHappen(event.target.value)}
          placeholder={t("whatShouldHappenPlaceholder")}
          maxLength={5000}
        />
      </div>

      <div className="grid gap-1.5">
        <span className="text-sm font-medium">{t("urgencyLabel")}</span>
        <div className="flex flex-wrap gap-2">
          {URGENCY_VALUES.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={urgency === value ? "default" : "outline"}
              onClick={() => setUrgency(value)}
              aria-pressed={urgency === value}
            >
              {t(`urgency.${value}`)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="ir-area">{t("areaLabel")}</Label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger id="ir-area">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AREA_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`areas.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <span className="text-sm font-medium">{t("signedInLabel")}</span>
          <div className="flex gap-2">
            {[true, false].map((value) => (
              <Button
                key={String(value)}
                type="button"
                size="sm"
                variant={wasSignedIn === value ? "default" : "outline"}
                onClick={() => setWasSignedIn(value)}
                aria-pressed={wasSignedIn === value}
              >
                {value ? t("signedInYes") : t("signedInNo")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-sm font-medium">{t("screenshotLabel")}</span>
        {screenshot ? (
          <div className="flex items-center gap-3 rounded-md border p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview, never optimised */}
            <img
              src={screenshot.previewUrl}
              alt=""
              className="h-16 w-24 rounded object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {screenshot.filename}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() =>
                setScreenshot((previous) => {
                  if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
                  return null;
                })
              }
              aria-label={t("screenshotRemove")}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" aria-hidden />
            {t("screenshotAdd")}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">{t("screenshotHint")}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_SCREENSHOT_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) acceptImage(file);
            event.target.value = "";
          }}
        />
      </div>

      {context && (
        <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {t("contextNote")}{" "}
          <span className="font-medium">
            {[context.browser, context.os, context.viewport].filter(Boolean).join(" · ")}
          </span>
        </p>
      )}

      <div className={cn("flex gap-2", isMobile ? "flex-col" : "justify-end")}>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
          {t("cancel")}
        </Button>
        <Button type="button" onClick={submit} disabled={!canSubmit} className="gap-2">
          {sending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {sending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </div>
  );

  if (!mounted) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[92vh] overflow-y-auto">
          <DrawerHeader className="text-start">
            <DrawerTitle>{t("title")}</DrawerTitle>
            <DrawerDescription>{t("description")}</DrawerDescription>
          </DrawerHeader>
          {form}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[88vh] gap-4 overflow-y-auto sm:max-w-xl">
        <DialogHeader className="text-start">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
