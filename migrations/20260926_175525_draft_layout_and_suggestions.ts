import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_study_drafts_layout" AS ENUM('story', 'feature', 'report');
  CREATE TABLE "case_study_drafts_suggested_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  ALTER TABLE "case_study_drafts" ADD COLUMN "layout" "enum_case_study_drafts_layout";
  ALTER TABLE "case_study_drafts_suggested_tags" ADD CONSTRAINT "case_study_drafts_suggested_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_study_drafts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_study_drafts_suggested_tags_order_idx" ON "case_study_drafts_suggested_tags" USING btree ("_order");
  CREATE INDEX "case_study_drafts_suggested_tags_parent_id_idx" ON "case_study_drafts_suggested_tags" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "case_study_drafts_suggested_tags" CASCADE;
  ALTER TABLE "case_study_drafts" DROP COLUMN "layout";
  DROP TYPE "public"."enum_case_study_drafts_layout";`)
}
