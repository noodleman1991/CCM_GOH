"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

/**
 * Pick several from a list, as chips that press on and off — onboarding's
 * About you step and Edit profile (languages, looking for, focus areas). With
 * `other`, a member can add one of their own; choices that aren't on the list
 * show as pressed chips so they can be taken off again.
 */
export function ChoiceChips({
  label,
  options,
  value,
  onChange,
  max,
  other,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  other?: { placeholder: string; addLabel: string; maxLength: number };
}) {
  const [draft, setDraft] = useState("");
  const chosen = new Set(value);
  const full = max !== undefined && value.length >= max;
  const extra = value.filter((v) => !options.some((o) => o.value === v));

  const toggle = (v: string) => onChange(chosen.has(v) ? value.filter((x) => x !== v) : [...value, v]);
  const add = () => {
    const next = draft.trim();
    if (!next || full) return;
    const taken = [...value, ...options.flatMap((o) => [o.value, o.label])].some((v) => v.toLowerCase() === next.toLowerCase());
    if (!taken) onChange([...value, next]);
    setDraft("");
  };

  const chip = (v: string, text: string) => {
    const on = chosen.has(v);
    return (
      <button
        key={v}
        type="button"
        aria-pressed={on}
        disabled={!on && full}
        onClick={() => toggle(v)}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-40",
          on ? "border-ccm-sea bg-ccm-sea text-white" : "border-ccm-midnight/15 bg-white text-ccm-midnight hover:bg-ccm-sky/15",
        )}
      >
        {on && <Check className="size-3.5" aria-hidden />}
        <bdi>{text}</bdi>
        {on && !options.some((o) => o.value === v) && <X className="size-3.5" aria-hidden />}
      </button>
    );
  };

  return (
    <div role="group" aria-label={label} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => chip(o.value, o.label))}
        {extra.map((v) => chip(v, v))}
      </div>
      {other && (
        <div className="flex max-w-sm gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            maxLength={other.maxLength}
            placeholder={other.placeholder}
            disabled={full}
            className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          />
          <button
            type="button"
            onClick={add}
            disabled={full || !draft.trim()}
            className="inline-flex h-11 items-center gap-1 rounded-md border border-ccm-midnight/15 px-3 text-sm font-semibold text-ccm-midnight hover:bg-ccm-sky/15 disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden />
            {other.addLabel}
          </button>
        </div>
      )}
    </div>
  );
}
