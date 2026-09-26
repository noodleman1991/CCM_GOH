import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tags" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_tags_v" ADD COLUMN "version_sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "work_types" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "expertise_areas" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "authors" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_authors_v" ADD COLUMN "version_sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "organizations" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "regional_communities" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "case_studies" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "lived_experiences" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_lived_experiences_v" ADD COLUMN "version_sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "research_outputs" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "agendas" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "news_posts" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_news_posts_v" ADD COLUMN "version_sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "docs_chapters" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "testimonials" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_testimonials_v" ADD COLUMN "version_sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "profile_prompts" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "external_sources" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "case_study_drafts" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "pages" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "regional_pages" ADD COLUMN "sanity_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_regional_pages_v" ADD COLUMN "version_sanity_updated_at" timestamp(3) with time zone;
  CREATE INDEX "tags_sanity_updated_at_idx" ON "tags" USING btree ("sanity_updated_at");
  CREATE INDEX "_tags_v_version_version_sanity_updated_at_idx" ON "_tags_v" USING btree ("version_sanity_updated_at");
  CREATE INDEX "work_types_sanity_updated_at_idx" ON "work_types" USING btree ("sanity_updated_at");
  CREATE INDEX "expertise_areas_sanity_updated_at_idx" ON "expertise_areas" USING btree ("sanity_updated_at");
  CREATE INDEX "authors_sanity_updated_at_idx" ON "authors" USING btree ("sanity_updated_at");
  CREATE INDEX "_authors_v_version_version_sanity_updated_at_idx" ON "_authors_v" USING btree ("version_sanity_updated_at");
  CREATE INDEX "organizations_sanity_updated_at_idx" ON "organizations" USING btree ("sanity_updated_at");
  CREATE INDEX "regional_communities_sanity_updated_at_idx" ON "regional_communities" USING btree ("sanity_updated_at");
  CREATE INDEX "case_studies_sanity_updated_at_idx" ON "case_studies" USING btree ("sanity_updated_at");
  CREATE INDEX "_case_studies_v_version_version_sanity_updated_at_idx" ON "_case_studies_v" USING btree ("version_sanity_updated_at");
  CREATE INDEX "lived_experiences_sanity_updated_at_idx" ON "lived_experiences" USING btree ("sanity_updated_at");
  CREATE INDEX "_lived_experiences_v_version_version_sanity_updated_at_idx" ON "_lived_experiences_v" USING btree ("version_sanity_updated_at");
  CREATE INDEX "research_outputs_sanity_updated_at_idx" ON "research_outputs" USING btree ("sanity_updated_at");
  CREATE INDEX "agendas_sanity_updated_at_idx" ON "agendas" USING btree ("sanity_updated_at");
  CREATE INDEX "news_posts_sanity_updated_at_idx" ON "news_posts" USING btree ("sanity_updated_at");
  CREATE INDEX "_news_posts_v_version_version_sanity_updated_at_idx" ON "_news_posts_v" USING btree ("version_sanity_updated_at");
  CREATE INDEX "docs_chapters_sanity_updated_at_idx" ON "docs_chapters" USING btree ("sanity_updated_at");
  CREATE INDEX "testimonials_sanity_updated_at_idx" ON "testimonials" USING btree ("sanity_updated_at");
  CREATE INDEX "_testimonials_v_version_version_sanity_updated_at_idx" ON "_testimonials_v" USING btree ("version_sanity_updated_at");
  CREATE INDEX "profile_prompts_sanity_updated_at_idx" ON "profile_prompts" USING btree ("sanity_updated_at");
  CREATE INDEX "external_sources_sanity_updated_at_idx" ON "external_sources" USING btree ("sanity_updated_at");
  CREATE INDEX "case_study_drafts_sanity_updated_at_idx" ON "case_study_drafts" USING btree ("sanity_updated_at");
  CREATE INDEX "pages_sanity_updated_at_idx" ON "pages" USING btree ("sanity_updated_at");
  CREATE INDEX "regional_pages_sanity_updated_at_idx" ON "regional_pages" USING btree ("sanity_updated_at");
  CREATE INDEX "_regional_pages_v_version_version_sanity_updated_at_idx" ON "_regional_pages_v" USING btree ("version_sanity_updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "tags_sanity_updated_at_idx";
  DROP INDEX "_tags_v_version_version_sanity_updated_at_idx";
  DROP INDEX "work_types_sanity_updated_at_idx";
  DROP INDEX "expertise_areas_sanity_updated_at_idx";
  DROP INDEX "authors_sanity_updated_at_idx";
  DROP INDEX "_authors_v_version_version_sanity_updated_at_idx";
  DROP INDEX "organizations_sanity_updated_at_idx";
  DROP INDEX "regional_communities_sanity_updated_at_idx";
  DROP INDEX "case_studies_sanity_updated_at_idx";
  DROP INDEX "_case_studies_v_version_version_sanity_updated_at_idx";
  DROP INDEX "lived_experiences_sanity_updated_at_idx";
  DROP INDEX "_lived_experiences_v_version_version_sanity_updated_at_idx";
  DROP INDEX "research_outputs_sanity_updated_at_idx";
  DROP INDEX "agendas_sanity_updated_at_idx";
  DROP INDEX "news_posts_sanity_updated_at_idx";
  DROP INDEX "_news_posts_v_version_version_sanity_updated_at_idx";
  DROP INDEX "docs_chapters_sanity_updated_at_idx";
  DROP INDEX "testimonials_sanity_updated_at_idx";
  DROP INDEX "_testimonials_v_version_version_sanity_updated_at_idx";
  DROP INDEX "profile_prompts_sanity_updated_at_idx";
  DROP INDEX "external_sources_sanity_updated_at_idx";
  DROP INDEX "case_study_drafts_sanity_updated_at_idx";
  DROP INDEX "pages_sanity_updated_at_idx";
  DROP INDEX "regional_pages_sanity_updated_at_idx";
  DROP INDEX "_regional_pages_v_version_version_sanity_updated_at_idx";
  ALTER TABLE "tags" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "_tags_v" DROP COLUMN "version_sanity_updated_at";
  ALTER TABLE "work_types" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "expertise_areas" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "authors" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "_authors_v" DROP COLUMN "version_sanity_updated_at";
  ALTER TABLE "organizations" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "regional_communities" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "case_studies" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_sanity_updated_at";
  ALTER TABLE "lived_experiences" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "_lived_experiences_v" DROP COLUMN "version_sanity_updated_at";
  ALTER TABLE "research_outputs" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "agendas" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "news_posts" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "_news_posts_v" DROP COLUMN "version_sanity_updated_at";
  ALTER TABLE "docs_chapters" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "testimonials" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "_testimonials_v" DROP COLUMN "version_sanity_updated_at";
  ALTER TABLE "profile_prompts" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "external_sources" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "case_study_drafts" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "pages" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "regional_pages" DROP COLUMN "sanity_updated_at";
  ALTER TABLE "_regional_pages_v" DROP COLUMN "version_sanity_updated_at";`)
}
