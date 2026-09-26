"use client";

import { useLocale, useTranslations } from "next-intl";
import { PlacePicker, type PlaceValue } from "@/components/forms/place-picker";
import { FieldError } from "@/components/forms/errors/field-error";
import { fieldId } from "@/components/forms/errors/field-id";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isoToRegion } from "@/lib/maps/iso-to-region";
import type { SectionProps } from "@/components/forms/case-study/values";

export type CommunityOption = {
  _id: string;
  name: Record<string, string | null | undefined>;
  slug: { current: string };
  region?: string | null;
};

// The shadcn Input look, on a native <select> (works with every keyboard, screen reader and phone picker).
const SELECT_CLASS =
  "border-input mt-2 flex min-h-11 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-ring/50 ring-ring/10 transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-4 aria-invalid:border-destructive/60 md:text-sm";

/** The one community in the place's region, when there is exactly one. */
export function communityForPlace(place: PlaceValue | null, communities: CommunityOption[]): string | null {
  const region = place?.countryCode3 ? isoToRegion(place.countryCode3) : null;
  if (!region) return null;
  const matches = communities.filter((c) => c.region === region);
  return matches.length === 1 ? matches[0]._id : null;
}

/** "Where & when": one place search, the regional community (suggested from the place), and dates. */
export function WhereSection({ values, set, errors, leave, describedBy, communities }: SectionProps & { communities: CommunityOption[] }) {
  const t = useTranslations("caseStudySubmission");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const onPlace = (place: PlaceValue | null) => {
    set("place", place);
    const suggested = communityForPlace(place, communities);
    if (suggested && !values.relatedCommunity) set("relatedCommunity", suggested);
  };

  return (
    <section aria-labelledby="cs-where" className="mt-12 border-t pt-8">
      <h2 id="cs-where" className="font-heading text-xl font-bold text-ccm-midnight">
        {t("sections.where")}
      </h2>

      <div className="mt-4">
        <PlacePicker
          value={values.place}
          onChange={onPlace}
          inputId={fieldId("location")}
          describedBy={describedBy("location")}
          onBlur={() => leave("location")}
        />
      </div>

      <div className="mt-6 max-w-md">
        <Label htmlFor="field-community">{t("fields.community")}</Label>
        <select
          id="field-community"
          className={SELECT_CLASS}
          value={values.relatedCommunity}
          onChange={(e) => set("relatedCommunity", e.target.value)}
          onBlur={() => leave("location")}
          {...describedBy("location")}
        >
          <option value="">{t("fields.communityNone")}</option>
          {communities.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name?.[locale] || c.name?.en || tCommon("untitled")}
            </option>
          ))}
        </select>
      </div>
      <FieldError path="location" message={errors.location} />

      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-ccm-midnight">{t("fields.dates")}</legend>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={fieldId("studyPeriod.startDate")}>{t("fields.start")}</Label>
            <Input
              id={fieldId("studyPeriod.startDate")}
              type="date"
              className="mt-2 min-h-11"
              value={values.studyPeriod.startDate}
              onChange={(e) => set("studyPeriod.startDate", e.target.value)}
              onBlur={() => leave("studyPeriod.endDate")}
            />
          </div>
          <div>
            <Label htmlFor={fieldId("studyPeriod.endDate")}>{t("fields.end")}</Label>
            <Input
              id={fieldId("studyPeriod.endDate")}
              type="date"
              className="mt-2 min-h-11"
              value={values.studyPeriod.endDate}
              onChange={(e) => set("studyPeriod.endDate", e.target.value)}
              onBlur={() => leave("studyPeriod.endDate")}
              {...describedBy("studyPeriod.endDate")}
            />
            <FieldError path="studyPeriod.endDate" message={errors["studyPeriod.endDate"]} />
          </div>
        </div>
      </fieldset>
    </section>
  );
}
