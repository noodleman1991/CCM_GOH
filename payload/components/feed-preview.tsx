"use client";

/**
 * "What will show now" (spec §3.5): under a Content feed section, the items a
 * visitor would see right now with the settings as they are in the form —
 * refreshed half a second after the editor stops changing them.
 *
 * Sends the section's raw form values; the server maps them with the same
 * function the page uses, so the preview can't drift from the page.
 *
 * Imports only React, @payloadcms/ui and payload/shared (see the admin
 * client-import gotcha).
 */
import { useEffect, useMemo, useState } from "react";
import { useAllFormFields, useLocale } from "@payloadcms/ui";
import { reduceFieldsToValues } from "payload/shared";

type Preview = { items: Array<{ title: string; kind: string; href: string }>; skipped: Array<{ kind: string; id: string }> };
type State = { status: "loading" } | { status: "ready"; data: Preview } | { status: "error"; message: string };

const KIND_NAMES: Record<string, string> = {
  caseStudy: "Case study",
  newsPost: "News",
  event: "Event",
  livedExperience: "Lived experience",
  researchOutput: "Research output",
  agenda: "Agenda",
};

/** The section's own fields, as one nested object (the shape the page reads). */
function useBlockValues(path: string): string {
  const [fields] = useAllFormFields();
  const blockPath = path.split(".").slice(0, -1).join(".");
  return useMemo(() => {
    const prefix = `${blockPath}.`;
    const own = Object.fromEntries(
      Object.entries(fields)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => [key.slice(prefix.length), value]),
    );
    return JSON.stringify(reduceFieldsToValues(own, true));
  }, [fields, blockPath]);
}

export function FeedPreview({ path = "" }: { path?: string }) {
  const block = useBlockValues(path);
  const { code: locale } = useLocale();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ status: "loading" });
      try {
        const res = await fetch("/api/admin/feed-preview", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ block: JSON.parse(block), locale }),
          signal: controller.signal,
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Couldn't load the preview. Try again in a moment.");
        setState({ status: "ready", data: body as Preview });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Couldn't load the preview." });
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [block, locale]);

  return (
    <div
      aria-live="polite"
      style={{
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: 6,
        padding: "0.75rem 1rem",
        margin: "0.5rem 0 1rem",
        background: "var(--theme-elevation-50)",
      }}
    >
      <strong style={{ display: "block", marginBottom: "0.5rem" }}>What will show now</strong>
      {state.status === "loading" && <p style={{ margin: 0, opacity: 0.7 }}>Checking…</p>}
      {state.status === "error" && <p style={{ margin: 0 }}>{state.message}</p>}
      {state.status === "ready" && (
        <>
          {state.data.items.length === 0 ? (
            <p style={{ margin: 0 }}>Nothing matches right now, so this section is hidden. Try fewer filters, or pick some items.</p>
          ) : (
            <ol style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
              {state.data.items.map((item) => (
                <li key={`${item.kind}:${item.href}`}>
                  <span style={{ opacity: 0.7 }}>{KIND_NAMES[item.kind] ?? item.kind}:</span> {item.title}
                </li>
              ))}
            </ol>
          )}
          {state.data.skipped.length > 0 && (
            <p style={{ margin: "0.5rem 0 0" }}>
              {state.data.skipped.length === 1
                ? "1 of your picks isn't shown — it's no longer published or approved."
                : `${state.data.skipped.length} of your picks aren't shown — they're no longer published or approved.`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
