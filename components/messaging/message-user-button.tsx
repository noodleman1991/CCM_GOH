"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { startConversation } from "@/lib/actions/messaging";

/** "Message" button on a public profile — opens (or creates) a 1:1 thread. */
export function MessageUserButton({ targetUserId }: { targetUserId: string }) {
  const t = useTranslations("messages");
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();
  const [pending, setPending] = useState(false);

  if (!isSignedIn || userId === targetUserId) return null;

  const open = async () => {
    setPending(true);
    try {
      const res = await startConversation(targetUserId);
      if (!res.ok) return toast.error(res.error);
      router.push(`/messages?c=${res.id}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant="outline" onClick={open} disabled={pending}>
      <MessageCircle className="size-4 me-2" />
      {t("messageButton")}
    </Button>
  );
}
