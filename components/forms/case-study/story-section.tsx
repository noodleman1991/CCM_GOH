"use client";

import { useTranslations } from "next-intl";
import PortableTextEditor from "@/components/forms/portable-text-editor";
import { FieldError } from "@/components/forms/errors/field-error";
import { fieldId } from "@/components/forms/errors/field-id";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CharCounter } from "@/components/ui/char-counter";
import { LIMITS } from "@/lib/validation/limits";
import { CASE_STUDY_MINIMUMS, WRITING_LANGUAGES, type WritingLanguage } from "@/lib/validation/case-study";
import { languageName } from "@/components/forms/case-study/writing-language";
import type { SectionProps } from "@/components/forms/case-study/values";

const dirOf = (lang: WritingLanguage) => (lang === "ar" ? "rtl" : "ltr");

/** Joins a hint's id with whatever the error system adds, so both are read out. */
function withHint(attrs: ReturnType<SectionProps["describedBy"]>, hintId: string) {
  return { ...attrs, "aria-describedby": [hintId, attrs["aria-describedby"]].filter(Boolean).join(" ") };
}

/** "Your story": title, summary and body in the writing language, plus English and optional translations. */
export function StorySection({
  lang,
  values,
  set,
  errors,
  leave,
  describedBy,
  editorKey,
  readOnly = false,
}: SectionProps & { lang: WritingLanguage; editorKey: number; readOnly?: boolean }) {
  const t = useTranslations("caseStudySubmission");
  const titlePath = `title.${lang}`;
  const excerptPath = `excerpt.${lang}`;
  const summaryHintId = `${fieldId(excerptPath)}-hint`;
  const others = WRITING_LANGUAGES.filter((l) => l !== lang && l !== "en");

  const field = (path: string) => ({
    id: fieldId(path),
    onBlur: () => leave(path),
    ...describedBy(path),
  });

  return (
    <section aria-labelledby="cs-story" className="mt-12">
      <h2 id="cs-story" className="font-heading text-xl font-bold text-ccm-midnight">
        {t("sections.story")}
      </h2>

      <label htmlFor={fieldId(titlePath)} className="mt-6 block text-sm font-medium text-ccm-midnight">
        {t("fields.title")}
      </label>
      <input
        {...field(titlePath)}
        dir={dirOf(lang)}
        lang={lang}
        value={values.title[lang] ?? ""}
        onChange={(e) => set(titlePath, e.target.value)}
        placeholder={t("canvas.titlePlaceholder")}
        maxLength={LIMITS.caseStudy.title}
        className="mt-1 w-full border-0 border-b-2 border-transparent bg-transparent pb-1 font-heading text-3xl font-bold leading-tight text-ccm-midnight outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ccm-water/50 aria-invalid:border-destructive/60 sm:text-4xl md:text-5xl"
      />
      <CharCounter value={values.title[lang]} max={LIMITS.caseStudy.title} />
      <FieldError path={titlePath} message={errors[titlePath]} />

      <label htmlFor={fieldId(excerptPath)} className="mt-6 block text-sm font-medium text-ccm-midnight">
        {t("fields.summary")}
      </label>
      <p id={summaryHintId} className="text-xs text-muted-foreground">
        {t("fields.summaryHint", { min: CASE_STUDY_MINIMUMS.summary })}
      </p>
      <textarea
        {...field(excerptPath)}
        {...withHint(describedBy(excerptPath), summaryHintId)}
        dir={dirOf(lang)}
        lang={lang}
        rows={3}
        value={values.excerpt[lang] ?? ""}
        onChange={(e) => set(excerptPath, e.target.value)}
        placeholder={t("canvas.excerptPlaceholder")}
        maxLength={LIMITS.caseStudy.excerpt}
        className="mt-2 w-full resize-none rounded-md border-0 bg-transparent text-lg leading-relaxed outline-none placeholder:text-muted-foreground/40 aria-invalid:ring-1 aria-invalid:ring-destructive/60"
      />
      <CharCounter value={values.excerpt[lang]} max={LIMITS.caseStudy.excerpt} />
      <FieldError path={excerptPath} message={errors[excerptPath]} />

      {/* The section heading names the editor; blur counts only when focus leaves the editor and its toolbar. */}
      <div
        className="mt-8"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) leave("content");
        }}
      >
        <PortableTextEditor
          key={`${editorKey}-${lang}`}
          id={fieldId("content")}
          labelledBy="cs-story"
          describedBy={describedBy("content")}
          variant="canvas"
          readOnly={readOnly}
          value={values.content}
          onChangeAction={(value) => set("content", value)}
          language={lang}
          placeholder={t("canvas.bodyPlaceholder")}
          maxLength={20000}
        />
      </div>
      <FieldError path="content" message={errors.content} />

      {lang !== "en" && (
        <div className="mt-8 space-y-4 rounded-xl border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">{t("fields.englishHint")}</p>
          <div>
            <Label htmlFor={fieldId("title.en")}>{t("fields.englishTitle")}</Label>
            <Input
              {...field("title.en")}
              dir="ltr"
              lang="en"
              className="mt-2 min-h-11"
              value={values.title.en ?? ""}
              onChange={(e) => set("title.en", e.target.value)}
              maxLength={LIMITS.caseStudy.title}
            />
            <FieldError path="title.en" message={errors["title.en"]} />
          </div>
          <div>
            <Label htmlFor={fieldId("excerpt.en")}>{t("fields.englishSummary")}</Label>
            <Input
              {...field("excerpt.en")}
              dir="ltr"
              lang="en"
              className="mt-2 min-h-11"
              value={values.excerpt.en ?? ""}
              onChange={(e) => set("excerpt.en", e.target.value)}
              maxLength={LIMITS.caseStudy.excerpt}
            />
            <FieldError path="excerpt.en" message={errors["excerpt.en"]} />
          </div>
        </div>
      )}

      <details className="group mt-6 rounded-xl border px-4">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-ccm-midnight">
          {t("fields.translations")}
        </summary>
        <div className="space-y-4 pb-4">
          {others.map((other) => (
            <div key={other} className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={fieldId(`title.${other}`)}>{t("fields.translationTitle", { language: languageName(other) })}</Label>
                <Input
                  {...field(`title.${other}`)}
                  dir={dirOf(other)}
                  lang={other}
                  className="mt-2 min-h-11"
                  value={values.title[other] ?? ""}
                  onChange={(e) => set(`title.${other}`, e.target.value)}
                  maxLength={LIMITS.caseStudy.title}
                />
                <FieldError path={`title.${other}`} message={errors[`title.${other}`]} />
              </div>
              <div>
                <Label htmlFor={fieldId(`excerpt.${other}`)}>{t("fields.translationSummary", { language: languageName(other) })}</Label>
                <Input
                  {...field(`excerpt.${other}`)}
                  dir={dirOf(other)}
                  lang={other}
                  className="mt-2 min-h-11"
                  value={values.excerpt[other] ?? ""}
                  onChange={(e) => set(`excerpt.${other}`, e.target.value)}
                  maxLength={LIMITS.caseStudy.excerpt}
                />
                <FieldError path={`excerpt.${other}`} message={errors[`excerpt.${other}`]} />
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
