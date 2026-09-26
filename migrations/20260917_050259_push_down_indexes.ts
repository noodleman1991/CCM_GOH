import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "case_studies_moderation_status_idx" ON "case_studies" USING btree ("moderation_status");
  CREATE INDEX "case_studies_featured_idx" ON "case_studies" USING btree ("featured");
  CREATE INDEX "case_studies_published_at_idx" ON "case_studies" USING btree ("published_at");
  CREATE INDEX "_case_studies_v_version_version_moderation_status_idx" ON "_case_studies_v" USING btree ("version_moderation_status");
  CREATE INDEX "_case_studies_v_version_version_featured_idx" ON "_case_studies_v" USING btree ("version_featured");
  CREATE INDEX "_case_studies_v_version_version_published_at_idx" ON "_case_studies_v" USING btree ("version_published_at");
  CREATE INDEX "lived_experiences_published_at_idx" ON "lived_experiences" USING btree ("published_at");
  CREATE INDEX "lived_experiences_featured_idx" ON "lived_experiences" USING btree ("featured");
  CREATE INDEX "lived_experiences_moderation_status_idx" ON "lived_experiences" USING btree ("moderation_status");
  CREATE INDEX "_lived_experiences_v_version_version_published_at_idx" ON "_lived_experiences_v" USING btree ("version_published_at");
  CREATE INDEX "_lived_experiences_v_version_version_featured_idx" ON "_lived_experiences_v" USING btree ("version_featured");
  CREATE INDEX "_lived_experiences_v_version_version_moderation_status_idx" ON "_lived_experiences_v" USING btree ("version_moderation_status");
  CREATE INDEX "research_outputs_moderation_status_idx" ON "research_outputs" USING btree ("moderation_status");
  CREATE INDEX "research_outputs_publish_date_idx" ON "research_outputs" USING btree ("publish_date");
  CREATE INDEX "agendas_publish_date_idx" ON "agendas" USING btree ("publish_date");
  CREATE INDEX "agendas_featured_idx" ON "agendas" USING btree ("featured");
  CREATE INDEX "news_posts_published_at_idx" ON "news_posts" USING btree ("published_at");
  CREATE INDEX "news_posts_featured_idx" ON "news_posts" USING btree ("featured");
  CREATE INDEX "_news_posts_v_version_version_published_at_idx" ON "_news_posts_v" USING btree ("version_published_at");
  CREATE INDEX "_news_posts_v_version_version_featured_idx" ON "_news_posts_v" USING btree ("version_featured");
  CREATE INDEX "external_sources_published_at_idx" ON "external_sources" USING btree ("published_at");
  CREATE INDEX "external_sources_featured_idx" ON "external_sources" USING btree ("featured");
  CREATE INDEX "external_sources_approved_idx" ON "external_sources" USING btree ("approved");
  CREATE INDEX "events_start_at_idx" ON "events" USING btree ("start_at");
  CREATE INDEX "events_moderation_status_idx" ON "events" USING btree ("moderation_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "case_studies_moderation_status_idx";
  DROP INDEX "case_studies_featured_idx";
  DROP INDEX "case_studies_published_at_idx";
  DROP INDEX "_case_studies_v_version_version_moderation_status_idx";
  DROP INDEX "_case_studies_v_version_version_featured_idx";
  DROP INDEX "_case_studies_v_version_version_published_at_idx";
  DROP INDEX "lived_experiences_published_at_idx";
  DROP INDEX "lived_experiences_featured_idx";
  DROP INDEX "lived_experiences_moderation_status_idx";
  DROP INDEX "_lived_experiences_v_version_version_published_at_idx";
  DROP INDEX "_lived_experiences_v_version_version_featured_idx";
  DROP INDEX "_lived_experiences_v_version_version_moderation_status_idx";
  DROP INDEX "research_outputs_moderation_status_idx";
  DROP INDEX "research_outputs_publish_date_idx";
  DROP INDEX "agendas_publish_date_idx";
  DROP INDEX "agendas_featured_idx";
  DROP INDEX "news_posts_published_at_idx";
  DROP INDEX "news_posts_featured_idx";
  DROP INDEX "_news_posts_v_version_version_published_at_idx";
  DROP INDEX "_news_posts_v_version_version_featured_idx";
  DROP INDEX "external_sources_published_at_idx";
  DROP INDEX "external_sources_featured_idx";
  DROP INDEX "external_sources_approved_idx";
  DROP INDEX "events_start_at_idx";
  DROP INDEX "events_moderation_status_idx";`)
}
