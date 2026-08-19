"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { broadcastNotification } from "@/lib/actions/broadcast";

type Community = { id: string; name: string; type: string; regionalName: string | null };
type TargetKind = "all" | "community" | "region";

export function BroadcastForm({ communities }: { communities: Community[] }) {
  const t = useTranslations("moderation.broadcast");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<TargetKind>("all");
  const [communityId, setCommunityId] = useState("");
  const [region, setRegion] = useState("");
  const [pending, setPending] = useState(false);

  const regions = [...new Set(communities.filter((c) => c.regionalName).map((c) => c.regionalName!))];

  const send = async () => {
    if (!message.trim()) return;
    setPending(true);
    try {
      const target =
        kind === "all"
          ? { kind: "all" as const }
          : kind === "community"
            ? { kind: "community" as const, communityId }
            : { kind: "region" as const, regionalName: region };
      if (kind === "community" && !communityId) return toast.error(t("pickCommunity"));
      if (kind === "region" && !region) return toast.error(t("pickRegion"));

      const res = await broadcastNotification({ message, target });
      if (!res.ok) return toast.error(res.error);
      toast.success(t("sentTo", { count: res.count }));
      setMessage("");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <div className="space-y-2">
        <Label htmlFor="bc-msg">{t("messageLabel")}</Label>
        <Textarea id="bc-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={280} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("audience")}</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as TargetKind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("everyone")}</SelectItem>
              <SelectItem value="community">{t("aCommunity")}</SelectItem>
              <SelectItem value="region">{t("aRegion")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {kind === "community" && (
          <div className="space-y-2">
            <Label>{t("community")}</Label>
            <Select value={communityId} onValueChange={setCommunityId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {communities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <bdi>{c.name}</bdi>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {kind === "region" && (
          <div className="space-y-2">
            <Label>{t("region")}</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button onClick={send} disabled={pending || !message.trim()}>
        {t("send")}
      </Button>
    </div>
  );
}
