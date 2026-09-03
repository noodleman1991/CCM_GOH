import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_scope" AS ENUM('community', 'project');
  CREATE TYPE "public"."enum_events_mode" AS ENUM('online', 'in_person', 'hybrid');
  CREATE TYPE "public"."enum_events_place_precision" AS ENUM('exact', 'city', 'country', 'region');
  CREATE TYPE "public"."enum_events_moderation_status" AS ENUM('pending', 'rejected', 'revision', 'approved');
  CREATE TYPE "public"."enum_projects_type" AS ENUM('research', 'implementation', 'pilot', 'community', 'policy', 'technology', 'other');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('planning', 'active', 'completed', 'on-hold', 'cancelled');
  CREATE TABLE "events" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"scope" "enum_events_scope" DEFAULT 'community',
  	"start_at" timestamp(3) with time zone NOT NULL,
  	"end_at" timestamp(3) with time zone,
  	"mode" "enum_events_mode" DEFAULT 'online',
  	"location_name" varchar,
  	"place_point" geometry(Point),
  	"place_text" varchar,
  	"place_precision" "enum_events_place_precision" DEFAULT 'city',
  	"place_country_code" varchar,
  	"url" varchar,
  	"cover_image_asset_id" integer,
  	"recording_url" varchar,
  	"related_collaboration" varchar,
  	"linked_project" varchar,
  	"related_community_id" varchar,
  	"moderation_status" "enum_events_moderation_status" DEFAULT 'approved',
  	"submitted_by" varchar,
  	"review_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"cover_image_alt" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_coverage_area" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"location" geometry(Point),
  	"name" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "projects" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"acronym" varchar,
  	"type" "enum_projects_type" DEFAULT 'research',
  	"status" "enum_projects_status" DEFAULT 'active',
  	"lead_organization_id" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"website" varchar,
  	"logo_asset_id" integer,
  	"location" geometry(Point),
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"logo_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"organizations_id" varchar,
  	"tags_id" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" varchar;
  ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_asset_id_media_id_fk" FOREIGN KEY ("cover_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_related_community_id_regional_communities_id_fk" FOREIGN KEY ("related_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_coverage_area" ADD CONSTRAINT "projects_coverage_area_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_organization_id_organizations_id_fk" FOREIGN KEY ("lead_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_logo_asset_id_media_id_fk" FOREIGN KEY ("logo_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_cover_image_cover_image_asset_idx" ON "events" USING btree ("cover_image_asset_id");
  CREATE INDEX "events_related_community_idx" ON "events" USING btree ("related_community_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_coverage_area_order_idx" ON "projects_coverage_area" USING btree ("_order");
  CREATE INDEX "projects_coverage_area_parent_id_idx" ON "projects_coverage_area" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_lead_organization_idx" ON "projects" USING btree ("lead_organization_id");
  CREATE INDEX "projects_logo_logo_asset_idx" ON "projects" USING btree ("logo_asset_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_organizations_id_idx" ON "projects_rels" USING btree ("organizations_id");
  CREATE INDEX "projects_rels_tags_id_idx" ON "projects_rels" USING btree ("tags_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_coverage_area" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "projects_coverage_area" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";
  
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_projects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projects_id";
  DROP TYPE "public"."enum_events_scope";
  DROP TYPE "public"."enum_events_mode";
  DROP TYPE "public"."enum_events_place_precision";
  DROP TYPE "public"."enum_events_moderation_status";
  DROP TYPE "public"."enum_projects_type";
  DROP TYPE "public"."enum_projects_status";`)
}
