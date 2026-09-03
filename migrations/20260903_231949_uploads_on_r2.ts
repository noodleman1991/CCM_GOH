import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "files" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sanity_asset_id" varchar,
  	"prefix" varchar DEFAULT 'cms/files',
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
  
  ALTER TABLE "lived_experiences" DROP CONSTRAINT "lived_experiences_video_file_id_media_id_fk";
  
  ALTER TABLE "_lived_experiences_v" DROP CONSTRAINT "_lived_experiences_v_version_video_file_id_media_id_fk";
  
  ALTER TABLE "research_outputs_versions" DROP CONSTRAINT "research_outputs_versions_file_id_media_id_fk";
  
  ALTER TABLE "agendas_files" DROP CONSTRAINT "agendas_files_file_id_media_id_fk";

  -- HAND-EDITED (Task 8). Payload's generator emitted the media.id serial ->
  -- varchar change without touching the ~60 foreign keys that reference it, so
  -- Postgres rejected the very first ALTER with foreign key constraint
  -- "authors_image_asset_id_media_id_fk" cannot be implemented. The three
  -- blocks below drop every FK pointing at media, keep its exact definition in
  -- a temp table, and put them all back verbatim once the column types match.
  -- Nothing is lost: pg_get_constraintdef round-trips the definition, and the
  -- four media -> files constraints are already dropped above so they are not
  -- captured here. media holds 0 rows (imports are Tasks 11-13).
  CREATE TEMP TABLE _media_fk_backup ON COMMIT DROP AS
    SELECT conrelid::regclass::text AS tbl, conname::text AS conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE contype = 'f' AND confrelid = 'media'::regclass;

  DO $$
  DECLARE r record;
  BEGIN
    FOR r IN SELECT * FROM _media_fk_backup LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    END LOOP;
  END $$;

  -- serial leaves a nextval() default behind; a varchar column cannot keep it.
  ALTER TABLE "media" ALTER COLUMN "id" DROP DEFAULT;
  
  ALTER TABLE "media" ALTER COLUMN "id" SET DATA TYPE varchar;
  ALTER TABLE "authors" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_authors_v" ALTER COLUMN "version_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "organizations" ALTER COLUMN "logo_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_communities" ALTER COLUMN "cover_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "case_studies" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_case_studies_v" ALTER COLUMN "version_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "lived_experiences" ALTER COLUMN "video_file_id" SET DATA TYPE varchar;
  ALTER TABLE "lived_experiences" ALTER COLUMN "thumbnail_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "lived_experiences" ALTER COLUMN "og_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_lived_experiences_v" ALTER COLUMN "version_video_file_id" SET DATA TYPE varchar;
  ALTER TABLE "_lived_experiences_v" ALTER COLUMN "version_thumbnail_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_lived_experiences_v" ALTER COLUMN "version_og_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "research_outputs_versions" ALTER COLUMN "file_id" SET DATA TYPE varchar;
  ALTER TABLE "research_outputs" ALTER COLUMN "cover_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "agendas_files" ALTER COLUMN "file_id" SET DATA TYPE varchar;
  ALTER TABLE "agendas" ALTER COLUMN "cover_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "news_posts" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "news_posts" ALTER COLUMN "og_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_news_posts_v" ALTER COLUMN "version_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_news_posts_v" ALTER COLUMN "version_og_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "testimonials" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_testimonials_v" ALTER COLUMN "version_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "external_sources" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "case_study_drafts" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_hero1" ALTER COLUMN "background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_hero1" ALTER COLUMN "background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_hero1" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_split_image" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_grid_card" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_grid_row" ALTER COLUMN "background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_grid_row" ALTER COLUMN "background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_grid_row" ALTER COLUMN "header_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_cta1" ALTER COLUMN "background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_cta1" ALTER COLUMN "background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_logo_cloud1_images" ALTER COLUMN "asset_id" SET DATA TYPE varchar;
  ALTER TABLE "pages" ALTER COLUMN "og_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages_blocks_content_grid" ALTER COLUMN "header_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages_logo_cloud_images" ALTER COLUMN "asset_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages" ALTER COLUMN "og_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "welcome_hero_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "welcome_hero_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "welcome_hero_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "why_join_c_t_a_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "why_join_c_t_a_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "why_join_c_t_a_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v_blocks_content_grid" ALTER COLUMN "header_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v_version_logo_cloud_images" ALTER COLUMN "asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v" ALTER COLUMN "version_og_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_welcome_hero_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_welcome_hero_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_welcome_hero_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_why_join_c_t_a_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_why_join_c_t_a_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_why_join_c_t_a_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "events" ALTER COLUMN "cover_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "projects" ALTER COLUMN "logo_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "media_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_blocks_split_image" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_blocks_grid_card" ALTER COLUMN "image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_partner_logos_images" ALTER COLUMN "asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage" ALTER COLUMN "og_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "hero_welcome_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "hero_welcome_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "hero_welcome_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "agendas_module_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "agendas_module_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "agendas_module_header_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "regional_communities_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "regional_communities_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "regional_communities_header_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "news_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "news_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "news_header_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "mental_health_definition_background_svg_pattern_id" SET DATA TYPE varchar;
  ALTER TABLE "homepage_locales" ALTER COLUMN "mental_health_definition_background_image_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "hub_illustrations" ALTER COLUMN "atlas_header_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "hub_illustrations" ALTER COLUMN "search_header_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "hub_illustrations" ALTER COLUMN "collaborate_header_asset_id" SET DATA TYPE varchar;
  ALTER TABLE "hub_illustrations" ALTER COLUMN "empty_state_asset_id" SET DATA TYPE varchar;
  -- HAND-EDITED (Task 8): every FK captured above, restored verbatim now that
  -- media.id and all referencing columns are varchar.
  DO $$
  DECLARE r record;
  BEGIN
    FOR r IN SELECT * FROM _media_fk_backup LOOP
      EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', r.tbl, r.conname, r.def);
    END LOOP;
  END $$;

  ALTER TABLE "media" ADD COLUMN "sanity_asset_id" varchar;
  ALTER TABLE "media" ADD COLUMN "lqip" varchar;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT 'cms/media';
  ALTER TABLE "media" ADD COLUMN "sizes_crop80x80_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop80x80_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop80x80_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop80x80_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop80x80_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop80x80_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop320x320_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop320x320_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop320x320_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop320x320_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop320x320_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop320x320_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x450_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x450_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x450_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x450_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x450_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x450_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x533_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x533_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x533_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x533_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x533_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x533_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x600_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x600_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x600_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x600_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x600_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_crop800x600_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max400x225_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max400x225_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max400x225_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max400x225_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max400x225_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max400x225_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max600x400_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max600x400_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max600x400_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max600x400_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max600x400_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max600x400_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max800x450_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max800x450_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max800x450_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max800x450_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max800x450_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max800x450_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max800_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max800_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max800_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max800_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max800_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max800_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max1100_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max1100_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max1100_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max1100_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max1100_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max1100_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max1200x675_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max1200x675_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max1200x675_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max1200x675_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_max1200x675_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_max1200x675_filename" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "files_id" varchar;
  CREATE UNIQUE INDEX "files_sanity_asset_id_idx" ON "files" USING btree ("sanity_asset_id");
  CREATE INDEX "files_updated_at_idx" ON "files" USING btree ("updated_at");
  CREATE INDEX "files_created_at_idx" ON "files" USING btree ("created_at");
  CREATE UNIQUE INDEX "files_filename_idx" ON "files" USING btree ("filename");
  ALTER TABLE "lived_experiences" ADD CONSTRAINT "lived_experiences_video_file_id_files_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_version_video_file_id_files_id_fk" FOREIGN KEY ("version_video_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "research_outputs_versions" ADD CONSTRAINT "research_outputs_versions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agendas_files" ADD CONSTRAINT "agendas_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_files_fk" FOREIGN KEY ("files_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "media_sanity_asset_id_idx" ON "media" USING btree ("sanity_asset_id");
  CREATE INDEX "media_sizes_crop80x80_sizes_crop80x80_filename_idx" ON "media" USING btree ("sizes_crop80x80_filename");
  CREATE INDEX "media_sizes_crop320x320_sizes_crop320x320_filename_idx" ON "media" USING btree ("sizes_crop320x320_filename");
  CREATE INDEX "media_sizes_crop800x450_sizes_crop800x450_filename_idx" ON "media" USING btree ("sizes_crop800x450_filename");
  CREATE INDEX "media_sizes_crop800x533_sizes_crop800x533_filename_idx" ON "media" USING btree ("sizes_crop800x533_filename");
  CREATE INDEX "media_sizes_crop800x600_sizes_crop800x600_filename_idx" ON "media" USING btree ("sizes_crop800x600_filename");
  CREATE INDEX "media_sizes_max400x225_sizes_max400x225_filename_idx" ON "media" USING btree ("sizes_max400x225_filename");
  CREATE INDEX "media_sizes_max600x400_sizes_max600x400_filename_idx" ON "media" USING btree ("sizes_max600x400_filename");
  CREATE INDEX "media_sizes_max800x450_sizes_max800x450_filename_idx" ON "media" USING btree ("sizes_max800x450_filename");
  CREATE INDEX "media_sizes_max800_sizes_max800_filename_idx" ON "media" USING btree ("sizes_max800_filename");
  CREATE INDEX "media_sizes_max1100_sizes_max1100_filename_idx" ON "media" USING btree ("sizes_max1100_filename");
  CREATE INDEX "media_sizes_max1200x675_sizes_max1200x675_filename_idx" ON "media" USING btree ("sizes_max1200x675_filename");
  CREATE INDEX "payload_locked_documents_rels_files_id_idx" ON "payload_locked_documents_rels" USING btree ("files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "files" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "files" CASCADE;
  ALTER TABLE "lived_experiences" DROP CONSTRAINT "lived_experiences_video_file_id_files_id_fk";
  
  ALTER TABLE "_lived_experiences_v" DROP CONSTRAINT "_lived_experiences_v_version_video_file_id_files_id_fk";
  
  ALTER TABLE "research_outputs_versions" DROP CONSTRAINT "research_outputs_versions_file_id_files_id_fk";
  
  ALTER TABLE "agendas_files" DROP CONSTRAINT "agendas_files_file_id_files_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_files_fk";
  
  DROP INDEX "media_sanity_asset_id_idx";
  DROP INDEX "media_sizes_crop80x80_sizes_crop80x80_filename_idx";
  DROP INDEX "media_sizes_crop320x320_sizes_crop320x320_filename_idx";
  DROP INDEX "media_sizes_crop800x450_sizes_crop800x450_filename_idx";
  DROP INDEX "media_sizes_crop800x533_sizes_crop800x533_filename_idx";
  DROP INDEX "media_sizes_crop800x600_sizes_crop800x600_filename_idx";
  DROP INDEX "media_sizes_max400x225_sizes_max400x225_filename_idx";
  DROP INDEX "media_sizes_max600x400_sizes_max600x400_filename_idx";
  DROP INDEX "media_sizes_max800x450_sizes_max800x450_filename_idx";
  DROP INDEX "media_sizes_max800_sizes_max800_filename_idx";
  DROP INDEX "media_sizes_max1100_sizes_max1100_filename_idx";
  DROP INDEX "media_sizes_max1200x675_sizes_max1200x675_filename_idx";
  DROP INDEX "payload_locked_documents_rels_files_id_idx";
  -- HAND-EDITED (Task 8), same reason as up(): the generator emitted
  -- SET DATA TYPE serial, which is not a real Postgres type, and again left
  -- the referencing foreign keys in place. This reversal is only meaningful
  -- while media is empty — a Sanity id like image-<hash>-png has no integer
  -- form — which is true for as long as Tasks 11-13 have not run.
  CREATE TEMP TABLE _media_fk_backup_down ON COMMIT DROP AS
    SELECT conrelid::regclass::text AS tbl, conname::text AS conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE contype = 'f' AND confrelid = 'media'::regclass;

  DO $$
  DECLARE r record;
  BEGIN
    FOR r IN SELECT * FROM _media_fk_backup_down LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    END LOOP;
  END $$;

  ALTER TABLE "media" ALTER COLUMN "id" SET DATA TYPE integer USING "id"::integer;
  CREATE SEQUENCE IF NOT EXISTS media_id_seq OWNED BY "media"."id";
  ALTER TABLE "media" ALTER COLUMN "id" SET DEFAULT nextval('media_id_seq');
  ALTER TABLE "authors" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_authors_v" ALTER COLUMN "version_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "organizations" ALTER COLUMN "logo_asset_id" SET DATA TYPE integer;
  ALTER TABLE "regional_communities" ALTER COLUMN "cover_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "case_studies" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_case_studies_v" ALTER COLUMN "version_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "lived_experiences" ALTER COLUMN "video_file_id" SET DATA TYPE integer;
  ALTER TABLE "lived_experiences" ALTER COLUMN "thumbnail_asset_id" SET DATA TYPE integer;
  ALTER TABLE "lived_experiences" ALTER COLUMN "og_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_lived_experiences_v" ALTER COLUMN "version_video_file_id" SET DATA TYPE integer;
  ALTER TABLE "_lived_experiences_v" ALTER COLUMN "version_thumbnail_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_lived_experiences_v" ALTER COLUMN "version_og_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "research_outputs_versions" ALTER COLUMN "file_id" SET DATA TYPE integer;
  ALTER TABLE "research_outputs" ALTER COLUMN "cover_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "agendas_files" ALTER COLUMN "file_id" SET DATA TYPE integer;
  ALTER TABLE "agendas" ALTER COLUMN "cover_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "news_posts" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "news_posts" ALTER COLUMN "og_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_news_posts_v" ALTER COLUMN "version_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_news_posts_v" ALTER COLUMN "version_og_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "testimonials" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_testimonials_v" ALTER COLUMN "version_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "external_sources" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "case_study_drafts" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_hero1" ALTER COLUMN "background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_hero1" ALTER COLUMN "background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_hero1" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_split_image" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_grid_card" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_grid_row" ALTER COLUMN "background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_grid_row" ALTER COLUMN "background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_grid_row" ALTER COLUMN "header_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_cta1" ALTER COLUMN "background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_cta1" ALTER COLUMN "background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages_blocks_logo_cloud1_images" ALTER COLUMN "asset_id" SET DATA TYPE integer;
  ALTER TABLE "pages" ALTER COLUMN "og_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages_blocks_content_grid" ALTER COLUMN "header_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages_logo_cloud_images" ALTER COLUMN "asset_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages" ALTER COLUMN "og_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "welcome_hero_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "welcome_hero_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "welcome_hero_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "why_join_c_t_a_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "why_join_c_t_a_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "regional_pages_locales" ALTER COLUMN "why_join_c_t_a_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v_blocks_content_grid" ALTER COLUMN "header_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v_version_logo_cloud_images" ALTER COLUMN "asset_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v" ALTER COLUMN "version_og_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_welcome_hero_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_welcome_hero_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_welcome_hero_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_why_join_c_t_a_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_why_join_c_t_a_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "_regional_pages_v_locales" ALTER COLUMN "version_why_join_c_t_a_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "events" ALTER COLUMN "cover_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "projects" ALTER COLUMN "logo_asset_id" SET DATA TYPE integer;
  ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "media_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_blocks_split_image" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_blocks_grid_card" ALTER COLUMN "image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_partner_logos_images" ALTER COLUMN "asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage" ALTER COLUMN "og_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "hero_welcome_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "hero_welcome_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "hero_welcome_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "agendas_module_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "agendas_module_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "agendas_module_header_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "regional_communities_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "regional_communities_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "regional_communities_header_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "news_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "news_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "news_header_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "mental_health_definition_background_svg_pattern_id" SET DATA TYPE integer;
  ALTER TABLE "homepage_locales" ALTER COLUMN "mental_health_definition_background_image_asset_id" SET DATA TYPE integer;
  ALTER TABLE "hub_illustrations" ALTER COLUMN "atlas_header_asset_id" SET DATA TYPE integer;
  ALTER TABLE "hub_illustrations" ALTER COLUMN "search_header_asset_id" SET DATA TYPE integer;
  ALTER TABLE "hub_illustrations" ALTER COLUMN "collaborate_header_asset_id" SET DATA TYPE integer;
  ALTER TABLE "hub_illustrations" ALTER COLUMN "empty_state_asset_id" SET DATA TYPE integer;
  -- HAND-EDITED (Task 8): restore the FKs captured at the top of down().
  DO $$
  DECLARE r record;
  BEGIN
    FOR r IN SELECT * FROM _media_fk_backup_down LOOP
      EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', r.tbl, r.conname, r.def);
    END LOOP;
  END $$;

  ALTER TABLE "lived_experiences" ADD CONSTRAINT "lived_experiences_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v" ADD CONSTRAINT "_lived_experiences_v_version_video_file_id_media_id_fk" FOREIGN KEY ("version_video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "research_outputs_versions" ADD CONSTRAINT "research_outputs_versions_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agendas_files" ADD CONSTRAINT "agendas_files_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" DROP COLUMN "sanity_asset_id";
  ALTER TABLE "media" DROP COLUMN "lqip";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "media" DROP COLUMN "sizes_crop80x80_url";
  ALTER TABLE "media" DROP COLUMN "sizes_crop80x80_width";
  ALTER TABLE "media" DROP COLUMN "sizes_crop80x80_height";
  ALTER TABLE "media" DROP COLUMN "sizes_crop80x80_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_crop80x80_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_crop80x80_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_crop320x320_url";
  ALTER TABLE "media" DROP COLUMN "sizes_crop320x320_width";
  ALTER TABLE "media" DROP COLUMN "sizes_crop320x320_height";
  ALTER TABLE "media" DROP COLUMN "sizes_crop320x320_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_crop320x320_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_crop320x320_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x450_url";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x450_width";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x450_height";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x450_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x450_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x450_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x533_url";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x533_width";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x533_height";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x533_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x533_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x533_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x600_url";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x600_width";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x600_height";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x600_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x600_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_crop800x600_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_max400x225_url";
  ALTER TABLE "media" DROP COLUMN "sizes_max400x225_width";
  ALTER TABLE "media" DROP COLUMN "sizes_max400x225_height";
  ALTER TABLE "media" DROP COLUMN "sizes_max400x225_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_max400x225_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_max400x225_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_max600x400_url";
  ALTER TABLE "media" DROP COLUMN "sizes_max600x400_width";
  ALTER TABLE "media" DROP COLUMN "sizes_max600x400_height";
  ALTER TABLE "media" DROP COLUMN "sizes_max600x400_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_max600x400_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_max600x400_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_max800x450_url";
  ALTER TABLE "media" DROP COLUMN "sizes_max800x450_width";
  ALTER TABLE "media" DROP COLUMN "sizes_max800x450_height";
  ALTER TABLE "media" DROP COLUMN "sizes_max800x450_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_max800x450_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_max800x450_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_max800_url";
  ALTER TABLE "media" DROP COLUMN "sizes_max800_width";
  ALTER TABLE "media" DROP COLUMN "sizes_max800_height";
  ALTER TABLE "media" DROP COLUMN "sizes_max800_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_max800_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_max800_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_max1100_url";
  ALTER TABLE "media" DROP COLUMN "sizes_max1100_width";
  ALTER TABLE "media" DROP COLUMN "sizes_max1100_height";
  ALTER TABLE "media" DROP COLUMN "sizes_max1100_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_max1100_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_max1100_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_max1200x675_url";
  ALTER TABLE "media" DROP COLUMN "sizes_max1200x675_width";
  ALTER TABLE "media" DROP COLUMN "sizes_max1200x675_height";
  ALTER TABLE "media" DROP COLUMN "sizes_max1200x675_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_max1200x675_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_max1200x675_filename";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "files_id";`)
}
