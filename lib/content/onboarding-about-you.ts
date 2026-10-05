import "server-only";
import { query } from "@/lib/content/internal/payload-source";
import { resolveAboutYouOptions, type AboutYouOption } from "@/lib/onboarding/about-you-options";

export type AboutYouContent = {
  title: string | null;
  description: string | null;
  promptIntro: string | null;
  lookingFor: AboutYouOption[];
  focusTopics: AboutYouOption[];
};

type Row = { title?: string | null; description?: string | null; promptIntro?: string | null; lookingForOptions?: { value?: string; label?: string }[] | null; focusTopicOptions?: { value?: string; label?: string }[] | null };

/**
 * Settings → Onboarding → Step 3: About you, in one language (English where a
 * translation is missing). The choices fall back to a starter list while the
 * team hasn't made one, and a failed read falls back the same way — the step
 * never breaks onboarding.
 */
export async function getAboutYouContent(locale: string): Promise<AboutYouContent> {
  const lang = (["en", "es", "fr", "ar"].includes(locale) ? locale : "en") as "en" | "es" | "fr" | "ar";
  const row = await query<Row | null>({ type: "global", slug: "onboardingAboutYou", locale: lang, fallbackLocale: "en", depth: 0 }).catch(() => null);
  return {
    title: row?.title?.trim() || null,
    description: row?.description?.trim() || null,
    promptIntro: row?.promptIntro?.trim() || null,
    ...resolveAboutYouOptions(row),
  };
}
