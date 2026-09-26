import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_original_language" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum__case_studies_v_version_original_language" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_case_study_drafts_location_precision" AS ENUM('exact', 'city', 'country', 'region');
  ALTER TABLE "case_studies" ADD COLUMN "original_language" "enum_case_studies_original_language" DEFAULT 'en';
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_original_language" "enum__case_studies_v_version_original_language" DEFAULT 'en';
  ALTER TABLE "case_study_drafts" ADD COLUMN "location_display_text" varchar;
  ALTER TABLE "case_study_drafts" ADD COLUMN "location_precision" "enum_case_study_drafts_location_precision";
  ALTER TABLE "case_study_drafts" ADD COLUMN "location_country_code" varchar;
  UPDATE "case_studies" SET "original_language" = 'en' WHERE "original_language" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies" DROP COLUMN "original_language";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_original_language";
  ALTER TABLE "case_study_drafts" DROP COLUMN "location_display_text";
  ALTER TABLE "case_study_drafts" DROP COLUMN "location_precision";
  ALTER TABLE "case_study_drafts" DROP COLUMN "location_country_code";
  DROP TYPE "public"."enum_case_studies_original_language";
  DROP TYPE "public"."enum__case_studies_v_version_original_language";
  DROP TYPE "public"."enum_case_study_drafts_location_precision";`)
}
