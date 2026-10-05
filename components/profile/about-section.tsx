import { getTranslations } from "next-intl/server";
import Markdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AnsweredPrompt } from "@/lib/community/profile-prompts";
import { optionLabel, type AboutYouOption } from "@/lib/onboarding/about-you-options";
import { OwnerAddLink, ProfileSection, SubHeading } from "./owner-add-link";

type AboutUser = {
  bio?: string | null;
  motivation?: string | null;
  lookingFor: string[];
  focusTopics: string[];
  collaborationInterests?: string | null;
  livedExperienceStatement?: string | null;
};

/**
 * About — the member's own words (profile spec D3): bio, what brought them
 * here, what they're looking for and open to, their prompts, and the
 * lived-experience statement only when they chose to show it (redacted
 * upstream otherwise).
 */
export async function AboutSection({
  user,
  prompts,
  options,
  addHref,
}: {
  user: AboutUser;
  prompts: AnsweredPrompt[];
  /** The team's choices, to show a stored value ("research-partners") in the reader's words. */
  options: { lookingFor: AboutYouOption[]; focusTopics: AboutYouOption[] };
  addHref: string | null;
}) {
  const t = await getTranslations("profile");
  const chips = (items: string[], tone: "sky" | "outline") => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) =>
        tone === "sky" ? (
          <Badge key={item} variant="secondary" className="bg-ccm-sky/25 text-ccm-sea"><bdi>{item}</bdi></Badge>
        ) : (
          <Badge key={item} variant="outline"><bdi>{item}</bdi></Badge>
        ),
      )}
    </div>
  );

  return (
    <ProfileSection id="about" title={t("sections.about")}>
      {addHref && <OwnerAddLink href={addHref}>{t("add.about")}</OwnerAddLink>}

      {user.bio && (
        <div dir="auto" className="prose max-w-none text-pretty font-sans text-base text-foreground/85 dark:prose-invert">
          <Markdown>{user.bio}</Markdown>
        </div>
      )}

      {user.motivation && (
        <Card className="border-ccm-sky bg-ccm-sky/10">
          <CardContent className="pt-6">
            <SubHeading>{t("motivation")}</SubHeading>
            <p dir="auto" className="text-pretty whitespace-pre-line text-foreground/85">{user.motivation}</p>
          </CardContent>
        </Card>
      )}

      {(user.lookingFor.length > 0 || user.focusTopics.length > 0) && (
        <div className="@container">
          <div className="grid gap-4 @lg:grid-cols-2">
            {user.lookingFor.length > 0 && (
              <div>
                <SubHeading>{t("lookingFor")}</SubHeading>
                {chips(user.lookingFor.map((v) => optionLabel(options.lookingFor, v)), "outline")}
              </div>
            )}
            {user.focusTopics.length > 0 && (
              <div>
                <SubHeading>{t("focusTopics")}</SubHeading>
                {chips(user.focusTopics.map((v) => optionLabel(options.focusTopics, v)), "sky")}
              </div>
            )}
          </div>
        </div>
      )}

      {user.collaborationInterests && (
        <div>
          <SubHeading>{t("sections.openTo")}</SubHeading>
          <p dir="auto" className="text-pretty whitespace-pre-line text-foreground/85">{user.collaborationInterests}</p>
        </div>
      )}

      {/* The prompts — the most human part of a profile. */}
      {prompts.length > 0 && (
        <div className="@container">
          <ul className="grid gap-3 @lg:grid-cols-2">
            {prompts.map((p) => (
              <li key={p.id}>
                <Card className="h-full bg-ccm-sky/10">
                  <CardContent className="pt-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ccm-sea">{p.prompt}</p>
                    <p dir="auto" className="text-pretty whitespace-pre-line text-base text-ccm-midnight">{p.answer}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user.livedExperienceStatement && (
        <Card className="border-s-4 border-s-ccm-water">
          <CardContent className="pt-6">
            <SubHeading>{t("livedExperience")}</SubHeading>
            <p dir="auto" className="text-pretty whitespace-pre-line text-foreground/85">{user.livedExperienceStatement}</p>
          </CardContent>
        </Card>
      )}
    </ProfileSection>
  );
}
