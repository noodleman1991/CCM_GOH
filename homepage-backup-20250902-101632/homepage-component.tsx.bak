import Blocks from "@/components/blocks";
import Hero1 from "@/components/blocks/hero/hero-1";

interface HomepageProps {
  homepage: any;
  locale: string; // Make required, not optional
}

export default function Homepage({ homepage, locale }: HomepageProps) {
  if (!homepage) return null;

  return (
    <>
      {/* Use welcomeHero like regional community page */}
      {homepage.welcomeHero && (
        <Hero1 {...homepage.welcomeHero} locale={locale} />
      )}

      {/* Render all other sections using existing Blocks component */}
      {homepage.blocks && homepage.blocks.length > 0 && (
        <Blocks blocks={homepage.blocks} locale={locale} />
      )}
    </>
  );
}
