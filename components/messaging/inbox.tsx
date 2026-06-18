"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { sendMessage, markConversationRead } from "@/lib/actions/messaging";
import type { ConversationSummary } from "@/lib/messaging/service";

type Msg = { id: string; senderId: string; body: string; createdAt: string };
const listFetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ conversations: ConversationSummary[] }>);
const msgFetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ messages: Msg[] }>);

export function Inbox({ currentUserId }: { currentUserId: string }) {
  const t = useTranslations("messages");
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string | null>(searchParams.get("c"));

  const { data: listData, mutate: mutateList } = useSWR("/api/messages", listFetcher, {
    refreshInterval: 30_000,
    refreshWhenHidden: false,
  });
  const conversations = listData?.conversations ?? [];
  const activeConvo = conversations.find((c) => c.id === active) ?? null;

  return (
    <div className="grid h-[75vh] gap-4 lg:grid-cols-[300px_1fr]">
      {/* Conversation list — hidden on mobile when a thread is open */}
      <aside className={cn("min-h-0 overflow-y-auto rounded-lg border", active && "hidden lg:block")}>
        <div className="border-b px-4 py-3 font-semibold">{t("title")}</div>
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="divide-y">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-muted",
                    active === c.id && "bg-muted"
                  )}
                >
                  <Avatar className="size-9 flex-shrink-0">
                    {c.otherImage && <AvatarImage src={c.otherImage} alt="" />}
                    <AvatarFallback>{(c.otherName ?? "?").slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", c.unread && "font-semibold")}>
                      <bdi>{c.otherName ?? t("unknownUser")}</bdi>
                    </p>
                    {c.lastMessage && <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>}
                  </div>
                  {c.unread && <span className="size-2 flex-shrink-0 rounded-full bg-ccm-sea" aria-label={t("unread")} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Thread */}
      <section className={cn("min-h-0 rounded-lg border", !active && "hidden lg:flex lg:items-center lg:justify-center")}>
        {active ? (
          <Thread
            key={active}
            conversationId={active}
            currentUserId={currentUserId}
            title={activeConvo?.otherName ?? t("unknownUser")}
            onBack={() => setActive(null)}
            onSent={() => mutateList()}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t("selectConversation")}</p>
        )}
      </section>
    </div>
  );
}

function Thread({
  conversationId,
  currentUserId,
  title,
  onBack,
  onSent,
}: {
  conversationId: string;
  currentUserId: string;
  title: string;
  onBack: () => void;
  onSent: () => void;
}) {
  const t = useTranslations("messages");
  const { data, mutate } = useSWR(`/api/messages?id=${conversationId}`, msgFetcher, {
    refreshInterval: 12_000,
    refreshWhenHidden: false,
  });
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!body.trim()) return;
    setPending(true);
    try {
      const res = await sendMessage({ conversationId, body });
      if (!res.ok) return toast.error(res.error);
      setBody("");
      mutate();
      onSent();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label={t("back")}>
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
        </Button>
        <span className="font-semibold">
          <bdi>{title}</bdi>
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  mine ? "bg-ccm-sea text-white" : "bg-muted text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn("mt-0.5 text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("typeMessage")}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          maxLength={4000}
        />
        <Button onClick={send} disabled={pending || !body.trim()} size="icon" aria-label={t("send")}>
          <Send className="size-4 rtl:-scale-x-100" />
        </Button>
      </div>
    </div>
  );
}
