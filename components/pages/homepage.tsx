import Hero1 from "@/components/blocks/hero/hero-1";
import SplitRow from "@/components/blocks/split/split-row";
import GridRow from "@/components/blocks/grid/grid-row";
import Carousel2 from "@/components/blocks/carousel/carousel-2";
import Cta1 from "@/components/blocks/cta/cta-1";
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
import { isRTL } from "@/i18n/i18n-helpers";

interface HomepageProps {
  homepage: any;
  locale: string;
}

export default function Homepage({ homepage, locale }: HomepageProps) {
  const rtl = isRTL(locale);

  if (!homepage) {
    return null;
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      {/* Section 1: Hero Welcome */}
      {homepage.heroWelcome && (
        <Hero1
          {...homepage.heroWelcome}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 2: Global Research & Action Agenda */}
      {homepage.globalAgenda && (
        <SplitRow
          {...homepage.globalAgenda}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 3: How to Use Hub */}
      {homepage.howToUse && (
        <SplitRow
          {...homepage.howToUse}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 4: Research Agendas Module */}
      {homepage.agendasModule && (
        <GridRow
          {...homepage.agendasModule}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 5: Lived Experiences Stories */}
      {homepage.livedExperiences && (
        <Carousel2
          {...homepage.livedExperiences}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 6: Regional Communities */}
      {homepage.regionalCommunities && (
        <GridRow
          {...homepage.regionalCommunities}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 7: Collaboration Info */}
      {homepage.collaboration && (
        <SplitRow
          {...homepage.collaboration}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 8: Latest News */}
      {homepage.news && (
        <GridRow
          {...homepage.news}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 9: Project Info */}
      {homepage.projectInfo && (
        <SplitRow
          {...homepage.projectInfo}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 10: Mental Health Definition */}
      {homepage.mentalHealthDefinition && (
        <Cta1
          {...homepage.mentalHealthDefinition}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 11: Partner Logos */}
      {homepage.partnerLogos && (
        <LogoCloud1
          {...homepage.partnerLogos}
          locale={locale}
          isRTL={rtl}
        />
      )}
    </div>
  );
}
