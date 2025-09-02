#!/bin/bash

# Studio Route Fix Script for Next.js 15 + Sanity v4
# This fixes the route groups and studio configuration issues

set -e
echo "🔧 Fixing Studio route and configuration issues..."

# 1. Move studio to the correct location (studio should be at app level, not nested)
if [ -d "app/[locale]/(studio)/studio" ]; then
    echo "📁 Moving studio to correct location..."

    # Create proper studio directory structure
    mkdir -p "app/studio"

    # Move studio content to correct location
    if [ -d "app/[locale]/(studio)/studio/[[...tool]]" ]; then
        cp -r "app/[locale]/(studio)/studio/[[...tool]]" "app/studio/"
    fi

    # Remove the incorrectly nested studio
    rm -rf "app/[locale]/(studio)"
    echo "✅ Studio moved to app/studio/"
fi

# 2. Fix studio page with correct import path
echo "📄 Creating proper studio page..."
cat > "app/studio/[[...tool]]/page.tsx" << 'EOF'
/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'

export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <NextStudio config={config} />
}
EOF

# 3. Create studio-specific layout that completely isolates it
echo "📄 Creating studio layout..."
cat > "app/studio/layout.tsx" << 'EOF'
import type { Metadata } from "next";

// Studio-specific metadata
export const metadata: Metadata = {
    title: "Sanity Studio | Content Management",
    description: "Content management system powered by Sanity Studio",
    robots: "noindex, nofollow", // Studio should not be indexed
};

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Studio gets NO providers from the main app
    // This ensures complete isolation
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
EOF

# 4. Update middleware to properly exclude studio
echo "🔧 Updating middleware for studio isolation..."
if [ -f "middleware.ts" ]; then
    # Create backup
    cp middleware.ts middleware.ts.backup

    # Update the config to properly exclude studio
    cat >> middleware.ts << 'EOF'

// Updated config for proper studio exclusion
export const config = {
    matcher: [
        /**
         * Match all paths EXCEPT:
         * - Studio routes (complete isolation)
         * - Static assets
         * - API routes
         * - Next.js internal files
         */
        '/((?!studio|api|_next|_vercel|.*\\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$).*)',
    ]
}
EOF
fi

# 5. Ensure sanity.config.ts is properly configured
echo "⚙️ Checking sanity.config.ts..."
if [ ! -f "sanity.config.ts" ]; then
    echo "⚠️  sanity.config.ts not found. Creating basic configuration..."
    cat > "sanity.config.ts" << 'EOF'
'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { presentationTool } from 'sanity/presentation'

// Import your schema types here
// import { schemaTypes } from './sanity/schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  name: 'default',
  title: 'Your Project Name',

  projectId,
  dataset,

  plugins: [
    structureTool(),
    visionTool(),
    presentationTool({
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3000',
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
    }),
  ],

  schema: {
    types: [
      // Add your schema types here
      // ...schemaTypes,

      // Temporary schema for testing - replace with your actual schemas
      {
        name: 'page',
        title: 'Page',
        type: 'document',
        fields: [
          {
            name: 'title',
            title: 'Title',
            type: 'string'
          },
          {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
              source: 'title',
              maxLength: 96,
            },
          },
          {
            name: 'content',
            title: 'Content',
            type: 'text'
          }
        ]
      }
    ],
  },
})
EOF
fi

# 6. Create basic page document in Sanity (to fix the "missing index document" issue)
echo "📄 Creating instructions for fixing missing index document..."
cat > "SANITY_SETUP_INSTRUCTIONS.md" << 'EOF'
# Sanity Studio Setup Instructions

## Fix "Missing index document" error:

1. **Access your Studio**: Go to http://localhost:3000/studio
2. **Create Homepage Document**:
   - Click "Create new document"
   - Select "Page" (or your homepage document type)
   - Set title: "Homepage"
   - Set slug: "index"
   - Add your content
   - Publish the document

## If you see "Access Denied":
1. Make sure you're logged in to your Sanity account
2. Verify your project ID and dataset in .env.local:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_SANITY_DATASET="production"
   ```

## Next Steps:
- Import your existing schemas into sanity.config.ts
- Update the schema types array with your content types
- Configure your document structure in the studio

## Development URLs:
- Main app: http://localhost:3000
- Studio: http://localhost:3000/studio
- Studio (standalone): npx sanity start (port 3333)
EOF

# 7. Update the main layout to properly exclude studio
echo "📄 Updating main locale layout..."
cat > "app/[locale]/layout.tsx" << 'EOF'
import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from "next-intl/server";
import { ClerkProvider } from '@clerk/nextjs';
import { arSA, esES, frFR, enGB } from '@clerk/localizations';
import { rtlLocales } from '@/i18n/routing';
import { Poppins, Lato } from "next/font/google";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
    display: "swap",
});

const lato = Lato({
    subsets: ["latin"],
    weight: ["300", "400", "700"],
    variable: "--font-lato",
    display: "swap",
});

const clerkLocalizationsMap = {
    en: enGB,
    fr: frFR,
    es: esES,
    ar: arSA,
};

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
    title: {
        template: "%s | Connecting Climate Minds",
        default: "Hub | Connecting Climate Minds",
    },
    openGraph: {
        images: [
            {
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.jpg`,
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    robots: !isProduction ? "noindex, nofollow" : "index, follow",
};

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const resolvedParams = await params;
    const { locale } = resolvedParams;
    const isRtl = rtlLocales.includes(locale);
    const messages = await getMessages();
    const clerkLocalization = clerkLocalizationsMap[locale as keyof typeof clerkLocalizationsMap] || enGB;

    return (
        <html
            lang={locale}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`${poppins.variable} ${lato.variable}`}
            suppressHydrationWarning
        >
        <head>
            <link rel="icon" href="/favicon.ico" />
        </head>
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased overscroll-none overflow-x-hidden",
                poppins.variable,
                lato.variable
            )}
        >
            <ClerkProvider localization={clerkLocalization}>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                    </ThemeProvider>
                    <Toaster position="top-center" richColors />
                </NextIntlClientProvider>
            </ClerkProvider>
        </body>
        </html>
    );
}
EOF

echo "✅ Studio fixes completed!"
echo ""
echo "🎯 Summary of fixes:"
echo "  📁 Moved studio from nested route groups to app/studio"
echo "  🔧 Fixed import path in studio page"
echo "  🏗️  Created isolated studio layout"
echo "  ⚙️  Updated middleware for proper studio exclusion"
echo "  📄 Created Sanity setup instructions"
echo ""
echo "🧪 Test the fixes:"
echo "  1. Main app: http://localhost:3000 (should have sidebar)"
echo "  2. Studio: http://localhost:3000/studio (should be isolated, no sidebar)"
echo ""
echo "📋 Next steps:"
echo "  1. Follow SANITY_SETUP_INSTRUCTIONS.md to fix the missing index document"
echo "  2. Update sanity.config.ts with your actual schemas"
echo "  3. Test all routes to ensure everything works"
echo ""
echo "🚨 If you still see issues:"
echo "  1. Clear Next.js cache: rm -rf .next"
echo "  2. Restart dev server: npm run dev"
echo "  3. Check browser console for any remaining errors"
echo ""
