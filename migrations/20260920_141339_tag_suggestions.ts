import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "case_studies_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_case_studies_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "lived_experiences_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_lived_experiences_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "research_outputs_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "case_studies_texts" ADD CONSTRAINT "case_studies_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_texts" ADD CONSTRAINT "_case_studies_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lived_experiences_texts" ADD CONSTRAINT "lived_experiences_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lived_experiences_v_texts" ADD CONSTRAINT "_lived_experiences_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lived_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "research_outputs_texts" ADD CONSTRAINT "research_outputs_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_texts_order_parent" ON "case_studies_texts" USING btree ("order","parent_id");
  CREATE INDEX "_case_studies_v_texts_order_parent" ON "_case_studies_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "lived_experiences_texts_order_parent" ON "lived_experiences_texts" USING btree ("order","parent_id");
  CREATE INDEX "_lived_experiences_v_texts_order_parent" ON "_lived_experiences_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "research_outputs_texts_order_parent" ON "research_outputs_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "case_studies_texts" CASCADE;
  DROP TABLE "_case_studies_v_texts" CASCADE;
  DROP TABLE "lived_experiences_texts" CASCADE;
  DROP TABLE "_lived_experiences_v_texts" CASCADE;
  DROP TABLE "research_outputs_texts" CASCADE;`)
}
