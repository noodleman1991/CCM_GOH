"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveUserSettings, type UserSettings } from "@/lib/actions/settings";
import { unblockUser } from "@/lib/actions/messaging";

type Blocked = { id: string; name: string; username: string | null; image: string | null };

export function SettingsForm({ initial, blocked }: { initial: UserSettings; blocked: Blocked[] }) {
  const t = useTranslations("settings");
  const [s, setS] = useState<UserSettings>(initial);
  const [blockList, setBlockList] = useState(blocked);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await saveUserSettings(s);
      if (res.ok) toast.success(t("saved"));
      else toast.error(res.error ?? "");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (k: keyof UserSettings) => (v: boolean) => setS((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("emailNotifications")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            ["emailOnReply", t("emailReply")],
            ["emailOnMention", t("emailMention")],
            ["emailOnMessage", t("emailMessage")],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={key}>{label}</Label>
              <Switch id={key} checked={s[key] as boolean} onCheckedChange={toggle(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("messaging")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label>{t("whoCanMessage")}</Label>
            <Select
              value={s.allowMessagesFrom}
              onValueChange={(v) => setS({ ...s, allowMessagesFrom: v as "EVERYONE" | "NOBODY" })}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EVERYONE">{t("everyone")}</SelectItem>
                <SelectItem value="NOBODY">{t("nobody")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {blockList.length > 0 && (
            <div className="space-y-2">
              <Label>{t("blocked")}</Label>
              {blockList.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border p-2">
                  <Avatar className="size-8">
                    {b.image && <AvatarImage src={b.image} alt="" />}
                    <AvatarFallback>{b.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <bdi>{b.name}</bdi>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const res = await unblockUser(b.id);
                      if (res.ok) setBlockList((l) => l.filter((x) => x.id !== b.id));
                    }}
                  >
                    {t("unblock")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("yourData")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/api/account/export">{t("downloadData")}</a>
          </Button>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {t("save")}
      </Button>
    </div>
  );
}
