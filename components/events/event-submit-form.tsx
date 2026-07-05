"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EditableEvent } from "@/lib/events/edit";

/** ISO → the local "YYYY-MM-DDTHH:mm" a datetime-local input expects. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * In-app event submission. Posts to /api/events/submit, which forces
 * status=pending → editor review (the moderation gate). Mirrors the
 * lived-experience submission UX. With `editDoc` (X7 ?edit=) the form
 * reopens an existing draft/pending event and resubmits it in place.
 */
export function EventSubmitForm({
  workspaceId,
  editDoc,
}: { workspaceId?: string | null; editDoc?: EditableEvent | null } = {}) {
  const t = useTranslations("events");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: editDoc?.title ?? "",
    description: editDoc?.description ?? "",
    scope: (editDoc?.scope ?? "community") as "community" | "project",
    startAt: toLocalInput(editDoc?.startAt ?? ""),
    endAt: toLocalInput(editDoc?.endAt ?? ""),
    mode: (editDoc?.mode ?? "online") as "online" | "in_person" | "hybrid",
    locationName: editDoc?.locationName ?? "",
    url: editDoc?.url ?? "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startAt) {
      toast.error(t("validationRequired"));
      return;
    }
    setPending(true);
    try {
      const payload = {
        ...form,
        ...(workspaceId ? { collaborationId: workspaceId } : {}),
        ...(editDoc ? { editId: editDoc._sanityId } : {}),
        // datetime-local → ISO; the API expects z.string().datetime()
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : "",
      };
      const res = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error(t("submitFailed"));
        return;
      }
      toast.success(t("submitPending"));
      router.push("/collaborate/events");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="ev-title">{t("fieldTitle")}</Label>
        <Input id="ev-title" value={form.title} onChange={(e) => set("title")(e.target.value)} maxLength={160} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-desc">{t("fieldDescription")}</Label>
        <textarea
          id="ev-desc"
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          maxLength={2000}
          rows={4}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ev-start">{t("fieldStart")}</Label>
          <Input id="ev-start" type="datetime-local" value={form.startAt} onChange={(e) => set("startAt")(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-end">{t("fieldEnd")}</Label>
          <Input id="ev-end" type="datetime-local" value={form.endAt} onChange={(e) => set("endAt")(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("fieldMode")}</Label>
          <Select value={form.mode} onValueChange={(v) => set("mode")(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="online">{t("modeOnline")}</SelectItem>
              <SelectItem value="in_person">{t("modeInPerson")}</SelectItem>
              <SelectItem value="hybrid">{t("modeHybrid")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("fieldScope")}</Label>
          <Select value={form.scope} onValueChange={(v) => set("scope")(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="community">{t("scopeCommunity")}</SelectItem>
              <SelectItem value="project">{t("scopeProject")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ev-loc">{t("fieldLocation")}</Label>
          <Input id="ev-loc" value={form.locationName} onChange={(e) => set("locationName")(e.target.value)} maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-url">{t("fieldUrl")}</Label>
          <Input id="ev-url" type="url" value={form.url} onChange={(e) => set("url")(e.target.value)} placeholder="https://" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("moderationNote")}</p>
      <Button type="submit" disabled={pending}>{t("submit")}</Button>
    </form>
  );
}
