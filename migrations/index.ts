import * as migration_20260903_121450_taxonomy_collections from './20260903_121450_taxonomy_collections';
import * as migration_20260903_173141_content_collections from './20260903_173141_content_collections';
import * as migration_20260903_184536_page_collections_and_globals from './20260903_184536_page_collections_and_globals';

export const migrations = [
  {
    up: migration_20260903_121450_taxonomy_collections.up,
    down: migration_20260903_121450_taxonomy_collections.down,
    name: '20260903_121450_taxonomy_collections',
  },
  {
    up: migration_20260903_173141_content_collections.up,
    down: migration_20260903_173141_content_collections.down,
    name: '20260903_173141_content_collections',
  },
  {
    up: migration_20260903_184536_page_collections_and_globals.up,
    down: migration_20260903_184536_page_collections_and_globals.down,
    name: '20260903_184536_page_collections_and_globals'
  },
];
