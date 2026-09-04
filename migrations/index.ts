import * as migration_20260903_121450_taxonomy_collections from './20260903_121450_taxonomy_collections';
import * as migration_20260903_173141_content_collections from './20260903_173141_content_collections';
import * as migration_20260903_184536_page_collections_and_globals from './20260903_184536_page_collections_and_globals';
import * as migration_20260903_224806_empty_wired_collections from './20260903_224806_empty_wired_collections';
import * as migration_20260903_231949_uploads_on_r2 from './20260903_231949_uploads_on_r2';
import * as migration_20260904_075324_globals_under_pg_arg_limit from './20260904_075324_globals_under_pg_arg_limit';
import * as migration_20260904_105415_sanity_updated_at from './20260904_105415_sanity_updated_at';

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
    name: '20260903_184536_page_collections_and_globals',
  },
  {
    up: migration_20260903_224806_empty_wired_collections.up,
    down: migration_20260903_224806_empty_wired_collections.down,
    name: '20260903_224806_empty_wired_collections',
  },
  {
    up: migration_20260903_231949_uploads_on_r2.up,
    down: migration_20260903_231949_uploads_on_r2.down,
    name: '20260903_231949_uploads_on_r2',
  },
  {
    up: migration_20260904_075324_globals_under_pg_arg_limit.up,
    down: migration_20260904_075324_globals_under_pg_arg_limit.down,
    name: '20260904_075324_globals_under_pg_arg_limit',
  },
  {
    up: migration_20260904_105415_sanity_updated_at.up,
    down: migration_20260904_105415_sanity_updated_at.down,
    name: '20260904_105415_sanity_updated_at'
  },
];
