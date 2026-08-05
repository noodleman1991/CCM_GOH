"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { inviteToCollaboration } from "@/lib/actions/requests";

type Candidate = {
  id: string;
  fullName?: string;
  displayName?: string;
  username?: string | null;
  image?: string | null;
};

/**
 * Owner-only invite box on the Members tab: search hub members by name and
 * invite them. Invitees get a REQUEST notification and accept/decline from
 * their feed (the outbound inverse of join requests).
 */
export function InviteMembers({
  collaborationId,
  existingIds,
}: {
  collaborationId: string;
  existingIds: string[];
}) {
  const t = useTranslations("collaboration");
  const tCommon = useTranslations("common");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/users/collaborate?search=${encodeURIComponent(query)}&pageSize=5`
        );
        const json = await res.json().catch(() => null);
        const users: Candidate[] = json?.data ?? [];
        setResults(users.filter((u) => !existingIds.includes(u.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, existingIds]);

  const invite = async (userId: string) => {
    setBusy(userId);
    const res = await inviteToCollaboration(collaborationId, userId);
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setInvited((s) => new Set(s).add(userId));
    toast.success(t("inviteSent"));
  };

  return (
    <div className="rounded-lg border border-dashed p-3">
      <SearchInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("inviteSearchPlaceholder")}
        aria-label={t("invitePeople")}
        onClear={q ? () => setQ("") : undefined}
        clearLabel={tCommon("clear")}
      />
      {q.trim().length >= 2 && (
        <ul className="mt-2 space-y-1">
          {results.map((u) => {
            const name = u.fullName || u.displayName || u.username || "—";
            const done = invited.has(u.id);
            return (
              <li key={u.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50">
                <Avatar className="size-7">
                  {u.image && <AvatarImage src={u.image} alt="" />}
                  <AvatarFallback className="text-xs">{name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm">
                  <bdi>{name}</bdi>
                  {u.username && <span className="ms-1.5 text-xs text-muted-foreground">@{u.username}</span>}
                </span>
                <Button
                  size="sm"
                  variant={done ? "ghost" : "outline"}
                  disabled={done || busy === u.id}
                  onClick={() => invite(u.id)}
                  className="min-h-8"
                >
                  {done ? <Check className="size-3.5 me-1" aria-hidden /> : <UserPlus className="size-3.5 me-1" aria-hidden />}
                  {done ? t("invitedLabel") : t("inviteAction")}
                </Button>
              </li>
            );
          })}
          {!searching && results.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">{t("inviteNoResults")}</li>
          )}
        </ul>
      )}
    </div>
  );
}
