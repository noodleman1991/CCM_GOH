import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_carousel1_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum_pages_blocks_carousel1_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum_pages_blocks_people_widget_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_pages_blocks_atlas_embed_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero1_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__pages_v_blocks_section_header_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__pages_v_blocks_section_header_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__pages_v_blocks_grid_row_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__pages_v_blocks_grid_row_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_grid_row_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__pages_v_blocks_cta1_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__pages_v_blocks_cta1_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__pages_v_blocks_logo_cloud1_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__pages_v_blocks_logo_cloud1_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__pages_v_blocks_logo_cloud1_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel1_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel1_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum__pages_v_blocks_people_widget_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__pages_v_blocks_atlas_embed_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum_homepage_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_version_partner_logos_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__homepage_v_version_hero_welcome_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__homepage_v_version_agendas_module_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__homepage_v_version_agendas_module_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__homepage_v_version_agendas_module_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__homepage_v_version_regional_communities_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__homepage_v_version_regional_communities_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__homepage_v_version_regional_communities_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__homepage_v_version_news_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__homepage_v_version_news_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__homepage_v_version_news_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__homepage_v_version_mental_health_definition_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__homepage_v_version_mental_health_definition_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__homepage_v_version_partner_logos_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__homepage_v_version_partner_logos_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__homepage_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TABLE "pages_blocks_hero2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "pages_blocks_hero2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel1" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"size" "enum_pages_blocks_carousel1_size" DEFAULT 'one',
  	"indicators" "enum_pages_blocks_carousel1_indicators" DEFAULT 'dots',
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline_row_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "pages_blocks_timeline_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faqs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "pages_blocks_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_content_feed_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_content_feed_kinds",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_content_feed_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_content_feed_filters_regions",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_content_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"fill" "enum_pages_blocks_content_feed_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum_pages_blocks_content_feed_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum_pages_blocks_content_feed_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"view_all_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_events_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"upcoming_limit" numeric DEFAULT 6,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_people_widget" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 12,
  	"region" "enum_pages_blocks_people_widget_region",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_region_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_atlas_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" "enum_pages_blocks_atlas_embed_region",
  	"show_breakdown" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_submit_story_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_asset_id" varchar,
  	"illustration_alt" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_form_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"image_position" "enum__pages_v_blocks_hero1_image_position" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_section_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum__pages_v_blocks_section_header_section_width" DEFAULT 'default',
  	"stack_align" "enum__pages_v_blocks_section_header_stack_align" DEFAULT 'left',
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_split_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"sticky" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_split_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_split_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_grid_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_grid_agenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"agenda_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_grid_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"news_post_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_author" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_location" boolean DEFAULT false,
  	"custom_excerpt" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_grid_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_asset_id" varchar,
  	"header_image_alt" varchar,
  	"grid_columns" "enum__pages_v_blocks_grid_row_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum__pages_v_blocks_grid_row_card_variant" DEFAULT 'classic',
  	"mode" "enum__pages_v_blocks_grid_row_mode" DEFAULT 'manual',
  	"max_items" numeric DEFAULT 3,
  	"initial_display_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"section_width" "enum__pages_v_blocks_cta1_section_width" DEFAULT 'default',
  	"stack_align" "enum__pages_v_blocks_cta1_stack_align" DEFAULT 'left',
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_cloud1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum__pages_v_blocks_logo_cloud1_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_cloud1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum__pages_v_blocks_logo_cloud1_layout" DEFAULT 'marquee',
  	"motion_speed" "enum__pages_v_blocks_logo_cloud1_motion_speed" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"size" "enum__pages_v_blocks_carousel1_size" DEFAULT 'one',
  	"indicators" "enum__pages_v_blocks_carousel1_indicators" DEFAULT 'dots',
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_row_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faqs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content_feed_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_content_feed_kinds",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_content_feed_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_content_feed_filters_regions",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_content_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"fill" "enum__pages_v_blocks_content_feed_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum__pages_v_blocks_content_feed_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum__pages_v_blocks_content_feed_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"view_all_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_events_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"upcoming_limit" numeric DEFAULT 6,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_people_widget" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 12,
  	"region" "enum__pages_v_blocks_people_widget_region",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_region_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_atlas_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum__pages_v_blocks_atlas_embed_region",
  	"show_breakdown" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_submit_story_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_asset_id" varchar,
  	"illustration_alt" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_sanity_updated_at" timestamp(3) with time zone,
  	"version_slug" varchar,
  	"version_noindex" boolean DEFAULT false,
  	"version_og_image_asset_id" varchar,
  	"version_order_rank" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"testimonials_id" varchar,
  	"case_studies_id" varchar,
  	"news_posts_id" varchar,
  	"events_id" varchar,
  	"lived_experiences_id" varchar,
  	"research_outputs_id" varchar,
  	"agendas_id" varchar,
  	"regional_communities_id" varchar,
  	"tags_id" varchar
  );
  
  CREATE TABLE "_homepage_v_version_hero_welcome_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_split_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"sticky" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_split_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_grid_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_grid_agenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"agenda_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_grid_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"news_post_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_author" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_location" boolean DEFAULT false,
  	"custom_excerpt" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_version_mental_health_definition_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_partner_logos_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum__homepage_v_version_partner_logos_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_welcome_background_type" "enum_bg_type" DEFAULT 'none',
  	"version_hero_welcome_background_ccm_color" "enum_bg_ccm_color",
  	"version_hero_welcome_background_color" varchar,
  	"version_hero_welcome_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"version_hero_welcome_background_gradient_start_color" varchar,
  	"version_hero_welcome_background_gradient_end_color" varchar,
  	"version_hero_welcome_background_svg_pattern_id" varchar,
  	"version_hero_welcome_background_image_asset_id" varchar,
  	"version_hero_welcome_background_light_text" boolean DEFAULT false,
  	"version_hero_welcome_background_blob_accent" boolean DEFAULT false,
  	"version_hero_welcome_image_asset_id" varchar,
  	"version_hero_welcome_padding_top" boolean,
  	"version_hero_welcome_padding_bottom" boolean,
  	"version_hero_welcome_image_position" "enum__homepage_v_version_hero_welcome_image_position" DEFAULT 'right',
  	"version_global_agenda_padding_top" boolean,
  	"version_global_agenda_padding_bottom" boolean,
  	"version_global_agenda_no_gap" boolean DEFAULT false,
  	"version_how_to_use_padding_top" boolean,
  	"version_how_to_use_padding_bottom" boolean,
  	"version_how_to_use_no_gap" boolean DEFAULT false,
  	"version_agendas_module_padding_top" boolean,
  	"version_agendas_module_padding_bottom" boolean,
  	"version_agendas_module_background_type" "enum_bg_type" DEFAULT 'none',
  	"version_agendas_module_background_ccm_color" "enum_bg_ccm_color",
  	"version_agendas_module_background_color" varchar,
  	"version_agendas_module_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"version_agendas_module_background_gradient_start_color" varchar,
  	"version_agendas_module_background_gradient_end_color" varchar,
  	"version_agendas_module_background_svg_pattern_id" varchar,
  	"version_agendas_module_background_image_asset_id" varchar,
  	"version_agendas_module_background_light_text" boolean DEFAULT false,
  	"version_agendas_module_background_blob_accent" boolean DEFAULT false,
  	"version_agendas_module_header_image_asset_id" varchar,
  	"version_agendas_module_grid_columns" "enum__homepage_v_version_agendas_module_grid_columns" DEFAULT 'grid-cols-3',
  	"version_agendas_module_card_variant" "enum__homepage_v_version_agendas_module_card_variant" DEFAULT 'classic',
  	"version_agendas_module_mode" "enum__homepage_v_version_agendas_module_mode" DEFAULT 'manual',
  	"version_agendas_module_max_items" numeric DEFAULT 3,
  	"version_agendas_module_initial_display_count" numeric,
  	"version_lived_experiences_padding_top" boolean,
  	"version_lived_experiences_padding_bottom" boolean,
  	"version_regional_communities_padding_top" boolean,
  	"version_regional_communities_padding_bottom" boolean,
  	"version_regional_communities_background_type" "enum_bg_type" DEFAULT 'none',
  	"version_regional_communities_background_ccm_color" "enum_bg_ccm_color",
  	"version_regional_communities_background_color" varchar,
  	"version_regional_communities_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"version_regional_communities_background_gradient_start_color" varchar,
  	"version_regional_communities_background_gradient_end_color" varchar,
  	"version_regional_communities_background_svg_pattern_id" varchar,
  	"version_regional_communities_background_image_asset_id" varchar,
  	"version_regional_communities_background_light_text" boolean DEFAULT false,
  	"version_regional_communities_background_blob_accent" boolean DEFAULT false,
  	"version_regional_communities_header_image_asset_id" varchar,
  	"version_regional_communities_grid_columns" "enum__homepage_v_version_regional_communities_grid_columns" DEFAULT 'grid-cols-3',
  	"version_regional_communities_card_variant" "enum__homepage_v_version_regional_communities_card_variant" DEFAULT 'classic',
  	"version_regional_communities_mode" "enum__homepage_v_version_regional_communities_mode" DEFAULT 'manual',
  	"version_regional_communities_max_items" numeric DEFAULT 3,
  	"version_regional_communities_initial_display_count" numeric,
  	"version_collaboration_padding_top" boolean,
  	"version_collaboration_padding_bottom" boolean,
  	"version_collaboration_no_gap" boolean DEFAULT false,
  	"version_news_padding_top" boolean,
  	"version_news_padding_bottom" boolean,
  	"version_news_background_type" "enum_bg_type" DEFAULT 'none',
  	"version_news_background_ccm_color" "enum_bg_ccm_color",
  	"version_news_background_color" varchar,
  	"version_news_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"version_news_background_gradient_start_color" varchar,
  	"version_news_background_gradient_end_color" varchar,
  	"version_news_background_svg_pattern_id" varchar,
  	"version_news_background_image_asset_id" varchar,
  	"version_news_background_light_text" boolean DEFAULT false,
  	"version_news_background_blob_accent" boolean DEFAULT false,
  	"version_news_header_image_asset_id" varchar,
  	"version_news_grid_columns" "enum__homepage_v_version_news_grid_columns" DEFAULT 'grid-cols-3',
  	"version_news_card_variant" "enum__homepage_v_version_news_card_variant" DEFAULT 'classic',
  	"version_news_mode" "enum__homepage_v_version_news_mode" DEFAULT 'manual',
  	"version_news_max_items" numeric DEFAULT 3,
  	"version_news_initial_display_count" numeric,
  	"version_project_info_padding_top" boolean,
  	"version_project_info_padding_bottom" boolean,
  	"version_project_info_no_gap" boolean DEFAULT false,
  	"version_mental_health_definition_padding_top" boolean,
  	"version_mental_health_definition_padding_bottom" boolean,
  	"version_mental_health_definition_background_type" "enum_bg_type" DEFAULT 'none',
  	"version_mental_health_definition_background_ccm_color" "enum_bg_ccm_color",
  	"version_mental_health_definition_background_color" varchar,
  	"version_mental_health_definition_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"version_mental_health_definition_background_gradient_start_color" varchar,
  	"version_mental_health_definition_background_gradient_end_color" varchar,
  	"version_mental_health_definition_background_svg_pattern_id" varchar,
  	"version_mental_health_definition_background_image_asset_id" varchar,
  	"version_mental_health_definition_background_light_text" boolean DEFAULT false,
  	"version_mental_health_definition_background_blob_accent" boolean DEFAULT false,
  	"version_mental_health_definition_section_width" "enum__homepage_v_version_mental_health_definition_section_width" DEFAULT 'default',
  	"version_mental_health_definition_stack_align" "enum__homepage_v_version_mental_health_definition_stack_align" DEFAULT 'left',
  	"version_partner_logos_padding_top" boolean,
  	"version_partner_logos_padding_bottom" boolean,
  	"version_partner_logos_layout" "enum__homepage_v_version_partner_logos_layout" DEFAULT 'marquee',
  	"version_partner_logos_motion_speed" "enum__homepage_v_version_partner_logos_motion_speed" DEFAULT 'default',
  	"version_noindex" boolean DEFAULT false,
  	"version_og_image_asset_id" varchar,
  	"version__status" "enum__homepage_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__homepage_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_homepage_v_locales" (
  	"version_title" varchar,
  	"version_hero_welcome_background_image_alt" varchar,
  	"version_hero_welcome_tag_line" varchar,
  	"version_hero_welcome_title" varchar,
  	"version_hero_welcome_body" jsonb,
  	"version_hero_welcome_image_alt" varchar,
  	"version_agendas_module_background_image_alt" varchar,
  	"version_agendas_module_title" varchar,
  	"version_agendas_module_subtitle" varchar,
  	"version_agendas_module_description" jsonb,
  	"version_agendas_module_header_image_alt" varchar,
  	"version_lived_experiences_title" varchar,
  	"version_lived_experiences_description" varchar,
  	"version_regional_communities_background_image_alt" varchar,
  	"version_regional_communities_title" varchar,
  	"version_regional_communities_subtitle" varchar,
  	"version_regional_communities_description" jsonb,
  	"version_regional_communities_header_image_alt" varchar,
  	"version_news_background_image_alt" varchar,
  	"version_news_title" varchar,
  	"version_news_subtitle" varchar,
  	"version_news_description" jsonb,
  	"version_news_header_image_alt" varchar,
  	"version_mental_health_definition_background_image_alt" varchar,
  	"version_mental_health_definition_tag_line" varchar,
  	"version_mental_health_definition_title" varchar,
  	"version_mental_health_definition_body" jsonb,
  	"version_partner_logos_title" varchar,
  	"version_partner_logos_description" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"testimonials_id" varchar
  );
  
  ALTER TABLE "pages_blocks_grid_agenda" ALTER COLUMN "agenda_id" DROP NOT NULL;
  ALTER TABLE "pages_blocks_grid_news" ALTER COLUMN "news_post_id" DROP NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "homepage_blocks_grid_agenda" ALTER COLUMN "agenda_id" DROP NOT NULL;
  ALTER TABLE "homepage_blocks_grid_news" ALTER COLUMN "news_post_id" DROP NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "_status" "enum_pages_status" DEFAULT 'draft';
  ALTER TABLE "pages_rels" ADD COLUMN "case_studies_id" varchar;
  ALTER TABLE "pages_rels" ADD COLUMN "news_posts_id" varchar;
  ALTER TABLE "pages_rels" ADD COLUMN "events_id" varchar;
  ALTER TABLE "pages_rels" ADD COLUMN "lived_experiences_id" varchar;
  ALTER TABLE "pages_rels" ADD COLUMN "research_outputs_id" varchar;
  ALTER TABLE "pages_rels" ADD COLUMN "agendas_id" varchar;
  ALTER TABLE "pages_rels" ADD COLUMN "regional_communities_id" varchar;
  ALTER TABLE "pages_rels" ADD COLUMN "tags_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "_status" "enum_homepage_status" DEFAULT 'draft';
  ALTER TABLE "pages_blocks_hero2_links" ADD CONSTRAINT "pages_blocks_hero2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2" ADD CONSTRAINT "pages_blocks_hero2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2" ADD CONSTRAINT "pages_blocks_hero2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2" ADD CONSTRAINT "pages_blocks_hero2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_images" ADD CONSTRAINT "pages_blocks_carousel1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_images" ADD CONSTRAINT "pages_blocks_carousel1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1" ADD CONSTRAINT "pages_blocks_carousel1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1" ADD CONSTRAINT "pages_blocks_carousel1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1" ADD CONSTRAINT "pages_blocks_carousel1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_row_timelines" ADD CONSTRAINT "pages_blocks_timeline_row_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_timeline_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_row" ADD CONSTRAINT "pages_blocks_timeline_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faqs_faqs" ADD CONSTRAINT "pages_blocks_faqs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faqs" ADD CONSTRAINT "pages_blocks_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_feed_kinds" ADD CONSTRAINT "pages_blocks_content_feed_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_feed_filters_regions" ADD CONSTRAINT "pages_blocks_content_feed_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_feed" ADD CONSTRAINT "pages_blocks_content_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_events_calendar" ADD CONSTRAINT "pages_blocks_events_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_people_widget" ADD CONSTRAINT "pages_blocks_people_widget_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_region_map" ADD CONSTRAINT "pages_blocks_region_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_atlas_embed" ADD CONSTRAINT "pages_blocks_atlas_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_submit_story_banner" ADD CONSTRAINT "pages_blocks_submit_story_banner_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_submit_story_banner" ADD CONSTRAINT "pages_blocks_submit_story_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_newsletter" ADD CONSTRAINT "pages_blocks_form_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1_links" ADD CONSTRAINT "_pages_v_blocks_hero1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1" ADD CONSTRAINT "_pages_v_blocks_hero1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1" ADD CONSTRAINT "_pages_v_blocks_hero1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1" ADD CONSTRAINT "_pages_v_blocks_hero1_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1" ADD CONSTRAINT "_pages_v_blocks_hero1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_section_header" ADD CONSTRAINT "_pages_v_blocks_section_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_content" ADD CONSTRAINT "_pages_v_blocks_split_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_image" ADD CONSTRAINT "_pages_v_blocks_split_image_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_image" ADD CONSTRAINT "_pages_v_blocks_split_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_row" ADD CONSTRAINT "_pages_v_blocks_split_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_card" ADD CONSTRAINT "_pages_v_blocks_grid_card_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_card" ADD CONSTRAINT "_pages_v_blocks_grid_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_agenda" ADD CONSTRAINT "_pages_v_blocks_grid_agenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_agenda" ADD CONSTRAINT "_pages_v_blocks_grid_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_news" ADD CONSTRAINT "_pages_v_blocks_grid_news_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_news" ADD CONSTRAINT "_pages_v_blocks_grid_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row" ADD CONSTRAINT "_pages_v_blocks_grid_row_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row" ADD CONSTRAINT "_pages_v_blocks_grid_row_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row" ADD CONSTRAINT "_pages_v_blocks_grid_row_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row" ADD CONSTRAINT "_pages_v_blocks_grid_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel2" ADD CONSTRAINT "_pages_v_blocks_carousel2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1_links" ADD CONSTRAINT "_pages_v_blocks_cta1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1" ADD CONSTRAINT "_pages_v_blocks_cta1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1" ADD CONSTRAINT "_pages_v_blocks_cta1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1" ADD CONSTRAINT "_pages_v_blocks_cta1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud1_images" ADD CONSTRAINT "_pages_v_blocks_logo_cloud1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud1_images" ADD CONSTRAINT "_pages_v_blocks_logo_cloud1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud1" ADD CONSTRAINT "_pages_v_blocks_logo_cloud1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2_links" ADD CONSTRAINT "_pages_v_blocks_hero2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2" ADD CONSTRAINT "_pages_v_blocks_hero2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2" ADD CONSTRAINT "_pages_v_blocks_hero2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2" ADD CONSTRAINT "_pages_v_blocks_hero2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_images" ADD CONSTRAINT "_pages_v_blocks_carousel1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_images" ADD CONSTRAINT "_pages_v_blocks_carousel1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1" ADD CONSTRAINT "_pages_v_blocks_carousel1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1" ADD CONSTRAINT "_pages_v_blocks_carousel1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1" ADD CONSTRAINT "_pages_v_blocks_carousel1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_row_timelines" ADD CONSTRAINT "_pages_v_blocks_timeline_row_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_timeline_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_row" ADD CONSTRAINT "_pages_v_blocks_timeline_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faqs_faqs" ADD CONSTRAINT "_pages_v_blocks_faqs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faqs" ADD CONSTRAINT "_pages_v_blocks_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_feed_kinds" ADD CONSTRAINT "_pages_v_blocks_content_feed_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_feed_filters_regions" ADD CONSTRAINT "_pages_v_blocks_content_feed_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_feed" ADD CONSTRAINT "_pages_v_blocks_content_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_events_calendar" ADD CONSTRAINT "_pages_v_blocks_events_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_people_widget" ADD CONSTRAINT "_pages_v_blocks_people_widget_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_region_map" ADD CONSTRAINT "_pages_v_blocks_region_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_atlas_embed" ADD CONSTRAINT "_pages_v_blocks_atlas_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_submit_story_banner" ADD CONSTRAINT "_pages_v_blocks_submit_story_banner_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_submit_story_banner" ADD CONSTRAINT "_pages_v_blocks_submit_story_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_newsletter" ADD CONSTRAINT "_pages_v_blocks_form_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_og_image_asset_id_media_id_fk" FOREIGN KEY ("version_og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_hero_welcome_links" ADD CONSTRAINT "_homepage_v_version_hero_welcome_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_content" ADD CONSTRAINT "_homepage_v_blocks_split_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_image" ADD CONSTRAINT "_homepage_v_blocks_split_image_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_image" ADD CONSTRAINT "_homepage_v_blocks_split_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_card" ADD CONSTRAINT "_homepage_v_blocks_grid_card_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_card" ADD CONSTRAINT "_homepage_v_blocks_grid_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_agenda" ADD CONSTRAINT "_homepage_v_blocks_grid_agenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_agenda" ADD CONSTRAINT "_homepage_v_blocks_grid_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_news" ADD CONSTRAINT "_homepage_v_blocks_grid_news_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_news" ADD CONSTRAINT "_homepage_v_blocks_grid_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_mental_health_definition_links" ADD CONSTRAINT "_homepage_v_version_mental_health_definition_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_partner_logos_images" ADD CONSTRAINT "_homepage_v_version_partner_logos_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_partner_logos_images" ADD CONSTRAINT "_homepage_v_version_partner_logos_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_welcome_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("version_hero_welcome_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_welcome_background_image_asset_id_media_id_fk" FOREIGN KEY ("version_hero_welcome_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_welcome_image_asset_id_media_id_fk" FOREIGN KEY ("version_hero_welcome_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_agendas_module_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("version_agendas_module_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_agendas_module_background_image_asset_id_media_id_fk" FOREIGN KEY ("version_agendas_module_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_agendas_module_header_image_asset_id_media_id_fk" FOREIGN KEY ("version_agendas_module_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_regional_communities_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("version_regional_communities_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_regional_communities_background_image_asset_id_media_id_fk" FOREIGN KEY ("version_regional_communities_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_regional_communities_header_image_asset_id_media_id_fk" FOREIGN KEY ("version_regional_communities_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_news_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("version_news_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_news_background_image_asset_id_media_id_fk" FOREIGN KEY ("version_news_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_news_header_image_asset_id_media_id_fk" FOREIGN KEY ("version_news_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_mental_health_definition_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("version_mental_health_definition_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_mental_health_definition_background_image_asset_id_media_id_fk" FOREIGN KEY ("version_mental_health_definition_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_og_image_asset_id_media_id_fk" FOREIGN KEY ("version_og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_locales" ADD CONSTRAINT "_homepage_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero2_links_order_idx" ON "pages_blocks_hero2_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero2_links_parent_id_idx" ON "pages_blocks_hero2_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero2_links_locale_idx" ON "pages_blocks_hero2_links" USING btree ("_locale");
  CREATE INDEX "pages_blocks_hero2_order_idx" ON "pages_blocks_hero2" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero2_parent_id_idx" ON "pages_blocks_hero2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero2_path_idx" ON "pages_blocks_hero2" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero2_locale_idx" ON "pages_blocks_hero2" USING btree ("_locale");
  CREATE INDEX "pages_blocks_hero2_background_background_svg_pattern_idx" ON "pages_blocks_hero2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_hero2_background_image_background_image_ass_idx" ON "pages_blocks_hero2" USING btree ("background_image_asset_id");
  CREATE INDEX "pages_blocks_carousel1_images_order_idx" ON "pages_blocks_carousel1_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel1_images_parent_id_idx" ON "pages_blocks_carousel1_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel1_images_locale_idx" ON "pages_blocks_carousel1_images" USING btree ("_locale");
  CREATE INDEX "pages_blocks_carousel1_images_asset_idx" ON "pages_blocks_carousel1_images" USING btree ("asset_id");
  CREATE INDEX "pages_blocks_carousel1_order_idx" ON "pages_blocks_carousel1" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel1_parent_id_idx" ON "pages_blocks_carousel1" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel1_path_idx" ON "pages_blocks_carousel1" USING btree ("_path");
  CREATE INDEX "pages_blocks_carousel1_locale_idx" ON "pages_blocks_carousel1" USING btree ("_locale");
  CREATE INDEX "pages_blocks_carousel1_background_background_svg_pattern_idx" ON "pages_blocks_carousel1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_carousel1_background_image_background_image_idx" ON "pages_blocks_carousel1" USING btree ("background_image_asset_id");
  CREATE INDEX "pages_blocks_timeline_row_timelines_order_idx" ON "pages_blocks_timeline_row_timelines" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_row_timelines_parent_id_idx" ON "pages_blocks_timeline_row_timelines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_row_timelines_locale_idx" ON "pages_blocks_timeline_row_timelines" USING btree ("_locale");
  CREATE INDEX "pages_blocks_timeline_row_order_idx" ON "pages_blocks_timeline_row" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_row_parent_id_idx" ON "pages_blocks_timeline_row" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_row_path_idx" ON "pages_blocks_timeline_row" USING btree ("_path");
  CREATE INDEX "pages_blocks_timeline_row_locale_idx" ON "pages_blocks_timeline_row" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faqs_faqs_order_idx" ON "pages_blocks_faqs_faqs" USING btree ("_order");
  CREATE INDEX "pages_blocks_faqs_faqs_parent_id_idx" ON "pages_blocks_faqs_faqs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faqs_faqs_locale_idx" ON "pages_blocks_faqs_faqs" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faqs_order_idx" ON "pages_blocks_faqs" USING btree ("_order");
  CREATE INDEX "pages_blocks_faqs_parent_id_idx" ON "pages_blocks_faqs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faqs_path_idx" ON "pages_blocks_faqs" USING btree ("_path");
  CREATE INDEX "pages_blocks_faqs_locale_idx" ON "pages_blocks_faqs" USING btree ("_locale");
  CREATE INDEX "pages_blocks_content_feed_kinds_order_idx" ON "pages_blocks_content_feed_kinds" USING btree ("order");
  CREATE INDEX "pages_blocks_content_feed_kinds_parent_idx" ON "pages_blocks_content_feed_kinds" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_content_feed_kinds_locale_idx" ON "pages_blocks_content_feed_kinds" USING btree ("locale");
  CREATE INDEX "pages_blocks_content_feed_filters_regions_order_idx" ON "pages_blocks_content_feed_filters_regions" USING btree ("order");
  CREATE INDEX "pages_blocks_content_feed_filters_regions_parent_idx" ON "pages_blocks_content_feed_filters_regions" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_content_feed_filters_regions_locale_idx" ON "pages_blocks_content_feed_filters_regions" USING btree ("locale");
  CREATE INDEX "pages_blocks_content_feed_order_idx" ON "pages_blocks_content_feed" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_feed_parent_id_idx" ON "pages_blocks_content_feed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_feed_path_idx" ON "pages_blocks_content_feed" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_feed_locale_idx" ON "pages_blocks_content_feed" USING btree ("_locale");
  CREATE INDEX "pages_blocks_events_calendar_order_idx" ON "pages_blocks_events_calendar" USING btree ("_order");
  CREATE INDEX "pages_blocks_events_calendar_parent_id_idx" ON "pages_blocks_events_calendar" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_events_calendar_path_idx" ON "pages_blocks_events_calendar" USING btree ("_path");
  CREATE INDEX "pages_blocks_events_calendar_locale_idx" ON "pages_blocks_events_calendar" USING btree ("_locale");
  CREATE INDEX "pages_blocks_people_widget_order_idx" ON "pages_blocks_people_widget" USING btree ("_order");
  CREATE INDEX "pages_blocks_people_widget_parent_id_idx" ON "pages_blocks_people_widget" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_people_widget_path_idx" ON "pages_blocks_people_widget" USING btree ("_path");
  CREATE INDEX "pages_blocks_people_widget_locale_idx" ON "pages_blocks_people_widget" USING btree ("_locale");
  CREATE INDEX "pages_blocks_region_map_order_idx" ON "pages_blocks_region_map" USING btree ("_order");
  CREATE INDEX "pages_blocks_region_map_parent_id_idx" ON "pages_blocks_region_map" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_region_map_path_idx" ON "pages_blocks_region_map" USING btree ("_path");
  CREATE INDEX "pages_blocks_region_map_locale_idx" ON "pages_blocks_region_map" USING btree ("_locale");
  CREATE INDEX "pages_blocks_atlas_embed_order_idx" ON "pages_blocks_atlas_embed" USING btree ("_order");
  CREATE INDEX "pages_blocks_atlas_embed_parent_id_idx" ON "pages_blocks_atlas_embed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_atlas_embed_path_idx" ON "pages_blocks_atlas_embed" USING btree ("_path");
  CREATE INDEX "pages_blocks_atlas_embed_locale_idx" ON "pages_blocks_atlas_embed" USING btree ("_locale");
  CREATE INDEX "pages_blocks_submit_story_banner_order_idx" ON "pages_blocks_submit_story_banner" USING btree ("_order");
  CREATE INDEX "pages_blocks_submit_story_banner_parent_id_idx" ON "pages_blocks_submit_story_banner" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_submit_story_banner_path_idx" ON "pages_blocks_submit_story_banner" USING btree ("_path");
  CREATE INDEX "pages_blocks_submit_story_banner_locale_idx" ON "pages_blocks_submit_story_banner" USING btree ("_locale");
  CREATE INDEX "pages_blocks_submit_story_banner_illustration_illustrati_idx" ON "pages_blocks_submit_story_banner" USING btree ("illustration_asset_id");
  CREATE INDEX "pages_blocks_form_newsletter_order_idx" ON "pages_blocks_form_newsletter" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_newsletter_parent_id_idx" ON "pages_blocks_form_newsletter" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_newsletter_path_idx" ON "pages_blocks_form_newsletter" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_newsletter_locale_idx" ON "pages_blocks_form_newsletter" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_hero1_links_order_idx" ON "_pages_v_blocks_hero1_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero1_links_parent_id_idx" ON "_pages_v_blocks_hero1_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero1_links_locale_idx" ON "_pages_v_blocks_hero1_links" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_hero1_order_idx" ON "_pages_v_blocks_hero1" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero1_parent_id_idx" ON "_pages_v_blocks_hero1" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero1_path_idx" ON "_pages_v_blocks_hero1" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero1_locale_idx" ON "_pages_v_blocks_hero1" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_hero1_background_background_svg_pattern_idx" ON "_pages_v_blocks_hero1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_hero1_background_image_background_image__idx" ON "_pages_v_blocks_hero1" USING btree ("background_image_asset_id");
  CREATE INDEX "_pages_v_blocks_hero1_image_image_asset_idx" ON "_pages_v_blocks_hero1" USING btree ("image_asset_id");
  CREATE INDEX "_pages_v_blocks_section_header_order_idx" ON "_pages_v_blocks_section_header" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_section_header_parent_id_idx" ON "_pages_v_blocks_section_header" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_section_header_path_idx" ON "_pages_v_blocks_section_header" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_section_header_locale_idx" ON "_pages_v_blocks_section_header" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_split_content_order_idx" ON "_pages_v_blocks_split_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_content_parent_id_idx" ON "_pages_v_blocks_split_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_content_path_idx" ON "_pages_v_blocks_split_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_split_content_locale_idx" ON "_pages_v_blocks_split_content" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_split_image_order_idx" ON "_pages_v_blocks_split_image" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_image_parent_id_idx" ON "_pages_v_blocks_split_image" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_image_path_idx" ON "_pages_v_blocks_split_image" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_split_image_locale_idx" ON "_pages_v_blocks_split_image" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_split_image_image_image_asset_idx" ON "_pages_v_blocks_split_image" USING btree ("image_asset_id");
  CREATE INDEX "_pages_v_blocks_split_row_order_idx" ON "_pages_v_blocks_split_row" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_row_parent_id_idx" ON "_pages_v_blocks_split_row" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_row_path_idx" ON "_pages_v_blocks_split_row" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_split_row_locale_idx" ON "_pages_v_blocks_split_row" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_grid_card_order_idx" ON "_pages_v_blocks_grid_card" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_grid_card_parent_id_idx" ON "_pages_v_blocks_grid_card" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_card_path_idx" ON "_pages_v_blocks_grid_card" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_grid_card_locale_idx" ON "_pages_v_blocks_grid_card" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_grid_card_image_image_asset_idx" ON "_pages_v_blocks_grid_card" USING btree ("image_asset_id");
  CREATE INDEX "_pages_v_blocks_grid_agenda_order_idx" ON "_pages_v_blocks_grid_agenda" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_grid_agenda_parent_id_idx" ON "_pages_v_blocks_grid_agenda" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_agenda_path_idx" ON "_pages_v_blocks_grid_agenda" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_grid_agenda_locale_idx" ON "_pages_v_blocks_grid_agenda" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_grid_agenda_agenda_idx" ON "_pages_v_blocks_grid_agenda" USING btree ("agenda_id");
  CREATE INDEX "_pages_v_blocks_grid_news_order_idx" ON "_pages_v_blocks_grid_news" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_grid_news_parent_id_idx" ON "_pages_v_blocks_grid_news" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_news_path_idx" ON "_pages_v_blocks_grid_news" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_grid_news_locale_idx" ON "_pages_v_blocks_grid_news" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_grid_news_news_post_idx" ON "_pages_v_blocks_grid_news" USING btree ("news_post_id");
  CREATE INDEX "_pages_v_blocks_grid_row_order_idx" ON "_pages_v_blocks_grid_row" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_grid_row_parent_id_idx" ON "_pages_v_blocks_grid_row" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_row_path_idx" ON "_pages_v_blocks_grid_row" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_grid_row_locale_idx" ON "_pages_v_blocks_grid_row" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_grid_row_background_background_svg_patte_idx" ON "_pages_v_blocks_grid_row" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_grid_row_background_image_background_ima_idx" ON "_pages_v_blocks_grid_row" USING btree ("background_image_asset_id");
  CREATE INDEX "_pages_v_blocks_grid_row_header_image_header_image_asset_idx" ON "_pages_v_blocks_grid_row" USING btree ("header_image_asset_id");
  CREATE INDEX "_pages_v_blocks_carousel2_order_idx" ON "_pages_v_blocks_carousel2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel2_parent_id_idx" ON "_pages_v_blocks_carousel2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel2_path_idx" ON "_pages_v_blocks_carousel2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_carousel2_locale_idx" ON "_pages_v_blocks_carousel2" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_cta1_links_order_idx" ON "_pages_v_blocks_cta1_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta1_links_parent_id_idx" ON "_pages_v_blocks_cta1_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta1_links_locale_idx" ON "_pages_v_blocks_cta1_links" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_cta1_order_idx" ON "_pages_v_blocks_cta1" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta1_parent_id_idx" ON "_pages_v_blocks_cta1" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta1_path_idx" ON "_pages_v_blocks_cta1" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta1_locale_idx" ON "_pages_v_blocks_cta1" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_cta1_background_background_svg_pattern_idx" ON "_pages_v_blocks_cta1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_cta1_background_image_background_image_a_idx" ON "_pages_v_blocks_cta1" USING btree ("background_image_asset_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_images_order_idx" ON "_pages_v_blocks_logo_cloud1_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_images_parent_id_idx" ON "_pages_v_blocks_logo_cloud1_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_images_locale_idx" ON "_pages_v_blocks_logo_cloud1_images" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_images_asset_idx" ON "_pages_v_blocks_logo_cloud1_images" USING btree ("asset_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_order_idx" ON "_pages_v_blocks_logo_cloud1" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_parent_id_idx" ON "_pages_v_blocks_logo_cloud1" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_path_idx" ON "_pages_v_blocks_logo_cloud1" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_locale_idx" ON "_pages_v_blocks_logo_cloud1" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_hero2_links_order_idx" ON "_pages_v_blocks_hero2_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero2_links_parent_id_idx" ON "_pages_v_blocks_hero2_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero2_links_locale_idx" ON "_pages_v_blocks_hero2_links" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_hero2_order_idx" ON "_pages_v_blocks_hero2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero2_parent_id_idx" ON "_pages_v_blocks_hero2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero2_path_idx" ON "_pages_v_blocks_hero2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero2_locale_idx" ON "_pages_v_blocks_hero2" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_hero2_background_background_svg_pattern_idx" ON "_pages_v_blocks_hero2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_hero2_background_image_background_image__idx" ON "_pages_v_blocks_hero2" USING btree ("background_image_asset_id");
  CREATE INDEX "_pages_v_blocks_carousel1_images_order_idx" ON "_pages_v_blocks_carousel1_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel1_images_parent_id_idx" ON "_pages_v_blocks_carousel1_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel1_images_locale_idx" ON "_pages_v_blocks_carousel1_images" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_carousel1_images_asset_idx" ON "_pages_v_blocks_carousel1_images" USING btree ("asset_id");
  CREATE INDEX "_pages_v_blocks_carousel1_order_idx" ON "_pages_v_blocks_carousel1" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel1_parent_id_idx" ON "_pages_v_blocks_carousel1" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel1_path_idx" ON "_pages_v_blocks_carousel1" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_carousel1_locale_idx" ON "_pages_v_blocks_carousel1" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_carousel1_background_background_svg_patt_idx" ON "_pages_v_blocks_carousel1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_carousel1_background_image_background_im_idx" ON "_pages_v_blocks_carousel1" USING btree ("background_image_asset_id");
  CREATE INDEX "_pages_v_blocks_timeline_row_timelines_order_idx" ON "_pages_v_blocks_timeline_row_timelines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_row_timelines_parent_id_idx" ON "_pages_v_blocks_timeline_row_timelines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_row_timelines_locale_idx" ON "_pages_v_blocks_timeline_row_timelines" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_timeline_row_order_idx" ON "_pages_v_blocks_timeline_row" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_row_parent_id_idx" ON "_pages_v_blocks_timeline_row" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_row_path_idx" ON "_pages_v_blocks_timeline_row" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_timeline_row_locale_idx" ON "_pages_v_blocks_timeline_row" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_faqs_faqs_order_idx" ON "_pages_v_blocks_faqs_faqs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faqs_faqs_parent_id_idx" ON "_pages_v_blocks_faqs_faqs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faqs_faqs_locale_idx" ON "_pages_v_blocks_faqs_faqs" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_faqs_order_idx" ON "_pages_v_blocks_faqs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faqs_parent_id_idx" ON "_pages_v_blocks_faqs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faqs_path_idx" ON "_pages_v_blocks_faqs" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faqs_locale_idx" ON "_pages_v_blocks_faqs" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_content_feed_kinds_order_idx" ON "_pages_v_blocks_content_feed_kinds" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_content_feed_kinds_parent_idx" ON "_pages_v_blocks_content_feed_kinds" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_content_feed_kinds_locale_idx" ON "_pages_v_blocks_content_feed_kinds" USING btree ("locale");
  CREATE INDEX "_pages_v_blocks_content_feed_filters_regions_order_idx" ON "_pages_v_blocks_content_feed_filters_regions" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_content_feed_filters_regions_parent_idx" ON "_pages_v_blocks_content_feed_filters_regions" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_content_feed_filters_regions_locale_idx" ON "_pages_v_blocks_content_feed_filters_regions" USING btree ("locale");
  CREATE INDEX "_pages_v_blocks_content_feed_order_idx" ON "_pages_v_blocks_content_feed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_feed_parent_id_idx" ON "_pages_v_blocks_content_feed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_feed_path_idx" ON "_pages_v_blocks_content_feed" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_feed_locale_idx" ON "_pages_v_blocks_content_feed" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_events_calendar_order_idx" ON "_pages_v_blocks_events_calendar" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_events_calendar_parent_id_idx" ON "_pages_v_blocks_events_calendar" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_events_calendar_path_idx" ON "_pages_v_blocks_events_calendar" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_events_calendar_locale_idx" ON "_pages_v_blocks_events_calendar" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_people_widget_order_idx" ON "_pages_v_blocks_people_widget" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_people_widget_parent_id_idx" ON "_pages_v_blocks_people_widget" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_people_widget_path_idx" ON "_pages_v_blocks_people_widget" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_people_widget_locale_idx" ON "_pages_v_blocks_people_widget" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_region_map_order_idx" ON "_pages_v_blocks_region_map" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_region_map_parent_id_idx" ON "_pages_v_blocks_region_map" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_region_map_path_idx" ON "_pages_v_blocks_region_map" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_region_map_locale_idx" ON "_pages_v_blocks_region_map" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_atlas_embed_order_idx" ON "_pages_v_blocks_atlas_embed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_atlas_embed_parent_id_idx" ON "_pages_v_blocks_atlas_embed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_atlas_embed_path_idx" ON "_pages_v_blocks_atlas_embed" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_atlas_embed_locale_idx" ON "_pages_v_blocks_atlas_embed" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_order_idx" ON "_pages_v_blocks_submit_story_banner" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_parent_id_idx" ON "_pages_v_blocks_submit_story_banner" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_path_idx" ON "_pages_v_blocks_submit_story_banner" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_locale_idx" ON "_pages_v_blocks_submit_story_banner" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_illustration_illustr_idx" ON "_pages_v_blocks_submit_story_banner" USING btree ("illustration_asset_id");
  CREATE INDEX "_pages_v_blocks_form_newsletter_order_idx" ON "_pages_v_blocks_form_newsletter" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_newsletter_parent_id_idx" ON "_pages_v_blocks_form_newsletter" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_newsletter_path_idx" ON "_pages_v_blocks_form_newsletter" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_newsletter_locale_idx" ON "_pages_v_blocks_form_newsletter" USING btree ("_locale");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_sanity_updated_at_idx" ON "_pages_v" USING btree ("version_sanity_updated_at");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_og_image_version_og_image_asset_idx" ON "_pages_v" USING btree ("version_og_image_asset_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_locale_idx" ON "_pages_v_rels" USING btree ("locale");
  CREATE INDEX "_pages_v_rels_testimonials_id_idx" ON "_pages_v_rels" USING btree ("testimonials_id","locale");
  CREATE INDEX "_pages_v_rels_case_studies_id_idx" ON "_pages_v_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "_pages_v_rels_news_posts_id_idx" ON "_pages_v_rels" USING btree ("news_posts_id","locale");
  CREATE INDEX "_pages_v_rels_events_id_idx" ON "_pages_v_rels" USING btree ("events_id","locale");
  CREATE INDEX "_pages_v_rels_lived_experiences_id_idx" ON "_pages_v_rels" USING btree ("lived_experiences_id","locale");
  CREATE INDEX "_pages_v_rels_research_outputs_id_idx" ON "_pages_v_rels" USING btree ("research_outputs_id","locale");
  CREATE INDEX "_pages_v_rels_agendas_id_idx" ON "_pages_v_rels" USING btree ("agendas_id","locale");
  CREATE INDEX "_pages_v_rels_regional_communities_id_idx" ON "_pages_v_rels" USING btree ("regional_communities_id","locale");
  CREATE INDEX "_pages_v_rels_tags_id_idx" ON "_pages_v_rels" USING btree ("tags_id","locale");
  CREATE INDEX "_homepage_v_version_hero_welcome_links_order_idx" ON "_homepage_v_version_hero_welcome_links" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_hero_welcome_links_parent_id_idx" ON "_homepage_v_version_hero_welcome_links" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_hero_welcome_links_locale_idx" ON "_homepage_v_version_hero_welcome_links" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_split_content_order_idx" ON "_homepage_v_blocks_split_content" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_split_content_parent_id_idx" ON "_homepage_v_blocks_split_content" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_content_path_idx" ON "_homepage_v_blocks_split_content" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_split_content_locale_idx" ON "_homepage_v_blocks_split_content" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_split_image_order_idx" ON "_homepage_v_blocks_split_image" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_split_image_parent_id_idx" ON "_homepage_v_blocks_split_image" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_image_path_idx" ON "_homepage_v_blocks_split_image" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_split_image_locale_idx" ON "_homepage_v_blocks_split_image" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_split_image_image_image_asset_idx" ON "_homepage_v_blocks_split_image" USING btree ("image_asset_id");
  CREATE INDEX "_homepage_v_blocks_grid_card_order_idx" ON "_homepage_v_blocks_grid_card" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_grid_card_parent_id_idx" ON "_homepage_v_blocks_grid_card" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_card_path_idx" ON "_homepage_v_blocks_grid_card" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_grid_card_locale_idx" ON "_homepage_v_blocks_grid_card" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_grid_card_image_image_asset_idx" ON "_homepage_v_blocks_grid_card" USING btree ("image_asset_id");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_order_idx" ON "_homepage_v_blocks_grid_agenda" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_parent_id_idx" ON "_homepage_v_blocks_grid_agenda" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_path_idx" ON "_homepage_v_blocks_grid_agenda" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_locale_idx" ON "_homepage_v_blocks_grid_agenda" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_agenda_idx" ON "_homepage_v_blocks_grid_agenda" USING btree ("agenda_id");
  CREATE INDEX "_homepage_v_blocks_grid_news_order_idx" ON "_homepage_v_blocks_grid_news" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_grid_news_parent_id_idx" ON "_homepage_v_blocks_grid_news" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_news_path_idx" ON "_homepage_v_blocks_grid_news" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_grid_news_locale_idx" ON "_homepage_v_blocks_grid_news" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_grid_news_news_post_idx" ON "_homepage_v_blocks_grid_news" USING btree ("news_post_id");
  CREATE INDEX "_homepage_v_version_mental_health_definition_links_order_idx" ON "_homepage_v_version_mental_health_definition_links" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_mental_health_definition_links_parent_id_idx" ON "_homepage_v_version_mental_health_definition_links" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_mental_health_definition_links_locale_idx" ON "_homepage_v_version_mental_health_definition_links" USING btree ("_locale");
  CREATE INDEX "_homepage_v_version_partner_logos_images_order_idx" ON "_homepage_v_version_partner_logos_images" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_partner_logos_images_parent_id_idx" ON "_homepage_v_version_partner_logos_images" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_partner_logos_images_locale_idx" ON "_homepage_v_version_partner_logos_images" USING btree ("_locale");
  CREATE INDEX "_homepage_v_version_partner_logos_images_asset_idx" ON "_homepage_v_version_partner_logos_images" USING btree ("asset_id");
  CREATE INDEX "_homepage_v_version_hero_welcome_background_version_hero_idx" ON "_homepage_v" USING btree ("version_hero_welcome_background_svg_pattern_id");
  CREATE INDEX "_homepage_v_version_hero_welcome_background_image_versio_idx" ON "_homepage_v" USING btree ("version_hero_welcome_background_image_asset_id");
  CREATE INDEX "_homepage_v_version_hero_welcome_image_version_hero_welc_idx" ON "_homepage_v" USING btree ("version_hero_welcome_image_asset_id");
  CREATE INDEX "_homepage_v_version_agendas_module_background_version_ag_idx" ON "_homepage_v" USING btree ("version_agendas_module_background_svg_pattern_id");
  CREATE INDEX "_homepage_v_version_agendas_module_background_image_vers_idx" ON "_homepage_v" USING btree ("version_agendas_module_background_image_asset_id");
  CREATE INDEX "_homepage_v_version_agendas_module_header_image_version__idx" ON "_homepage_v" USING btree ("version_agendas_module_header_image_asset_id");
  CREATE INDEX "_homepage_v_version_regional_communities_background_vers_idx" ON "_homepage_v" USING btree ("version_regional_communities_background_svg_pattern_id");
  CREATE INDEX "_homepage_v_version_regional_communities_background_imag_idx" ON "_homepage_v" USING btree ("version_regional_communities_background_image_asset_id");
  CREATE INDEX "_homepage_v_version_regional_communities_header_image_ve_idx" ON "_homepage_v" USING btree ("version_regional_communities_header_image_asset_id");
  CREATE INDEX "_homepage_v_version_news_background_version_news_backgro_idx" ON "_homepage_v" USING btree ("version_news_background_svg_pattern_id");
  CREATE INDEX "_homepage_v_version_news_background_image_version_news_b_idx" ON "_homepage_v" USING btree ("version_news_background_image_asset_id");
  CREATE INDEX "_homepage_v_version_news_header_image_version_news_heade_idx" ON "_homepage_v" USING btree ("version_news_header_image_asset_id");
  CREATE INDEX "_homepage_v_version_mental_health_definition_background__idx" ON "_homepage_v" USING btree ("version_mental_health_definition_background_svg_pattern_id");
  CREATE INDEX "_homepage_v_version_mental_health_definition_backgroun_1_idx" ON "_homepage_v" USING btree ("version_mental_health_definition_background_image_asset_id");
  CREATE INDEX "_homepage_v_version_og_image_version_og_image_asset_idx" ON "_homepage_v" USING btree ("version_og_image_asset_id");
  CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_v_snapshot_idx" ON "_homepage_v" USING btree ("snapshot");
  CREATE INDEX "_homepage_v_published_locale_idx" ON "_homepage_v" USING btree ("published_locale");
  CREATE INDEX "_homepage_v_latest_idx" ON "_homepage_v" USING btree ("latest");
  CREATE INDEX "_homepage_v_autosave_idx" ON "_homepage_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_homepage_v_locales_locale_parent_id_unique" ON "_homepage_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_rels_order_idx" ON "_homepage_v_rels" USING btree ("order");
  CREATE INDEX "_homepage_v_rels_parent_idx" ON "_homepage_v_rels" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_rels_path_idx" ON "_homepage_v_rels" USING btree ("path");
  CREATE INDEX "_homepage_v_rels_locale_idx" ON "_homepage_v_rels" USING btree ("locale");
  CREATE INDEX "_homepage_v_rels_testimonials_id_idx" ON "_homepage_v_rels" USING btree ("testimonials_id","locale");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_rels_case_studies_id_idx" ON "pages_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "pages_rels_news_posts_id_idx" ON "pages_rels" USING btree ("news_posts_id","locale");
  CREATE INDEX "pages_rels_events_id_idx" ON "pages_rels" USING btree ("events_id","locale");
  CREATE INDEX "pages_rels_lived_experiences_id_idx" ON "pages_rels" USING btree ("lived_experiences_id","locale");
  CREATE INDEX "pages_rels_research_outputs_id_idx" ON "pages_rels" USING btree ("research_outputs_id","locale");
  CREATE INDEX "pages_rels_agendas_id_idx" ON "pages_rels" USING btree ("agendas_id","locale");
  CREATE INDEX "pages_rels_regional_communities_id_idx" ON "pages_rels" USING btree ("regional_communities_id","locale");
  CREATE INDEX "pages_rels_tags_id_idx" ON "pages_rels" USING btree ("tags_id","locale");
  CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");

  -- Existing pages and the homepage were live before drafts existed: keep them published.
  UPDATE "pages" SET "_status" = 'published' WHERE "_status" IS NULL OR "_status" = 'draft';
  UPDATE "homepage" SET "_status" = 'published' WHERE "_status" IS NULL OR "_status" = 'draft';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_carousel1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_carousel1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_timeline_row_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_timeline_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faqs_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_content_feed_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_content_feed_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_content_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_events_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_people_widget" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_region_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_atlas_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_submit_story_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_form_newsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_section_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_split_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_split_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_split_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_grid_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_grid_agenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_grid_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_grid_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_carousel2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_logo_cloud1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_logo_cloud1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_carousel1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_carousel1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_timeline_row_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_timeline_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faqs_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_content_feed_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_content_feed_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_content_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_events_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_people_widget" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_region_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_atlas_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_submit_story_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_form_newsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_hero_welcome_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_split_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_split_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_agenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_mental_health_definition_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_partner_logos_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero2_links" CASCADE;
  DROP TABLE "pages_blocks_hero2" CASCADE;
  DROP TABLE "pages_blocks_carousel1_images" CASCADE;
  DROP TABLE "pages_blocks_carousel1" CASCADE;
  DROP TABLE "pages_blocks_timeline_row_timelines" CASCADE;
  DROP TABLE "pages_blocks_timeline_row" CASCADE;
  DROP TABLE "pages_blocks_faqs_faqs" CASCADE;
  DROP TABLE "pages_blocks_faqs" CASCADE;
  DROP TABLE "pages_blocks_content_feed_kinds" CASCADE;
  DROP TABLE "pages_blocks_content_feed_filters_regions" CASCADE;
  DROP TABLE "pages_blocks_content_feed" CASCADE;
  DROP TABLE "pages_blocks_events_calendar" CASCADE;
  DROP TABLE "pages_blocks_people_widget" CASCADE;
  DROP TABLE "pages_blocks_region_map" CASCADE;
  DROP TABLE "pages_blocks_atlas_embed" CASCADE;
  DROP TABLE "pages_blocks_submit_story_banner" CASCADE;
  DROP TABLE "pages_blocks_form_newsletter" CASCADE;
  DROP TABLE "_pages_v_blocks_hero1_links" CASCADE;
  DROP TABLE "_pages_v_blocks_hero1" CASCADE;
  DROP TABLE "_pages_v_blocks_section_header" CASCADE;
  DROP TABLE "_pages_v_blocks_split_content" CASCADE;
  DROP TABLE "_pages_v_blocks_split_image" CASCADE;
  DROP TABLE "_pages_v_blocks_split_row" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_card" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_agenda" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_news" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_row" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel2" CASCADE;
  DROP TABLE "_pages_v_blocks_cta1_links" CASCADE;
  DROP TABLE "_pages_v_blocks_cta1" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_cloud1_images" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_cloud1" CASCADE;
  DROP TABLE "_pages_v_blocks_hero2_links" CASCADE;
  DROP TABLE "_pages_v_blocks_hero2" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel1_images" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel1" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_row_timelines" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_row" CASCADE;
  DROP TABLE "_pages_v_blocks_faqs_faqs" CASCADE;
  DROP TABLE "_pages_v_blocks_faqs" CASCADE;
  DROP TABLE "_pages_v_blocks_content_feed_kinds" CASCADE;
  DROP TABLE "_pages_v_blocks_content_feed_filters_regions" CASCADE;
  DROP TABLE "_pages_v_blocks_content_feed" CASCADE;
  DROP TABLE "_pages_v_blocks_events_calendar" CASCADE;
  DROP TABLE "_pages_v_blocks_people_widget" CASCADE;
  DROP TABLE "_pages_v_blocks_region_map" CASCADE;
  DROP TABLE "_pages_v_blocks_atlas_embed" CASCADE;
  DROP TABLE "_pages_v_blocks_submit_story_banner" CASCADE;
  DROP TABLE "_pages_v_blocks_form_newsletter" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "_homepage_v_version_hero_welcome_links" CASCADE;
  DROP TABLE "_homepage_v_blocks_split_content" CASCADE;
  DROP TABLE "_homepage_v_blocks_split_image" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_card" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_agenda" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_news" CASCADE;
  DROP TABLE "_homepage_v_version_mental_health_definition_links" CASCADE;
  DROP TABLE "_homepage_v_version_partner_logos_images" CASCADE;
  DROP TABLE "_homepage_v" CASCADE;
  DROP TABLE "_homepage_v_locales" CASCADE;
  DROP TABLE "_homepage_v_rels" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_case_studies_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_news_posts_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_events_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_lived_experiences_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_research_outputs_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_agendas_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_regional_communities_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_tags_fk";
  
  DROP INDEX "pages__status_idx";
  DROP INDEX "pages_rels_case_studies_id_idx";
  DROP INDEX "pages_rels_news_posts_id_idx";
  DROP INDEX "pages_rels_events_id_idx";
  DROP INDEX "pages_rels_lived_experiences_id_idx";
  DROP INDEX "pages_rels_research_outputs_id_idx";
  DROP INDEX "pages_rels_agendas_id_idx";
  DROP INDEX "pages_rels_regional_communities_id_idx";
  DROP INDEX "pages_rels_tags_id_idx";
  DROP INDEX "homepage__status_idx";
  ALTER TABLE "pages_blocks_grid_agenda" ALTER COLUMN "agenda_id" SET NOT NULL;
  ALTER TABLE "pages_blocks_grid_news" ALTER COLUMN "news_post_id" SET NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "homepage_blocks_grid_agenda" ALTER COLUMN "agenda_id" SET NOT NULL;
  ALTER TABLE "homepage_blocks_grid_news" ALTER COLUMN "news_post_id" SET NOT NULL;
  ALTER TABLE "pages" DROP COLUMN "_status";
  ALTER TABLE "pages_rels" DROP COLUMN "case_studies_id";
  ALTER TABLE "pages_rels" DROP COLUMN "news_posts_id";
  ALTER TABLE "pages_rels" DROP COLUMN "events_id";
  ALTER TABLE "pages_rels" DROP COLUMN "lived_experiences_id";
  ALTER TABLE "pages_rels" DROP COLUMN "research_outputs_id";
  ALTER TABLE "pages_rels" DROP COLUMN "agendas_id";
  ALTER TABLE "pages_rels" DROP COLUMN "regional_communities_id";
  ALTER TABLE "pages_rels" DROP COLUMN "tags_id";
  ALTER TABLE "homepage" DROP COLUMN "_status";
  DROP TYPE "public"."enum_pages_blocks_carousel1_size";
  DROP TYPE "public"."enum_pages_blocks_carousel1_indicators";
  DROP TYPE "public"."enum_pages_blocks_content_feed_kinds";
  DROP TYPE "public"."enum_pages_blocks_content_feed_filters_regions";
  DROP TYPE "public"."enum_pages_blocks_content_feed_fill";
  DROP TYPE "public"."enum_pages_blocks_content_feed_sort";
  DROP TYPE "public"."enum_pages_blocks_content_feed_layout";
  DROP TYPE "public"."enum_pages_blocks_people_widget_region";
  DROP TYPE "public"."enum_pages_blocks_atlas_embed_region";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero1_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_section_header_section_width";
  DROP TYPE "public"."enum__pages_v_blocks_section_header_stack_align";
  DROP TYPE "public"."enum__pages_v_blocks_grid_row_grid_columns";
  DROP TYPE "public"."enum__pages_v_blocks_grid_row_card_variant";
  DROP TYPE "public"."enum__pages_v_blocks_grid_row_mode";
  DROP TYPE "public"."enum__pages_v_blocks_cta1_section_width";
  DROP TYPE "public"."enum__pages_v_blocks_cta1_stack_align";
  DROP TYPE "public"."enum__pages_v_blocks_logo_cloud1_images_org_type";
  DROP TYPE "public"."enum__pages_v_blocks_logo_cloud1_layout";
  DROP TYPE "public"."enum__pages_v_blocks_logo_cloud1_motion_speed";
  DROP TYPE "public"."enum__pages_v_blocks_carousel1_size";
  DROP TYPE "public"."enum__pages_v_blocks_carousel1_indicators";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_kinds";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_filters_regions";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_fill";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_sort";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_layout";
  DROP TYPE "public"."enum__pages_v_blocks_people_widget_region";
  DROP TYPE "public"."enum__pages_v_blocks_atlas_embed_region";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_homepage_status";
  DROP TYPE "public"."enum__homepage_v_version_partner_logos_images_org_type";
  DROP TYPE "public"."enum__homepage_v_version_hero_welcome_image_position";
  DROP TYPE "public"."enum__homepage_v_version_agendas_module_grid_columns";
  DROP TYPE "public"."enum__homepage_v_version_agendas_module_card_variant";
  DROP TYPE "public"."enum__homepage_v_version_agendas_module_mode";
  DROP TYPE "public"."enum__homepage_v_version_regional_communities_grid_columns";
  DROP TYPE "public"."enum__homepage_v_version_regional_communities_card_variant";
  DROP TYPE "public"."enum__homepage_v_version_regional_communities_mode";
  DROP TYPE "public"."enum__homepage_v_version_news_grid_columns";
  DROP TYPE "public"."enum__homepage_v_version_news_card_variant";
  DROP TYPE "public"."enum__homepage_v_version_news_mode";
  DROP TYPE "public"."enum__homepage_v_version_mental_health_definition_section_width";
  DROP TYPE "public"."enum__homepage_v_version_mental_health_definition_stack_align";
  DROP TYPE "public"."enum__homepage_v_version_partner_logos_layout";
  DROP TYPE "public"."enum__homepage_v_version_partner_logos_motion_speed";
  DROP TYPE "public"."enum__homepage_v_version_status";
  DROP TYPE "public"."enum__homepage_v_published_locale";`)
}
