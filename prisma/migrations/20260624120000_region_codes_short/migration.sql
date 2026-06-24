-- Phase 6 / B3: rename RegionalCommunityName enum values long → short codes.
-- ALTER TYPE ... RENAME VALUE preserves all existing rows (no data loss) and is
-- atomic per value. Postgres 10+.
ALTER TYPE "RegionalCommunityName" RENAME VALUE 'SUB_SAHARAN_AFRICA' TO 'ssa';
ALTER TYPE "RegionalCommunityName" RENAME VALUE 'NORTHERN_AFRICA_AND_WESTERN_ASIA' TO 'nawa';
ALTER TYPE "RegionalCommunityName" RENAME VALUE 'CENTRAL_AND_SOUTHERN_ASIA' TO 'csa';
ALTER TYPE "RegionalCommunityName" RENAME VALUE 'EASTERN_AND_SOUTH_EASTERN_ASIA' TO 'esea';
ALTER TYPE "RegionalCommunityName" RENAME VALUE 'LATIN_AMERICA_AND_THE_CARIBBEAN' TO 'lac';
ALTER TYPE "RegionalCommunityName" RENAME VALUE 'OCEANIA' TO 'oce';
ALTER TYPE "RegionalCommunityName" RENAME VALUE 'EUROPE_AND_NORTH_AMERICA' TO 'enam';
