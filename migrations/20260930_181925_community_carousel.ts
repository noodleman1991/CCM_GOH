import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_community_carousel_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum_pages_blocks_community_carousel_2_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum__pages_v_blocks_community_carousel_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum__pages_v_blocks_community_carousel_2_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum_regional_communities_blocks_community_carousel_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum_regional_communities_blocks_community_carouse_9cc4rl" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'events', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_community_carousel_2_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum_regional_communities_blocks_community_carouse_l2pex2" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'events', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_community_carousel_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_community_caro_1h38e57" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'events', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_community_carousel_2_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_community_caro_14lq3r4" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'events', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_homepage_blocks_community_carousel_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum_homepage_blocks_community_carousel_2_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum__homepage_v_blocks_community_carousel_speed" AS ENUM('calm', 'normal');
  CREATE TYPE "public"."enum__homepage_v_blocks_community_carousel_2_speed" AS ENUM('calm', 'normal');
  CREATE TABLE "pages_blocks_community_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum_pages_blocks_community_carousel_speed" DEFAULT 'calm',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_community_carousel_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_community_carousel_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum_pages_blocks_community_carousel_2_speed" DEFAULT 'calm',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_community_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum__pages_v_blocks_community_carousel_speed" DEFAULT 'calm',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_community_carousel_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_community_carousel_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum__pages_v_blocks_community_carousel_2_speed" DEFAULT 'calm',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_community_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum_regional_communities_blocks_community_carousel_speed" DEFAULT 'calm',
  	"chapter_kind" "enum_regional_communities_blocks_community_carouse_9cc4rl" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_community_carousel_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_community_carousel_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum_regional_communities_blocks_community_carousel_2_speed" DEFAULT 'calm',
  	"chapter_kind" "enum_regional_communities_blocks_community_carouse_l2pex2" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum__regional_communities_v_blocks_community_carousel_speed" DEFAULT 'calm',
  	"chapter_kind" "enum__regional_communities_v_blocks_community_caro_1h38e57" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_carousel_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_carousel_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum__regional_communities_v_blocks_community_carousel_2_speed" DEFAULT 'calm',
  	"chapter_kind" "enum__regional_communities_v_blocks_community_caro_14lq3r4" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_community_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum_homepage_blocks_community_carousel_speed" DEFAULT 'calm',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_community_carousel_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_community_carousel_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum_homepage_blocks_community_carousel_2_speed" DEFAULT 'calm',
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_community_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum__homepage_v_blocks_community_carousel_speed" DEFAULT 'calm',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_community_carousel_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_community_carousel_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"show_members" boolean DEFAULT true,
  	"show_stories" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"show_faces" boolean DEFAULT true,
  	"show_latest" boolean DEFAULT true,
  	"autoplay" boolean DEFAULT true,
  	"speed" "enum__homepage_v_blocks_community_carousel_2_speed" DEFAULT 'calm',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_community_carousel" ADD CONSTRAINT "pages_blocks_community_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_community_carousel_locales" ADD CONSTRAINT "pages_blocks_community_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_community_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_community_carousel_2" ADD CONSTRAINT "pages_blocks_community_carousel_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_community_carousel" ADD CONSTRAINT "_pages_v_blocks_community_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_community_carousel_locales" ADD CONSTRAINT "_pages_v_blocks_community_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_community_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_community_carousel_2" ADD CONSTRAINT "_pages_v_blocks_community_carousel_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_community_carousel" ADD CONSTRAINT "regional_communities_blocks_community_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_community_carousel_locales" ADD CONSTRAINT "regional_communities_blocks_community_carousel_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_community_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_community_carousel_2" ADD CONSTRAINT "regional_communities_blocks_community_carousel_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_carousel" ADD CONSTRAINT "_regional_communities_v_blocks_community_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_carousel_locales" ADD CONSTRAINT "_regional_communities_v_blocks_community_carousel_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_community_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_carousel_2" ADD CONSTRAINT "_regional_communities_v_blocks_community_carousel_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_community_carousel" ADD CONSTRAINT "homepage_blocks_community_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_community_carousel_locales" ADD CONSTRAINT "homepage_blocks_community_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_community_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_community_carousel_2" ADD CONSTRAINT "homepage_blocks_community_carousel_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_community_carousel" ADD CONSTRAINT "_homepage_v_blocks_community_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_community_carousel_locales" ADD CONSTRAINT "_homepage_v_blocks_community_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_community_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_community_carousel_2" ADD CONSTRAINT "_homepage_v_blocks_community_carousel_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_community_carousel_order_idx" ON "pages_blocks_community_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_community_carousel_parent_id_idx" ON "pages_blocks_community_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_community_carousel_path_idx" ON "pages_blocks_community_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_community_carousel_locales_locale_parent_id_uni" ON "pages_blocks_community_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_community_carousel_2_order_idx" ON "pages_blocks_community_carousel_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_community_carousel_2_parent_id_idx" ON "pages_blocks_community_carousel_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_community_carousel_2_path_idx" ON "pages_blocks_community_carousel_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_community_carousel_2_locale_idx" ON "pages_blocks_community_carousel_2" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_community_carousel_order_idx" ON "_pages_v_blocks_community_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_community_carousel_parent_id_idx" ON "_pages_v_blocks_community_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_community_carousel_path_idx" ON "_pages_v_blocks_community_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_community_carousel_locales_locale_parent_id_" ON "_pages_v_blocks_community_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_community_carousel_2_order_idx" ON "_pages_v_blocks_community_carousel_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_community_carousel_2_parent_id_idx" ON "_pages_v_blocks_community_carousel_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_community_carousel_2_path_idx" ON "_pages_v_blocks_community_carousel_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_community_carousel_2_locale_idx" ON "_pages_v_blocks_community_carousel_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_community_carousel_order_idx" ON "regional_communities_blocks_community_carousel" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_community_carousel_parent_id_idx" ON "regional_communities_blocks_community_carousel" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_community_carousel_path_idx" ON "regional_communities_blocks_community_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_community_carousel_locales_local" ON "regional_communities_blocks_community_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_community_carousel_2_order_idx" ON "regional_communities_blocks_community_carousel_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_community_carousel_2_parent_id_idx" ON "regional_communities_blocks_community_carousel_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_community_carousel_2_path_idx" ON "regional_communities_blocks_community_carousel_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_community_carousel_2_locale_idx" ON "regional_communities_blocks_community_carousel_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_community_carousel_order_idx" ON "_regional_communities_v_blocks_community_carousel" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_community_carousel_parent_id_idx" ON "_regional_communities_v_blocks_community_carousel" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_carousel_path_idx" ON "_regional_communities_v_blocks_community_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_community_carousel_locales_lo" ON "_regional_communities_v_blocks_community_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_carousel_2_order_idx" ON "_regional_communities_v_blocks_community_carousel_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_community_carousel_2_parent_id_idx" ON "_regional_communities_v_blocks_community_carousel_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_carousel_2_path_idx" ON "_regional_communities_v_blocks_community_carousel_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_community_carousel_2_locale_idx" ON "_regional_communities_v_blocks_community_carousel_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_community_carousel_order_idx" ON "homepage_blocks_community_carousel" USING btree ("_order");
  CREATE INDEX "homepage_blocks_community_carousel_parent_id_idx" ON "homepage_blocks_community_carousel" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_community_carousel_path_idx" ON "homepage_blocks_community_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_community_carousel_locales_locale_parent_id_" ON "homepage_blocks_community_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_community_carousel_2_order_idx" ON "homepage_blocks_community_carousel_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_community_carousel_2_parent_id_idx" ON "homepage_blocks_community_carousel_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_community_carousel_2_path_idx" ON "homepage_blocks_community_carousel_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_community_carousel_2_locale_idx" ON "homepage_blocks_community_carousel_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_community_carousel_order_idx" ON "_homepage_v_blocks_community_carousel" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_community_carousel_parent_id_idx" ON "_homepage_v_blocks_community_carousel" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_community_carousel_path_idx" ON "_homepage_v_blocks_community_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_community_carousel_locales_locale_parent_" ON "_homepage_v_blocks_community_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_community_carousel_2_order_idx" ON "_homepage_v_blocks_community_carousel_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_community_carousel_2_parent_id_idx" ON "_homepage_v_blocks_community_carousel_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_community_carousel_2_path_idx" ON "_homepage_v_blocks_community_carousel_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_community_carousel_2_locale_idx" ON "_homepage_v_blocks_community_carousel_2" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_community_carousel" CASCADE;
  DROP TABLE "pages_blocks_community_carousel_locales" CASCADE;
  DROP TABLE "pages_blocks_community_carousel_2" CASCADE;
  DROP TABLE "_pages_v_blocks_community_carousel" CASCADE;
  DROP TABLE "_pages_v_blocks_community_carousel_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_community_carousel_2" CASCADE;
  DROP TABLE "regional_communities_blocks_community_carousel" CASCADE;
  DROP TABLE "regional_communities_blocks_community_carousel_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_community_carousel_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_carousel" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_carousel_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_carousel_2" CASCADE;
  DROP TABLE "homepage_blocks_community_carousel" CASCADE;
  DROP TABLE "homepage_blocks_community_carousel_locales" CASCADE;
  DROP TABLE "homepage_blocks_community_carousel_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_community_carousel" CASCADE;
  DROP TABLE "_homepage_v_blocks_community_carousel_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_community_carousel_2" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_community_carousel_speed";
  DROP TYPE "public"."enum_pages_blocks_community_carousel_2_speed";
  DROP TYPE "public"."enum__pages_v_blocks_community_carousel_speed";
  DROP TYPE "public"."enum__pages_v_blocks_community_carousel_2_speed";
  DROP TYPE "public"."enum_regional_communities_blocks_community_carousel_speed";
  DROP TYPE "public"."enum_regional_communities_blocks_community_carouse_9cc4rl";
  DROP TYPE "public"."enum_regional_communities_blocks_community_carousel_2_speed";
  DROP TYPE "public"."enum_regional_communities_blocks_community_carouse_l2pex2";
  DROP TYPE "public"."enum__regional_communities_v_blocks_community_carousel_speed";
  DROP TYPE "public"."enum__regional_communities_v_blocks_community_caro_1h38e57";
  DROP TYPE "public"."enum__regional_communities_v_blocks_community_carousel_2_speed";
  DROP TYPE "public"."enum__regional_communities_v_blocks_community_caro_14lq3r4";
  DROP TYPE "public"."enum_homepage_blocks_community_carousel_speed";
  DROP TYPE "public"."enum_homepage_blocks_community_carousel_2_speed";
  DROP TYPE "public"."enum__homepage_v_blocks_community_carousel_speed";
  DROP TYPE "public"."enum__homepage_v_blocks_community_carousel_2_speed";`)
}
