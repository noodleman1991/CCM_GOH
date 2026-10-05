/**
 * The choices the "About you" step and Edit profile offer for "Looking for"
 * and "Focus areas". They come from Settings → Onboarding → About you, so the
 * team edits them (no hardcoded vocabularies — user rule 2026-07-02); the
 * starter lists below are used only while the team hasn't made one. Pure.
 */
export type AboutYouOption = { value: string; label: string };

export const FALLBACK_LOOKING_FOR: AboutYouOption[] = [
  { value: "collaborators", label: "People to work with" },
  { value: "research-partners", label: "Research partners" },
  { value: "mentoring", label: "A mentor" },
  { value: "mentees", label: "People to mentor" },
  { value: "peer-support", label: "Peer support" },
  { value: "funding", label: "Funding" },
  { value: "speakers", label: "Speakers for an event" },
];

export const FALLBACK_FOCUS_TOPICS: AboutYouOption[] = [
  { value: "eco-anxiety", label: "Eco-anxiety" },
  { value: "climate-grief", label: "Climate grief" },
  { value: "youth", label: "Young people" },
  { value: "community-resilience", label: "Community resilience" },
  { value: "indigenous-knowledge", label: "Indigenous knowledge" },
  { value: "health-systems", label: "Health systems" },
  { value: "disasters", label: "Disasters and displacement" },
  { value: "policy", label: "Policy" },
];

type Raw = { value?: string | null; label?: string | null } | null | undefined;

const clean = (rows: Raw[] | null | undefined) =>
  (rows ?? [])
    .map((r) => ({ value: r?.value?.trim() ?? "", label: r?.label?.trim() ?? "" }))
    .filter((r) => r.value && r.label);

export function resolveAboutYouOptions(
  global: { lookingForOptions?: Raw[] | null; focusTopicOptions?: Raw[] | null } | null | undefined,
): { lookingFor: AboutYouOption[]; focusTopics: AboutYouOption[] } {
  const lookingFor = clean(global?.lookingForOptions);
  const focusTopics = clean(global?.focusTopicOptions);
  return {
    lookingFor: lookingFor.length > 0 ? lookingFor : FALLBACK_LOOKING_FOR,
    focusTopics: focusTopics.length > 0 ? focusTopics : FALLBACK_FOCUS_TOPICS,
  };
}

/** A stored value shown as its label; values no longer on the list show as written. */
export function optionLabel(options: AboutYouOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
