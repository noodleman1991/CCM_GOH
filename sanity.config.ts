"use client";

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schema";
import { resolve } from "@/sanity/presentation/resolve";
import { structure } from "./sanity/structure";
import { codeInput } from "@sanity/code-input";
import { documentInternationalization } from '@sanity/document-internationalization'

import { routing } from './i18n/routing'

export default defineConfig({
  basePath: "/studio",
  title: "Connecting Climate Minds CMS",
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schema' folder
  schema,
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        draftMode: {
          enable: "/api/draft-mode/enable",
        },
      },
      resolve,
    }),
    visionTool({ defaultApiVersion: apiVersion }),
    codeInput(),
    documentInternationalization({
        supportedLanguages: routing.locales.map(locale => ({
            id: locale,
            title:  locale === 'ar' ? 'العربية' :
                    locale === 'fr' ? 'Français' :
                    locale === 'es' ? 'Español' : 'English'
        })),
        schemaTypes: ['page', 'regionalCommunityPage', 'post'],
        languageField: 'language',
        weakReferences: true,
    })
  ],
});
