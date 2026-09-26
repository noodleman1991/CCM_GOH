"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { localeHeaders } from "@/lib/forms/read-form-error";

export type DraftState = "idle" | "saving" | "saved" | "error";
export type LocalDraft<T> = { savedAt: number; values: T };

const RETRY_MS = 10_000;

/** Where the on-device copy lives: per draft, per edited case study, or "new". */
export const localDraftKey = (draftId: string | null, editId?: string) =>
  `case-study-draft:${editId ? `edit-${editId}` : (draftId ?? "new")}`;

export function readLocalDraft<T>(key: string): LocalDraft<T> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LocalDraft<T>) : null;
  } catch {
    return null; // storage blocked, or a copy we can't read
  }
}

export function clearLocalDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage blocked */
  }
}

function writeLocalDraft<T>(key: string, values: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), values }));
  } catch {
    /* storage full or blocked — the server copy still saves */
  }
}

/**
 * Server autosave plus an on-device copy, so nothing typed is ever lost.
 *
 * - The values present when `hydrated` turns on are the starting point and
 *   are not saved back.
 * - Every later change is mirrored locally at once and sent to the server
 *   1.5 s after typing stops.
 * - One request at a time: a change (or Save draft) during a request marks the
 *   draft pending, and the LATEST values are sent as soon as the request ends.
 *   So a slow first save can't create two drafts, and an older save can never
 *   land after a newer one.
 * - The local copy is dropped only when what the server just saved is still
 *   the newest state; a failed save retries by itself.
 */
export function useCaseStudyDraft<T>({
  values,
  hydrated,
  worthSaving,
  locale,
  draftId,
  setDraftId,
  editId,
}: {
  values: T;
  hydrated: boolean;
  worthSaving: boolean;
  locale: string;
  draftId: string | null;
  setDraftId: (id: string) => void;
  editId?: string;
}) {
  const [state, setState] = useState<DraftState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [retry, setRetry] = useState(0);
  const baseline = useRef<T | null>(null);
  const latest = useRef<T>(values);
  const lastSent = useRef<T | null>(null);
  const lastMirrored = useRef<T | null>(null);
  const idRef = useRef<string | null>(draftId);
  const inFlight = useRef(false);
  const pending = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const key = localDraftKey(draftId, editId);

  // Declared first, so the autosave effect below always sees this render's values.
  useEffect(() => {
    latest.current = values;
  });
  useEffect(() => {
    idRef.current = draftId;
  }, [draftId]);
  useEffect(
    () => () => {
      clearTimeout(retryTimer.current);
      clearTimeout(debounce.current);
    },
    [],
  );

  /** One POST of `snapshot`; true when the server kept it. */
  const postOnce = useCallback(
    async (snapshot: T) => {
      setState("saving");
      try {
        const id = idRef.current;
        const res = await fetch("/api/case-studies/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...localeHeaders(locale) },
          body: JSON.stringify(editId ? { editId, draftData: snapshot } : { draftId: id, draftData: snapshot }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { id: saved } = (await res.json()) as { id?: string };
        const newest = latest.current;
        if (saved && !id && !editId) {
          idRef.current = saved;
          setDraftId(saved);
          // The "new" copy moves to its draft's key; edits typed during the request go with it.
          if (newest !== snapshot) writeLocalDraft(localDraftKey(saved), newest);
          clearLocalDraft(localDraftKey(null));
        }
        lastSent.current = snapshot;
        if (newest === snapshot) clearLocalDraft(localDraftKey(idRef.current, editId));
        setSavedAt(new Date());
        setState("saved");
        return true;
      } catch {
        setState("error");
        clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => setRetry((n) => n + 1), RETRY_MS);
        return false;
      }
    },
    [locale, editId, setDraftId],
  );

  /** Sends the latest values now, or right after the request already under way. */
  const flush = useCallback(async () => {
    clearTimeout(debounce.current);
    if (baseline.current === null) return; // the saved draft isn't loaded yet: nothing of ours to save
    if (inFlight.current) {
      pending.current = true;
      return;
    }
    inFlight.current = true;
    try {
      do {
        pending.current = false;
        const snapshot = latest.current;
        if (snapshot === lastSent.current) continue;
        if (!(await postOnce(snapshot))) break;
      } while (pending.current);
    } finally {
      pending.current = false;
      inFlight.current = false;
    }
  }, [postOnce]);

  useEffect(() => {
    if (!hydrated) return;
    if (baseline.current === null) {
      baseline.current = values;
      lastSent.current = values;
      return;
    }
    if (!worthSaving || values === lastSent.current) return;
    if (lastMirrored.current !== values) {
      writeLocalDraft(key, values);
      lastMirrored.current = values;
    }
    if (inFlight.current) {
      pending.current = true; // sent with the newest values when the current request ends
      return;
    }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void flush(), 1500);
    return () => clearTimeout(debounce.current);
  }, [hydrated, worthSaving, values, key, flush, retry]);

  const saveNow = useCallback(() => flush(), [flush]);

  return { state, savedAt, saveNow };
}
