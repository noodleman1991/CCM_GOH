"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createCollaboration } from "@/lib/actions/collaboration";

export function CreateCollaborationButton() {
  const t = useTranslations("collaboration");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "MEMBERS">("MEMBERS");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setPending(true);
    try {
      const res = await createCollaboration({ title, description, visibility });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      router.push(`/collaborations/${res.id}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 me-2" />
          {t("create")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collab-title">{t("titleLabel")}</Label>
            <Input id="collab-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collab-desc">{t("descriptionLabel")}</Label>
            <Textarea id="collab-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
          </div>
          <div className="space-y-2">
            <Label>{t("visibilityLabel")}</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as "PUBLIC" | "MEMBERS")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBERS">{t("visibilityMembers")}</SelectItem>
                <SelectItem value="PUBLIC">{t("visibilityPublic")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !title.trim()}>
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
