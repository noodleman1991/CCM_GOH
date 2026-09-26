"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "@payloadcms/ui";

import { ACCEPTED_SCREENSHOT_TYPES, AREA_VALUES, URGENCY_VALUES } from "@/lib/issue-report";
import { useIssueReport, type Translate } from "@/components/issue-report/use-issue-report";

type Strings = Record<string, unknown>;

/** next-intl's `t` for one namespace: dotted keys and `{name}` values. */
function translator(strings: Strings): Translate {
  return (key, values) => {
    const found = key.split(".").reduce<unknown>((node, part) => (node as Strings | undefined)?.[part], strings);
    const text = typeof found === "string" ? found : key;
    return values ? text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? "")) : text;
  };
}

/**
 * The admin's copy of the hub widget: same form, same endpoint, same
 * screenshot capture (use-issue-report), drawn with the admin's own tokens in
 * app/(payload)/custom.scss because the admin has no Tailwind. Imports only
 * pure modules — see payload-admin-client-import-gotcha.
 */
export function ReportIssueBubble({ strings }: { strings: Strings }) {
  const pathname = usePathname() || "/admin";
  const [t] = useState(() => translator(strings));
  const report = useIssueReport({ t, notify: toast, locale: "en", pathname });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { open, setOpen } = report;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <>
      <button
        type="button"
        className="ccm-report__trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t("trigger")}
      >
        <BugIcon />
        <span className="ccm-report__trigger-label">{t("trigger")}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="ccm-report"
        aria-labelledby="ccm-report-title"
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {open && (
          <div
            className="ccm-report__panel"
            onPaste={report.onPaste}
            onDrop={report.onDrop}
            onDragOver={(event) => event.preventDefault()}
          >
            <header className="ccm-report__header">
              <h2 id="ccm-report-title">{t("title")}</h2>
              <p>{t("description")}</p>
              <button type="button" className="ccm-report__close" onClick={close} aria-label={t("cancel")}>
                ×
              </button>
            </header>

            <label className="ccm-report__field">
              <span>{t("summaryLabel")}</span>
              <input
                autoFocus
                value={report.summary}
                onChange={(event) => report.setSummary(event.target.value)}
                placeholder={t("summaryPlaceholder")}
                maxLength={200}
              />
            </label>

            <label className="ccm-report__field">
              <span>{t("whatHappenedLabel")}</span>
              <textarea
                rows={3}
                value={report.whatHappened}
                onChange={(event) => report.setWhatHappened(event.target.value)}
                placeholder={t("whatHappenedPlaceholder")}
                maxLength={5000}
              />
            </label>

            <label className="ccm-report__field">
              <span>{t("whatShouldHappenLabel")}</span>
              <textarea
                rows={2}
                value={report.whatShouldHappen}
                onChange={(event) => report.setWhatShouldHappen(event.target.value)}
                placeholder={t("whatShouldHappenPlaceholder")}
                maxLength={5000}
              />
            </label>

            <fieldset className="ccm-report__field">
              <legend>{t("urgencyLabel")}</legend>
              <div className="ccm-report__chips">
                {URGENCY_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="ccm-report__chip"
                    aria-pressed={report.urgency === value}
                    onClick={() => report.setUrgency(value)}
                  >
                    {t(`urgency.${value}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="ccm-report__field">
              <span>{t("areaLabel")}</span>
              <select value={report.area} onChange={(event) => report.setArea(event.target.value)}>
                {AREA_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`areas.${value}`)}
                  </option>
                ))}
              </select>
            </label>

            <div className="ccm-report__field">
              <span>{t("screenshotLabel")}</span>
              {report.screenshot ? (
                <div className="ccm-report__shot">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview, never optimised */}
                  <img src={report.screenshot.previewUrl} alt="" />
                  <span>{report.screenshot.filename}</span>
                  <button type="button" onClick={report.removeScreenshot} aria-label={t("screenshotRemove")}>
                    ×
                  </button>
                </div>
              ) : (
                <div className="ccm-report__chips">
                  {report.canCapture && (
                    <button
                      type="button"
                      className="ccm-report__chip"
                      onClick={report.capture}
                      disabled={report.capturing}
                    >
                      {t("screenshotCapture")}
                    </button>
                  )}
                  <button type="button" className="ccm-report__chip" onClick={() => fileInputRef.current?.click()}>
                    {t("screenshotAdd")}
                  </button>
                </div>
              )}
              <small>{report.canCapture ? t("screenshotHintCapture") : t("screenshotHint")}</small>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept={ACCEPTED_SCREENSHOT_TYPES.join(",")}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) report.acceptImage(file);
                  event.target.value = "";
                }}
              />
            </div>

            {report.context && (
              <p className="ccm-report__context">
                {t("contextNote")} {[report.context.browser, report.context.os, report.context.viewport].filter(Boolean).join(" · ")}
              </p>
            )}

            <footer className="ccm-report__actions">
              <button type="button" className="ccm-report__secondary" onClick={close} disabled={report.sending}>
                {t("cancel")}
              </button>
              <button type="button" className="ccm-report__primary" onClick={report.submit} disabled={!report.canSubmit}>
                {report.sending ? t("submitting") : t("submit")}
              </button>
            </footer>
          </div>
        )}
      </dialog>
    </>
  );
}

function BugIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m8 2 1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  );
}
