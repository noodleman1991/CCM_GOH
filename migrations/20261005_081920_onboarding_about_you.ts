import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "onboarding_about_you_looking_for_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "onboarding_about_you_looking_for_options_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "onboarding_about_you_focus_topic_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "onboarding_about_you_focus_topic_options_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "onboarding_about_you" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "onboarding_about_you_locales" (
  	"title" varchar,
  	"description" varchar,
  	"prompt_intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "onboarding_about_you_looking_for_options" ADD CONSTRAINT "onboarding_about_you_looking_for_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_about_you"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_about_you_looking_for_options_locales" ADD CONSTRAINT "onboarding_about_you_looking_for_options_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_about_you_looking_for_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_about_you_focus_topic_options" ADD CONSTRAINT "onboarding_about_you_focus_topic_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_about_you"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_about_you_focus_topic_options_locales" ADD CONSTRAINT "onboarding_about_you_focus_topic_options_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_about_you_focus_topic_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_about_you_locales" ADD CONSTRAINT "onboarding_about_you_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_about_you"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "onboarding_about_you_looking_for_options_order_idx" ON "onboarding_about_you_looking_for_options" USING btree ("_order");
  CREATE INDEX "onboarding_about_you_looking_for_options_parent_id_idx" ON "onboarding_about_you_looking_for_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "onboarding_about_you_looking_for_options_locales_locale_pare" ON "onboarding_about_you_looking_for_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "onboarding_about_you_focus_topic_options_order_idx" ON "onboarding_about_you_focus_topic_options" USING btree ("_order");
  CREATE INDEX "onboarding_about_you_focus_topic_options_parent_id_idx" ON "onboarding_about_you_focus_topic_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "onboarding_about_you_focus_topic_options_locales_locale_pare" ON "onboarding_about_you_focus_topic_options_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "onboarding_about_you_locales_locale_parent_id_unique" ON "onboarding_about_you_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "onboarding_about_you_looking_for_options" CASCADE;
  DROP TABLE "onboarding_about_you_looking_for_options_locales" CASCADE;
  DROP TABLE "onboarding_about_you_focus_topic_options" CASCADE;
  DROP TABLE "onboarding_about_you_focus_topic_options_locales" CASCADE;
  DROP TABLE "onboarding_about_you" CASCADE;
  DROP TABLE "onboarding_about_you_locales" CASCADE;`)
}
