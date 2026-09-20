"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterChip, RemovableChip } from "@/components/ui/filter-chip";
import { CharCounter } from "@/components/ui/char-counter";
import { getLocalizedText } from "@/lib/localization-utils";
import { LIMITS } from "@/lib/validation/limits";
import { matchTags, SAME_TAG_THRESHOLD, type FuzzyTag } from "@/lib/tags/fuzzy";

/**
 * "Suggest a tag" under the tag picker of the three submission forms
 * (2026-09-20). As the member types, the text is fuzzy-matched against every
 * existing tag's labels and slug: a close match is offered as "did you mean"
 * and picking it selects the existing tag; a near-identical one cannot be
 * added at all. Only genuinely new terms are kept, up to LIMITS.tags.
 * The server repeats the check before storing (lib/tags/fuzzy.ts).
 */
export function TagSuggestions<T extends FuzzyTag>({
  availableTags,
  selectedTagIds,
  onPickExisting,
  value,
  onChange,
  idPrefix = "tag-suggestion",
}: {
  availableTags: readonly T[];
  selectedTagIds: readonly string[];
  onPickExisting: (tagId: string) => void;
  value: readonly string[];
  onChange: (next: string[]) => void;
  idPrefix?: string;
}) {
  const t = useTranslations("forms.tagSuggestions");
  const locale = useLocale();
  const [text, setText] = useState("");

  const matches = useMemo(() => matchTags(text, availableTags, { threshold: 0.6, limit: 3 }), [text, availableTags]);
  const sameAsExisting = matches[0]?.score !== undefined && matches[0].score >= SAME_TAG_THRESHOLD;
  const duplicate = value.some((v) => v.trim().toLowerCase() === text.trim().toLowerCase());
  const full = value.length >= LIMITS.tags.suggestions;
  const canAdd = text.trim().length > 0 && !sameAsExisting && !duplicate && !full;

  const add = () => {
    if (!canAdd) return;
    onChange([...value, text.trim().replace(/\s+/g, " ")]);
    setText("");
  };
  const pick = (tagId: string) => {
    onPickExisting(tagId);
    setText("");
  };
  const labelOf = (tag: T) => getLocalizedText(tag.label as Record<string, string> | string | null | undefined, locale, "");

  return (
    <div className="mt-4 space-y-2">
      <Label htmlFor={`${idPrefix}-input`}>{t("label")}</Label>
      <p className="text-sm text-muted-foreground">{t("hint", { max: LIMITS.tags.suggestions })}</p>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Input
            id={`${idPrefix}-input`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={t("placeholder")}
            maxLength={LIMITS.tags.suggestion}
            disabled={full}
            aria-describedby={`${idPrefix}-status`}
          />
          <CharCounter value={text} max={LIMITS.tags.suggestion} />
        </div>
        <Button type="button" variant="outline" onClick={add} disabled={!canAdd} className="shrink-0">
          <Plus className="size-4" aria-hidden="true" />
          {t("add")}
        </Button>
      </div>

      <p id={`${idPrefix}-status`} aria-live="polite" className="text-xs text-muted-foreground">
        {full ? t("limitReached", { max: LIMITS.tags.suggestions }) : sameAsExisting ? t("alreadyExists") : ""}
      </p>

      {matches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" data-slot="tag-suggestion-matches">
          <span className="text-sm text-muted-foreground">{t("didYouMean")}</span>
          {matches.map(({ tag }) => (
            <FilterChip
              key={tag.id}
              label={labelOf(tag)}
              active={selectedTagIds.includes(tag.id)}
              onClick={() => pick(tag.id)}
            />
          ))}
        </div>
      )}

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t("yourSuggestions")}>
          {value.map((s) => (
            <li key={s}>
              <RemovableChip label={s} onRemove={() => onChange(value.filter((v) => v !== s))} removeLabel={t("remove", { tag: s })} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
