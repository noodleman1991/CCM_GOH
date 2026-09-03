import * as migration_20260903_121450_taxonomy_collections from './20260903_121450_taxonomy_collections';

export const migrations = [
  {
    up: migration_20260903_121450_taxonomy_collections.up,
    down: migration_20260903_121450_taxonomy_collections.down,
    name: '20260903_121450_taxonomy_collections'
  },
];
