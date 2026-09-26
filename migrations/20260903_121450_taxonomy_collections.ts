import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_users_role" AS ENUM('community_member', 'community_editor', 'team_editor', 'admin');
  CREATE TYPE "public"."enum_tags_category" AS ENUM('topic', 'location', 'method', 'audience', 'impact', 'other');
  CREATE TYPE "public"."enum_tags_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__tags_v_version_category" AS ENUM('topic', 'location', 'method', 'audience', 'impact', 'other');
  CREATE TYPE "public"."enum__tags_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__tags_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_authors_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__authors_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__authors_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_organizations_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_organizations_place_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum_regional_communities_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"clerk_id" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'community_member' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "tags" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"category" "enum_tags_category" DEFAULT 'topic',
  	"color" varchar DEFAULT '#205596',
  	"use_as_theme" boolean DEFAULT false,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_tags_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "tags_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_tags_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_value" varchar,
  	"version_category" "enum__tags_v_version_category" DEFAULT 'topic',
  	"version_color" varchar DEFAULT '#205596',
  	"version_use_as_theme" boolean DEFAULT false,
  	"version_order_rank" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__tags_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__tags_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_tags_v_locales" (
  	"version_label" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "work_types" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "work_types_locales" (
  	"label" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "expertise_areas" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "expertise_areas_locales" (
  	"label" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "authors_community_memberships" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"community_id" varchar,
  	"role" varchar
  );
  
  CREATE TABLE "authors" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"image_asset_id" integer,
  	"organizational_affiliation" varchar,
  	"user_id" varchar,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_authors_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "authors_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_authors_v_version_community_memberships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"community_id" varchar,
  	"role" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_authors_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_image_asset_id" integer,
  	"version_organizational_affiliation" varchar,
  	"version_user_id" varchar,
  	"version_order_rank" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__authors_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__authors_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_authors_v_locales" (
  	"version_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "organizations_offices" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"location" geometry(Point),
  	"name" varchar,
  	"address" varchar,
  	"is_primary" boolean DEFAULT false
  );
  
  CREATE TABLE "organizations" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"acronym" varchar,
  	"type" "enum_organizations_type" NOT NULL,
  	"logo_asset_id" integer,
  	"website" varchar,
  	"email" varchar,
  	"headquarters" geometry(Point),
  	"place_point" geometry(Point),
  	"place_text" varchar,
  	"place_precision" "enum_organizations_place_precision" DEFAULT 'city',
  	"place_country_code" varchar,
  	"location_details_country" varchar,
  	"location_details_city" varchar,
  	"location_details_region" varchar,
  	"regional_community_id" varchar,
  	"social_media_twitter" varchar,
  	"social_media_linkedin" varchar,
  	"social_media_facebook" varchar,
  	"social_media_instagram" varchar,
  	"verified" boolean DEFAULT false,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "organizations_locales" (
  	"description" varchar,
  	"logo_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "organizations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" varchar
  );
  
  CREATE TABLE "regional_communities_boundaries" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"point" geometry(Point)
  );
  
  CREATE TABLE "regional_communities_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"person_id" varchar NOT NULL,
  	"role" varchar
  );
  
  CREATE TABLE "regional_communities" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"region" "enum_regional_communities_region",
  	"cover_image_asset_id" integer,
  	"contact_name" varchar,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"contact_organization_id" varchar,
  	"featured" boolean DEFAULT false,
  	"active" boolean DEFAULT true,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "regional_communities_locales" (
  	"name" varchar NOT NULL,
  	"cover_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"tags_id" varchar,
  	"work_types_id" varchar,
  	"expertise_areas_id" varchar,
  	"authors_id" varchar,
  	"organizations_id" varchar,
  	"regional_communities_id" varchar
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tags_v" ADD CONSTRAINT "_tags_v_parent_id_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tags_v_locales" ADD CONSTRAINT "_tags_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tags_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "work_types_locales" ADD CONSTRAINT "work_types_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."work_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "expertise_areas_locales" ADD CONSTRAINT "expertise_areas_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."expertise_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_community_memberships" ADD CONSTRAINT "authors_community_memberships_community_id_regional_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors_community_memberships" ADD CONSTRAINT "authors_community_memberships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors_locales" ADD CONSTRAINT "authors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_authors_v_version_community_memberships" ADD CONSTRAINT "_authors_v_version_community_memberships_community_id_regional_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_authors_v_version_community_memberships" ADD CONSTRAINT "_authors_v_version_community_memberships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_authors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_authors_v" ADD CONSTRAINT "_authors_v_parent_id_authors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_authors_v" ADD CONSTRAINT "_authors_v_version_image_asset_id_media_id_fk" FOREIGN KEY ("version_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_authors_v_locales" ADD CONSTRAINT "_authors_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_authors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "organizations_offices" ADD CONSTRAINT "organizations_offices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "organizations" ADD CONSTRAINT "organizations_logo_asset_id_media_id_fk" FOREIGN KEY ("logo_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "organizations" ADD CONSTRAINT "organizations_regional_community_id_regional_communities_id_fk" FOREIGN KEY ("regional_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "organizations_locales" ADD CONSTRAINT "organizations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "organizations_rels" ADD CONSTRAINT "organizations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "organizations_rels" ADD CONSTRAINT "organizations_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_boundaries" ADD CONSTRAINT "regional_communities_boundaries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_members" ADD CONSTRAINT "regional_communities_members_person_id_authors_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_members" ADD CONSTRAINT "regional_communities_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities" ADD CONSTRAINT "regional_communities_cover_image_asset_id_media_id_fk" FOREIGN KEY ("cover_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities" ADD CONSTRAINT "regional_communities_contact_organization_id_organizations_id_fk" FOREIGN KEY ("contact_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_locales" ADD CONSTRAINT "regional_communities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_work_types_fk" FOREIGN KEY ("work_types_id") REFERENCES "public"."work_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_expertise_areas_fk" FOREIGN KEY ("expertise_areas_id") REFERENCES "public"."expertise_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "tags_value_idx" ON "tags" USING btree ("value");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "tags__status_idx" ON "tags" USING btree ("_status");
  CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "tags_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_tags_v_parent_idx" ON "_tags_v" USING btree ("parent_id");
  CREATE INDEX "_tags_v_version_version_value_idx" ON "_tags_v" USING btree ("version_value");
  CREATE INDEX "_tags_v_version_version_updated_at_idx" ON "_tags_v" USING btree ("version_updated_at");
  CREATE INDEX "_tags_v_version_version_created_at_idx" ON "_tags_v" USING btree ("version_created_at");
  CREATE INDEX "_tags_v_version_version__status_idx" ON "_tags_v" USING btree ("version__status");
  CREATE INDEX "_tags_v_created_at_idx" ON "_tags_v" USING btree ("created_at");
  CREATE INDEX "_tags_v_updated_at_idx" ON "_tags_v" USING btree ("updated_at");
  CREATE INDEX "_tags_v_snapshot_idx" ON "_tags_v" USING btree ("snapshot");
  CREATE INDEX "_tags_v_published_locale_idx" ON "_tags_v" USING btree ("published_locale");
  CREATE INDEX "_tags_v_latest_idx" ON "_tags_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_tags_v_locales_locale_parent_id_unique" ON "_tags_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "work_types_key_idx" ON "work_types" USING btree ("key");
  CREATE INDEX "work_types_updated_at_idx" ON "work_types" USING btree ("updated_at");
  CREATE INDEX "work_types_created_at_idx" ON "work_types" USING btree ("created_at");
  CREATE UNIQUE INDEX "work_types_locales_locale_parent_id_unique" ON "work_types_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "expertise_areas_key_idx" ON "expertise_areas" USING btree ("key");
  CREATE INDEX "expertise_areas_updated_at_idx" ON "expertise_areas" USING btree ("updated_at");
  CREATE INDEX "expertise_areas_created_at_idx" ON "expertise_areas" USING btree ("created_at");
  CREATE UNIQUE INDEX "expertise_areas_locales_locale_parent_id_unique" ON "expertise_areas_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "authors_community_memberships_order_idx" ON "authors_community_memberships" USING btree ("_order");
  CREATE INDEX "authors_community_memberships_parent_id_idx" ON "authors_community_memberships" USING btree ("_parent_id");
  CREATE INDEX "authors_community_memberships_community_idx" ON "authors_community_memberships" USING btree ("community_id");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_image_image_asset_idx" ON "authors" USING btree ("image_asset_id");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE INDEX "authors__status_idx" ON "authors" USING btree ("_status");
  CREATE UNIQUE INDEX "authors_locales_locale_parent_id_unique" ON "authors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_authors_v_version_community_memberships_order_idx" ON "_authors_v_version_community_memberships" USING btree ("_order");
  CREATE INDEX "_authors_v_version_community_memberships_parent_id_idx" ON "_authors_v_version_community_memberships" USING btree ("_parent_id");
  CREATE INDEX "_authors_v_version_community_memberships_community_idx" ON "_authors_v_version_community_memberships" USING btree ("community_id");
  CREATE INDEX "_authors_v_parent_idx" ON "_authors_v" USING btree ("parent_id");
  CREATE INDEX "_authors_v_version_version_slug_idx" ON "_authors_v" USING btree ("version_slug");
  CREATE INDEX "_authors_v_version_image_version_image_asset_idx" ON "_authors_v" USING btree ("version_image_asset_id");
  CREATE INDEX "_authors_v_version_version_updated_at_idx" ON "_authors_v" USING btree ("version_updated_at");
  CREATE INDEX "_authors_v_version_version_created_at_idx" ON "_authors_v" USING btree ("version_created_at");
  CREATE INDEX "_authors_v_version_version__status_idx" ON "_authors_v" USING btree ("version__status");
  CREATE INDEX "_authors_v_created_at_idx" ON "_authors_v" USING btree ("created_at");
  CREATE INDEX "_authors_v_updated_at_idx" ON "_authors_v" USING btree ("updated_at");
  CREATE INDEX "_authors_v_snapshot_idx" ON "_authors_v" USING btree ("snapshot");
  CREATE INDEX "_authors_v_published_locale_idx" ON "_authors_v" USING btree ("published_locale");
  CREATE INDEX "_authors_v_latest_idx" ON "_authors_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_authors_v_locales_locale_parent_id_unique" ON "_authors_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "organizations_offices_order_idx" ON "organizations_offices" USING btree ("_order");
  CREATE INDEX "organizations_offices_parent_id_idx" ON "organizations_offices" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");
  CREATE INDEX "organizations_logo_logo_asset_idx" ON "organizations" USING btree ("logo_asset_id");
  CREATE INDEX "organizations_regional_community_idx" ON "organizations" USING btree ("regional_community_id");
  CREATE INDEX "organizations_updated_at_idx" ON "organizations" USING btree ("updated_at");
  CREATE INDEX "organizations_created_at_idx" ON "organizations" USING btree ("created_at");
  CREATE UNIQUE INDEX "organizations_locales_locale_parent_id_unique" ON "organizations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "organizations_rels_order_idx" ON "organizations_rels" USING btree ("order");
  CREATE INDEX "organizations_rels_parent_idx" ON "organizations_rels" USING btree ("parent_id");
  CREATE INDEX "organizations_rels_path_idx" ON "organizations_rels" USING btree ("path");
  CREATE INDEX "organizations_rels_tags_id_idx" ON "organizations_rels" USING btree ("tags_id");
  CREATE INDEX "regional_communities_boundaries_order_idx" ON "regional_communities_boundaries" USING btree ("_order");
  CREATE INDEX "regional_communities_boundaries_parent_id_idx" ON "regional_communities_boundaries" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_members_order_idx" ON "regional_communities_members" USING btree ("_order");
  CREATE INDEX "regional_communities_members_parent_id_idx" ON "regional_communities_members" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_members_person_idx" ON "regional_communities_members" USING btree ("person_id");
  CREATE UNIQUE INDEX "regional_communities_slug_idx" ON "regional_communities" USING btree ("slug");
  CREATE INDEX "regional_communities_cover_image_cover_image_asset_idx" ON "regional_communities" USING btree ("cover_image_asset_id");
  CREATE INDEX "regional_communities_contact_contact_organization_idx" ON "regional_communities" USING btree ("contact_organization_id");
  CREATE INDEX "regional_communities_updated_at_idx" ON "regional_communities" USING btree ("updated_at");
  CREATE INDEX "regional_communities_created_at_idx" ON "regional_communities" USING btree ("created_at");
  CREATE UNIQUE INDEX "regional_communities_locales_locale_parent_id_unique" ON "regional_communities_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_work_types_id_idx" ON "payload_locked_documents_rels" USING btree ("work_types_id");
  CREATE INDEX "payload_locked_documents_rels_expertise_areas_id_idx" ON "payload_locked_documents_rels" USING btree ("expertise_areas_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_organizations_id_idx" ON "payload_locked_documents_rels" USING btree ("organizations_id");
  CREATE INDEX "payload_locked_documents_rels_regional_communities_id_idx" ON "payload_locked_documents_rels" USING btree ("regional_communities_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "tags_locales" CASCADE;
  DROP TABLE "_tags_v" CASCADE;
  DROP TABLE "_tags_v_locales" CASCADE;
  DROP TABLE "work_types" CASCADE;
  DROP TABLE "work_types_locales" CASCADE;
  DROP TABLE "expertise_areas" CASCADE;
  DROP TABLE "expertise_areas_locales" CASCADE;
  DROP TABLE "authors_community_memberships" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "authors_locales" CASCADE;
  DROP TABLE "_authors_v_version_community_memberships" CASCADE;
  DROP TABLE "_authors_v" CASCADE;
  DROP TABLE "_authors_v_locales" CASCADE;
  DROP TABLE "organizations_offices" CASCADE;
  DROP TABLE "organizations" CASCADE;
  DROP TABLE "organizations_locales" CASCADE;
  DROP TABLE "organizations_rels" CASCADE;
  DROP TABLE "regional_communities_boundaries" CASCADE;
  DROP TABLE "regional_communities_members" CASCADE;
  DROP TABLE "regional_communities" CASCADE;
  DROP TABLE "regional_communities_locales" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_tags_category";
  DROP TYPE "public"."enum_tags_status";
  DROP TYPE "public"."enum__tags_v_version_category";
  DROP TYPE "public"."enum__tags_v_version_status";
  DROP TYPE "public"."enum__tags_v_published_locale";
  DROP TYPE "public"."enum_authors_status";
  DROP TYPE "public"."enum__authors_v_version_status";
  DROP TYPE "public"."enum__authors_v_published_locale";
  DROP TYPE "public"."enum_organizations_type";
  DROP TYPE "public"."enum_organizations_place_precision";
  DROP TYPE "public"."enum_regional_communities_region";`)
}
