"use client";

import { useTranslations } from "next-intl";
import { BylineChips } from "@/components/forms/case-study/byline-chips";
import { FieldError } from "@/components/forms/errors/field-error";
import { fieldId } from "@/components/forms/errors/field-id";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CharCounter } from "@/components/ui/char-counter";
import { LIMITS } from "@/lib/validation/limits";
import type { SectionProps } from "@/components/forms/case-study/values";

/** "Who wrote this?": the authors, each with its own messages, then the organisation. */
export function PeopleSection({ values, set, errors, leave, describedBy }: SectionProps) {
  const t = useTranslations("caseStudySubmission");
  const authors = values.authors;

  return (
    <section aria-labelledby="cs-people" className="mt-12 border-t pt-8">
      <h2 id="cs-people" className="font-heading text-xl font-bold text-ccm-midnight">
        {t("sections.people")}
      </h2>
      <div className="mt-4">
        <BylineChips
          authors={authors}
          onAdd={() => set("authors", [...authors, { name: "", email: "", role: "coauthor" }])}
          onUpdate={(index, field, value) => set(`authors.${index}.${field}`, value)}
          onRemove={(index) => set("authors", authors.filter((_, i) => i !== index))}
          errors={errors}
          onLeave={leave}
          describedBy={describedBy}
        />
      </div>

      <div className="mt-6">
        <Label htmlFor={fieldId("organizationName")}>{t("fields.organisation")}</Label>
        <Input
          id={fieldId("organizationName")}
          value={values.organizationName}
          onChange={(e) => set("organizationName", e.target.value)}
          onBlur={() => leave("organizationName")}
          {...describedBy("organizationName")}
          placeholder={t("byline.organizationPlaceholder")}
          className="mt-2 min-h-11"
          maxLength={LIMITS.caseStudy.organizationName}
        />
        <CharCounter value={values.organizationName} max={LIMITS.caseStudy.organizationName} />
        <FieldError path="organizationName" message={errors.organizationName} />
      </div>
    </section>
  );
}
