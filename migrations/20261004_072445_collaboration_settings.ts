import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_collaboration_settings_workspaces" AS ENUM('off', 'team', 'leads', 'members');
  CREATE TABLE "collaboration_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"notifications" boolean DEFAULT false,
  	"people" boolean DEFAULT false,
  	"workspaces" "enum_collaboration_settings_workspaces" DEFAULT 'off',
  	"messages" boolean DEFAULT false,
  	"contributions" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "collaboration_settings" CASCADE;
  DROP TYPE "public"."enum_collaboration_settings_workspaces";`)
}
