import Blocks from "@/components/blocks";
import Hero1 from "@/components/blocks/hero/hero-1";

interface HomepageProps {
  homepage: any;
  locale?: string;
}

export default function Homepage({ homepage, locale }: HomepageProps) {
  if (!homepage) return null;

  return (
    <>
      {/* Use welcomeHero to match your schema - same pattern as regional community */}
      {homepage.welcomeHero && (
        <Hero1 {...homepage.welcomeHero} locale={locale} />
      )}

      {/* Additional specific sections */}
      {homepage.globalAgendaSection && (
        <div key="global-agenda">
          <Blocks blocks={[homepage.globalAgendaSection]} locale={locale} />
        </div>
      )}

      {homepage.howToUseSection && (
        <div key="how-to-use">
          <Blocks blocks={[homepage.howToUseSection]} locale={locale} />
        </div>
      )}

      {homepage.agendasModule && (
        <div key="agendas">
          <Blocks blocks={[homepage.agendasModule]} locale={locale} />
        </div>
      )}

      {homepage.livedExperiencesModule && (
        <div key="lived-experiences">
          <Blocks blocks={[homepage.livedExperiencesModule]} locale={locale} />
        </div>
      )}

      {homepage.regionalCommunitiesModule && (
        <div key="regional-communities">
          <Blocks blocks={[homepage.regionalCommunitiesModule]} locale={locale} />
        </div>
      )}

      {homepage.collaborationSection && (
        <div key="collaboration">
          <Blocks blocks={[homepage.collaborationSection]} locale={locale} />
        </div>
      )}

      {homepage.newsModule && (
        <div key="news">
          <Blocks blocks={[homepage.newsModule]} locale={locale} />
        </div>
      )}

      {homepage.projectInfoSection && (
        <div key="project-info">
          <Blocks blocks={[homepage.projectInfoSection]} locale={locale} />
        </div>
      )}

      {homepage.mentalHealthSection && (
        <div key="mental-health">
          <Blocks blocks={[homepage.mentalHealthSection]} locale={locale} />
        </div>
      )}

      {homepage.partnerLogos && (
        <div key="partner-logos">
          <Blocks blocks={[homepage.partnerLogos]} locale={locale} />
        </div>
      )}

      {/* Render additional blocks - same pattern as regional community */}
      <Blocks blocks={homepage.blocks ?? []} locale={locale} />
    </>
  );
}
