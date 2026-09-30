import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_region_map" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "pages_blocks_region_map_2" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_region_map" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_region_map_2" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "regional_communities_blocks_region_map" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "regional_communities_blocks_region_map_2" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "_regional_communities_v_blocks_region_map" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "_regional_communities_v_blocks_region_map_2" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "homepage_blocks_region_map" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "homepage_blocks_region_map_2" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "_homepage_v_blocks_region_map" ADD COLUMN "show_region_stories" boolean DEFAULT true;
  ALTER TABLE "_homepage_v_blocks_region_map_2" ADD COLUMN "show_region_stories" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_region_map" DROP COLUMN "show_region_stories";
  ALTER TABLE "pages_blocks_region_map_2" DROP COLUMN "show_region_stories";
  ALTER TABLE "_pages_v_blocks_region_map" DROP COLUMN "show_region_stories";
  ALTER TABLE "_pages_v_blocks_region_map_2" DROP COLUMN "show_region_stories";
  ALTER TABLE "regional_communities_blocks_region_map" DROP COLUMN "show_region_stories";
  ALTER TABLE "regional_communities_blocks_region_map_2" DROP COLUMN "show_region_stories";
  ALTER TABLE "_regional_communities_v_blocks_region_map" DROP COLUMN "show_region_stories";
  ALTER TABLE "_regional_communities_v_blocks_region_map_2" DROP COLUMN "show_region_stories";
  ALTER TABLE "homepage_blocks_region_map" DROP COLUMN "show_region_stories";
  ALTER TABLE "homepage_blocks_region_map_2" DROP COLUMN "show_region_stories";
  ALTER TABLE "_homepage_v_blocks_region_map" DROP COLUMN "show_region_stories";
  ALTER TABLE "_homepage_v_blocks_region_map_2" DROP COLUMN "show_region_stories";`)
}
