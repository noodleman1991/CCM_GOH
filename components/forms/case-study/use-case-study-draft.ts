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
 * The values present when `hydrated` turns on are the starting point and are
 * not saved back; every change after that is mirrored locally at once and
 * sent to the server 1.5 s after typing stops. A failed save retries by
 * itself; a successful one drops the local copy it covered.
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
  const lastSent = useRef<T | null>(null);
  const lastMirrored = useRef<T | null>(null);
  const idRef = useRef<string | null>(draftId);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const key = localDraftKey(draftId, editId);

  useEffect(() => {
    idRef.current = draftId;
  }, [draftId]);
  useEffect(() => () => clearTimeout(retryTimer.current), []);

  const post = useCallback(
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
        if (saved && !id && !editId) {
          idRef.current = saved;
          setDraftId(saved);
          clearLocalDraft(localDraftKey(null)); // the "new" copy now has a home
        }
        lastSent.current = snapshot;
        if (lastMirrored.current === snapshot) clearLocalDraft(localDraftKey(idRef.current, editId));
        setSavedAt(new Date());
        setState("saved");
      } catch {
        setState("error");
        clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => setRetry((n) => n + 1), RETRY_MS);
      }
    },
    [locale, editId, setDraftId],
  );

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
    const timer = setTimeout(() => void post(values), 1500);
    return () => clearTimeout(timer);
  }, [hydrated, worthSaving, values, key, post, retry]);

  const saveNow = useCallback(() => post(values), [post, values]);

  return { state, savedAt, saveNow };
}
