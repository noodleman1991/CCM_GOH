import * as migration_20260903_121450_taxonomy_collections from './20260903_121450_taxonomy_collections';
import * as migration_20260903_173141_content_collections from './20260903_173141_content_collections';
import * as migration_20260903_184536_page_collections_and_globals from './20260903_184536_page_collections_and_globals';
import * as migration_20260903_224806_empty_wired_collections from './20260903_224806_empty_wired_collections';
import * as migration_20260903_231949_uploads_on_r2 from './20260903_231949_uploads_on_r2';
import * as migration_20260904_075324_globals_under_pg_arg_limit from './20260904_075324_globals_under_pg_arg_limit';
import * as migration_20260904_105415_sanity_updated_at from './20260904_105415_sanity_updated_at';
import * as migration_20260917_050259_push_down_indexes from './20260917_050259_push_down_indexes';
import * as migration_20260920_141339_tag_suggestions from './20260920_141339_tag_suggestions';
import * as migration_20260926_155648_human_friendly_forms from './20260926_155648_human_friendly_forms';
import * as migration_20260926_175525_draft_layout_and_suggestions from './20260926_175525_draft_layout_and_suggestions';
import * as migration_20260927_094948_atlas_embed_enabled_default from './20260927_094948_atlas_embed_enabled_default';
import * as migration_20260928_130239_page_sections_and_drafts from './20260928_130239_page_sections_and_drafts';
import * as migration_20260928_152904_homepage_sections_and_organisations from './20260928_152904_homepage_sections_and_organisations';
import * as migration_20260929_063611_community_records_with_pages from './20260929_063611_community_records_with_pages';
import * as migration_20260929_102614_pages_sections from './20260929_102614_pages_sections';
import * as migration_20260929_150919_community_leads from './20260929_150919_community_leads';
import * as migration_20260930_090407_news_fallback_illustration from './20260930_090407_news_fallback_illustration';
import * as migration_20260930_153429_events_across_the_hub from './20260930_153429_events_across_the_hub';
import * as migration_20260930_180818_community_tagline from './20260930_180818_community_tagline';
import * as migration_20260930_181925_community_carousel from './20260930_181925_community_carousel';
import * as migration_20260930_191639_logo_wall from './20260930_191639_logo_wall';

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
    name: '20260904_105415_sanity_updated_at',
  },
  {
    up: migration_20260917_050259_push_down_indexes.up,
    down: migration_20260917_050259_push_down_indexes.down,
    name: '20260917_050259_push_down_indexes',
  },
  {
    up: migration_20260920_141339_tag_suggestions.up,
    down: migration_20260920_141339_tag_suggestions.down,
    name: '20260920_141339_tag_suggestions',
  },
  {
    up: migration_20260926_155648_human_friendly_forms.up,
    down: migration_20260926_155648_human_friendly_forms.down,
    name: '20260926_155648_human_friendly_forms',
  },
  {
    up: migration_20260926_175525_draft_layout_and_suggestions.up,
    down: migration_20260926_175525_draft_layout_and_suggestions.down,
    name: '20260926_175525_draft_layout_and_suggestions',
  },
  {
    up: migration_20260927_094948_atlas_embed_enabled_default.up,
    down: migration_20260927_094948_atlas_embed_enabled_default.down,
    name: '20260927_094948_atlas_embed_enabled_default',
  },
  {
    up: migration_20260928_130239_page_sections_and_drafts.up,
    down: migration_20260928_130239_page_sections_and_drafts.down,
    name: '20260928_130239_page_sections_and_drafts',
  },
  {
    up: migration_20260928_152904_homepage_sections_and_organisations.up,
    down: migration_20260928_152904_homepage_sections_and_organisations.down,
    name: '20260928_152904_homepage_sections_and_organisations',
  },
  {
    up: migration_20260929_063611_community_records_with_pages.up,
    down: migration_20260929_063611_community_records_with_pages.down,
    name: '20260929_063611_community_records_with_pages',
  },
  {
    up: migration_20260929_102614_pages_sections.up,
    down: migration_20260929_102614_pages_sections.down,
    name: '20260929_102614_pages_sections',
  },
  {
    up: migration_20260929_150919_community_leads.up,
    down: migration_20260929_150919_community_leads.down,
    name: '20260929_150919_community_leads',
  },
  {
    up: migration_20260930_090407_news_fallback_illustration.up,
    down: migration_20260930_090407_news_fallback_illustration.down,
    name: '20260930_090407_news_fallback_illustration',
  },
  {
    up: migration_20260930_153429_events_across_the_hub.up,
    down: migration_20260930_153429_events_across_the_hub.down,
    name: '20260930_153429_events_across_the_hub',
  },
  {
    up: migration_20260930_180818_community_tagline.up,
    down: migration_20260930_180818_community_tagline.down,
    name: '20260930_180818_community_tagline',
  },
  {
    up: migration_20260930_181925_community_carousel.up,
    down: migration_20260930_181925_community_carousel.down,
    name: '20260930_181925_community_carousel',
  },
  {
    up: migration_20260930_191639_logo_wall.up,
    down: migration_20260930_191639_logo_wall.down,
    name: '20260930_191639_logo_wall'
  },
];
