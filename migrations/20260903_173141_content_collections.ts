import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_themes" AS ENUM('displacement', 'livelihoods', 'youth', 'indigenous');
  CREATE TYPE "public"."enum_case_studies_populations" AS ENUM('youth', 'women', 'indigenous', 'farmers', 'displaced');
  CREATE TYPE "public"."enum_case_studies_authors_role" AS ENUM('lead', 'coauthor', 'contributor', 'advisor');
  CREATE TYPE "public"."enum_case_studies_topic" AS ENUM('climate-environment', 'mental-health', 'community-health', 'youth-education', 'policy-governance', 'technology-innovation', 'economic-development', 'cultural-arts', 'food-agriculture', 'urban-planning', 'human-rights', 'migration', 'gender-equality', 'disaster-resilience', 'digital-inclusion', 'other');
  CREATE TYPE "public"."enum_case_studies_layout" AS ENUM('story', 'feature', 'report');
  CREATE TYPE "public"."enum_case_studies_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_case_studies_location_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum_case_studies_moderation_status" AS ENUM('pending', 'rejected', 'revision', 'approved');
  CREATE TYPE "public"."enum_case_studies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__case_studies_v_version_themes" AS ENUM('displacement', 'livelihoods', 'youth', 'indigenous');
  CREATE TYPE "public"."enum__case_studies_v_version_populations" AS ENUM('youth', 'women', 'indigenous', 'farmers', 'displaced');
  CREATE TYPE "public"."enum__case_studies_v_version_authors_role" AS ENUM('lead', 'coauthor', 'contributor', 'advisor');
  CREATE TYPE "public"."enum__case_studies_v_version_topic" AS ENUM('climate-environment', 'mental-health', 'community-health', 'youth-education', 'policy-governance', 'technology-innovation', 'economic-development', 'cultural-arts', 'food-agriculture', 'urban-planning', 'human-rights', 'migration', 'gender-equality', 'disaster-resilience', 'digital-inclusion', 'other');
  CREATE TYPE "public"."enum__case_studies_v_version_layout" AS ENUM('story', 'feature', 'report');
  CREATE TYPE "public"."enum__case_studies_v_version_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__case_studies_v_version_location_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum__case_studies_v_version_moderation_status" AS ENUM('pending', 'rejected', 'revision', 'approved');
  CREATE TYPE "public"."enum__case_studies_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__case_studies_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_lived_experiences_themes" AS ENUM('displacement', 'livelihoods', 'youth', 'indigenous');
  CREATE TYPE "public"."enum_lived_experiences_populations" AS ENUM('youth', 'women', 'indigenous', 'farmers', 'displaced');
  CREATE TYPE "public"."enum_lived_experiences_format" AS ENUM('video', 'audio', 'written');
  CREATE TYPE "public"."enum_lived_experiences_video_source" AS ENUM('youtube', 'vimeo', 'upload');
  CREATE TYPE "public"."enum_lived_experiences_layout" AS ENUM('story', 'feature', 'report');
  CREATE TYPE "public"."enum_lived_experiences_place_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum_lived_experiences_moderation_status" AS ENUM('pending', 'rejected', 'revision', 'approved');
  CREATE TYPE "public"."enum_lived_experiences_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lived_experiences_v_version_themes" AS ENUM('displacement', 'livelihoods', 'youth', 'indigenous');
  CREATE TYPE "public"."enum__lived_experiences_v_version_populations" AS ENUM('youth', 'women', 'indigenous', 'farmers', 'displaced');
  CREATE TYPE "public"."enum__lived_experiences_v_version_format" AS ENUM('video', 'audio', 'written');
  CREATE TYPE "public"."enum__lived_experiences_v_version_video_source" AS ENUM('youtube', 'vimeo', 'upload');
  CREATE TYPE "public"."enum__lived_experiences_v_version_layout" AS ENUM('story', 'feature', 'report');
  CREATE TYPE "public"."enum__lived_experiences_v_version_place_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum__lived_experiences_v_version_moderation_status" AS ENUM('pending', 'rejected', 'revision', 'approved');
  CREATE TYPE "public"."enum__lived_experiences_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lived_experiences_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_research_outputs_versions_kind" AS ENUM('summary', 'full', 'brief', 'deck');
  CREATE TYPE "public"."enum_research_outputs_versions_lang" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_research_outputs_themes" AS ENUM('displacement', 'livelihoods', 'youth', 'indigenous');
  CREATE TYPE "public"."enum_research_outputs_populations" AS ENUM('youth', 'women', 'indigenous', 'farmers', 'displaced');
  CREATE TYPE "public"."enum_research_outputs_output_type" AS ENUM('report', 'toolkit', 'dataset-brief', 'guideline');
  CREATE TYPE "public"."enum_research_outputs_layout" AS ENUM('report', 'story', 'feature');
  CREATE TYPE "public"."enum_research_outputs_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_research_outputs_moderation_status" AS ENUM('pending', 'rejected', 'revision', 'approved');
  CREATE TYPE "public"."enum_research_outputs_place_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum_agendas_files_language" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_agendas_agenda_type" AS ENUM('annual', 'research', 'policy', 'technical', 'case-study', 'whitepaper', 'guidelines', 'agenda', 'minutes', 'other');
  CREATE TYPE "public"."enum_agendas_access_level" AS ENUM('public', 'registered', 'members');
  CREATE TYPE "public"."enum_news_posts_themes" AS ENUM('displacement', 'livelihoods', 'youth', 'indigenous');
  CREATE TYPE "public"."enum_news_posts_populations" AS ENUM('youth', 'women', 'indigenous', 'farmers', 'displaced');
  CREATE TYPE "public"."enum_news_posts_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_news_posts_place_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum_news_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_posts_v_version_themes" AS ENUM('displacement', 'livelihoods', 'youth', 'indigenous');
  CREATE TYPE "public"."enum__news_posts_v_version_populations" AS ENUM('youth', 'women', 'indigenous', 'farmers', 'displaced');
  CREATE TYPE "public"."enum__news_posts_v_version_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__news_posts_v_version_place_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum__news_posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_posts_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_testimonials_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonials_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonials_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_profile_prompts_category" AS ENUM('about', 'collaboration', 'lived-experience', 'research');
  CREATE TYPE "public"."enum_external_sources_language" AS ENUM('en', 'es', 'fr', 'ar', 'multi', 'other');
  CREATE TYPE "public"."enum_external_sources_source_type" AS ENUM('news', 'research', 'blog', 'report', 'press', 'policy', 'other');
  CREATE TYPE "public"."enum_case_study_drafts_authors_role" AS ENUM('lead', 'coauthor', 'contributor', 'advisor');
  CREATE TYPE "public"."enum_case_study_drafts_topic" AS ENUM('climate-environment', 'mental-health', 'community-health', 'youth-education', 'policy-governance', 'technology-innovation', 'economic-development', 'cultural-arts', 'food-agriculture', 'urban-planning', 'human-rights', 'migration', 'gender-equality', 'disaster-resilience', 'digital-inclusion', 'other');
  CREATE TABLE "case_studies_themes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_case_studies_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "case_studies_populations" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_case_studies_populations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "case_studies_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"user_id" varchar,
  	"name" varchar,
  	"email" varchar,
  	"role" "enum_case_studies_authors_role" DEFAULT 'coauthor',
  	"affiliation_id" varchar,
  	"clerk_user_id" varchar,
  	"clerk_username" varchar,
  	"clerk_image_url" varchar
  );
  
  CREATE TABLE "case_studies_study_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"location" geometry(Point),
  	"name" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "case_studies" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"image_asset_id" integer,
  	"image_caption" varchar,
  	"topic" "enum_case_studies_topic",
  	"layout" "enum_case_studies_layout" DEFAULT 'story',
  	"region" "enum_case_studies_region",
  	"submitted_by" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"study_period_start_date" timestamp(3) with time zone,
  	"study_period_end_date" timestamp(3) with time zone,
  	"location_text_country" varchar,
  	"location_text_city" varchar,
  	"study_location" geometry(Point),
  	"location_display_text" varchar,
  	"location_precision" "enum_case_studies_location_precision" DEFAULT 'city',
  	"location_country_code" varchar,
  	"related_community_id" varchar,
  	"moderation_status" "enum_case_studies_moderation_status" DEFAULT 'pending',
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"review_notes" varchar,
  	"reviewed_by_id" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"notified_status" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"canonical_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_case_studies_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "case_studies_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_studies_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" varchar,
  	"organizations_id" varchar
  );
  
  CREATE TABLE "_case_studies_v_version_themes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__case_studies_v_version_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_populations" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__case_studies_v_version_populations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_version_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar,
  	"name" varchar,
  	"email" varchar,
  	"role" "enum__case_studies_v_version_authors_role" DEFAULT 'coauthor',
  	"affiliation_id" varchar,
  	"clerk_user_id" varchar,
  	"clerk_username" varchar,
  	"clerk_image_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_version_study_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"location" geometry(Point),
  	"name" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_slug" varchar,
  	"version_image_asset_id" integer,
  	"version_image_caption" varchar,
  	"version_topic" "enum__case_studies_v_version_topic",
  	"version_layout" "enum__case_studies_v_version_layout" DEFAULT 'story',
  	"version_region" "enum__case_studies_v_version_region",
  	"version_submitted_by" varchar,
  	"version_submitted_at" timestamp(3) with time zone,
  	"version_study_period_start_date" timestamp(3) with time zone,
  	"version_study_period_end_date" timestamp(3) with time zone,
  	"version_location_text_country" varchar,
  	"version_location_text_city" varchar,
  	"version_study_location" geometry(Point),
  	"version_location_display_text" varchar,
  	"version_location_precision" "enum__case_studies_v_version_location_precision" DEFAULT 'city',
  	"version_location_country_code" varchar,
  	"version_related_community_id" varchar,
  	"version_moderation_status" "enum__case_studies_v_version_moderation_status" DEFAULT 'pending',
  	"version_featured" boolean DEFAULT false,
  	"version_published_at" timestamp(3) with time zone,
  	"version_review_notes" varchar,
  	"version_reviewed_by_id" varchar,
  	"version_reviewed_at" timestamp(3) with time zone,
  	"version_notified_status" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_canonical_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__case_studies_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__case_studies_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_case_studies_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" varchar,
  	"organizations_id" varchar
  );
  
  CREATE TABLE "lived_experiences_themes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_lived_experiences_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "lived_experiences_populations" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_lived_experiences_populations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "lived_experiences" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"format" "enum_lived_experiences_format" DEFAULT 'video',
  	"slug" varchar,
  	"video_source" "enum_lived_experiences_video_source",
  	"video_link" varchar,
  	"video_url" varchar,
  	"video_file_id" integer,
  	"thumbnail_asset_id" integer,
  	"duration" varchar,
  	"published_at" timestamp(3) with time zone,
  	"author_id" varchar,
  	"related_community_id" varchar,
  	"region_id" varchar,
  	"layout" "enum_lived_experiences_layout" DEFAULT 'story',
  	"location" geometry(Point),
  	"place_point" geometry(Point),
  	"place_text" varchar,
  	"place_precision" "enum_lived_experiences_place_precision" DEFAULT 'country',
  	"place_country_code" varchar,
  	"featured" boolean DEFAULT false,
  	"moderation_status" "enum_lived_experiences_moderation_status",
  	"submitted_by" varchar,
  	"review_notes" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"noindex" boolean DEFAULT false,
  	"og_image_asset_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lived_experiences_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "lived_experiences_locales" (
  	"title" varchar,
  	"description" varchar,
  	"issue" varchar,
  	"person_context" varchar,
  	"body" jsonb,
  	"thumbnail_alt" varchar,
  	"og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lived_experiences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"organizations_id" varchar,
  	"tags_id" varchar
  );
  
  CREATE TABLE "_lived_experiences_v_version_themes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__lived_experiences_v_version_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_lived_experiences_v_version_populations" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__lived_experiences_v_version_populations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_lived_experiences_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_format" "enum__lived_experiences_v_version_format" DEFAULT 'video',
  	"version_slug" varchar,
  	"version_video_source" "enum__lived_experiences_v_version_video_source",
  	"version_video_link" varchar,
  	"version_video_url" varchar,
  	"version_video_file_id" integer,
  	"version_thumbnail_asset_id" integer,
  	"version_duration" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" varchar,
  	"version_related_community_id" varchar,
  	"version_region_id" varchar,
  	"version_layout" "enum__lived_experiences_v_version_layout" DEFAULT 'story',
  	"version_location" geometry(Point),
  	"version_place_point" geometry(Point),
  	"version_place_text" varchar,
  	"version_place_precision" "enum__lived_experiences_v_version_place_precision" DEFAULT 'country',
  	"version_place_country_code" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_moderation_status" "enum__lived_experiences_v_version_moderation_status",
  	"version_submitted_by" varchar,
  	"version_review_notes" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_noindex" boolean DEFAULT false,
  	"version_og_image_asset_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lived_experiences_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__lived_experiences_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_lived_experiences_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_issue" varchar,
  	"version_person_context" varchar,
  	"version_body" jsonb,
  	"version_thumbnail_alt" varchar,
  	"version_og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_lived_experiences_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"organizations_id" varchar,
  	"tags_id" varchar
  );
  
  CREATE TABLE "research_outputs_versions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_research_outputs_versions_kind" NOT NULL,
  	"lang" "enum_research_outputs_versions_lang" NOT NULL,
  	"label" varchar,
  	"file_id" integer,
  	"body" jsonb,
  	"pages" numeric,
  	"download_count" numeric DEFAULT 0,
  	"last_downloaded" timestamp(3) with time zone
  );
  
  CREATE TABLE "research_outputs_themes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_research_outputs_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "research_outputs_populations" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_research_outputs_populations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "research_outputs" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"output_type" "enum_research_outputs_output_type" DEFAULT 'report' NOT NULL,
  	"layout" "enum_research_outputs_layout" DEFAULT 'report',
  	"cover_image_asset_id" integer,
  	"region" "enum_research_outputs_region",
  	"moderation_status" "enum_research_outputs_moderation_status" DEFAULT 'approved',
  	"submitted_by" varchar,
  	"review_notes" varchar,
  	"place_point" geometry(Point),
  	"place_text" varchar,
  	"place_precision" "enum_research_outputs_place_precision" DEFAULT 'city',
  	"place_country_code" varchar,
  	"publish_date" timestamp(3) with time zone,
  	"year" numeric,
  	"featured" boolean DEFAULT false,
  	"total_download_count" numeric DEFAULT 0,
  	"migrated_from_report" varchar,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "research_outputs_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar,
  	"cover_image_alt" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "research_outputs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"regional_communities_id" varchar,
  	"organizations_id" varchar,
  	"tags_id" varchar
  );
  
  CREATE TABLE "agendas_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_agendas_files_language" NOT NULL,
  	"file_id" integer NOT NULL,
  	"download_count" numeric DEFAULT 0,
  	"last_downloaded" timestamp(3) with time zone
  );
  
  CREATE TABLE "agendas" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"cover_image_asset_id" integer,
  	"agenda_type" "enum_agendas_agenda_type" NOT NULL,
  	"publish_date" timestamp(3) with time zone NOT NULL,
  	"year" numeric NOT NULL,
  	"total_download_count" numeric DEFAULT 0,
  	"featured" boolean DEFAULT false,
  	"access_level" "enum_agendas_access_level" DEFAULT 'public',
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "agendas_locales" (
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"description" varchar,
  	"cover_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "agendas_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"organizations_id" varchar,
  	"regional_communities_id" varchar,
  	"tags_id" varchar
  );
  
  CREATE TABLE "news_posts_themes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_news_posts_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "news_posts_populations" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_news_posts_populations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "news_posts_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "news_posts" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"author_id" varchar,
  	"published_at" timestamp(3) with time zone,
  	"image_asset_id" integer,
  	"related_community_id" varchar,
  	"region" "enum_news_posts_region",
  	"location" geometry(Point),
  	"place_point" geometry(Point),
  	"place_text" varchar,
  	"place_precision" "enum_news_posts_place_precision" DEFAULT 'city',
  	"place_country_code" varchar,
  	"location_details_city" varchar,
  	"location_details_country" varchar,
  	"location_details_region" varchar,
  	"featured" boolean DEFAULT false,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"noindex" boolean DEFAULT false,
  	"og_image_asset_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "news_posts_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"image_alt" varchar,
  	"og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "news_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"organizations_id" varchar,
  	"tags_id" varchar
  );
  
  CREATE TABLE "_news_posts_v_version_themes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__news_posts_v_version_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_news_posts_v_version_populations" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__news_posts_v_version_populations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_news_posts_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"date" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_slug" varchar,
  	"version_author_id" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_image_asset_id" integer,
  	"version_related_community_id" varchar,
  	"version_region" "enum__news_posts_v_version_region",
  	"version_location" geometry(Point),
  	"version_place_point" geometry(Point),
  	"version_place_text" varchar,
  	"version_place_precision" "enum__news_posts_v_version_place_precision" DEFAULT 'city',
  	"version_place_country_code" varchar,
  	"version_location_details_city" varchar,
  	"version_location_details_country" varchar,
  	"version_location_details_region" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_noindex" boolean DEFAULT false,
  	"version_og_image_asset_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__news_posts_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_news_posts_v_locales" (
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_image_alt" varchar,
  	"version_og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_news_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"organizations_id" varchar,
  	"tags_id" varchar
  );
  
  CREATE TABLE "docs_chapters" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" varchar DEFAULT 'global-agenda' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"order" numeric NOT NULL,
  	"body" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"title" varchar,
  	"image_asset_id" integer,
  	"body" jsonb,
  	"rating" numeric,
  	"related_community_id" varchar,
  	"organization_id" varchar,
  	"featured" boolean DEFAULT false,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_testimonials_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "testimonials_locales" (
  	"job_title" varchar,
  	"image_alt" varchar,
  	"quote" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_testimonials_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_name" varchar,
  	"version_title" varchar,
  	"version_image_asset_id" integer,
  	"version_body" jsonb,
  	"version_rating" numeric,
  	"version_related_community_id" varchar,
  	"version_organization_id" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_order_rank" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__testimonials_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__testimonials_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_testimonials_v_locales" (
  	"version_job_title" varchar,
  	"version_image_alt" varchar,
  	"version_quote" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "profile_prompts" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" "enum_profile_prompts_category" DEFAULT 'about',
  	"active" boolean DEFAULT true,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "profile_prompts_locales" (
  	"prompt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "external_sources_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "external_sources" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_url" varchar NOT NULL,
  	"publisher" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"image_asset_id" integer,
  	"related_community_id" varchar,
  	"language" "enum_external_sources_language" DEFAULT 'en',
  	"source_type" "enum_external_sources_source_type" DEFAULT 'news',
  	"featured" boolean DEFAULT false,
  	"approved" boolean DEFAULT true,
  	"added_by_id" varchar,
  	"added_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "external_sources_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "external_sources_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" varchar,
  	"organizations_id" varchar
  );
  
  CREATE TABLE "case_study_drafts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "case_study_drafts_selected_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "case_study_drafts_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"user_id" varchar,
  	"name" varchar,
  	"email" varchar,
  	"role" "enum_case_study_drafts_authors_role" DEFAULT 'coauthor',
  	"affiliation_id" varchar
  );
  
  CREATE TABLE "case_study_drafts_study_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"location" geometry(Point),
  	"name" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "case_study_drafts_form_metadata_completed_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "case_study_drafts" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"last_saved" timestamp(3) with time zone NOT NULL,
  	"topic" "enum_case_study_drafts_topic",
  	"content_language" varchar,
  	"content" jsonb,
  	"image_asset_id" integer,
  	"image_caption" varchar,
  	"study_period_start_date" timestamp(3) with time zone,
  	"study_period_end_date" timestamp(3) with time zone,
  	"location_text_country" varchar,
  	"location_text_city" varchar,
  	"study_location" geometry(Point),
  	"related_community" varchar,
  	"form_metadata_current_step" varchar,
  	"form_metadata_organization_name" varchar,
  	"organization_name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "case_study_drafts_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "case_study_drafts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"organizations_id" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "case_studies_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lived_experiences_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "research_outputs_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agendas_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "news_posts_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "docs_chapters_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "testimonials_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "profile_prompts_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "external_sources_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "case_study_drafts_id" varchar;
  ALTER TABLE "case_studies_themes" ADD CONSTRAINT "case_studies_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_populations" ADD CONSTRAINT "case_studies_populations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_authors" ADD CONSTRAINT "case_studies_authors_affiliation_id_organizations_id_fk" FOREIGN KEY ("affiliation_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_authors" ADD CONSTRAINT "case_studies_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_study_areas" ADD CONSTRAINT "case_studies_study_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_related_community_id_regional_communities_id_fk" FOREIGN KEY ("related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_reviewed_by_id_authors_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_locales" ADD CONSTRAINT "case_studies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_themes" ADD CONSTRAINT "_case_studies_v_version_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_populations" ADD CONSTRAINT "_case_studies_v_version_populations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_authors" ADD CONSTRAINT "_case_studies_v_version_authors_affiliation_id_organizations_id_fk" FOREIGN KEY ("affiliation_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_authors" ADD CONSTRAINT "_case_studies_v_version_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_study_areas" ADD CONSTRAINT "_case_studies_v_version_study_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_parent_id_case_studies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_image_asset_id_media_id_fk" FOREIGN KEY ("version_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_related_community_id_regional_communities_id_fk" FOREIGN KEY ("version_related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_reviewed_by_id_authors_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_locales" ADD CONSTRAINT "_case_studies_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lived_experiences_themes" ADD CONSTRAINT "lived_experiences_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lived_experiences_populations" ADD CONSTRAINT "lived_experiences_populations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lived_experiences" ADD CONSTRAINT "lived_experiences_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lived_experiences" ADD CONSTRAINT "lived_experiences_thumbnail_asset_id_media_id_fk" FOREIGN KEY ("thumbnail_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lived_experiences" ADD CONSTRAINT "lived_experiences_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lived_experiences" ADD CONSTRAINT "lived_experiences_related_community_id_regional_communities_id_fk" FOREIGN KEY ("related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lived_experiences" ADD CONSTRAINT "lived_experiences_region_id_regional_communities_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lived_experiences" ADD CONSTRAINT "lived_experiences_og_image_asset_id_media_id_fk" FOREIGN KEY ("og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lived_experiences_locales" ADD CONSTRAINT "lived_experiences_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lived_experiences_rels" ADD CONSTRAINT "lived_experiences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lived_experiences_rels" ADD CONSTRAINT "lived_experiences_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lived_experiences_rels" ADD CONSTRAINT "lived_experiences_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v_version_themes" ADD CONSTRAINT "_lived_experiences_v_version_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lived_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v_version_populations" ADD CONSTRAINT "_lived_experiences_v_version_populations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lived_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_parent_id_lived_experiences_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lived_experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_version_video_file_id_media_id_fk" FOREIGN KEY ("version_video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_version_thumbnail_asset_id_media_id_fk" FOREIGN KEY ("version_thumbnail_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_version_related_community_id_regional_communities_id_fk" FOREIGN KEY ("version_related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_version_region_id_regional_communities_id_fk" FOREIGN KEY ("version_region_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_version_og_image_asset_id_media_id_fk" FOREIGN KEY ("version_og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v_locales" ADD CONSTRAINT "_lived_experiences_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lived_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v_rels" ADD CONSTRAINT "_lived_experiences_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lived_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v_rels" ADD CONSTRAINT "_lived_experiences_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v_rels" ADD CONSTRAINT "_lived_experiences_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs_versions" ADD CONSTRAINT "research_outputs_versions_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "research_outputs_versions" ADD CONSTRAINT "research_outputs_versions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs_themes" ADD CONSTRAINT "research_outputs_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs_populations" ADD CONSTRAINT "research_outputs_populations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs" ADD CONSTRAINT "research_outputs_cover_image_asset_id_media_id_fk" FOREIGN KEY ("cover_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "research_outputs_locales" ADD CONSTRAINT "research_outputs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs_rels" ADD CONSTRAINT "research_outputs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs_rels" ADD CONSTRAINT "research_outputs_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs_rels" ADD CONSTRAINT "research_outputs_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs_rels" ADD CONSTRAINT "research_outputs_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agendas_files" ADD CONSTRAINT "agendas_files_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agendas_files" ADD CONSTRAINT "agendas_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agendas" ADD CONSTRAINT "agendas_cover_image_asset_id_media_id_fk" FOREIGN KEY ("cover_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agendas_locales" ADD CONSTRAINT "agendas_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agendas_rels" ADD CONSTRAINT "agendas_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agendas_rels" ADD CONSTRAINT "agendas_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agendas_rels" ADD CONSTRAINT "agendas_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agendas_rels" ADD CONSTRAINT "agendas_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_posts_themes" ADD CONSTRAINT "news_posts_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_posts_populations" ADD CONSTRAINT "news_posts_populations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_posts_sources" ADD CONSTRAINT "news_posts_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_related_community_id_regional_communities_id_fk" FOREIGN KEY ("related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_og_image_asset_id_media_id_fk" FOREIGN KEY ("og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_posts_locales" ADD CONSTRAINT "news_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_posts_rels" ADD CONSTRAINT "news_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_posts_rels" ADD CONSTRAINT "news_posts_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_posts_rels" ADD CONSTRAINT "news_posts_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_posts_v_version_themes" ADD CONSTRAINT "_news_posts_v_version_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_posts_v_version_populations" ADD CONSTRAINT "_news_posts_v_version_populations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_posts_v_version_sources" ADD CONSTRAINT "_news_posts_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_posts_v" ADD CONSTRAINT "_news_posts_v_parent_id_news_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_posts_v" ADD CONSTRAINT "_news_posts_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_posts_v" ADD CONSTRAINT "_news_posts_v_version_image_asset_id_media_id_fk" FOREIGN KEY ("version_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_posts_v" ADD CONSTRAINT "_news_posts_v_version_related_community_id_regional_communities_id_fk" FOREIGN KEY ("version_related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_posts_v" ADD CONSTRAINT "_news_posts_v_version_og_image_asset_id_media_id_fk" FOREIGN KEY ("version_og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_posts_v_locales" ADD CONSTRAINT "_news_posts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_posts_v_rels" ADD CONSTRAINT "_news_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_posts_v_rels" ADD CONSTRAINT "_news_posts_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_posts_v_rels" ADD CONSTRAINT "_news_posts_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_related_community_id_regional_communities_id_fk" FOREIGN KEY ("related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials_locales" ADD CONSTRAINT "testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_parent_id_testimonials_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_version_image_asset_id_media_id_fk" FOREIGN KEY ("version_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_version_related_community_id_regional_communities_id_fk" FOREIGN KEY ("version_related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_version_organization_id_organizations_id_fk" FOREIGN KEY ("version_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v_locales" ADD CONSTRAINT "_testimonials_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_testimonials_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profile_prompts_locales" ADD CONSTRAINT "profile_prompts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profile_prompts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_sources_authors" ADD CONSTRAINT "external_sources_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."external_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_sources" ADD CONSTRAINT "external_sources_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "external_sources" ADD CONSTRAINT "external_sources_related_community_id_regional_communities_id_fk" FOREIGN KEY ("related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "external_sources" ADD CONSTRAINT "external_sources_added_by_id_authors_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "external_sources_locales" ADD CONSTRAINT "external_sources_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."external_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_sources_rels" ADD CONSTRAINT "external_sources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."external_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_sources_rels" ADD CONSTRAINT "external_sources_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_sources_rels" ADD CONSTRAINT "external_sources_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_study_drafts_tags" ADD CONSTRAINT "case_study_drafts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_study_drafts_selected_tags" ADD CONSTRAINT "case_study_drafts_selected_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_study_drafts_authors" ADD CONSTRAINT "case_study_drafts_authors_affiliation_id_organizations_id_fk" FOREIGN KEY ("affiliation_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_study_drafts_authors" ADD CONSTRAINT "case_study_drafts_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_study_drafts_study_areas" ADD CONSTRAINT "case_study_drafts_study_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_study_drafts_form_metadata_completed_sections" ADD CONSTRAINT "case_study_drafts_form_metadata_completed_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_study_drafts" ADD CONSTRAINT "case_study_drafts_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_study_drafts_locales" ADD CONSTRAINT "case_study_drafts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_study_drafts_rels" ADD CONSTRAINT "case_study_drafts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_study_drafts_rels" ADD CONSTRAINT "case_study_drafts_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_themes_order_idx" ON "case_studies_themes" USING btree ("order");
  CREATE INDEX "case_studies_themes_parent_idx" ON "case_studies_themes" USING btree ("parent_id");
  CREATE INDEX "case_studies_populations_order_idx" ON "case_studies_populations" USING btree ("order");
  CREATE INDEX "case_studies_populations_parent_idx" ON "case_studies_populations" USING btree ("parent_id");
  CREATE INDEX "case_studies_authors_order_idx" ON "case_studies_authors" USING btree ("_order");
  CREATE INDEX "case_studies_authors_parent_id_idx" ON "case_studies_authors" USING btree ("_parent_id");
  CREATE INDEX "case_studies_authors_affiliation_idx" ON "case_studies_authors" USING btree ("affiliation_id");
  CREATE INDEX "case_studies_study_areas_order_idx" ON "case_studies_study_areas" USING btree ("_order");
  CREATE INDEX "case_studies_study_areas_parent_id_idx" ON "case_studies_study_areas" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_slug_idx" ON "case_studies" USING btree ("slug");
  CREATE INDEX "case_studies_image_image_asset_idx" ON "case_studies" USING btree ("image_asset_id");
  CREATE INDEX "case_studies_related_community_idx" ON "case_studies" USING btree ("related_community_id");
  CREATE INDEX "case_studies_reviewed_by_idx" ON "case_studies" USING btree ("reviewed_by_id");
  CREATE INDEX "case_studies_updated_at_idx" ON "case_studies" USING btree ("updated_at");
  CREATE INDEX "case_studies_created_at_idx" ON "case_studies" USING btree ("created_at");
  CREATE INDEX "case_studies__status_idx" ON "case_studies" USING btree ("_status");
  CREATE UNIQUE INDEX "case_studies_locales_locale_parent_id_unique" ON "case_studies_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_rels_order_idx" ON "case_studies_rels" USING btree ("order");
  CREATE INDEX "case_studies_rels_parent_idx" ON "case_studies_rels" USING btree ("parent_id");
  CREATE INDEX "case_studies_rels_path_idx" ON "case_studies_rels" USING btree ("path");
  CREATE INDEX "case_studies_rels_tags_id_idx" ON "case_studies_rels" USING btree ("tags_id");
  CREATE INDEX "case_studies_rels_organizations_id_idx" ON "case_studies_rels" USING btree ("organizations_id");
  CREATE INDEX "_case_studies_v_version_themes_order_idx" ON "_case_studies_v_version_themes" USING btree ("order");
  CREATE INDEX "_case_studies_v_version_themes_parent_idx" ON "_case_studies_v_version_themes" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_version_populations_order_idx" ON "_case_studies_v_version_populations" USING btree ("order");
  CREATE INDEX "_case_studies_v_version_populations_parent_idx" ON "_case_studies_v_version_populations" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_version_authors_order_idx" ON "_case_studies_v_version_authors" USING btree ("_order");
  CREATE INDEX "_case_studies_v_version_authors_parent_id_idx" ON "_case_studies_v_version_authors" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_version_authors_affiliation_idx" ON "_case_studies_v_version_authors" USING btree ("affiliation_id");
  CREATE INDEX "_case_studies_v_version_study_areas_order_idx" ON "_case_studies_v_version_study_areas" USING btree ("_order");
  CREATE INDEX "_case_studies_v_version_study_areas_parent_id_idx" ON "_case_studies_v_version_study_areas" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_parent_idx" ON "_case_studies_v" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_version_version_slug_idx" ON "_case_studies_v" USING btree ("version_slug");
  CREATE INDEX "_case_studies_v_version_image_version_image_asset_idx" ON "_case_studies_v" USING btree ("version_image_asset_id");
  CREATE INDEX "_case_studies_v_version_version_related_community_idx" ON "_case_studies_v" USING btree ("version_related_community_id");
  CREATE INDEX "_case_studies_v_version_version_reviewed_by_idx" ON "_case_studies_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_case_studies_v_version_version_updated_at_idx" ON "_case_studies_v" USING btree ("version_updated_at");
  CREATE INDEX "_case_studies_v_version_version_created_at_idx" ON "_case_studies_v" USING btree ("version_created_at");
  CREATE INDEX "_case_studies_v_version_version__status_idx" ON "_case_studies_v" USING btree ("version__status");
  CREATE INDEX "_case_studies_v_created_at_idx" ON "_case_studies_v" USING btree ("created_at");
  CREATE INDEX "_case_studies_v_updated_at_idx" ON "_case_studies_v" USING btree ("updated_at");
  CREATE INDEX "_case_studies_v_snapshot_idx" ON "_case_studies_v" USING btree ("snapshot");
  CREATE INDEX "_case_studies_v_published_locale_idx" ON "_case_studies_v" USING btree ("published_locale");
  CREATE INDEX "_case_studies_v_latest_idx" ON "_case_studies_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_case_studies_v_locales_locale_parent_id_unique" ON "_case_studies_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_rels_order_idx" ON "_case_studies_v_rels" USING btree ("order");
  CREATE INDEX "_case_studies_v_rels_parent_idx" ON "_case_studies_v_rels" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_rels_path_idx" ON "_case_studies_v_rels" USING btree ("path");
  CREATE INDEX "_case_studies_v_rels_tags_id_idx" ON "_case_studies_v_rels" USING btree ("tags_id");
  CREATE INDEX "_case_studies_v_rels_organizations_id_idx" ON "_case_studies_v_rels" USING btree ("organizations_id");
  CREATE INDEX "lived_experiences_themes_order_idx" ON "lived_experiences_themes" USING btree ("order");
  CREATE INDEX "lived_experiences_themes_parent_idx" ON "lived_experiences_themes" USING btree ("parent_id");
  CREATE INDEX "lived_experiences_populations_order_idx" ON "lived_experiences_populations" USING btree ("order");
  CREATE INDEX "lived_experiences_populations_parent_idx" ON "lived_experiences_populations" USING btree ("parent_id");
  CREATE UNIQUE INDEX "lived_experiences_slug_idx" ON "lived_experiences" USING btree ("slug");
  CREATE INDEX "lived_experiences_video_file_idx" ON "lived_experiences" USING btree ("video_file_id");
  CREATE INDEX "lived_experiences_thumbnail_thumbnail_asset_idx" ON "lived_experiences" USING btree ("thumbnail_asset_id");
  CREATE INDEX "lived_experiences_author_idx" ON "lived_experiences" USING btree ("author_id");
  CREATE INDEX "lived_experiences_related_community_idx" ON "lived_experiences" USING btree ("related_community_id");
  CREATE INDEX "lived_experiences_region_idx" ON "lived_experiences" USING btree ("region_id");
  CREATE INDEX "lived_experiences_og_image_og_image_asset_idx" ON "lived_experiences" USING btree ("og_image_asset_id");
  CREATE INDEX "lived_experiences_updated_at_idx" ON "lived_experiences" USING btree ("updated_at");
  CREATE INDEX "lived_experiences_created_at_idx" ON "lived_experiences" USING btree ("created_at");
  CREATE INDEX "lived_experiences__status_idx" ON "lived_experiences" USING btree ("_status");
  CREATE UNIQUE INDEX "lived_experiences_locales_locale_parent_id_unique" ON "lived_experiences_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lived_experiences_rels_order_idx" ON "lived_experiences_rels" USING btree ("order");
  CREATE INDEX "lived_experiences_rels_parent_idx" ON "lived_experiences_rels" USING btree ("parent_id");
  CREATE INDEX "lived_experiences_rels_path_idx" ON "lived_experiences_rels" USING btree ("path");
  CREATE INDEX "lived_experiences_rels_organizations_id_idx" ON "lived_experiences_rels" USING btree ("organizations_id");
  CREATE INDEX "lived_experiences_rels_tags_id_idx" ON "lived_experiences_rels" USING btree ("tags_id");
  CREATE INDEX "_lived_experiences_v_version_themes_order_idx" ON "_lived_experiences_v_version_themes" USING btree ("order");
  CREATE INDEX "_lived_experiences_v_version_themes_parent_idx" ON "_lived_experiences_v_version_themes" USING btree ("parent_id");
  CREATE INDEX "_lived_experiences_v_version_populations_order_idx" ON "_lived_experiences_v_version_populations" USING btree ("order");
  CREATE INDEX "_lived_experiences_v_version_populations_parent_idx" ON "_lived_experiences_v_version_populations" USING btree ("parent_id");
  CREATE INDEX "_lived_experiences_v_parent_idx" ON "_lived_experiences_v" USING btree ("parent_id");
  CREATE INDEX "_lived_experiences_v_version_version_slug_idx" ON "_lived_experiences_v" USING btree ("version_slug");
  CREATE INDEX "_lived_experiences_v_version_version_video_file_idx" ON "_lived_experiences_v" USING btree ("version_video_file_id");
  CREATE INDEX "_lived_experiences_v_version_thumbnail_version_thumbnail_idx" ON "_lived_experiences_v" USING btree ("version_thumbnail_asset_id");
  CREATE INDEX "_lived_experiences_v_version_version_author_idx" ON "_lived_experiences_v" USING btree ("version_author_id");
  CREATE INDEX "_lived_experiences_v_version_version_related_community_idx" ON "_lived_experiences_v" USING btree ("version_related_community_id");
  CREATE INDEX "_lived_experiences_v_version_version_region_idx" ON "_lived_experiences_v" USING btree ("version_region_id");
  CREATE INDEX "_lived_experiences_v_version_og_image_version_og_image_a_idx" ON "_lived_experiences_v" USING btree ("version_og_image_asset_id");
  CREATE INDEX "_lived_experiences_v_version_version_updated_at_idx" ON "_lived_experiences_v" USING btree ("version_updated_at");
  CREATE INDEX "_lived_experiences_v_version_version_created_at_idx" ON "_lived_experiences_v" USING btree ("version_created_at");
  CREATE INDEX "_lived_experiences_v_version_version__status_idx" ON "_lived_experiences_v" USING btree ("version__status");
  CREATE INDEX "_lived_experiences_v_created_at_idx" ON "_lived_experiences_v" USING btree ("created_at");
  CREATE INDEX "_lived_experiences_v_updated_at_idx" ON "_lived_experiences_v" USING btree ("updated_at");
  CREATE INDEX "_lived_experiences_v_snapshot_idx" ON "_lived_experiences_v" USING btree ("snapshot");
  CREATE INDEX "_lived_experiences_v_published_locale_idx" ON "_lived_experiences_v" USING btree ("published_locale");
  CREATE INDEX "_lived_experiences_v_latest_idx" ON "_lived_experiences_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_lived_experiences_v_locales_locale_parent_id_unique" ON "_lived_experiences_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lived_experiences_v_rels_order_idx" ON "_lived_experiences_v_rels" USING btree ("order");
  CREATE INDEX "_lived_experiences_v_rels_parent_idx" ON "_lived_experiences_v_rels" USING btree ("parent_id");
  CREATE INDEX "_lived_experiences_v_rels_path_idx" ON "_lived_experiences_v_rels" USING btree ("path");
  CREATE INDEX "_lived_experiences_v_rels_organizations_id_idx" ON "_lived_experiences_v_rels" USING btree ("organizations_id");
  CREATE INDEX "_lived_experiences_v_rels_tags_id_idx" ON "_lived_experiences_v_rels" USING btree ("tags_id");
  CREATE INDEX "research_outputs_versions_order_idx" ON "research_outputs_versions" USING btree ("_order");
  CREATE INDEX "research_outputs_versions_parent_id_idx" ON "research_outputs_versions" USING btree ("_parent_id");
  CREATE INDEX "research_outputs_versions_file_idx" ON "research_outputs_versions" USING btree ("file_id");
  CREATE INDEX "research_outputs_themes_order_idx" ON "research_outputs_themes" USING btree ("order");
  CREATE INDEX "research_outputs_themes_parent_idx" ON "research_outputs_themes" USING btree ("parent_id");
  CREATE INDEX "research_outputs_populations_order_idx" ON "research_outputs_populations" USING btree ("order");
  CREATE INDEX "research_outputs_populations_parent_idx" ON "research_outputs_populations" USING btree ("parent_id");
  CREATE UNIQUE INDEX "research_outputs_slug_idx" ON "research_outputs" USING btree ("slug");
  CREATE INDEX "research_outputs_cover_image_cover_image_asset_idx" ON "research_outputs" USING btree ("cover_image_asset_id");
  CREATE INDEX "research_outputs_updated_at_idx" ON "research_outputs" USING btree ("updated_at");
  CREATE INDEX "research_outputs_created_at_idx" ON "research_outputs" USING btree ("created_at");
  CREATE UNIQUE INDEX "research_outputs_locales_locale_parent_id_unique" ON "research_outputs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "research_outputs_rels_order_idx" ON "research_outputs_rels" USING btree ("order");
  CREATE INDEX "research_outputs_rels_parent_idx" ON "research_outputs_rels" USING btree ("parent_id");
  CREATE INDEX "research_outputs_rels_path_idx" ON "research_outputs_rels" USING btree ("path");
  CREATE INDEX "research_outputs_rels_regional_communities_id_idx" ON "research_outputs_rels" USING btree ("regional_communities_id");
  CREATE INDEX "research_outputs_rels_organizations_id_idx" ON "research_outputs_rels" USING btree ("organizations_id");
  CREATE INDEX "research_outputs_rels_tags_id_idx" ON "research_outputs_rels" USING btree ("tags_id");
  CREATE INDEX "agendas_files_order_idx" ON "agendas_files" USING btree ("_order");
  CREATE INDEX "agendas_files_parent_id_idx" ON "agendas_files" USING btree ("_parent_id");
  CREATE INDEX "agendas_files_file_idx" ON "agendas_files" USING btree ("file_id");
  CREATE UNIQUE INDEX "agendas_slug_idx" ON "agendas" USING btree ("slug");
  CREATE INDEX "agendas_cover_image_cover_image_asset_idx" ON "agendas" USING btree ("cover_image_asset_id");
  CREATE INDEX "agendas_updated_at_idx" ON "agendas" USING btree ("updated_at");
  CREATE INDEX "agendas_created_at_idx" ON "agendas" USING btree ("created_at");
  CREATE UNIQUE INDEX "agendas_locales_locale_parent_id_unique" ON "agendas_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "agendas_rels_order_idx" ON "agendas_rels" USING btree ("order");
  CREATE INDEX "agendas_rels_parent_idx" ON "agendas_rels" USING btree ("parent_id");
  CREATE INDEX "agendas_rels_path_idx" ON "agendas_rels" USING btree ("path");
  CREATE INDEX "agendas_rels_organizations_id_idx" ON "agendas_rels" USING btree ("organizations_id");
  CREATE INDEX "agendas_rels_regional_communities_id_idx" ON "agendas_rels" USING btree ("regional_communities_id");
  CREATE INDEX "agendas_rels_tags_id_idx" ON "agendas_rels" USING btree ("tags_id");
  CREATE INDEX "news_posts_themes_order_idx" ON "news_posts_themes" USING btree ("order");
  CREATE INDEX "news_posts_themes_parent_idx" ON "news_posts_themes" USING btree ("parent_id");
  CREATE INDEX "news_posts_populations_order_idx" ON "news_posts_populations" USING btree ("order");
  CREATE INDEX "news_posts_populations_parent_idx" ON "news_posts_populations" USING btree ("parent_id");
  CREATE INDEX "news_posts_sources_order_idx" ON "news_posts_sources" USING btree ("_order");
  CREATE INDEX "news_posts_sources_parent_id_idx" ON "news_posts_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "news_posts_slug_idx" ON "news_posts" USING btree ("slug");
  CREATE INDEX "news_posts_author_idx" ON "news_posts" USING btree ("author_id");
  CREATE INDEX "news_posts_image_image_asset_idx" ON "news_posts" USING btree ("image_asset_id");
  CREATE INDEX "news_posts_related_community_idx" ON "news_posts" USING btree ("related_community_id");
  CREATE INDEX "news_posts_og_image_og_image_asset_idx" ON "news_posts" USING btree ("og_image_asset_id");
  CREATE INDEX "news_posts_updated_at_idx" ON "news_posts" USING btree ("updated_at");
  CREATE INDEX "news_posts_created_at_idx" ON "news_posts" USING btree ("created_at");
  CREATE INDEX "news_posts__status_idx" ON "news_posts" USING btree ("_status");
  CREATE UNIQUE INDEX "news_posts_locales_locale_parent_id_unique" ON "news_posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_posts_rels_order_idx" ON "news_posts_rels" USING btree ("order");
  CREATE INDEX "news_posts_rels_parent_idx" ON "news_posts_rels" USING btree ("parent_id");
  CREATE INDEX "news_posts_rels_path_idx" ON "news_posts_rels" USING btree ("path");
  CREATE INDEX "news_posts_rels_organizations_id_idx" ON "news_posts_rels" USING btree ("organizations_id");
  CREATE INDEX "news_posts_rels_tags_id_idx" ON "news_posts_rels" USING btree ("tags_id");
  CREATE INDEX "_news_posts_v_version_themes_order_idx" ON "_news_posts_v_version_themes" USING btree ("order");
  CREATE INDEX "_news_posts_v_version_themes_parent_idx" ON "_news_posts_v_version_themes" USING btree ("parent_id");
  CREATE INDEX "_news_posts_v_version_populations_order_idx" ON "_news_posts_v_version_populations" USING btree ("order");
  CREATE INDEX "_news_posts_v_version_populations_parent_idx" ON "_news_posts_v_version_populations" USING btree ("parent_id");
  CREATE INDEX "_news_posts_v_version_sources_order_idx" ON "_news_posts_v_version_sources" USING btree ("_order");
  CREATE INDEX "_news_posts_v_version_sources_parent_id_idx" ON "_news_posts_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_news_posts_v_parent_idx" ON "_news_posts_v" USING btree ("parent_id");
  CREATE INDEX "_news_posts_v_version_version_slug_idx" ON "_news_posts_v" USING btree ("version_slug");
  CREATE INDEX "_news_posts_v_version_version_author_idx" ON "_news_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_news_posts_v_version_image_version_image_asset_idx" ON "_news_posts_v" USING btree ("version_image_asset_id");
  CREATE INDEX "_news_posts_v_version_version_related_community_idx" ON "_news_posts_v" USING btree ("version_related_community_id");
  CREATE INDEX "_news_posts_v_version_og_image_version_og_image_asset_idx" ON "_news_posts_v" USING btree ("version_og_image_asset_id");
  CREATE INDEX "_news_posts_v_version_version_updated_at_idx" ON "_news_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_posts_v_version_version_created_at_idx" ON "_news_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_news_posts_v_version_version__status_idx" ON "_news_posts_v" USING btree ("version__status");
  CREATE INDEX "_news_posts_v_created_at_idx" ON "_news_posts_v" USING btree ("created_at");
  CREATE INDEX "_news_posts_v_updated_at_idx" ON "_news_posts_v" USING btree ("updated_at");
  CREATE INDEX "_news_posts_v_snapshot_idx" ON "_news_posts_v" USING btree ("snapshot");
  CREATE INDEX "_news_posts_v_published_locale_idx" ON "_news_posts_v" USING btree ("published_locale");
  CREATE INDEX "_news_posts_v_latest_idx" ON "_news_posts_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_news_posts_v_locales_locale_parent_id_unique" ON "_news_posts_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_posts_v_rels_order_idx" ON "_news_posts_v_rels" USING btree ("order");
  CREATE INDEX "_news_posts_v_rels_parent_idx" ON "_news_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_news_posts_v_rels_path_idx" ON "_news_posts_v_rels" USING btree ("path");
  CREATE INDEX "_news_posts_v_rels_organizations_id_idx" ON "_news_posts_v_rels" USING btree ("organizations_id");
  CREATE INDEX "_news_posts_v_rels_tags_id_idx" ON "_news_posts_v_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "docs_chapters_slug_idx" ON "docs_chapters" USING btree ("slug");
  CREATE INDEX "docs_chapters_updated_at_idx" ON "docs_chapters" USING btree ("updated_at");
  CREATE INDEX "docs_chapters_created_at_idx" ON "docs_chapters" USING btree ("created_at");
  CREATE INDEX "testimonials_image_image_asset_idx" ON "testimonials" USING btree ("image_asset_id");
  CREATE INDEX "testimonials_related_community_idx" ON "testimonials" USING btree ("related_community_id");
  CREATE INDEX "testimonials_organization_idx" ON "testimonials" USING btree ("organization_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "testimonials__status_idx" ON "testimonials" USING btree ("_status");
  CREATE UNIQUE INDEX "testimonials_locales_locale_parent_id_unique" ON "testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_testimonials_v_parent_idx" ON "_testimonials_v" USING btree ("parent_id");
  CREATE INDEX "_testimonials_v_version_image_version_image_asset_idx" ON "_testimonials_v" USING btree ("version_image_asset_id");
  CREATE INDEX "_testimonials_v_version_version_related_community_idx" ON "_testimonials_v" USING btree ("version_related_community_id");
  CREATE INDEX "_testimonials_v_version_version_organization_idx" ON "_testimonials_v" USING btree ("version_organization_id");
  CREATE INDEX "_testimonials_v_version_version_updated_at_idx" ON "_testimonials_v" USING btree ("version_updated_at");
  CREATE INDEX "_testimonials_v_version_version_created_at_idx" ON "_testimonials_v" USING btree ("version_created_at");
  CREATE INDEX "_testimonials_v_version_version__status_idx" ON "_testimonials_v" USING btree ("version__status");
  CREATE INDEX "_testimonials_v_created_at_idx" ON "_testimonials_v" USING btree ("created_at");
  CREATE INDEX "_testimonials_v_updated_at_idx" ON "_testimonials_v" USING btree ("updated_at");
  CREATE INDEX "_testimonials_v_snapshot_idx" ON "_testimonials_v" USING btree ("snapshot");
  CREATE INDEX "_testimonials_v_published_locale_idx" ON "_testimonials_v" USING btree ("published_locale");
  CREATE INDEX "_testimonials_v_latest_idx" ON "_testimonials_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_testimonials_v_locales_locale_parent_id_unique" ON "_testimonials_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "profile_prompts_updated_at_idx" ON "profile_prompts" USING btree ("updated_at");
  CREATE INDEX "profile_prompts_created_at_idx" ON "profile_prompts" USING btree ("created_at");
  CREATE UNIQUE INDEX "profile_prompts_locales_locale_parent_id_unique" ON "profile_prompts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "external_sources_authors_order_idx" ON "external_sources_authors" USING btree ("_order");
  CREATE INDEX "external_sources_authors_parent_id_idx" ON "external_sources_authors" USING btree ("_parent_id");
  CREATE INDEX "external_sources_image_image_asset_idx" ON "external_sources" USING btree ("image_asset_id");
  CREATE INDEX "external_sources_related_community_idx" ON "external_sources" USING btree ("related_community_id");
  CREATE INDEX "external_sources_added_by_idx" ON "external_sources" USING btree ("added_by_id");
  CREATE INDEX "external_sources_updated_at_idx" ON "external_sources" USING btree ("updated_at");
  CREATE INDEX "external_sources_created_at_idx" ON "external_sources" USING btree ("created_at");
  CREATE UNIQUE INDEX "external_sources_locales_locale_parent_id_unique" ON "external_sources_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "external_sources_rels_order_idx" ON "external_sources_rels" USING btree ("order");
  CREATE INDEX "external_sources_rels_parent_idx" ON "external_sources_rels" USING btree ("parent_id");
  CREATE INDEX "external_sources_rels_path_idx" ON "external_sources_rels" USING btree ("path");
  CREATE INDEX "external_sources_rels_tags_id_idx" ON "external_sources_rels" USING btree ("tags_id");
  CREATE INDEX "external_sources_rels_organizations_id_idx" ON "external_sources_rels" USING btree ("organizations_id");
  CREATE INDEX "case_study_drafts_tags_order_idx" ON "case_study_drafts_tags" USING btree ("_order");
  CREATE INDEX "case_study_drafts_tags_parent_id_idx" ON "case_study_drafts_tags" USING btree ("_parent_id");
  CREATE INDEX "case_study_drafts_selected_tags_order_idx" ON "case_study_drafts_selected_tags" USING btree ("_order");
  CREATE INDEX "case_study_drafts_selected_tags_parent_id_idx" ON "case_study_drafts_selected_tags" USING btree ("_parent_id");
  CREATE INDEX "case_study_drafts_authors_order_idx" ON "case_study_drafts_authors" USING btree ("_order");
  CREATE INDEX "case_study_drafts_authors_parent_id_idx" ON "case_study_drafts_authors" USING btree ("_parent_id");
  CREATE INDEX "case_study_drafts_authors_affiliation_idx" ON "case_study_drafts_authors" USING btree ("affiliation_id");
  CREATE INDEX "case_study_drafts_study_areas_order_idx" ON "case_study_drafts_study_areas" USING btree ("_order");
  CREATE INDEX "case_study_drafts_study_areas_parent_id_idx" ON "case_study_drafts_study_areas" USING btree ("_parent_id");
  CREATE INDEX "case_study_drafts_form_metadata_completed_sections_order_idx" ON "case_study_drafts_form_metadata_completed_sections" USING btree ("_order");
  CREATE INDEX "case_study_drafts_form_metadata_completed_sections_parent_id_idx" ON "case_study_drafts_form_metadata_completed_sections" USING btree ("_parent_id");
  CREATE INDEX "case_study_drafts_image_image_asset_idx" ON "case_study_drafts" USING btree ("image_asset_id");
  CREATE INDEX "case_study_drafts_updated_at_idx" ON "case_study_drafts" USING btree ("updated_at");
  CREATE INDEX "case_study_drafts_created_at_idx" ON "case_study_drafts" USING btree ("created_at");
  CREATE UNIQUE INDEX "case_study_drafts_locales_locale_parent_id_unique" ON "case_study_drafts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_study_drafts_rels_order_idx" ON "case_study_drafts_rels" USING btree ("order");
  CREATE INDEX "case_study_drafts_rels_parent_idx" ON "case_study_drafts_rels" USING btree ("parent_id");
  CREATE INDEX "case_study_drafts_rels_path_idx" ON "case_study_drafts_rels" USING btree ("path");
  CREATE INDEX "case_study_drafts_rels_organizations_id_idx" ON "case_study_drafts_rels" USING btree ("organizations_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_docs_chapters_fk" FOREIGN KEY ("docs_chapters_id") REFERENCES "public"."docs_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_prompts_fk" FOREIGN KEY ("profile_prompts_id") REFERENCES "public"."profile_prompts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_external_sources_fk" FOREIGN KEY ("external_sources_id") REFERENCES "public"."external_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_case_study_drafts_fk" FOREIGN KEY ("case_study_drafts_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_case_studies_id_idx" ON "payload_locked_documents_rels" USING btree ("case_studies_id");
  CREATE INDEX "payload_locked_documents_rels_lived_experiences_id_idx" ON "payload_locked_documents_rels" USING btree ("lived_experiences_id");
  CREATE INDEX "payload_locked_documents_rels_research_outputs_id_idx" ON "payload_locked_documents_rels" USING btree ("research_outputs_id");
  CREATE INDEX "payload_locked_documents_rels_agendas_id_idx" ON "payload_locked_documents_rels" USING btree ("agendas_id");
  CREATE INDEX "payload_locked_documents_rels_news_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("news_posts_id");
  CREATE INDEX "payload_locked_documents_rels_docs_chapters_id_idx" ON "payload_locked_documents_rels" USING btree ("docs_chapters_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_profile_prompts_id_idx" ON "payload_locked_documents_rels" USING btree ("profile_prompts_id");
  CREATE INDEX "payload_locked_documents_rels_external_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("external_sources_id");
  CREATE INDEX "payload_locked_documents_rels_case_study_drafts_id_idx" ON "payload_locked_documents_rels" USING btree ("case_study_drafts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_populations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_study_areas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_populations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_study_areas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lived_experiences_themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lived_experiences_populations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lived_experiences" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lived_experiences_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lived_experiences_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lived_experiences_v_version_themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lived_experiences_v_version_populations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lived_experiences_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lived_experiences_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lived_experiences_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "research_outputs_versions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "research_outputs_themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "research_outputs_populations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "research_outputs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "research_outputs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "research_outputs_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agendas_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agendas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agendas_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agendas_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_posts_themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_posts_populations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_posts_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_posts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_posts_v_version_themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_posts_v_version_populations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_posts_v_version_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_posts_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_posts_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "docs_chapters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_testimonials_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_testimonials_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "profile_prompts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "profile_prompts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "external_sources_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "external_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "external_sources_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "external_sources_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_study_drafts_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_study_drafts_selected_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_study_drafts_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_study_drafts_study_areas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_study_drafts_form_metadata_completed_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_study_drafts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_study_drafts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_study_drafts_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "case_studies_themes" CASCADE;
  DROP TABLE "case_studies_populations" CASCADE;
  DROP TABLE "case_studies_authors" CASCADE;
  DROP TABLE "case_studies_study_areas" CASCADE;
  DROP TABLE "case_studies" CASCADE;
  DROP TABLE "case_studies_locales" CASCADE;
  DROP TABLE "case_studies_rels" CASCADE;
  DROP TABLE "_case_studies_v_version_themes" CASCADE;
  DROP TABLE "_case_studies_v_version_populations" CASCADE;
  DROP TABLE "_case_studies_v_version_authors" CASCADE;
  DROP TABLE "_case_studies_v_version_study_areas" CASCADE;
  DROP TABLE "_case_studies_v" CASCADE;
  DROP TABLE "_case_studies_v_locales" CASCADE;
  DROP TABLE "_case_studies_v_rels" CASCADE;
  DROP TABLE "lived_experiences_themes" CASCADE;
  DROP TABLE "lived_experiences_populations" CASCADE;
  DROP TABLE "lived_experiences" CASCADE;
  DROP TABLE "lived_experiences_locales" CASCADE;
  DROP TABLE "lived_experiences_rels" CASCADE;
  DROP TABLE "_lived_experiences_v_version_themes" CASCADE;
  DROP TABLE "_lived_experiences_v_version_populations" CASCADE;
  DROP TABLE "_lived_experiences_v" CASCADE;
  DROP TABLE "_lived_experiences_v_locales" CASCADE;
  DROP TABLE "_lived_experiences_v_rels" CASCADE;
  DROP TABLE "research_outputs_versions" CASCADE;
  DROP TABLE "research_outputs_themes" CASCADE;
  DROP TABLE "research_outputs_populations" CASCADE;
  DROP TABLE "research_outputs" CASCADE;
  DROP TABLE "research_outputs_locales" CASCADE;
  DROP TABLE "research_outputs_rels" CASCADE;
  DROP TABLE "agendas_files" CASCADE;
  DROP TABLE "agendas" CASCADE;
  DROP TABLE "agendas_locales" CASCADE;
  DROP TABLE "agendas_rels" CASCADE;
  DROP TABLE "news_posts_themes" CASCADE;
  DROP TABLE "news_posts_populations" CASCADE;
  DROP TABLE "news_posts_sources" CASCADE;
  DROP TABLE "news_posts" CASCADE;
  DROP TABLE "news_posts_locales" CASCADE;
  DROP TABLE "news_posts_rels" CASCADE;
  DROP TABLE "_news_posts_v_version_themes" CASCADE;
  DROP TABLE "_news_posts_v_version_populations" CASCADE;
  DROP TABLE "_news_posts_v_version_sources" CASCADE;
  DROP TABLE "_news_posts_v" CASCADE;
  DROP TABLE "_news_posts_v_locales" CASCADE;
  DROP TABLE "_news_posts_v_rels" CASCADE;
  DROP TABLE "docs_chapters" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "testimonials_locales" CASCADE;
  DROP TABLE "_testimonials_v" CASCADE;
  DROP TABLE "_testimonials_v_locales" CASCADE;
  DROP TABLE "profile_prompts" CASCADE;
  DROP TABLE "profile_prompts_locales" CASCADE;
  DROP TABLE "external_sources_authors" CASCADE;
  DROP TABLE "external_sources" CASCADE;
  DROP TABLE "external_sources_locales" CASCADE;
  DROP TABLE "external_sources_rels" CASCADE;
  DROP TABLE "case_study_drafts_tags" CASCADE;
  DROP TABLE "case_study_drafts_selected_tags" CASCADE;
  DROP TABLE "case_study_drafts_authors" CASCADE;
  DROP TABLE "case_study_drafts_study_areas" CASCADE;
  DROP TABLE "case_study_drafts_form_metadata_completed_sections" CASCADE;
  DROP TABLE "case_study_drafts" CASCADE;
  DROP TABLE "case_study_drafts_locales" CASCADE;
  DROP TABLE "case_study_drafts_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_case_studies_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lived_experiences_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_research_outputs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agendas_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_news_posts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_docs_chapters_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_testimonials_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_profile_prompts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_external_sources_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_case_study_drafts_fk";
  
  DROP INDEX "payload_locked_documents_rels_case_studies_id_idx";
  DROP INDEX "payload_locked_documents_rels_lived_experiences_id_idx";
  DROP INDEX "payload_locked_documents_rels_research_outputs_id_idx";
  DROP INDEX "payload_locked_documents_rels_agendas_id_idx";
  DROP INDEX "payload_locked_documents_rels_news_posts_id_idx";
  DROP INDEX "payload_locked_documents_rels_docs_chapters_id_idx";
  DROP INDEX "payload_locked_documents_rels_testimonials_id_idx";
  DROP INDEX "payload_locked_documents_rels_profile_prompts_id_idx";
  DROP INDEX "payload_locked_documents_rels_external_sources_id_idx";
  DROP INDEX "payload_locked_documents_rels_case_study_drafts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "case_studies_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lived_experiences_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "research_outputs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agendas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "news_posts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "docs_chapters_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "profile_prompts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "external_sources_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "case_study_drafts_id";
  DROP TYPE "public"."enum_case_studies_themes";
  DROP TYPE "public"."enum_case_studies_populations";
  DROP TYPE "public"."enum_case_studies_authors_role";
  DROP TYPE "public"."enum_case_studies_topic";
  DROP TYPE "public"."enum_case_studies_layout";
  DROP TYPE "public"."enum_case_studies_region";
  DROP TYPE "public"."enum_case_studies_location_precision";
  DROP TYPE "public"."enum_case_studies_moderation_status";
  DROP TYPE "public"."enum_case_studies_status";
  DROP TYPE "public"."enum__case_studies_v_version_themes";
  DROP TYPE "public"."enum__case_studies_v_version_populations";
  DROP TYPE "public"."enum__case_studies_v_version_authors_role";
  DROP TYPE "public"."enum__case_studies_v_version_topic";
  DROP TYPE "public"."enum__case_studies_v_version_layout";
  DROP TYPE "public"."enum__case_studies_v_version_region";
  DROP TYPE "public"."enum__case_studies_v_version_location_precision";
  DROP TYPE "public"."enum__case_studies_v_version_moderation_status";
  DROP TYPE "public"."enum__case_studies_v_version_status";
  DROP TYPE "public"."enum__case_studies_v_published_locale";
  DROP TYPE "public"."enum_lived_experiences_themes";
  DROP TYPE "public"."enum_lived_experiences_populations";
  DROP TYPE "public"."enum_lived_experiences_format";
  DROP TYPE "public"."enum_lived_experiences_video_source";
  DROP TYPE "public"."enum_lived_experiences_layout";
  DROP TYPE "public"."enum_lived_experiences_place_precision";
  DROP TYPE "public"."enum_lived_experiences_moderation_status";
  DROP TYPE "public"."enum_lived_experiences_status";
  DROP TYPE "public"."enum__lived_experiences_v_version_themes";
  DROP TYPE "public"."enum__lived_experiences_v_version_populations";
  DROP TYPE "public"."enum__lived_experiences_v_version_format";
  DROP TYPE "public"."enum__lived_experiences_v_version_video_source";
  DROP TYPE "public"."enum__lived_experiences_v_version_layout";
  DROP TYPE "public"."enum__lived_experiences_v_version_place_precision";
  DROP TYPE "public"."enum__lived_experiences_v_version_moderation_status";
  DROP TYPE "public"."enum__lived_experiences_v_version_status";
  DROP TYPE "public"."enum__lived_experiences_v_published_locale";
  DROP TYPE "public"."enum_research_outputs_versions_kind";
  DROP TYPE "public"."enum_research_outputs_versions_lang";
  DROP TYPE "public"."enum_research_outputs_themes";
  DROP TYPE "public"."enum_research_outputs_populations";
  DROP TYPE "public"."enum_research_outputs_output_type";
  DROP TYPE "public"."enum_research_outputs_layout";
  DROP TYPE "public"."enum_research_outputs_region";
  DROP TYPE "public"."enum_research_outputs_moderation_status";
  DROP TYPE "public"."enum_research_outputs_place_precision";
  DROP TYPE "public"."enum_agendas_files_language";
  DROP TYPE "public"."enum_agendas_agenda_type";
  DROP TYPE "public"."enum_agendas_access_level";
  DROP TYPE "public"."enum_news_posts_themes";
  DROP TYPE "public"."enum_news_posts_populations";
  DROP TYPE "public"."enum_news_posts_region";
  DROP TYPE "public"."enum_news_posts_place_precision";
  DROP TYPE "public"."enum_news_posts_status";
  DROP TYPE "public"."enum__news_posts_v_version_themes";
  DROP TYPE "public"."enum__news_posts_v_version_populations";
  DROP TYPE "public"."enum__news_posts_v_version_region";
  DROP TYPE "public"."enum__news_posts_v_version_place_precision";
  DROP TYPE "public"."enum__news_posts_v_version_status";
  DROP TYPE "public"."enum__news_posts_v_published_locale";
  DROP TYPE "public"."enum_testimonials_status";
  DROP TYPE "public"."enum__testimonials_v_version_status";
  DROP TYPE "public"."enum__testimonials_v_published_locale";
  DROP TYPE "public"."enum_profile_prompts_category";
  DROP TYPE "public"."enum_external_sources_language";
  DROP TYPE "public"."enum_external_sources_source_type";
  DROP TYPE "public"."enum_case_study_drafts_authors_role";
  DROP TYPE "public"."enum_case_study_drafts_topic";`)
}
