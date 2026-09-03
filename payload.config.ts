import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import { Users } from "./payload/collections/users";
import { Media } from "./payload/collections/media";
import { Tags } from "./payload/collections/tags";
import { WorkTypes } from "./payload/collections/work-types";
import { ExpertiseAreas } from "./payload/collections/expertise-areas";
import { Authors } from "./payload/collections/authors";
import { Organizations } from "./payload/collections/organizations";
import { RegionalCommunities } from "./payload/collections/regional-communities";
import { CaseStudies } from "./payload/collections/case-studies";
import { LivedExperiences } from "./payload/collections/lived-experiences";
import { ResearchOutputs } from "./payload/collections/research-outputs";
import { Agendas } from "./payload/collections/agendas";
import { NewsPosts } from "./payload/collections/news-posts";
import { DocsChapters } from "./payload/collections/docs-chapters";
import { Testimonials } from "./payload/collections/testimonials";
import { ProfilePrompts } from "./payload/collections/profile-prompts";
import { ExternalSources } from "./payload/collections/external-sources";
import { CaseStudyDrafts } from "./payload/collections/case-study-drafts";
import { Pages } from "./payload/collections/pages";
import { RegionalCommunityPages } from "./payload/collections/regional-community-pages";
import { Events } from "./payload/collections/events";
import { Projects } from "./payload/collections/projects";
import { globals } from "./payload/globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    // Explicit rather than relying on sanitize's auto-detection of the first
    // auth-enabled collection — Users is the only one, but this is the
    // authoritative wiring for who can sign into /admin.
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  // The REST API must not mount at /api — this app already has 71 route
  // files under app/api/, and Payload's default catch-all would answer every
  // unmatched /api/* path with a Payload error instead of a 404.
  // /admin is free: Sanity's Studio lives at /studio.
  routes: { api: "/payload-api", admin: "/admin" },
  // Deliberately NOT idType: "uuid" — 310 of 446 Sanity ids are slug-like
  // (`tag-farmers`, `regional-community-page-oceania`), and uuid would reject
  // every one. Each collection declares its own custom text id field instead.
  db: postgresAdapter({
    pool: { connectionString: process.env.PAYLOAD_DATABASE_URL || "" },
  }),
  editor: lexicalEditor(),
  collections: [
    Users,
    Media,
    Tags,
    WorkTypes,
    ExpertiseAreas,
    Authors,
    Organizations,
    RegionalCommunities,
    CaseStudies,
    LivedExperiences,
    ResearchOutputs,
    Agendas,
    NewsPosts,
    DocsChapters,
    Testimonials,
    ProfilePrompts,
    ExternalSources,
    CaseStudyDrafts,
    Pages,
    RegionalCommunityPages,
    Events,
    Projects,
  ],
  globals,
  localization: {
    locales: [
      { label: "English", code: "en" },
      { label: "Español", code: "es" },
      { label: "Français", code: "fr" },
      { label: "العربية", code: "ar", rtl: true },
    ],
    defaultLocale: "en",
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  sharp,
});
