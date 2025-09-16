import Blocks from "@/components/blocks/index";
import ContentFlow from "./content-flow";

interface HybridContentFlowProps {
  sections: any[];
  locale: string;
  userId: string;
  communitySlug: string;
}

// Server component that separates client-safe and server-only blocks
export default function HybridContentFlow({
  sections,
  locale,
  userId,
  communitySlug
}: HybridContentFlowProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <>
      {sections.map((section, index) => {
        const key = section._key || `section-${index}`;

        // Handle server-only blocks
        if (isServerBlock(section._type)) {
          return (
            <Blocks
              key={key}
              blocks={[section as any]}
              locale={locale}
              userId={userId}
            />
          );
        }

        // Handle client-safe blocks
        if (isClientBlock(section._type)) {
          return (
            <ContentFlow
              key={key}
              sections={[section]}
              locale={locale}
              userId={userId}
              communitySlug={communitySlug}
            />
          );
        }

        return null;
      })}
    </>
  );
}

function isServerBlock(type: string): boolean {
  const serverBlocks = [
    "hero-1",
    "hero-2",
    "section-header",
    "split-row",
    "grid-row",
    "carousel-1",
    "carousel-2",
    "lived-experiences-carousel",
    "timeline-row",
    "cta-1",
    "logo-cloud-1",
    "faqs",
    "form-newsletter",
    "all-posts"
  ];

  return serverBlocks.includes(type);
}

function isClientBlock(type: string): boolean {
  const clientBlocks = [
    "manualContentInsert",
    "dynamicContentInsert",
    "separatorBlock"
  ];

  return clientBlocks.includes(type);
}