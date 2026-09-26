"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle, Loader2, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LayoutChooser } from "@/components/forms/case-study/layout-chooser";
import { HeroImageDrop } from "@/components/forms/case-study/hero-image-drop";
import { TagPicker } from "@/components/forms/case-study/tag-picker";
import { TagSuggestions } from "@/components/forms/tag-suggestions";
import { WritingLanguage } from "@/components/forms/case-study/writing-language";
import { StorySection } from "@/components/forms/case-study/story-section";
import { PeopleSection } from "@/components/forms/case-study/people-section";
import { WhereSection, type CommunityOption } from "@/components/forms/case-study/where-section";
import { ReviewStep } from "@/components/forms/case-study/review-step";
import { DraftStatusLine, SubmitActions } from "@/components/forms/case-study/submit-bar";
import { clearLocalDraft, localDraftKey, readLocalDraft, useCaseStudyDraft, type LocalDraft } from "@/components/forms/case-study/use-case-study-draft";
import { emptyValues, fromStored, hasAnything, setAt, type CaseStudyValues } from "@/components/forms/case-study/values";
import { useFormErrors } from "@/components/forms/errors/use-form-errors";
import { FieldError } from "@/components/forms/errors/field-error";
import { fieldId } from "@/components/forms/errors/field-id";
import { WhatsLeft, type WhatsLeftItem } from "@/components/forms/errors/whats-left";
import { toFieldIssues } from "@/lib/validation/messages";
import { CASE_STUDY_MINIMUMS, caseStudyFieldOrder, hasStoryText, makeCaseStudySubmissionSchema } from "@/lib/validation/case-study";
import { localeHeaders, readFormError } from "@/lib/forms/read-form-error";

type TagOption = { _id: string; label: Record<string, string>; value: { current: string }; category?: string | null };

interface ImprovedCaseStudyFormProps {
  userId: string;
  locale: string;
  availableTags: TagOption[];
  regionalCommunities: CommunityOption[];
  onSuccess?: (id: string) => void;
  workspaceId?: string | null;
  /** Edit mode: a submitted case study (mapped to form shape server-side), resubmitted instead of created. */
  editDoc?: (Record<string, unknown> & { _sanityId: string }) | null;
  /** Resume this draft (dashboard Continue) instead of the latest one. Ignored in edit mode. */
  draftId?: string | null;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_MB = 5;
const len = (s: string | undefined) => s?.trim().length ?? 0;

export default function ImprovedCaseStudyForm({
  locale = "en",
  availableTags,
  regionalCommunities,
  onSuccess,
  workspaceId,
  editDoc,
  draftId: requestedDraftId,
}: ImprovedCaseStudyFormProps) {
  const { user } = useUser();
  const t = useTranslations("caseStudySubmission");
  const tErrors = useTranslations("forms.errors");
  const tDraft = useTranslations("caseStudySubmission.draft");
  const starting = () => emptyValues(user ? { name: user.fullName || "", email: user.emailAddresses[0]?.emailAddress || "" } : undefined);

  const [values, setValues] = useState<CaseStudyValues>(starting);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [restoreOffer, setRestoreOffer] = useState<LocalDraft<CaseStudyValues> | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cover, setCover] = useState<{ uploading: boolean; error: string | null }>({ uploading: false, error: null });
  // What to focus after the next render: the first field with a problem, or the form-level message.
  const focusPending = useRef<"problem" | "message" | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const lang = values.originalLanguage;
  const set = useCallback((path: string, value: unknown) => setValues((v) => setAt(v, path, value)), []);
  const apply = (next: CaseStudyValues) => { setValues(next); setEditorKey((k) => k + 1); };

  // --- Rules and errors ------------------------------------------------------
  const themeIds = useMemo(() => new Set(availableTags.filter((tag) => tag.category === "topic").map((tag) => tag._id)), [availableTags]);
  // No theme tags at all (or none loaded): the rule can't be met, so it isn't enforced — the server does the same.
  const schema = useMemo(() => makeCaseStudySubmissionSchema({ themeTagIds: themeIds.size > 0 ? themeIds : null }), [themeIds]);
  const validate = useCallback((v: CaseStudyValues) => {
    const result = schema.safeParse(v);
    return result.success ? [] : toFieldIssues(result.error);
  }, [schema]);
  // "location" is not a real field: it's the place, or failing that the community.
  const checked = useMemo(() => ({ ...values, location: values.place ?? (values.relatedCommunity || null) }), [values]);
  const { errors, leave, validateAll, setServerErrors, focusFirstError, describedBy } = useFormErrors({
    values: checked, validate, t: tErrors, order: caseStudyFieldOrder(lang, values.authors.length),
  });
  // Focus once the messages (and any author editor they open) are on the page.
  const focusFirstProblem = () => { focusPending.current = "problem"; };
  useEffect(() => {
    const target = focusPending.current;
    if (!target) return;
    focusPending.current = null;
    if (target === "problem") return focusFirstError();
    messageRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    messageRef.current?.focus({ preventScroll: true });
  });

  const items: WhatsLeftItem[] = [
    { id: "title", label: t("whatsLeft.title"), done: len(values.title[lang]) >= CASE_STUDY_MINIMUMS.title, target: `title.${lang}`, severity: "required" },
    { id: "summary", label: t("whatsLeft.summary", { min: CASE_STUDY_MINIMUMS.summary }), done: len(values.excerpt[lang]) >= CASE_STUDY_MINIMUMS.summary, target: `excerpt.${lang}`, severity: "required" },
    { id: "story", label: t("whatsLeft.story"), done: hasStoryText(values.content), target: "content", severity: "required" },
    ...(lang === "en" ? [] : [
      { id: "englishTitle", label: t("whatsLeft.englishTitle"), done: len(values.title.en) >= CASE_STUDY_MINIMUMS.title, target: "title.en", severity: "required" as const },
      { id: "englishSummary", label: t("whatsLeft.englishSummary"), done: len(values.excerpt.en) >= CASE_STUDY_MINIMUMS.englishSummary, target: "excerpt.en", severity: "required" as const },
    ]),
    { id: "authors", label: t("whatsLeft.authors"), done: values.authors.length > 0 && values.authors.every((a) => a.name.trim()), target: "authors", severity: "required" },
    { id: "theme", label: t("whatsLeft.theme"), done: values.tags.some((id) => themeIds.has(id)), target: "tags", severity: "required" },
    { id: "where", label: t("whatsLeft.where"), done: Boolean(values.place || values.relatedCommunity), target: "location", severity: "required" },
    { id: "pin", label: t("whatsLeft.pin"), done: !(!values.place && values.relatedCommunity), target: "location", severity: "nudge" },
  ];

  // --- Drafts ----------------------------------------------------------------
  const editId = editDoc?._sanityId;
  const draft = useCaseStudyDraft({
    values, hydrated, worthSaving: Boolean(draftId || editId || hasAnything(values)), locale, draftId, setDraftId, editId,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored: Record<string, unknown> | null = null;
      let id: string | null = null;
      try {
        if (editDoc) {
          stored = editDoc;
        } else {
          const res = await fetch(requestedDraftId ? `/api/case-studies/drafts?id=${encodeURIComponent(requestedDraftId)}` : "/api/case-studies/drafts");
          stored = res.ok ? ((await res.json()).draft ?? null) : null;
          id = typeof stored?._id === "string" ? stored._id : null;
        }
      } catch { /* offline or signed out: start from what's on this device */ }
      if (cancelled) return;
      if (stored) apply(fromStored(stored, starting()));
      if (id) setDraftId(id);
      const local = readLocalDraft<CaseStudyValues>(localDraftKey(id, editDoc?._sanityId));
      const serverTime = typeof stored?.lastSaved === "string" ? Date.parse(stored.lastSaved) : 0;
      if (local && local.savedAt > serverTime) setRestoreOffer(local);
      else if (stored && !editDoc) toast.info(t("toasts.draftRestored"));
      setHydrated(true);
    })();
    return () => { cancelled = true; };
    // Runs once: the starting point is loaded a single time per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answerRestore = (restore: boolean) => {
    if (restore && restoreOffer) apply(fromStored(restoreOffer.values as unknown as Record<string, unknown>, starting()));
    else clearLocalDraft(localDraftKey(draftId, editId));
    setRestoreOffer(null);
  };

  // --- Cover image: uploaded as soon as it's chosen ---------------------------
  const chooseCover = async (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) return setCover({ uploading: false, error: tErrors("upload.wrongType") });
    const mb = file.size / 1024 / 1024;
    if (mb > IMAGE_MAX_MB) return setCover({ uploading: false, error: tErrors("upload.tooBig", { size: mb.toFixed(1), max: IMAGE_MAX_MB }) });
    setCover({ uploading: true, error: null });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads/image", { method: "POST", headers: localeHeaders(locale), body });
      if (!res.ok) return setCover({ uploading: false, error: (await readFormError(res, tErrors("form.generic"))).message });
      const { assetRef, url } = (await res.json()) as { assetRef?: string; url?: string };
      setValues((v) => ({ ...v, imageAssetId: assetRef, imageUrl: url }));
      setCover({ uploading: false, error: null });
    } catch {
      setCover({ uploading: false, error: tErrors("form.generic") });
    }
  };

  // --- Preview and submit ------------------------------------------------------
  const ready = () => {
    if (validateAll()) return true;
    setStep("form");
    focusFirstProblem();
    return false;
  };

  const submit = async () => {
    if (isSubmitting || !ready()) return;
    setIsSubmitting(true);
    setFormMessage(null);
    try {
      const body = new FormData();
      // A missing place is left out rather than sent as null: the submit route's older rules refuse null.
      const { place, ...rest } = values;
      body.append("data", JSON.stringify({ ...rest, ...(place ? { place } : {}), ...(workspaceId ? { collaborationId: workspaceId } : {}), ...(editId ? { editId } : {}) }));
      const res = await fetch("/api/case-studies/submit", { method: "POST", headers: localeHeaders(locale), body });
      if (!res.ok) {
        const { message, fields } = await readFormError(res, tErrors("form.generic"));
        setServerErrors(fields);
        setFormMessage(message);
        setStep("form");
        focusPending.current = Object.keys(fields).length > 0 ? "problem" : "message";
        return;
      }
      const result = (await res.json()) as { id: string };
      if (draftId) {
        fetch("/api/case-studies/drafts", {
          method: "DELETE", headers: { "Content-Type": "application/json", ...localeHeaders(locale) }, body: JSON.stringify({ draftId }),
        }).catch(() => { /* best effort */ });
      }
      clearLocalDraft(localDraftKey(draftId, editId));
      setDraftId(null);
      setStep("success");
      onSuccess?.(result.id);
    } catch {
      setFormMessage(tErrors("form.generic"));
      focusPending.current = "message";
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-12 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="size-8 text-green-600" aria-hidden />
        </div>
        <h2 className="text-2xl font-bold">{t("successScreen.heading")}</h2>
        <div className="space-y-2 text-muted-foreground">
          <p>{t("successScreen.submittedLine")}</p>
          <p>{t("successScreen.reviewLine")}</p>
        </div>
        <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
          <Button variant="outline" className="min-h-11" onClick={() => { apply(starting()); setCover({ uploading: false, error: null }); setStep("form"); }}>
            <Plus className="me-2 size-4" aria-hidden />
            {t("successScreen.submitAnother")}
          </Button>
          <Button asChild className="min-h-11">
            <Link href="/dashboard/submissions">{t("successScreen.viewSubmissions")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <ReviewStep
        values={values}
        locale={locale}
        tags={availableTags}
        communities={regionalCommunities}
        isSubmitting={isSubmitting}
        onBack={() => setStep("form")}
        onSubmit={() => void submit()}
      />
    );
  }

  const sectionProps = { values, set, errors, leave, describedBy };

  return (
    <div className="mx-auto flex max-w-6xl gap-10 pb-28 lg:pb-10">
      <main className="min-w-0 flex-1">
        <header>
          <h1 className="font-heading text-2xl font-bold text-ccm-midnight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </header>

        {restoreOffer && (
          <div role="status" className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-ccm-amber/40 bg-ccm-amber/10 p-4 text-sm">
            <p className="min-w-0 flex-1">
              {tDraft("restorePrompt", { time: new Date(restoreOffer.savedAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) })}
            </p>
            <Button type="button" className="min-h-11" onClick={() => answerRestore(true)}>{tDraft("restore")}</Button>
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => answerRestore(false)}>{tDraft("discard")}</Button>
          </div>
        )}

        {!hydrated && (
          <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {tDraft("loading")}
          </p>
        )}

        {/* Nothing can be typed until the saved draft is in, so it can't overwrite early typing. */}
        <fieldset disabled={!hydrated} aria-busy={!hydrated} className="m-0 min-w-0 border-0 p-0">
        <WritingLanguage value={lang} onChange={(next) => set("originalLanguage", next)} />

        <div className="mt-8">
          <HeroImageDrop previewUrl={values.imageUrl ?? null} onFile={(file) => void chooseCover(file)} onRemove={() => setValues((v) => ({ ...v, imageAssetId: null, imageUrl: null }))} />
          {cover.uploading && <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">{t("hero.uploading")}</p>}
          <FieldError path="image" message={cover.error ?? undefined} />
        </div>

        {formMessage && (
          <div ref={messageRef} tabIndex={-1} role="alert" className="mt-8 outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {formMessage}
          </div>
        )}

        <StorySection {...sectionProps} lang={lang} editorKey={editorKey} readOnly={!hydrated} />
        <PeopleSection {...sectionProps} />
        <WhereSection {...sectionProps} communities={regionalCommunities} />

        <section aria-labelledby="cs-tags" className="mt-12 border-t pt-8">
          <h2 id="cs-tags" className="font-heading text-xl font-bold text-ccm-midnight">
            <label htmlFor={fieldId("tags")}>{t("sections.tags")}</label>
          </h2>
          <div className="mt-4">
            <TagPicker tags={availableTags} selected={values.tags} onChange={(ids) => set("tags", ids)} inputId={fieldId("tags")} describedBy={describedBy("tags")} onBlur={() => leave("tags")} />
          </div>
          <FieldError path="tags" message={errors.tags} />
          <TagSuggestions
            availableTags={availableTags.map((tag) => ({ id: tag._id, label: tag.label, value: tag.value }))}
            selectedTagIds={values.tags}
            onPickExisting={(id) => { if (!values.tags.includes(id)) set("tags", [...values.tags, id]); }}
            value={values.suggestedTags}
            onChange={(next) => set("suggestedTags", next)}
          />
        </section>

        <section aria-labelledby="cs-presentation" className="mt-12 border-t pt-8">
          <h2 id="cs-presentation" className="font-heading text-xl font-bold text-ccm-midnight">{t("sections.presentation")}</h2>
          <div className="mt-2">
            <LayoutChooser value={values.layout} onChange={(layout) => set("layout", layout)} labelledBy="cs-presentation" />
          </div>
        </section>
        </fieldset>
      </main>

      <WhatsLeft
        items={items}
        status={<DraftStatusLine state={draft.state} savedAt={draft.savedAt} locale={locale} />}
        actions={
          <SubmitActions
            isSubmitting={isSubmitting}
            disabled={!hydrated}
            onSaveDraft={() => void draft.saveNow()}
            onPreview={() => { if (ready()) setStep("review"); }}
            onSubmit={() => void submit()}
          />
        }
      />
    </div>
  );
}
