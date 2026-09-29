import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "regional_communities_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_regional_communities_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "regional_communities_texts" ADD CONSTRAINT "regional_communities_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_texts" ADD CONSTRAINT "_regional_communities_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "regional_communities_texts_order_parent" ON "regional_communities_texts" USING btree ("order","parent_id");
  CREATE INDEX "_regional_communities_v_texts_order_parent" ON "_regional_communities_v_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "regional_communities_texts" CASCADE;
  DROP TABLE "_regional_communities_v_texts" CASCADE;`)
}
