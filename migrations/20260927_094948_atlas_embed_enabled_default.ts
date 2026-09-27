import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "regional_pages" ALTER COLUMN "atlas_embed_enabled" SET DEFAULT true;
  ALTER TABLE "_regional_pages_v" ALTER COLUMN "version_atlas_embed_enabled" SET DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "regional_pages" ALTER COLUMN "atlas_embed_enabled" DROP DEFAULT;
  ALTER TABLE "_regional_pages_v" ALTER COLUMN "version_atlas_embed_enabled" DROP DEFAULT;`)
}
