import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import sharp from "sharp";
import { Users } from "./payload/collections/users";
import { Media } from "./payload/collections/media";
import { Files } from "./payload/collections/files";
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
import { richTextEditor } from "./payload/blocks/rich-text-embeds";
import { payloadR2BucketName, payloadR2ClientConfig } from "./payload/storage/r2";
import { s3Storage } from "@payloadcms/storage-s3";

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
    // Never auto-push drizzle's schema at this database.
    //
    // @payloadcms/db-postgres runs pushDevSchema whenever
    // `NODE_ENV !== "production" && PAYLOAD_MIGRATING !== "true" && push !== false`
    // (dist/connect.js). All three hold for `pnpm dev` and for every import
    // script, so without this flag an ordinary dev server rewrites the schema
    // of a database that holds real content -- including 21 in-flight
    // moderation drafts. It has fired here before: payload_migrations still
    // carries drizzle's `{name:"dev",batch:"-1"}` marker from an earlier push.
    //
    // Schema changes go through `payload migrate:create` + `payload migrate`,
    // which set PAYLOAD_MIGRATING themselves and are unaffected by this.
    push: false,
  }),
  // The default lexical feature set PLUS the Portable Text embed vocabulary
  // (image / youtube / break / infoBox / story*) and the footnote inline
  // block, so a field that holds content converted by
  // lib/content/internal/lexical.ts can actually be opened in the admin. Set
  // here so bare `type: "richText"` fields (docsChapters.body,
  // researchOutputs.body, caseStudyDrafts.content, testimonials.quote)
  // inherit it; payload/fields/localized.ts sets the same editor for every
  // localizedRichText field. Adds no tables: richText is one jsonb column.
  editor: richTextEditor(),
  collections: [
    Users,
    Media,
    Files,
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
  plugins: [
    // Uploads live in Cloudflare R2, the object store this app already uses
    // (lib/r2.ts), reached through R2's S3-compatible API.
    //
    // `s3Storage`, not `@payloadcms/storage-r2`: that package's `bucket` is the
    // Cloudflare *Workers binding* (`env.MY_BUCKET`), which exists only inside
    // a Worker. This app deploys to Vercel on Node, so using it here means
    // hand-writing an S3-backed stand-in for a Workers runtime object — code
    // that would carry every upload in the CMS and could only ever be verified
    // against the live bucket. R2 is S3-compatible and `lib/r2.ts` already
    // drives it with `@aws-sdk/client-s3` on exactly this configuration
    // (`region: "auto"`, the account R2 endpoint, path-style addressing), so
    // the officially supported S3 adapter is both the smaller and the better
    // tested path. Every call it makes — headObject, ranged getObject,
    // putObject / multipart via @aws-sdk/lib-storage, deleteObject — is
    // supported by R2's S3 API.
    //
    // No `acl`: R2 has no object ACLs, and leaving it unset means no
    // `x-amz-acl` header is sent. No `signedDownloads` and no
    // `disablePayloadAccessControl`, so files keep being served through
    // Payload's own static handler on `/payload-api/...` — the same serving
    // path the R2 adapter gave us, which never exposed a bucket URL either.
    //
    // Left permanently enabled rather than gated on whether R2 env vars are
    // present: the S3 client is built lazily on the first upload, and
    // `enabled: false` would silently fall back to writing uploads to the
    // local disk. With it always on, a missing credential is a loud error on
    // the upload instead of a file quietly stored somewhere ephemeral.
    //
    // The `cms/` prefixes keep CMS assets clear of the collaboration-file key
    // layout (`public/…`, `members/…`) in case both share one bucket.
    s3Storage({
      bucket: payloadR2BucketName(),
      config: payloadR2ClientConfig(),
      collections: {
        media: { prefix: "cms/media" },
        files: { prefix: "cms/files" },
      },
    }),
  ],
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
