#!/bin/bash

# Homepage Template Implementation Script
# This script implements the structured homepage template based on your JSON design

set -e  # Exit on any error

echo "🚀 Starting Homepage Template Implementation..."

# Create backup directory
BACKUP_DIR="homepage-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Created backup directory: $BACKUP_DIR"

# Backup existing files
echo "📋 Backing up existing files..."
cp sanity/schemas/documents/homepage.ts "$BACKUP_DIR/homepage.ts.bak" 2>/dev/null || echo "No existing homepage schema found"
cp sanity/queries/homepage.ts "$BACKUP_DIR/homepage-query.ts.bak" 2>/dev/null || echo "No existing homepage query found"
cp components/pages/homepage.tsx "$BACKUP_DIR/homepage-component.tsx.bak" 2>/dev/null || echo "No existing homepage component found"
cp sanity/presentation/resolve.ts "$BACKUP_DIR/resolve.ts.bak" 2>/dev/null || echo "No existing resolve found"

# 1. Update Homepage Schema
echo "🏗️  Updating homepage schema..."
cat > sanity/schemas/documents/homepage.ts << 'EOF'
import { defineField, defineType } from "sanity";
import { Home } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';

export default defineType({
  name: "homepage",
  type: "document",
  title: "Homepage",
  icon: Home,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "settings",
      title: "Settings",
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
        isUnique: isUniqueOtherThanLanguage,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "language",
      type: "string",
      readOnly: true,
      hidden: true,
      group: "settings",
    }),

    // Section 1: Hero Welcome - maps to "section_1_hero_welcome"
    defineField({
      name: "heroWelcome",
      title: "Hero Welcome Section",
      type: "hero-1",
      group: "content",
      description: "Welcome to Connecting Climate Minds Hub section"
    }),

    // Section 2: Global Agenda - maps to "section_2_global_agenda"
    defineField({
      name: "globalAgenda",
      title: "Global Research & Action Section",
      type: "split-row",
      group: "content",
      description: "Prioritizing Global Research and Action section"
    }),

    // Section 3: How to Use - maps to "section_3_how_to_use"
    defineField({
      name: "howToUse",
      title: "How to Use Hub Section",
      type: "split-row",
      group: "content",
      description: "Your collaborative space section"
    }),

    // Section 4: Agendas Module - maps to "section_4_agendas_module"
    defineField({
      name: "agendasModule",
      title: "Research Agendas",
      type: "grid-row",
      group: "content"
    }),

    // Section 5: Lived Experiences - maps to "section_5_lived_experiences"
    defineField({
      name: "livedExperiences",
      title: "Lived Experiences Stories",
      type: "carousel-2",
      group: "content"
    }),

    // Section 6: Regional Communities - maps to "section_6_regional_communities"
    defineField({
      name: "regionalCommunities",
      title: "Regional Communities",
      type: "grid-row",
      group: "content"
    }),

    // Section 7: Collaboration - maps to "section_7_collaboration_info"
    defineField({
      name: "collaboration",
      title: "Collaboration Section",
      type: "split-row",
      group: "content"
    }),

    // Section 8: News - maps to "section_8_news"
    defineField({
      name: "news",
      title: "Latest News Section",
      type: "grid-row",
      group: "content"
    }),

    // Section 9: Project Info - maps to "section_9_project_info"
    defineField({
      name: "projectInfo",
      title: "Project Information",
      type: "split-row",
      group: "content"
    }),

    // Section 10: Mental Health Definition - maps to "section_10_mental_health_definition"
    defineField({
      name: "mentalHealthDefinition",
      title: "Mental Health Definition",
      type: "cta-1",
      group: "content"
    }),

    // Section 11: Partner Logos - maps to "section_11_partner_logos"
    defineField({
      name: "partnerLogos",
      title: "Partner Logos",
      type: "logo-cloud-1",
      group: "content"
    }),

    // SEO Fields
    defineField({
      name: "meta_title",
      title: "Meta Title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "meta_description",
      title: "Meta Description",
      type: "text",
      group: "seo",
      rows: 3,
    }),
    defineField({
      name: "noindex",
      title: "No Index",
      type: "boolean",
      initialValue: false,
      group: "seo",
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph Image - [1200x630]",
      type: "image",
      group: "seo",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    orderRankField({ type: "homepage" }),
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      media: 'heroWelcome.image',
    },
    prepare(select) {
      const {title, language, media} = select

      return {
        title: title || "Homepage",
        subtitle: language ? language.toUpperCase() : 'EN',
        media,
      }
    },
  }
});
EOF

# 2. Update Homepage Query
echo "🔍 Updating homepage query..."
cat > sanity/queries/homepage.ts << 'EOF'
import { groq } from "next-sanity";
import { hero1Query } from "./hero/hero-1";
import { splitRowQuery } from "./split/split-row";
import { gridRowQuery } from "./grid/grid-row";
import { carousel2Query } from "./carousel/carousel-2";
import { cta1Query } from "./cta/cta-1";
import { logoCloud1Query } from "./logo-cloud/logo-cloud-1";

export const HOMEPAGE_QUERY = groq`
  *[_type == "homepage" && slug.current == $slug && language == $language][0]{
    _id,
    title,
    slug,
    language,

    // Template sections based on JSON structure
    heroWelcome {
      ${hero1Query}
    },
    globalAgenda {
      ${splitRowQuery}
    },
    howToUse {
      ${splitRowQuery}
    },
    agendasModule {
      ${gridRowQuery}
    },
    livedExperiences {
      ${carousel2Query}
    },
    regionalCommunities {
      ${gridRowQuery}
    },
    collaboration {
      ${splitRowQuery}
    },
    news {
      ${gridRowQuery}
    },
    projectInfo {
      ${splitRowQuery}
    },
    mentalHealthDefinition {
      ${cta1Query}
    },
    partnerLogos {
      ${logoCloud1Query}
    },

    meta_title,
    meta_description,
    noindex,
    ogImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
      alt
    }
  }
`;
EOF

# 3. Create/Update Homepage Component
echo "⚛️  Creating homepage component..."
mkdir -p components/pages
cat > components/pages/homepage.tsx << 'EOF'
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
EOF

# 4. Update Presentation Resolve (minimal fix)
echo "🎯 Updating presentation resolve..."
cat > sanity/presentation/resolve.ts << 'EOF'
import {
  defineLocations,
  defineDocuments,
  PresentationPluginOptions,
} from "sanity/presentation";

export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    homepage: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
        language: "language",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Homepage",
            href: doc?.slug === "index" ? "/" : `/${doc?.slug}`,
          },
        ],
      }),
    }),
    page: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled",
            href: `/${doc?.slug}`,
          },
        ],
      }),
    }),
    post: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled",
            href: `/blog/${doc?.slug}`,
          },
          { title: "Blog", href: `/blog` },
        ],
      }),
    }),
  },
  mainDocuments: defineDocuments([
    {
      route: "/",
      filter: `_type == 'homepage' && slug.current == 'index'`,
    },
    {
      route: "/:slug",
      filter: `_type == 'page' && slug.current == $slug`,
    },
    {
      route: "/blog/:slug",
      filter: `_type == 'post' && slug.current == $slug`,
    },
  ]),
};
EOF

echo "✅ Implementation completed successfully!"
echo ""
echo "📋 What was updated:"
echo "   ✓ sanity/schemas/documents/homepage.ts - Structured template schema"
echo "   ✓ sanity/queries/homepage.ts - Updated query for new structure"
echo "   ✓ components/pages/homepage.tsx - Template component"
echo "   ✓ sanity/presentation/resolve.ts - Fixed presentation tool"
echo ""
echo "📦 Backups created in: $BACKUP_DIR"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Go to Sanity Studio and create a homepage with slug 'index'"
echo "3. Fill in the 11 template sections based on your JSON structure"
echo "4. Your homepage will be available at '/'"
echo ""
echo "🔧 Template sections (in order):"
echo "   1. Hero Welcome (hero-1)"
echo "   2. Global Agenda (split-row)"
echo "   3. How to Use (split-row)"
echo "   4. Research Agendas (grid-row)"
echo "   5. Lived Experiences (carousel-2)"
echo "   6. Regional Communities (grid-row)"
echo "   7. Collaboration (split-row)"
echo "   8. Latest News (grid-row)"
echo "   9. Project Info (split-row)"
echo "   10. Mental Health Definition (cta-1)"
echo "   11. Partner Logos (logo-cloud-1)"
echo ""
echo "✨ Done! Your homepage template is now ready."
