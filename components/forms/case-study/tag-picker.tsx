"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const TAG_GROUPS = ["topic", "audience", "impact", "method", "other"] as const;
type TagOption = { _id: string; label?: Record<string, string | null | undefined> | null; category?: string | null };

export function TagPicker({
  tags,
  selected,
  onChange,
  inputId,
  describedBy,
  onBlur,
}: {
  tags: TagOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  inputId: string;
  describedBy?: { "aria-invalid"?: true; "aria-describedby"?: string };
  onBlur?: () => void;
}) {
  const t = useTranslations("caseStudySubmission.tags");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const label = (tag: TagOption) => tag.label?.[locale] || tag.label?.en || "";
  const byId = useMemo(() => new Map(tags.map((tag) => [tag._id, tag])), [tags]);
  const firstTheme = selected.find((id) => byId.get(id)?.category === "topic");
  const q = query.trim().toLocaleLowerCase(locale);

  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const groups = TAG_GROUPS.map((group) => ({
    group,
    items: tags
      .filter((tag) => (tag.category ?? "other") === group || (group === "other" && !TAG_GROUPS.includes((tag.category ?? "") as never) && tag.category !== "location"))
      .filter((tag) => !q || label(tag).toLocaleLowerCase(locale).includes(q))
      .sort((a, b) => label(a).localeCompare(label(b), locale)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4" onBlur={onBlur}>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const tag = byId.get(id);
            if (!tag) return null;
            return (
              <li key={id} className="flex min-h-9 items-center gap-1.5 rounded-full bg-ccm-midnight px-3 text-sm text-white">
                {id === firstTheme && <Star className="size-3.5 fill-current" aria-label={t("main")} />}
                <span>{label(tag)}</span>
                <button type="button" className="-me-1 grid size-7 place-items-center rounded-full hover:bg-white/15" onClick={() => toggle(id)} aria-label={t("remove", { tag: label(tag) })}>
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {firstTheme && (
        <p className="text-xs text-muted-foreground">
          ★ <span>{t("main")}</span>: {label(byId.get(firstTheme)!)}
        </p>
      )}

      <Input id={inputId} type="search" role="searchbox" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} {...describedBy} />

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noMatch")}</p>
      ) : (
        groups.map(({ group, items }) => (
          <fieldset key={group}>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(`groups.${group}`)}</legend>
            <div className="flex flex-wrap gap-2">
              {items.map((tag) => {
                const on = selected.includes(tag._id);
                return (
                  <button
                    key={tag._id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(tag._id)}
                    className={cn(
                      "min-h-11 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water",
                      on ? "border-ccm-midnight bg-ccm-midnight text-white" : "border-border bg-background hover:border-ccm-water",
                    )}
                  >
                    {label(tag)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))
      )}
    </div>
  );
}
