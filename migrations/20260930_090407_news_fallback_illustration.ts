import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hub_illustrations" ADD COLUMN "news_fallback_asset_id" varchar;
  ALTER TABLE "hub_illustrations_locales" ADD COLUMN "news_fallback_alt" varchar;
  ALTER TABLE "hub_illustrations" ADD CONSTRAINT "hub_illustrations_news_fallback_asset_id_media_id_fk" FOREIGN KEY ("news_fallback_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hub_illustrations_news_fallback_news_fallback_asset_idx" ON "hub_illustrations" USING btree ("news_fallback_asset_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hub_illustrations" DROP CONSTRAINT "hub_illustrations_news_fallback_asset_id_media_id_fk";
  
  DROP INDEX "hub_illustrations_news_fallback_news_fallback_asset_idx";
  ALTER TABLE "hub_illustrations" DROP COLUMN "news_fallback_asset_id";
  ALTER TABLE "hub_illustrations_locales" DROP COLUMN "news_fallback_alt";`)
}
