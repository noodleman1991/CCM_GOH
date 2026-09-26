import "server-only";
import { getModerationSettings as fetchModerationSettings } from "@/lib/content/discovery";
import { classify, type Tier } from "@/lib/moderation/normalize";

type ModerationSettings = {
  enabled: boolean;
  blockTerms: string[];
  reviewTerms: string[];
};

let cached: { value: ModerationSettings; at: number } | null = null;
const TTL_MS = 60_000;

async function getSettings(): Promise<ModerationSettings> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const value = await fetchModerationSettings();
  cached = { value, at: Date.now() };
  return value;
}

export type ModerationVerdict = { tier: Tier; term?: string };

/** Classify a comment body against the CMS wordlists. */
export async function moderateBody(body: string): Promise<ModerationVerdict> {
  const settings = await getSettings();
  if (!settings.enabled) return { tier: "clean" };
  return classify(body, settings.blockTerms, settings.reviewTerms);
}
