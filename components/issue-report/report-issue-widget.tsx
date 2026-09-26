"use client";

import { useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bug, Camera, ImagePlus, Loader2, X } from "lucide-react";

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
import { ACCEPTED_SCREENSHOT_TYPES, AREA_VALUES, URGENCY_VALUES } from "@/lib/issue-report";
import { useIssueReport, type Translate } from "@/components/issue-report/use-issue-report";

/**
 * Editor-only "Report a problem" widget. Rendered by the (main) layout solely
 * for staff, so it carries no gate of its own — the API re-checks.
 *
 * Everything the browser already knows (page, browser, device, screen, locale)
 * is captured rather than typed, which is the whole reason this beats a
 * spreadsheet: the reporter writes two sentences and nothing else.
 */

const noSubscription = () => () => {};

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
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const report = useIssueReport({ t: t as Translate, notify: toast, locale, pathname: pathname || "/" });
  const {
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
  } = report;

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
              onClick={removeScreenshot}
              aria-label={t("screenshotRemove")}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {report.canCapture && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={report.capture}
                disabled={report.capturing}
              >
                <Camera className="size-4" aria-hidden />
                {t("screenshotCapture")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden />
              {t("screenshotAdd")}
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {report.canCapture ? t("screenshotHintCapture") : t("screenshotHint")}
        </p>
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
        <DrawerContent className="max-h-[92dvh] overflow-y-auto">
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
      <DialogContent className="max-h-[88dvh] gap-4 overflow-y-auto sm:max-w-xl">
        <DialogHeader className="text-start">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
