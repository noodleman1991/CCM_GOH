import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "regional_communities_locales" ADD COLUMN "tagline" varchar;
  ALTER TABLE "_regional_communities_v_locales" ADD COLUMN "version_tagline" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "regional_communities_locales" DROP COLUMN "tagline";
  ALTER TABLE "_regional_communities_v_locales" DROP COLUMN "version_tagline";`)
}
