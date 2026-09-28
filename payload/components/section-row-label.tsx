"use client";

/**
 * A section's row header: number, plain name, and — for a section in a list
 * every language shares — which translations are still missing
 * ("EN ✓ · ES missing · FR ✓ · AR ✓").
 *
 * The form holds one language at a time, so the status comes from the saved
 * document read with `locale=all` (drafts included), refetched after each save.
 * A new, unsaved section — or any failed read — shows the name alone.
 *
 * Imports only React, @payloadcms/ui and the pure helper beside it: an admin
 * client component that reaches lib/content or next/headers takes /admin down.
 */
import { useEffect, useState } from "react";
import { useDocumentInfo, useRowLabel } from "@payloadcms/ui";
import { findBlockById, statusLine, translationStatus } from "./translation-status";

const LOCALES = ["en", "es", "fr", "ar"] as const;
const cache = new Map<string, Promise<unknown>>();

function loadDocument(url: string): Promise<unknown> {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url, { credentials: "include" }).then((res) => (res.ok ? res.json() : null)).catch(() => null);
    cache.set(url, pending);
  }
  return pending;
}

export function SectionRowLabel({ label }: { label?: string }) {
  const { data, rowNumber } = useRowLabel<{ id?: string; blockType?: string }>();
  const { id, collectionSlug, globalSlug, savedDocumentData } = useDocumentInfo();
  const rowId = data?.id;
  const version = String(savedDocumentData?.updatedAt ?? "");
  const url = globalSlug
    ? `/payload-api/globals/${globalSlug}?locale=all&depth=0&draft=true&v=${encodeURIComponent(version)}`
    : collectionSlug && id
      ? `/payload-api/${collectionSlug}/${id}?locale=all&depth=0&draft=true&v=${encodeURIComponent(version)}`
      : null;
  const key = url && rowId ? `${url}#${rowId}` : null;

  // The status is remembered with the read it came from, so a stale one is never shown.
  const [result, setResult] = useState<{ key: string; line: { text: string; spoken: string } | null } | null>(null);
  const line = result && result.key === key ? result.line : null;

  useEffect(() => {
    if (!url || !rowId || !key) return;
    let live = true;
    loadDocument(url).then((doc) => {
      if (!live) return;
      const found = doc ? findBlockById(doc, rowId) : undefined;
      setResult({ key, line: found?.shared ? statusLine(translationStatus(found.block, LOCALES)) : null });
    });
    return () => {
      live = false;
    };
  }, [url, rowId, key]);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", pointerEvents: "none" }}>
      <span style={{ opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>{String((rowNumber ?? 0) + 1).padStart(2, "0")}</span>
      <strong style={{ fontWeight: 600 }}>{label ?? data?.blockType ?? "Section"}</strong>
      {line && (
        <span aria-label={line.spoken} style={{ fontSize: "0.8em", opacity: 0.75 }}>
          {line.text}
        </span>
      )}
    </span>
  );
}
