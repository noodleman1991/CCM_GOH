// components/collaboration/project-cta-bar.tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserPlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { FollowButton } from "@/components/follow/follow-button";
import { requestToJoin, requestContact } from "@/lib/actions/requests";
import { canRequestToJoin } from "@/lib/collaboration/public-access";

export function ProjectCtaBar({
  projectId,
  projectTitle,
  leadUserId,
  isSignedIn,
  isMember,
}: {
  projectId: string;
  projectTitle: string;
  leadUserId: string;
  isSignedIn: boolean;
  isMember: boolean;
}) {
  const t = useTranslations("projectPublic");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [requested, setRequested] = useState(false);
  const [pending, startTransition] = useTransition();

  const mayJoin = canRequestToJoin({ isSignedIn, isMember });

  const submitJoin = () => {
    startTransition(async () => {
      const res = await requestToJoin(projectId, message.trim() || undefined);
      if (res.ok) {
        setRequested(true);
        setOpen(false);
        toast.success(t("requestSent"));
      } else {
        toast.error(res.error);
      }
    });
  };

  const messageLead = () => {
    if (!isSignedIn) return;
    startTransition(async () => {
      const res = await requestContact(leadUserId);
      if (res.ok) toast.success(t("requestSent"));
      else toast.error(res.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Follow — reuses the shared, ISR-safe follow toggle */}
      <FollowButton targetType="PROJECT" targetId={projectId} size="default" />

      {/* Request to join */}
      {mayJoin ? (
        <Button onClick={() => setOpen(true)} disabled={requested || pending} className="gap-1.5">
          <UserPlus className="size-4" aria-hidden="true" />
          {requested ? t("requestSent") : t("requestToJoin")}
        </Button>
      ) : !isSignedIn ? (
        <Button asChild variant="outline" className="gap-1.5">
          <Link href="/sign-in">{t("signInToJoin")}</Link>
        </Button>
      ) : null}

      {/* Message the lead */}
      {isSignedIn && !isMember && (
        <Button variant="outline" onClick={messageLead} disabled={pending} className="gap-1.5">
          <MessageSquare className="size-4" aria-hidden="true" />
          {t("messageLead")}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("requestModalTitle", { title: projectTitle })}</DialogTitle>
            <DialogDescription>{t("requestModalHint")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("requestModalPlaceholder")}
            maxLength={500}
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              {t("requestCancel")}
            </Button>
            <Button onClick={submitJoin} disabled={pending}>
              {t("requestModalSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
