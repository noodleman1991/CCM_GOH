"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Globe2, Laptop, MapPin, Users } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharCounter } from "@/components/ui/char-counter";
import { PlacePicker, type PlaceValue } from "@/components/forms/place-picker";
import { ReviewContext } from "@/components/forms/review-context";
import { FieldError } from "@/components/forms/errors/field-error";
import { fieldId } from "@/components/forms/errors/field-id";
import { useFormErrors } from "@/components/forms/errors/use-form-errors";
import { readFormError, localeHeaders } from "@/lib/forms/read-form-error";
import { eventSubmissionSchema } from "@/lib/validation/event";
import { toFieldIssues, type Translator } from "@/lib/validation/messages";
import { LIMITS } from "@/lib/validation/limits";
import { localInputToIso, zoneLabel } from "@/lib/events/local-time";
import type { EditableEvent } from "@/lib/events/edit";
import { cn } from "@/lib/utils";

type Mode = "online" | "in_person" | "hybrid";
type Origin = "ccm" | "external";

interface Values {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  mode: Mode;
  place: PlaceValue | null;
  regionalCommunityId: string;
  origin: Origin;
  organiserName: string;
  url: string;
}

const ORDER = ["title", "description", "startAt", "endAt", "place", "organiserName", "url"];

/** ISO → the local "YYYY-MM-DDTHH:mm" a datetime-local input expects. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** What the server receives — the same shape the schema checks here first. */
function toPayload(v: Values, extra: { editId?: string; collaborationId?: string }) {
  return {
    title: v.title,
    description: v.description,
    scope: "community" as const,
    startAt: localInputToIso(v.startAt),
    endAt: localInputToIso(v.endAt),
    mode: v.mode,
    place: v.mode === "online" ? null : v.place,
    regionalCommunityId: v.regionalCommunityId,
    origin: v.origin,
    organiserName: v.origin === "external" ? v.organiserName : "",
    url: v.url,
    ...(extra.editId ? { editId: extra.editId } : {}),
    ...(extra.collaborationId ? { collaborationId: extra.collaborationId } : {}),
  };
}

/** A large tappable choice — the same pattern as the case-study form's layout picker. */
function Choice({ selected, onSelect, icon, label, hint, name }: { selected: boolean; onSelect: () => void; icon: React.ReactNode; label: string; hint: string; name: string }) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ccm-sea",
        selected ? "border-ccm-sea bg-ccm-sea/5" : "border-ccm-midnight/15 hover:border-ccm-sea/40",
      )}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="sr-only" />
      <span className={cn("mt-0.5 flex-none", selected ? "text-ccm-sea" : "text-ccm-midnight/60")} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ccm-midnight">{label}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-ccm-midnight/10 bg-white p-4 @content-sm/page:p-6">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden className="space-y-0.5">
        <p className="font-heading text-lg font-bold text-ccm-midnight">{title}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}

/**
 * Suggest an event (events spec §3.2): what, when, where, who runs it — in the
 * hub's human-friendly form pattern (quiet while typing, checked on leaving a
 * field, server problems shown on the field). The server re-checks everything
 * and decides whether suggestions are open for this member.
 */
export function SuggestForm({
  communities,
  editDoc = null,
  workspaceId = null,
}: {
  communities: Array<{ id: string; name: string }>;
  editDoc?: EditableEvent | null;
  workspaceId?: string | null;
}) {
  const t = useTranslations("events.suggest");
  const tErrors = useTranslations("forms.errors");
  const locale = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    title: editDoc?.title ?? "",
    description: editDoc?.description ?? "",
    startAt: toLocalInput(editDoc?.startAt ?? ""),
    endAt: toLocalInput(editDoc?.endAt ?? ""),
    mode: editDoc?.mode ?? "online",
    place: editDoc?.place ?? null,
    regionalCommunityId: editDoc?.regionalCommunityId ?? "",
    origin: editDoc?.origin ?? "ccm",
    organiserName: editDoc?.organiserName ?? "",
    url: editDoc?.url ?? "",
  });
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const zone = useMemo(() => zoneLabel(new Date(), locale), [locale]);

  const validate = useCallback((v: Values) => {
    const parsed = eventSubmissionSchema.safeParse(toPayload(v, {}));
    return parsed.success ? [] : toFieldIssues(parsed.error);
  }, []);
  const { errors, leave, validateAll, setServerErrors, focusFirstError, describedBy } = useFormErrors({
    values,
    validate,
    t: tErrors as unknown as Translator,
    order: ORDER,
  });

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateAll()) {
      focusFirstError();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "content-type": "application/json", ...localeHeaders(locale) },
        body: JSON.stringify(toPayload(values, { editId: editDoc?._sanityId, collaborationId: workspaceId ?? undefined })),
      });
      if (!res.ok) {
        const { message, fields } = await readFormError(res, tErrors("form.generic"));
        setServerErrors(fields);
        setFormError(message);
        if (Object.keys(fields).length) focusFirstError();
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setFormError(tErrors("form.generic"));
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div role="status" className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="flex items-center gap-2 font-heading text-lg font-bold text-ccm-midnight">
          <CheckCircle2 className="size-5 text-emerald-700" aria-hidden />
          {t("thanksTitle")}
        </p>
        <p className="text-ccm-midnight/80">{t("thanksBody")}</p>
        {!editDoc && (
          <Button type="button" variant="outline" onClick={() => { setValues((v) => ({ ...v, title: "", description: "", startAt: "", endAt: "", url: "", organiserName: "" })); setDone(false); }}>
            {t("another")}
          </Button>
        )}
      </div>
    );
  }

  const field = (path: string) => ({ id: fieldId(path), onBlur: () => leave(path), ...describedBy(path) });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {editDoc && <ReviewContext status={editDoc.status} reviewNotes={editDoc.reviewNotes} />}

      <Section title={t("whatTitle")} hint={t("whatHint")}>
        <div>
          <Label htmlFor={fieldId("title")}>{t("fieldTitle")}</Label>
          <Input {...field("title")} value={values.title} onChange={(e) => set("title", e.target.value)} maxLength={LIMITS.event.title} className="mt-1.5" />
          <div className="mt-1 flex items-start justify-between gap-3">
            <FieldError path="title" message={errors.title} />
            <CharCounter value={values.title} max={LIMITS.event.title} className="ms-auto" />
          </div>
        </div>
        <div>
          <Label htmlFor={fieldId("description")}>{t("fieldDescription")}</Label>
          <p className="text-sm text-muted-foreground">{t("descriptionHint")}</p>
          <Textarea {...field("description")} value={values.description} onChange={(e) => set("description", e.target.value)} maxLength={LIMITS.event.description} rows={4} className="mt-1.5" />
          <FieldError path="description" message={errors.description} />
        </div>
      </Section>

      <Section title={t("whenTitle")} hint={t("zone", { zone })}>
        <div className="grid gap-4 @content-sm/page:grid-cols-2">
          <div>
            <Label htmlFor={fieldId("startAt")}>{t("fieldStart")}</Label>
            <Input {...field("startAt")} type="datetime-local" value={values.startAt} onChange={(e) => set("startAt", e.target.value)} className="mt-1.5" />
            <FieldError path="startAt" message={errors.startAt} />
          </div>
          <div>
            <Label htmlFor={fieldId("endAt")}>{t("fieldEnd")}</Label>
            <Input {...field("endAt")} type="datetime-local" value={values.endAt} min={values.startAt || undefined} onChange={(e) => set("endAt", e.target.value)} className="mt-1.5" />
            <FieldError path="endAt" message={errors.endAt} />
          </div>
        </div>
      </Section>

      <Section title={t("whereTitle")}>
        <div role="radiogroup" aria-label={t("whereTitle")} className="grid gap-2.5 @content-sm/page:grid-cols-3">
          <Choice name="mode" selected={values.mode === "online"} onSelect={() => set("mode", "online")} icon={<Laptop className="size-5" />} label={t("online")} hint={t("onlineHint")} />
          <Choice name="mode" selected={values.mode === "in_person"} onSelect={() => set("mode", "in_person")} icon={<MapPin className="size-5" />} label={t("inPerson")} hint={t("inPersonHint")} />
          <Choice name="mode" selected={values.mode === "hybrid"} onSelect={() => set("mode", "hybrid")} icon={<Globe2 className="size-5" />} label={t("hybrid")} hint={t("hybridHint")} />
        </div>
        {values.mode !== "online" && (
          <div>
            <Label htmlFor={fieldId("place")}>{t("fieldPlace")}</Label>
            <div className="mt-1.5">
              <PlacePicker value={values.place} onChange={(p) => set("place", p)} inputId={fieldId("place")} describedBy={describedBy("place")} onBlur={() => leave("place")} />
            </div>
            <FieldError path="place" message={errors.place} />
          </div>
        )}
        {communities.length > 0 && (
          <div>
            <Label htmlFor={fieldId("regionalCommunityId")}>{t("fieldCommunity")}</Label>
            <select
              id={fieldId("regionalCommunityId")}
              value={values.regionalCommunityId}
              onChange={(e) => set("regionalCommunityId", e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-2 focus-visible:outline-ccm-sea"
            >
              <option value="">{t("noCommunity")}</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Section>

      <Section title={t("whoTitle")}>
        <div role="radiogroup" aria-label={t("whoTitle")} className="grid gap-2.5 @content-sm/page:grid-cols-2">
          <Choice name="origin" selected={values.origin === "ccm"} onSelect={() => set("origin", "ccm")} icon={<Users className="size-5" />} label={t("ccm")} hint={t("ccmHint")} />
          <Choice name="origin" selected={values.origin === "external"} onSelect={() => set("origin", "external")} icon={<Globe2 className="size-5" />} label={t("external")} hint={t("externalHint")} />
        </div>
        {values.origin === "external" && (
          <div>
            <Label htmlFor={fieldId("organiserName")}>{t("fieldOrganiser")}</Label>
            <Input {...field("organiserName")} value={values.organiserName} onChange={(e) => set("organiserName", e.target.value)} maxLength={LIMITS.event.organiserName} className="mt-1.5" />
            <FieldError path="organiserName" message={errors.organiserName} />
          </div>
        )}
        <div>
          <Label htmlFor={fieldId("url")}>{values.origin === "external" ? t("fieldWebsite") : t("fieldWebsiteOptional")}</Label>
          {values.origin === "external" && <p className="text-sm text-muted-foreground">{t("websiteHint")}</p>}
          <Input {...field("url")} type="url" inputMode="url" placeholder="https://" value={values.url} onChange={(e) => set("url", e.target.value)} className="mt-1.5" />
          <FieldError path="url" message={errors.url} />
        </div>
      </Section>

      <div className="space-y-2">
        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" disabled={sending} className="w-full @content-sm/page:w-auto">
          {sending ? t("sending") : editDoc ? t("resubmit") : t("submit")}
        </Button>
        <p className="text-sm text-muted-foreground">{t("reviewNote")}</p>
      </div>
    </form>
  );
}
