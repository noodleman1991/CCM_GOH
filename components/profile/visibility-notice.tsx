import { Eye, EyeOff, Lock, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { visibilityNoticeKey, type ProfileVisibilityValue } from "@/lib/profile/visibility-notice-key";

export type { ProfileVisibilityValue };

const ICONS = { public: Eye, publicHidden: EyeOff, members: Users, membersHidden: Users, private: Lock } as const;

/**
 * Owner-only strip under the profile header: who can see this profile, in
 * plain words, with the way to change it one tap away. Profiles default to
 * PUBLIC and searchable, so without this an author has no visual cue that
 * signed-out visitors can read their page.
 */
export async function ProfileVisibilityNotice({
  visibility,
  searchable,
  className,
}: {
  visibility: ProfileVisibilityValue | null | undefined;
  searchable: boolean | null | undefined;
  className?: string;
}) {
  const t = await getTranslations("profile.visibilityNotice");
  const key = visibilityNoticeKey(visibility, searchable);
  const Icon = ICONS[key];
  const tone =
    key === "public" || key === "publicHidden"
      ? "border-amber-300/60 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100"
      : "border-border bg-muted/50 text-foreground";
  return (
    <div
      role="status"
      data-slot="profile-visibility-notice"
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm", tone, className)}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="font-medium">{t(`${key}.title`)}</span>
      <span className="text-muted-foreground">{t(`${key}.detail`)}</span>
      <Link href="/dashboard/profile/edit?tab=privacy" className="ms-auto font-medium underline underline-offset-4">
        {t("change")}
      </Link>
    </div>
  );
}
