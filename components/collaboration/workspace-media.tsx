"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { addMedia, deleteMedia } from "@/lib/actions/collaboration-media";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-provider";
import type { CollaborationRole } from "@/generated/prisma";

type Media = { id: string; url: string; title: string | null; createdAt: string };
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ media: Media[] }>);

export function WorkspaceMedia({
  collaborationId,
  myRole,
}: {
  collaborationId: string;
  myRole: CollaborationRole | null;
  isSignedIn: boolean;
}) {
  const t = useTranslations("collaboration");
  const { consent, hasConsented, acceptAll } = useCookieConsent();
  const { data, mutate } = useSWR(`/api/collaborations/${collaborationId}/media`, fetcher, {
    revalidateOnFocus: false,
  });
  const [url, setUrl] = useState("");

  const canEdit = myRole === "EDITOR" || myRole === "OWNER";
  const media = data?.media ?? [];
  const canPlay = consent?.functional && hasConsented;

  // Inline add: paste a YouTube URL + Enter (title can be added later). The
  // server derives a sensible default title from the link.
  const add = async () => {
    const u = url.trim();
    if (!u) return;
    setUrl("");
    const res = await addMedia(collaborationId, u, "");
    if (!res.ok) { toast.error(res.error); return; }
    mutate();
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex items-center gap-2 rounded-md border p-2">
          <Plus className="size-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("youtubeUrlPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
      )}

      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noMedia")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {media.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-ccm-midnight">
                {canPlay ? (
                  <iframe
                    src={m.url}
                    title={m.title ?? "Video"}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-white">
                    <p className="text-sm text-white/85">{t("mediaConsentRequired")}</p>
                    <Button size="sm" variant="secondary" onClick={acceptAll}>
                      {t("acceptCookies")}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                {m.title && <p className="truncate text-sm font-medium"><bdi>{m.title}</bdi></p>}
                {canEdit && (
                  <button
                    onClick={async () => {
                      const res = await deleteMedia(collaborationId, m.id);
                      if (res.ok) mutate();
                      else toast.error(res.error);
                    }}
                    className="ms-auto text-muted-foreground hover:text-destructive"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
