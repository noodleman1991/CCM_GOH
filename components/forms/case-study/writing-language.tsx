"use client";

import { useTranslations } from "next-intl";
import type { WritingLanguage } from "@/lib/validation/case-study";
import { cn } from "@/lib/utils";

/** Each language by its own name, so a reader finds theirs whatever the page language. */
export const WRITING_LANGUAGE_NAMES: ReadonlyArray<{ code: WritingLanguage; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export const languageName = (code: WritingLanguage) =>
  WRITING_LANGUAGE_NAMES.find((l) => l.code === code)?.label ?? code;

/** "I'm writing in": sets the language (and direction) of the title, summary and story. */
export function WritingLanguage({ value, onChange }: { value: WritingLanguage; onChange: (lang: WritingLanguage) => void }) {
  const t = useTranslations("caseStudySubmission.sections");
  return (
    <section aria-labelledby="cs-writing-in" className="mt-8">
      <h2 id="cs-writing-in" className="font-heading text-xl font-bold text-ccm-midnight">
        {t("writingIn")}
      </h2>
      {/* Toggle buttons (aria-pressed), grouped: one is always pressed. */}
      <div role="group" aria-labelledby="cs-writing-in" className="mt-3 flex flex-wrap items-center gap-1.5">
        {WRITING_LANGUAGE_NAMES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={value === code}
            onClick={() => onChange(code)}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water",
              value === code ? "bg-ccm-midnight text-white" : "bg-muted text-muted-foreground hover:text-ccm-midnight",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
