import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero1_2_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_pages_blocks_section_header_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_pages_blocks_section_header_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_pages_blocks_carousel1_2_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum_pages_blocks_carousel1_2_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_2_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_2_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_2_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_2_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_2_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum_pages_blocks_people_widget_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_pages_blocks_grid_row_2_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_pages_blocks_grid_row_2_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_pages_blocks_grid_row_2_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_atlas_embed_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_pages_blocks_cta1_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_pages_blocks_cta1_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_pages_blocks_logo_cloud1_2_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_pages_blocks_logo_cloud1_2_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_pages_blocks_logo_cloud1_2_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__pages_v_blocks_hero1_2_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__pages_v_blocks_section_header_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__pages_v_blocks_section_header_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel1_2_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel1_2_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_2_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_2_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_2_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_2_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_2_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum__pages_v_blocks_people_widget_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__pages_v_blocks_grid_row_2_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__pages_v_blocks_grid_row_2_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__pages_v_blocks_grid_row_2_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_atlas_embed_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__pages_v_blocks_cta1_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__pages_v_blocks_cta1_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__pages_v_blocks_logo_cloud1_2_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__pages_v_blocks_logo_cloud1_2_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__pages_v_blocks_logo_cloud1_2_motion_speed" AS ENUM('default', 'slow');
  CREATE TABLE "pages_blocks_hero1_2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "pages_blocks_hero1_2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"image_position" "enum_pages_blocks_hero1_2_image_position" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_hero1_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_alt" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero2_2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "pages_blocks_hero2_2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_hero2_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_section_header_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum_pages_blocks_section_header_2_section_width" DEFAULT 'default',
  	"stack_align" "enum_pages_blocks_section_header_2_stack_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_section_header_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_split_content_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sticky" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_split_content_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_split_image_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_split_image_2_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_split_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel1_2_images_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_carousel1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_pages_blocks_carousel1_2_size" DEFAULT 'one',
  	"indicators" "enum_pages_blocks_carousel1_2_indicators" DEFAULT 'dots',
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel1_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_timeline_row_2_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_timeline_row_2_timelines_locales" (
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_timeline_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faqs_2_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faqs_2_faqs_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faqs_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_content_feed_2_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_content_feed_2_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_content_feed_2_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_content_feed_2_filters_regions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_content_feed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"fill" "enum_pages_blocks_content_feed_2_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum_pages_blocks_content_feed_2_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum_pages_blocks_content_feed_2_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_content_feed_2_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_events_calendar_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"upcoming_limit" numeric DEFAULT 6,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_events_calendar_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_people_widget_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 12,
  	"region" "enum_pages_blocks_people_widget_2_region",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_people_widget_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_grid_card_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_grid_card_2_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_grid_agenda_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"agenda_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_grid_news_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"news_post_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_author" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_location" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_grid_news_2_locales" (
  	"custom_excerpt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_grid_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header_image_asset_id" varchar,
  	"mode" "enum_pages_blocks_grid_row_2_mode" DEFAULT 'manual',
  	"max_items" numeric DEFAULT 3,
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
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"grid_columns" "enum_pages_blocks_grid_row_2_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum_pages_blocks_grid_row_2_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_grid_row_2_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_alt" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_region_map_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_region_map_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_atlas_embed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" "enum_pages_blocks_atlas_embed_2_region",
  	"show_breakdown" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta1_2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "pages_blocks_cta1_2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
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
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"section_width" "enum_pages_blocks_cta1_2_section_width" DEFAULT 'default',
  	"stack_align" "enum_pages_blocks_cta1_2_stack_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta1_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_submit_story_banner_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"illustration_asset_id" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_submit_story_banner_2_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_form_newsletter_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_form_newsletter_2_locales" (
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_logo_cloud1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"org_type" "enum_pages_blocks_logo_cloud1_2_images_org_type"
  );
  
  CREATE TABLE "pages_blocks_logo_cloud1_2_images_locales" (
  	"alt" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_logo_cloud1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_pages_blocks_logo_cloud1_2_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum_pages_blocks_logo_cloud1_2_motion_speed" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_logo_cloud1_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_carousel2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel2_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_hero1_2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero1_2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_hero1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"image_position" "enum__pages_v_blocks_hero1_2_image_position" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero1_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_alt" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_hero2_2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero2_2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_hero2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero2_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_section_header_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum__pages_v_blocks_section_header_2_section_width" DEFAULT 'default',
  	"stack_align" "enum__pages_v_blocks_section_header_2_stack_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_section_header_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_split_content_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"sticky" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_split_content_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_split_image_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_split_image_2_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_split_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel1_2_images_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_carousel1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "enum__pages_v_blocks_carousel1_2_size" DEFAULT 'one',
  	"indicators" "enum__pages_v_blocks_carousel1_2_indicators" DEFAULT 'dots',
  	"background_type" "enum_bg_type" DEFAULT 'none',
  	"background_ccm_color" "enum_bg_ccm_color",
  	"background_color" varchar,
  	"background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"background_gradient_start_color" varchar,
  	"background_gradient_end_color" varchar,
  	"background_svg_pattern_id" varchar,
  	"background_image_asset_id" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel1_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_row_2_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_row_2_timelines_locales" (
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faqs_2_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faqs_2_faqs_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faqs_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content_feed_2_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_content_feed_2_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_content_feed_2_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_content_feed_2_filters_regions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_content_feed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"fill" "enum__pages_v_blocks_content_feed_2_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum__pages_v_blocks_content_feed_2_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum__pages_v_blocks_content_feed_2_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content_feed_2_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_events_calendar_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"upcoming_limit" numeric DEFAULT 6,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_events_calendar_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_people_widget_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 12,
  	"region" "enum__pages_v_blocks_people_widget_2_region",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_people_widget_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_grid_card_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_grid_card_2_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_grid_agenda_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"agenda_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_grid_news_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"news_post_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_author" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_location" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_grid_news_2_locales" (
  	"custom_excerpt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_grid_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_image_asset_id" varchar,
  	"mode" "enum__pages_v_blocks_grid_row_2_mode" DEFAULT 'manual',
  	"max_items" numeric DEFAULT 3,
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
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"grid_columns" "enum__pages_v_blocks_grid_row_2_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum__pages_v_blocks_grid_row_2_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_grid_row_2_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_alt" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_region_map_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_region_map_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_atlas_embed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum__pages_v_blocks_atlas_embed_2_region",
  	"show_breakdown" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta1_2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta1_2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cta1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
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
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"section_width" "enum__pages_v_blocks_cta1_2_section_width" DEFAULT 'default',
  	"stack_align" "enum__pages_v_blocks_cta1_2_stack_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta1_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_submit_story_banner_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"illustration_asset_id" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_submit_story_banner_2_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_form_newsletter_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_newsletter_2_locales" (
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_logo_cloud1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"org_type" "enum__pages_v_blocks_logo_cloud1_2_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_cloud1_2_images_locales" (
  	"alt" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_logo_cloud1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum__pages_v_blocks_logo_cloud1_2_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum__pages_v_blocks_logo_cloud1_2_motion_speed" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_cloud1_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_carousel2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel2_2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages" ADD COLUMN "layout_per_language" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_layout_per_language" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_hero1_2_links" ADD CONSTRAINT "pages_blocks_hero1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1_2_links_locales" ADD CONSTRAINT "pages_blocks_hero1_2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero1_2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1_2" ADD CONSTRAINT "pages_blocks_hero1_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1_2" ADD CONSTRAINT "pages_blocks_hero1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1_2" ADD CONSTRAINT "pages_blocks_hero1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1_2" ADD CONSTRAINT "pages_blocks_hero1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1_2_locales" ADD CONSTRAINT "pages_blocks_hero1_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2_2_links" ADD CONSTRAINT "pages_blocks_hero2_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2_2_links_locales" ADD CONSTRAINT "pages_blocks_hero2_2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero2_2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2_2" ADD CONSTRAINT "pages_blocks_hero2_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2_2" ADD CONSTRAINT "pages_blocks_hero2_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2_2" ADD CONSTRAINT "pages_blocks_hero2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero2_2_locales" ADD CONSTRAINT "pages_blocks_hero2_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_section_header_2" ADD CONSTRAINT "pages_blocks_section_header_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_section_header_2_locales" ADD CONSTRAINT "pages_blocks_section_header_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_section_header_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_content_2" ADD CONSTRAINT "pages_blocks_split_content_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_content_2_locales" ADD CONSTRAINT "pages_blocks_split_content_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_split_content_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_image_2" ADD CONSTRAINT "pages_blocks_split_image_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_image_2" ADD CONSTRAINT "pages_blocks_split_image_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_image_2_locales" ADD CONSTRAINT "pages_blocks_split_image_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_split_image_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_row_2" ADD CONSTRAINT "pages_blocks_split_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_2_images" ADD CONSTRAINT "pages_blocks_carousel1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_2_images" ADD CONSTRAINT "pages_blocks_carousel1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_carousel1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_2_images_locales" ADD CONSTRAINT "pages_blocks_carousel1_2_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_carousel1_2_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_2" ADD CONSTRAINT "pages_blocks_carousel1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_2" ADD CONSTRAINT "pages_blocks_carousel1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_2" ADD CONSTRAINT "pages_blocks_carousel1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel1_2_locales" ADD CONSTRAINT "pages_blocks_carousel1_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_carousel1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_row_2_timelines" ADD CONSTRAINT "pages_blocks_timeline_row_2_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_timeline_row_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_row_2_timelines_locales" ADD CONSTRAINT "pages_blocks_timeline_row_2_timelines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_timeline_row_2_timelines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_row_2" ADD CONSTRAINT "pages_blocks_timeline_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faqs_2_faqs" ADD CONSTRAINT "pages_blocks_faqs_2_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faqs_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faqs_2_faqs_locales" ADD CONSTRAINT "pages_blocks_faqs_2_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faqs_2_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faqs_2" ADD CONSTRAINT "pages_blocks_faqs_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_feed_2_kinds" ADD CONSTRAINT "pages_blocks_content_feed_2_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_feed_2_filters_regions" ADD CONSTRAINT "pages_blocks_content_feed_2_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_feed_2" ADD CONSTRAINT "pages_blocks_content_feed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_feed_2_locales" ADD CONSTRAINT "pages_blocks_content_feed_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_events_calendar_2" ADD CONSTRAINT "pages_blocks_events_calendar_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_events_calendar_2_locales" ADD CONSTRAINT "pages_blocks_events_calendar_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_events_calendar_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_people_widget_2" ADD CONSTRAINT "pages_blocks_people_widget_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_people_widget_2_locales" ADD CONSTRAINT "pages_blocks_people_widget_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_people_widget_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_card_2" ADD CONSTRAINT "pages_blocks_grid_card_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_card_2" ADD CONSTRAINT "pages_blocks_grid_card_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_card_2_locales" ADD CONSTRAINT "pages_blocks_grid_card_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_grid_card_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_agenda_2" ADD CONSTRAINT "pages_blocks_grid_agenda_2_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_agenda_2" ADD CONSTRAINT "pages_blocks_grid_agenda_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_news_2" ADD CONSTRAINT "pages_blocks_grid_news_2_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_news_2" ADD CONSTRAINT "pages_blocks_grid_news_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_news_2_locales" ADD CONSTRAINT "pages_blocks_grid_news_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_grid_news_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row_2" ADD CONSTRAINT "pages_blocks_grid_row_2_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row_2" ADD CONSTRAINT "pages_blocks_grid_row_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row_2" ADD CONSTRAINT "pages_blocks_grid_row_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row_2" ADD CONSTRAINT "pages_blocks_grid_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row_2_locales" ADD CONSTRAINT "pages_blocks_grid_row_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_grid_row_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_region_map_2" ADD CONSTRAINT "pages_blocks_region_map_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_region_map_2_locales" ADD CONSTRAINT "pages_blocks_region_map_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_region_map_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_atlas_embed_2" ADD CONSTRAINT "pages_blocks_atlas_embed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1_2_links" ADD CONSTRAINT "pages_blocks_cta1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1_2_links_locales" ADD CONSTRAINT "pages_blocks_cta1_2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta1_2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1_2" ADD CONSTRAINT "pages_blocks_cta1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1_2" ADD CONSTRAINT "pages_blocks_cta1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1_2" ADD CONSTRAINT "pages_blocks_cta1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1_2_locales" ADD CONSTRAINT "pages_blocks_cta1_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_submit_story_banner_2" ADD CONSTRAINT "pages_blocks_submit_story_banner_2_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_submit_story_banner_2" ADD CONSTRAINT "pages_blocks_submit_story_banner_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_submit_story_banner_2_locales" ADD CONSTRAINT "pages_blocks_submit_story_banner_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_submit_story_banner_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_newsletter_2" ADD CONSTRAINT "pages_blocks_form_newsletter_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_newsletter_2_locales" ADD CONSTRAINT "pages_blocks_form_newsletter_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_form_newsletter_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud1_2_images" ADD CONSTRAINT "pages_blocks_logo_cloud1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud1_2_images" ADD CONSTRAINT "pages_blocks_logo_cloud1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_cloud1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud1_2_images_locales" ADD CONSTRAINT "pages_blocks_logo_cloud1_2_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_cloud1_2_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud1_2" ADD CONSTRAINT "pages_blocks_logo_cloud1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud1_2_locales" ADD CONSTRAINT "pages_blocks_logo_cloud1_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_cloud1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel2_2" ADD CONSTRAINT "pages_blocks_carousel2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel2_2_locales" ADD CONSTRAINT "pages_blocks_carousel2_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_carousel2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1_2_links" ADD CONSTRAINT "_pages_v_blocks_hero1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1_2_links_locales" ADD CONSTRAINT "_pages_v_blocks_hero1_2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero1_2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1_2" ADD CONSTRAINT "_pages_v_blocks_hero1_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1_2" ADD CONSTRAINT "_pages_v_blocks_hero1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1_2" ADD CONSTRAINT "_pages_v_blocks_hero1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1_2" ADD CONSTRAINT "_pages_v_blocks_hero1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero1_2_locales" ADD CONSTRAINT "_pages_v_blocks_hero1_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2_2_links" ADD CONSTRAINT "_pages_v_blocks_hero2_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2_2_links_locales" ADD CONSTRAINT "_pages_v_blocks_hero2_2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero2_2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2_2" ADD CONSTRAINT "_pages_v_blocks_hero2_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2_2" ADD CONSTRAINT "_pages_v_blocks_hero2_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2_2" ADD CONSTRAINT "_pages_v_blocks_hero2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero2_2_locales" ADD CONSTRAINT "_pages_v_blocks_hero2_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_section_header_2" ADD CONSTRAINT "_pages_v_blocks_section_header_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_section_header_2_locales" ADD CONSTRAINT "_pages_v_blocks_section_header_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_section_header_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_content_2" ADD CONSTRAINT "_pages_v_blocks_split_content_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_content_2_locales" ADD CONSTRAINT "_pages_v_blocks_split_content_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_split_content_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_image_2" ADD CONSTRAINT "_pages_v_blocks_split_image_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_image_2" ADD CONSTRAINT "_pages_v_blocks_split_image_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_image_2_locales" ADD CONSTRAINT "_pages_v_blocks_split_image_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_split_image_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_split_row_2" ADD CONSTRAINT "_pages_v_blocks_split_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_2_images" ADD CONSTRAINT "_pages_v_blocks_carousel1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_2_images" ADD CONSTRAINT "_pages_v_blocks_carousel1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_carousel1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_2_images_locales" ADD CONSTRAINT "_pages_v_blocks_carousel1_2_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_carousel1_2_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_2" ADD CONSTRAINT "_pages_v_blocks_carousel1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_2" ADD CONSTRAINT "_pages_v_blocks_carousel1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_2" ADD CONSTRAINT "_pages_v_blocks_carousel1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel1_2_locales" ADD CONSTRAINT "_pages_v_blocks_carousel1_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_carousel1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_row_2_timelines" ADD CONSTRAINT "_pages_v_blocks_timeline_row_2_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_timeline_row_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_row_2_timelines_locales" ADD CONSTRAINT "_pages_v_blocks_timeline_row_2_timelines_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_timeline_row_2_timelines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_row_2" ADD CONSTRAINT "_pages_v_blocks_timeline_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faqs_2_faqs" ADD CONSTRAINT "_pages_v_blocks_faqs_2_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faqs_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faqs_2_faqs_locales" ADD CONSTRAINT "_pages_v_blocks_faqs_2_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faqs_2_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faqs_2" ADD CONSTRAINT "_pages_v_blocks_faqs_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_feed_2_kinds" ADD CONSTRAINT "_pages_v_blocks_content_feed_2_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_feed_2_filters_regions" ADD CONSTRAINT "_pages_v_blocks_content_feed_2_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_feed_2" ADD CONSTRAINT "_pages_v_blocks_content_feed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_feed_2_locales" ADD CONSTRAINT "_pages_v_blocks_content_feed_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_events_calendar_2" ADD CONSTRAINT "_pages_v_blocks_events_calendar_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_events_calendar_2_locales" ADD CONSTRAINT "_pages_v_blocks_events_calendar_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_events_calendar_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_people_widget_2" ADD CONSTRAINT "_pages_v_blocks_people_widget_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_people_widget_2_locales" ADD CONSTRAINT "_pages_v_blocks_people_widget_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_people_widget_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_card_2" ADD CONSTRAINT "_pages_v_blocks_grid_card_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_card_2" ADD CONSTRAINT "_pages_v_blocks_grid_card_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_card_2_locales" ADD CONSTRAINT "_pages_v_blocks_grid_card_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_grid_card_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_agenda_2" ADD CONSTRAINT "_pages_v_blocks_grid_agenda_2_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_agenda_2" ADD CONSTRAINT "_pages_v_blocks_grid_agenda_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_news_2" ADD CONSTRAINT "_pages_v_blocks_grid_news_2_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_news_2" ADD CONSTRAINT "_pages_v_blocks_grid_news_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_news_2_locales" ADD CONSTRAINT "_pages_v_blocks_grid_news_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_grid_news_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row_2" ADD CONSTRAINT "_pages_v_blocks_grid_row_2_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row_2" ADD CONSTRAINT "_pages_v_blocks_grid_row_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row_2" ADD CONSTRAINT "_pages_v_blocks_grid_row_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row_2" ADD CONSTRAINT "_pages_v_blocks_grid_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_grid_row_2_locales" ADD CONSTRAINT "_pages_v_blocks_grid_row_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_grid_row_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_region_map_2" ADD CONSTRAINT "_pages_v_blocks_region_map_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_region_map_2_locales" ADD CONSTRAINT "_pages_v_blocks_region_map_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_region_map_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_atlas_embed_2" ADD CONSTRAINT "_pages_v_blocks_atlas_embed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1_2_links" ADD CONSTRAINT "_pages_v_blocks_cta1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1_2_links_locales" ADD CONSTRAINT "_pages_v_blocks_cta1_2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta1_2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1_2" ADD CONSTRAINT "_pages_v_blocks_cta1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1_2" ADD CONSTRAINT "_pages_v_blocks_cta1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1_2" ADD CONSTRAINT "_pages_v_blocks_cta1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta1_2_locales" ADD CONSTRAINT "_pages_v_blocks_cta1_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_submit_story_banner_2" ADD CONSTRAINT "_pages_v_blocks_submit_story_banner_2_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_submit_story_banner_2" ADD CONSTRAINT "_pages_v_blocks_submit_story_banner_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_submit_story_banner_2_locales" ADD CONSTRAINT "_pages_v_blocks_submit_story_banner_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_submit_story_banner_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_newsletter_2" ADD CONSTRAINT "_pages_v_blocks_form_newsletter_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_newsletter_2_locales" ADD CONSTRAINT "_pages_v_blocks_form_newsletter_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_form_newsletter_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud1_2_images" ADD CONSTRAINT "_pages_v_blocks_logo_cloud1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud1_2_images" ADD CONSTRAINT "_pages_v_blocks_logo_cloud1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_logo_cloud1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud1_2_images_locales" ADD CONSTRAINT "_pages_v_blocks_logo_cloud1_2_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_logo_cloud1_2_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud1_2" ADD CONSTRAINT "_pages_v_blocks_logo_cloud1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_cloud1_2_locales" ADD CONSTRAINT "_pages_v_blocks_logo_cloud1_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_logo_cloud1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel2_2" ADD CONSTRAINT "_pages_v_blocks_carousel2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel2_2_locales" ADD CONSTRAINT "_pages_v_blocks_carousel2_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_carousel2_2"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero1_2_links_order_idx" ON "pages_blocks_hero1_2_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero1_2_links_parent_id_idx" ON "pages_blocks_hero1_2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_hero1_2_links_locales_locale_parent_id_unique" ON "pages_blocks_hero1_2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero1_2_order_idx" ON "pages_blocks_hero1_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero1_2_parent_id_idx" ON "pages_blocks_hero1_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero1_2_path_idx" ON "pages_blocks_hero1_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero1_2_image_image_asset_idx" ON "pages_blocks_hero1_2" USING btree ("image_asset_id");
  CREATE INDEX "pages_blocks_hero1_2_background_background_svg_pattern_idx" ON "pages_blocks_hero1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_hero1_2_background_image_background_image_a_idx" ON "pages_blocks_hero1_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "pages_blocks_hero1_2_locales_locale_parent_id_unique" ON "pages_blocks_hero1_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero2_2_links_order_idx" ON "pages_blocks_hero2_2_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero2_2_links_parent_id_idx" ON "pages_blocks_hero2_2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_hero2_2_links_locales_locale_parent_id_unique" ON "pages_blocks_hero2_2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero2_2_order_idx" ON "pages_blocks_hero2_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero2_2_parent_id_idx" ON "pages_blocks_hero2_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero2_2_path_idx" ON "pages_blocks_hero2_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero2_2_background_background_svg_pattern_idx" ON "pages_blocks_hero2_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_hero2_2_background_image_background_image_a_idx" ON "pages_blocks_hero2_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "pages_blocks_hero2_2_locales_locale_parent_id_unique" ON "pages_blocks_hero2_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_section_header_2_order_idx" ON "pages_blocks_section_header_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_section_header_2_parent_id_idx" ON "pages_blocks_section_header_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_section_header_2_path_idx" ON "pages_blocks_section_header_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_section_header_2_locales_locale_parent_id_uniqu" ON "pages_blocks_section_header_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_split_content_2_order_idx" ON "pages_blocks_split_content_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_content_2_parent_id_idx" ON "pages_blocks_split_content_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_content_2_path_idx" ON "pages_blocks_split_content_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_split_content_2_locales_locale_parent_id_unique" ON "pages_blocks_split_content_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_split_image_2_order_idx" ON "pages_blocks_split_image_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_image_2_parent_id_idx" ON "pages_blocks_split_image_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_image_2_path_idx" ON "pages_blocks_split_image_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_split_image_2_image_image_asset_idx" ON "pages_blocks_split_image_2" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "pages_blocks_split_image_2_locales_locale_parent_id_unique" ON "pages_blocks_split_image_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_split_row_2_order_idx" ON "pages_blocks_split_row_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_row_2_parent_id_idx" ON "pages_blocks_split_row_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_row_2_path_idx" ON "pages_blocks_split_row_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_carousel1_2_images_order_idx" ON "pages_blocks_carousel1_2_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel1_2_images_parent_id_idx" ON "pages_blocks_carousel1_2_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel1_2_images_asset_idx" ON "pages_blocks_carousel1_2_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "pages_blocks_carousel1_2_images_locales_locale_parent_id_uni" ON "pages_blocks_carousel1_2_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_carousel1_2_order_idx" ON "pages_blocks_carousel1_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel1_2_parent_id_idx" ON "pages_blocks_carousel1_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel1_2_path_idx" ON "pages_blocks_carousel1_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_carousel1_2_background_background_svg_patte_idx" ON "pages_blocks_carousel1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_carousel1_2_background_image_background_ima_idx" ON "pages_blocks_carousel1_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "pages_blocks_carousel1_2_locales_locale_parent_id_unique" ON "pages_blocks_carousel1_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_timeline_row_2_timelines_order_idx" ON "pages_blocks_timeline_row_2_timelines" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_row_2_timelines_parent_id_idx" ON "pages_blocks_timeline_row_2_timelines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_timeline_row_2_timelines_locales_locale_parent_" ON "pages_blocks_timeline_row_2_timelines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_timeline_row_2_order_idx" ON "pages_blocks_timeline_row_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_row_2_parent_id_idx" ON "pages_blocks_timeline_row_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_row_2_path_idx" ON "pages_blocks_timeline_row_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_faqs_2_faqs_order_idx" ON "pages_blocks_faqs_2_faqs" USING btree ("_order");
  CREATE INDEX "pages_blocks_faqs_2_faqs_parent_id_idx" ON "pages_blocks_faqs_2_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faqs_2_faqs_locales_locale_parent_id_unique" ON "pages_blocks_faqs_2_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faqs_2_order_idx" ON "pages_blocks_faqs_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_faqs_2_parent_id_idx" ON "pages_blocks_faqs_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faqs_2_path_idx" ON "pages_blocks_faqs_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_feed_2_kinds_order_idx" ON "pages_blocks_content_feed_2_kinds" USING btree ("order");
  CREATE INDEX "pages_blocks_content_feed_2_kinds_parent_idx" ON "pages_blocks_content_feed_2_kinds" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_content_feed_2_filters_regions_order_idx" ON "pages_blocks_content_feed_2_filters_regions" USING btree ("order");
  CREATE INDEX "pages_blocks_content_feed_2_filters_regions_parent_idx" ON "pages_blocks_content_feed_2_filters_regions" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_content_feed_2_order_idx" ON "pages_blocks_content_feed_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_feed_2_parent_id_idx" ON "pages_blocks_content_feed_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_feed_2_path_idx" ON "pages_blocks_content_feed_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_content_feed_2_locales_locale_parent_id_unique" ON "pages_blocks_content_feed_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_events_calendar_2_order_idx" ON "pages_blocks_events_calendar_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_events_calendar_2_parent_id_idx" ON "pages_blocks_events_calendar_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_events_calendar_2_path_idx" ON "pages_blocks_events_calendar_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_events_calendar_2_locales_locale_parent_id_uniq" ON "pages_blocks_events_calendar_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_people_widget_2_order_idx" ON "pages_blocks_people_widget_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_people_widget_2_parent_id_idx" ON "pages_blocks_people_widget_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_people_widget_2_path_idx" ON "pages_blocks_people_widget_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_people_widget_2_locales_locale_parent_id_unique" ON "pages_blocks_people_widget_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_grid_card_2_order_idx" ON "pages_blocks_grid_card_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_grid_card_2_parent_id_idx" ON "pages_blocks_grid_card_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_grid_card_2_path_idx" ON "pages_blocks_grid_card_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_grid_card_2_image_image_asset_idx" ON "pages_blocks_grid_card_2" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "pages_blocks_grid_card_2_locales_locale_parent_id_unique" ON "pages_blocks_grid_card_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_grid_agenda_2_order_idx" ON "pages_blocks_grid_agenda_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_grid_agenda_2_parent_id_idx" ON "pages_blocks_grid_agenda_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_grid_agenda_2_path_idx" ON "pages_blocks_grid_agenda_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_grid_agenda_2_agenda_idx" ON "pages_blocks_grid_agenda_2" USING btree ("agenda_id");
  CREATE INDEX "pages_blocks_grid_news_2_order_idx" ON "pages_blocks_grid_news_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_grid_news_2_parent_id_idx" ON "pages_blocks_grid_news_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_grid_news_2_path_idx" ON "pages_blocks_grid_news_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_grid_news_2_news_post_idx" ON "pages_blocks_grid_news_2" USING btree ("news_post_id");
  CREATE UNIQUE INDEX "pages_blocks_grid_news_2_locales_locale_parent_id_unique" ON "pages_blocks_grid_news_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_grid_row_2_order_idx" ON "pages_blocks_grid_row_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_grid_row_2_parent_id_idx" ON "pages_blocks_grid_row_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_grid_row_2_path_idx" ON "pages_blocks_grid_row_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_grid_row_2_header_image_header_image_asset_idx" ON "pages_blocks_grid_row_2" USING btree ("header_image_asset_id");
  CREATE INDEX "pages_blocks_grid_row_2_background_background_svg_patter_idx" ON "pages_blocks_grid_row_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_grid_row_2_background_image_background_imag_idx" ON "pages_blocks_grid_row_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "pages_blocks_grid_row_2_locales_locale_parent_id_unique" ON "pages_blocks_grid_row_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_region_map_2_order_idx" ON "pages_blocks_region_map_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_region_map_2_parent_id_idx" ON "pages_blocks_region_map_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_region_map_2_path_idx" ON "pages_blocks_region_map_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_region_map_2_locales_locale_parent_id_unique" ON "pages_blocks_region_map_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_atlas_embed_2_order_idx" ON "pages_blocks_atlas_embed_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_atlas_embed_2_parent_id_idx" ON "pages_blocks_atlas_embed_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_atlas_embed_2_path_idx" ON "pages_blocks_atlas_embed_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta1_2_links_order_idx" ON "pages_blocks_cta1_2_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta1_2_links_parent_id_idx" ON "pages_blocks_cta1_2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_cta1_2_links_locales_locale_parent_id_unique" ON "pages_blocks_cta1_2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cta1_2_order_idx" ON "pages_blocks_cta1_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta1_2_parent_id_idx" ON "pages_blocks_cta1_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta1_2_path_idx" ON "pages_blocks_cta1_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta1_2_background_background_svg_pattern_idx" ON "pages_blocks_cta1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_cta1_2_background_image_background_image_as_idx" ON "pages_blocks_cta1_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "pages_blocks_cta1_2_locales_locale_parent_id_unique" ON "pages_blocks_cta1_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_submit_story_banner_2_order_idx" ON "pages_blocks_submit_story_banner_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_submit_story_banner_2_parent_id_idx" ON "pages_blocks_submit_story_banner_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_submit_story_banner_2_path_idx" ON "pages_blocks_submit_story_banner_2" USING btree ("_path");
  CREATE INDEX "pages_blocks_submit_story_banner_2_illustration_illustra_idx" ON "pages_blocks_submit_story_banner_2" USING btree ("illustration_asset_id");
  CREATE UNIQUE INDEX "pages_blocks_submit_story_banner_2_locales_locale_parent_id_" ON "pages_blocks_submit_story_banner_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_form_newsletter_2_order_idx" ON "pages_blocks_form_newsletter_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_newsletter_2_parent_id_idx" ON "pages_blocks_form_newsletter_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_newsletter_2_path_idx" ON "pages_blocks_form_newsletter_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_form_newsletter_2_locales_locale_parent_id_uniq" ON "pages_blocks_form_newsletter_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_logo_cloud1_2_images_order_idx" ON "pages_blocks_logo_cloud1_2_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_cloud1_2_images_parent_id_idx" ON "pages_blocks_logo_cloud1_2_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_cloud1_2_images_asset_idx" ON "pages_blocks_logo_cloud1_2_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "pages_blocks_logo_cloud1_2_images_locales_locale_parent_id_u" ON "pages_blocks_logo_cloud1_2_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_logo_cloud1_2_order_idx" ON "pages_blocks_logo_cloud1_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_cloud1_2_parent_id_idx" ON "pages_blocks_logo_cloud1_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_cloud1_2_path_idx" ON "pages_blocks_logo_cloud1_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_logo_cloud1_2_locales_locale_parent_id_unique" ON "pages_blocks_logo_cloud1_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_carousel2_2_order_idx" ON "pages_blocks_carousel2_2" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel2_2_parent_id_idx" ON "pages_blocks_carousel2_2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel2_2_path_idx" ON "pages_blocks_carousel2_2" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_carousel2_2_locales_locale_parent_id_unique" ON "pages_blocks_carousel2_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero1_2_links_order_idx" ON "_pages_v_blocks_hero1_2_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero1_2_links_parent_id_idx" ON "_pages_v_blocks_hero1_2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero1_2_links_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_hero1_2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero1_2_order_idx" ON "_pages_v_blocks_hero1_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero1_2_parent_id_idx" ON "_pages_v_blocks_hero1_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero1_2_path_idx" ON "_pages_v_blocks_hero1_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero1_2_image_image_asset_idx" ON "_pages_v_blocks_hero1_2" USING btree ("image_asset_id");
  CREATE INDEX "_pages_v_blocks_hero1_2_background_background_svg_patter_idx" ON "_pages_v_blocks_hero1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_hero1_2_background_image_background_imag_idx" ON "_pages_v_blocks_hero1_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero1_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_hero1_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero2_2_links_order_idx" ON "_pages_v_blocks_hero2_2_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero2_2_links_parent_id_idx" ON "_pages_v_blocks_hero2_2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero2_2_links_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_hero2_2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero2_2_order_idx" ON "_pages_v_blocks_hero2_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero2_2_parent_id_idx" ON "_pages_v_blocks_hero2_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero2_2_path_idx" ON "_pages_v_blocks_hero2_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero2_2_background_background_svg_patter_idx" ON "_pages_v_blocks_hero2_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_hero2_2_background_image_background_imag_idx" ON "_pages_v_blocks_hero2_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero2_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_hero2_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_section_header_2_order_idx" ON "_pages_v_blocks_section_header_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_section_header_2_parent_id_idx" ON "_pages_v_blocks_section_header_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_section_header_2_path_idx" ON "_pages_v_blocks_section_header_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_section_header_2_locales_locale_parent_id_un" ON "_pages_v_blocks_section_header_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_split_content_2_order_idx" ON "_pages_v_blocks_split_content_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_content_2_parent_id_idx" ON "_pages_v_blocks_split_content_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_content_2_path_idx" ON "_pages_v_blocks_split_content_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_split_content_2_locales_locale_parent_id_uni" ON "_pages_v_blocks_split_content_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_split_image_2_order_idx" ON "_pages_v_blocks_split_image_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_image_2_parent_id_idx" ON "_pages_v_blocks_split_image_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_image_2_path_idx" ON "_pages_v_blocks_split_image_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_split_image_2_image_image_asset_idx" ON "_pages_v_blocks_split_image_2" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_split_image_2_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_split_image_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_split_row_2_order_idx" ON "_pages_v_blocks_split_row_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_split_row_2_parent_id_idx" ON "_pages_v_blocks_split_row_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_split_row_2_path_idx" ON "_pages_v_blocks_split_row_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_carousel1_2_images_order_idx" ON "_pages_v_blocks_carousel1_2_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel1_2_images_parent_id_idx" ON "_pages_v_blocks_carousel1_2_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel1_2_images_asset_idx" ON "_pages_v_blocks_carousel1_2_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_carousel1_2_images_locales_locale_parent_id_" ON "_pages_v_blocks_carousel1_2_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel1_2_order_idx" ON "_pages_v_blocks_carousel1_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel1_2_parent_id_idx" ON "_pages_v_blocks_carousel1_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel1_2_path_idx" ON "_pages_v_blocks_carousel1_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_carousel1_2_background_background_svg_pa_idx" ON "_pages_v_blocks_carousel1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_carousel1_2_background_image_background__idx" ON "_pages_v_blocks_carousel1_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_carousel1_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_carousel1_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_row_2_timelines_order_idx" ON "_pages_v_blocks_timeline_row_2_timelines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_row_2_timelines_parent_id_idx" ON "_pages_v_blocks_timeline_row_2_timelines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_timeline_row_2_timelines_locales_locale_pare" ON "_pages_v_blocks_timeline_row_2_timelines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_row_2_order_idx" ON "_pages_v_blocks_timeline_row_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_row_2_parent_id_idx" ON "_pages_v_blocks_timeline_row_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_row_2_path_idx" ON "_pages_v_blocks_timeline_row_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faqs_2_faqs_order_idx" ON "_pages_v_blocks_faqs_2_faqs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faqs_2_faqs_parent_id_idx" ON "_pages_v_blocks_faqs_2_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_faqs_2_faqs_locales_locale_parent_id_unique" ON "_pages_v_blocks_faqs_2_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_faqs_2_order_idx" ON "_pages_v_blocks_faqs_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faqs_2_parent_id_idx" ON "_pages_v_blocks_faqs_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faqs_2_path_idx" ON "_pages_v_blocks_faqs_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_feed_2_kinds_order_idx" ON "_pages_v_blocks_content_feed_2_kinds" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_content_feed_2_kinds_parent_idx" ON "_pages_v_blocks_content_feed_2_kinds" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_content_feed_2_filters_regions_order_idx" ON "_pages_v_blocks_content_feed_2_filters_regions" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_content_feed_2_filters_regions_parent_idx" ON "_pages_v_blocks_content_feed_2_filters_regions" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_content_feed_2_order_idx" ON "_pages_v_blocks_content_feed_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_feed_2_parent_id_idx" ON "_pages_v_blocks_content_feed_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_feed_2_path_idx" ON "_pages_v_blocks_content_feed_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_content_feed_2_locales_locale_parent_id_uniq" ON "_pages_v_blocks_content_feed_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_events_calendar_2_order_idx" ON "_pages_v_blocks_events_calendar_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_events_calendar_2_parent_id_idx" ON "_pages_v_blocks_events_calendar_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_events_calendar_2_path_idx" ON "_pages_v_blocks_events_calendar_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_events_calendar_2_locales_locale_parent_id_u" ON "_pages_v_blocks_events_calendar_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_people_widget_2_order_idx" ON "_pages_v_blocks_people_widget_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_people_widget_2_parent_id_idx" ON "_pages_v_blocks_people_widget_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_people_widget_2_path_idx" ON "_pages_v_blocks_people_widget_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_people_widget_2_locales_locale_parent_id_uni" ON "_pages_v_blocks_people_widget_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_card_2_order_idx" ON "_pages_v_blocks_grid_card_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_grid_card_2_parent_id_idx" ON "_pages_v_blocks_grid_card_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_card_2_path_idx" ON "_pages_v_blocks_grid_card_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_grid_card_2_image_image_asset_idx" ON "_pages_v_blocks_grid_card_2" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_grid_card_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_grid_card_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_agenda_2_order_idx" ON "_pages_v_blocks_grid_agenda_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_grid_agenda_2_parent_id_idx" ON "_pages_v_blocks_grid_agenda_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_agenda_2_path_idx" ON "_pages_v_blocks_grid_agenda_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_grid_agenda_2_agenda_idx" ON "_pages_v_blocks_grid_agenda_2" USING btree ("agenda_id");
  CREATE INDEX "_pages_v_blocks_grid_news_2_order_idx" ON "_pages_v_blocks_grid_news_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_grid_news_2_parent_id_idx" ON "_pages_v_blocks_grid_news_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_news_2_path_idx" ON "_pages_v_blocks_grid_news_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_grid_news_2_news_post_idx" ON "_pages_v_blocks_grid_news_2" USING btree ("news_post_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_grid_news_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_grid_news_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_row_2_order_idx" ON "_pages_v_blocks_grid_row_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_grid_row_2_parent_id_idx" ON "_pages_v_blocks_grid_row_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_grid_row_2_path_idx" ON "_pages_v_blocks_grid_row_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_grid_row_2_header_image_header_image_ass_idx" ON "_pages_v_blocks_grid_row_2" USING btree ("header_image_asset_id");
  CREATE INDEX "_pages_v_blocks_grid_row_2_background_background_svg_pat_idx" ON "_pages_v_blocks_grid_row_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_grid_row_2_background_image_background_i_idx" ON "_pages_v_blocks_grid_row_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_grid_row_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_grid_row_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_region_map_2_order_idx" ON "_pages_v_blocks_region_map_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_region_map_2_parent_id_idx" ON "_pages_v_blocks_region_map_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_region_map_2_path_idx" ON "_pages_v_blocks_region_map_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_region_map_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_region_map_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_atlas_embed_2_order_idx" ON "_pages_v_blocks_atlas_embed_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_atlas_embed_2_parent_id_idx" ON "_pages_v_blocks_atlas_embed_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_atlas_embed_2_path_idx" ON "_pages_v_blocks_atlas_embed_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta1_2_links_order_idx" ON "_pages_v_blocks_cta1_2_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta1_2_links_parent_id_idx" ON "_pages_v_blocks_cta1_2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_cta1_2_links_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta1_2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cta1_2_order_idx" ON "_pages_v_blocks_cta1_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta1_2_parent_id_idx" ON "_pages_v_blocks_cta1_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta1_2_path_idx" ON "_pages_v_blocks_cta1_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta1_2_background_background_svg_pattern_idx" ON "_pages_v_blocks_cta1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_pages_v_blocks_cta1_2_background_image_background_image_idx" ON "_pages_v_blocks_cta1_2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_cta1_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta1_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_2_order_idx" ON "_pages_v_blocks_submit_story_banner_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_2_parent_id_idx" ON "_pages_v_blocks_submit_story_banner_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_2_path_idx" ON "_pages_v_blocks_submit_story_banner_2" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_submit_story_banner_2_illustration_illus_idx" ON "_pages_v_blocks_submit_story_banner_2" USING btree ("illustration_asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_submit_story_banner_2_locales_locale_parent_" ON "_pages_v_blocks_submit_story_banner_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_form_newsletter_2_order_idx" ON "_pages_v_blocks_form_newsletter_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_newsletter_2_parent_id_idx" ON "_pages_v_blocks_form_newsletter_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_newsletter_2_path_idx" ON "_pages_v_blocks_form_newsletter_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_form_newsletter_2_locales_locale_parent_id_u" ON "_pages_v_blocks_form_newsletter_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_2_images_order_idx" ON "_pages_v_blocks_logo_cloud1_2_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_2_images_parent_id_idx" ON "_pages_v_blocks_logo_cloud1_2_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_2_images_asset_idx" ON "_pages_v_blocks_logo_cloud1_2_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_logo_cloud1_2_images_locales_locale_parent_i" ON "_pages_v_blocks_logo_cloud1_2_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_2_order_idx" ON "_pages_v_blocks_logo_cloud1_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_2_parent_id_idx" ON "_pages_v_blocks_logo_cloud1_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_cloud1_2_path_idx" ON "_pages_v_blocks_logo_cloud1_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_logo_cloud1_2_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_logo_cloud1_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel2_2_order_idx" ON "_pages_v_blocks_carousel2_2" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel2_2_parent_id_idx" ON "_pages_v_blocks_carousel2_2" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel2_2_path_idx" ON "_pages_v_blocks_carousel2_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_carousel2_2_locales_locale_parent_id_unique" ON "_pages_v_blocks_carousel2_2_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hero1_2_links" CASCADE;
  DROP TABLE "pages_blocks_hero1_2_links_locales" CASCADE;
  DROP TABLE "pages_blocks_hero1_2" CASCADE;
  DROP TABLE "pages_blocks_hero1_2_locales" CASCADE;
  DROP TABLE "pages_blocks_hero2_2_links" CASCADE;
  DROP TABLE "pages_blocks_hero2_2_links_locales" CASCADE;
  DROP TABLE "pages_blocks_hero2_2" CASCADE;
  DROP TABLE "pages_blocks_hero2_2_locales" CASCADE;
  DROP TABLE "pages_blocks_section_header_2" CASCADE;
  DROP TABLE "pages_blocks_section_header_2_locales" CASCADE;
  DROP TABLE "pages_blocks_split_content_2" CASCADE;
  DROP TABLE "pages_blocks_split_content_2_locales" CASCADE;
  DROP TABLE "pages_blocks_split_image_2" CASCADE;
  DROP TABLE "pages_blocks_split_image_2_locales" CASCADE;
  DROP TABLE "pages_blocks_split_row_2" CASCADE;
  DROP TABLE "pages_blocks_carousel1_2_images" CASCADE;
  DROP TABLE "pages_blocks_carousel1_2_images_locales" CASCADE;
  DROP TABLE "pages_blocks_carousel1_2" CASCADE;
  DROP TABLE "pages_blocks_carousel1_2_locales" CASCADE;
  DROP TABLE "pages_blocks_timeline_row_2_timelines" CASCADE;
  DROP TABLE "pages_blocks_timeline_row_2_timelines_locales" CASCADE;
  DROP TABLE "pages_blocks_timeline_row_2" CASCADE;
  DROP TABLE "pages_blocks_faqs_2_faqs" CASCADE;
  DROP TABLE "pages_blocks_faqs_2_faqs_locales" CASCADE;
  DROP TABLE "pages_blocks_faqs_2" CASCADE;
  DROP TABLE "pages_blocks_content_feed_2_kinds" CASCADE;
  DROP TABLE "pages_blocks_content_feed_2_filters_regions" CASCADE;
  DROP TABLE "pages_blocks_content_feed_2" CASCADE;
  DROP TABLE "pages_blocks_content_feed_2_locales" CASCADE;
  DROP TABLE "pages_blocks_events_calendar_2" CASCADE;
  DROP TABLE "pages_blocks_events_calendar_2_locales" CASCADE;
  DROP TABLE "pages_blocks_people_widget_2" CASCADE;
  DROP TABLE "pages_blocks_people_widget_2_locales" CASCADE;
  DROP TABLE "pages_blocks_grid_card_2" CASCADE;
  DROP TABLE "pages_blocks_grid_card_2_locales" CASCADE;
  DROP TABLE "pages_blocks_grid_agenda_2" CASCADE;
  DROP TABLE "pages_blocks_grid_news_2" CASCADE;
  DROP TABLE "pages_blocks_grid_news_2_locales" CASCADE;
  DROP TABLE "pages_blocks_grid_row_2" CASCADE;
  DROP TABLE "pages_blocks_grid_row_2_locales" CASCADE;
  DROP TABLE "pages_blocks_region_map_2" CASCADE;
  DROP TABLE "pages_blocks_region_map_2_locales" CASCADE;
  DROP TABLE "pages_blocks_atlas_embed_2" CASCADE;
  DROP TABLE "pages_blocks_cta1_2_links" CASCADE;
  DROP TABLE "pages_blocks_cta1_2_links_locales" CASCADE;
  DROP TABLE "pages_blocks_cta1_2" CASCADE;
  DROP TABLE "pages_blocks_cta1_2_locales" CASCADE;
  DROP TABLE "pages_blocks_submit_story_banner_2" CASCADE;
  DROP TABLE "pages_blocks_submit_story_banner_2_locales" CASCADE;
  DROP TABLE "pages_blocks_form_newsletter_2" CASCADE;
  DROP TABLE "pages_blocks_form_newsletter_2_locales" CASCADE;
  DROP TABLE "pages_blocks_logo_cloud1_2_images" CASCADE;
  DROP TABLE "pages_blocks_logo_cloud1_2_images_locales" CASCADE;
  DROP TABLE "pages_blocks_logo_cloud1_2" CASCADE;
  DROP TABLE "pages_blocks_logo_cloud1_2_locales" CASCADE;
  DROP TABLE "pages_blocks_carousel2_2" CASCADE;
  DROP TABLE "pages_blocks_carousel2_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_hero1_2_links" CASCADE;
  DROP TABLE "_pages_v_blocks_hero1_2_links_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_hero1_2" CASCADE;
  DROP TABLE "_pages_v_blocks_hero1_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_hero2_2_links" CASCADE;
  DROP TABLE "_pages_v_blocks_hero2_2_links_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_hero2_2" CASCADE;
  DROP TABLE "_pages_v_blocks_hero2_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_section_header_2" CASCADE;
  DROP TABLE "_pages_v_blocks_section_header_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_split_content_2" CASCADE;
  DROP TABLE "_pages_v_blocks_split_content_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_split_image_2" CASCADE;
  DROP TABLE "_pages_v_blocks_split_image_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_split_row_2" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel1_2_images" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel1_2_images_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel1_2" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel1_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_row_2_timelines" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_row_2_timelines_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_row_2" CASCADE;
  DROP TABLE "_pages_v_blocks_faqs_2_faqs" CASCADE;
  DROP TABLE "_pages_v_blocks_faqs_2_faqs_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faqs_2" CASCADE;
  DROP TABLE "_pages_v_blocks_content_feed_2_kinds" CASCADE;
  DROP TABLE "_pages_v_blocks_content_feed_2_filters_regions" CASCADE;
  DROP TABLE "_pages_v_blocks_content_feed_2" CASCADE;
  DROP TABLE "_pages_v_blocks_content_feed_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_events_calendar_2" CASCADE;
  DROP TABLE "_pages_v_blocks_events_calendar_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_people_widget_2" CASCADE;
  DROP TABLE "_pages_v_blocks_people_widget_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_card_2" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_card_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_agenda_2" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_news_2" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_news_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_row_2" CASCADE;
  DROP TABLE "_pages_v_blocks_grid_row_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_region_map_2" CASCADE;
  DROP TABLE "_pages_v_blocks_region_map_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_atlas_embed_2" CASCADE;
  DROP TABLE "_pages_v_blocks_cta1_2_links" CASCADE;
  DROP TABLE "_pages_v_blocks_cta1_2_links_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_cta1_2" CASCADE;
  DROP TABLE "_pages_v_blocks_cta1_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_submit_story_banner_2" CASCADE;
  DROP TABLE "_pages_v_blocks_submit_story_banner_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_form_newsletter_2" CASCADE;
  DROP TABLE "_pages_v_blocks_form_newsletter_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_cloud1_2_images" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_cloud1_2_images_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_cloud1_2" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_cloud1_2_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel2_2" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel2_2_locales" CASCADE;
  ALTER TABLE "pages" DROP COLUMN "layout_per_language";
  ALTER TABLE "_pages_v" DROP COLUMN "version_layout_per_language";
  DROP TYPE "public"."enum_pages_blocks_hero1_2_image_position";
  DROP TYPE "public"."enum_pages_blocks_section_header_2_section_width";
  DROP TYPE "public"."enum_pages_blocks_section_header_2_stack_align";
  DROP TYPE "public"."enum_pages_blocks_carousel1_2_size";
  DROP TYPE "public"."enum_pages_blocks_carousel1_2_indicators";
  DROP TYPE "public"."enum_pages_blocks_content_feed_2_kinds";
  DROP TYPE "public"."enum_pages_blocks_content_feed_2_filters_regions";
  DROP TYPE "public"."enum_pages_blocks_content_feed_2_fill";
  DROP TYPE "public"."enum_pages_blocks_content_feed_2_sort";
  DROP TYPE "public"."enum_pages_blocks_content_feed_2_layout";
  DROP TYPE "public"."enum_pages_blocks_people_widget_2_region";
  DROP TYPE "public"."enum_pages_blocks_grid_row_2_mode";
  DROP TYPE "public"."enum_pages_blocks_grid_row_2_grid_columns";
  DROP TYPE "public"."enum_pages_blocks_grid_row_2_card_variant";
  DROP TYPE "public"."enum_pages_blocks_atlas_embed_2_region";
  DROP TYPE "public"."enum_pages_blocks_cta1_2_section_width";
  DROP TYPE "public"."enum_pages_blocks_cta1_2_stack_align";
  DROP TYPE "public"."enum_pages_blocks_logo_cloud1_2_images_org_type";
  DROP TYPE "public"."enum_pages_blocks_logo_cloud1_2_layout";
  DROP TYPE "public"."enum_pages_blocks_logo_cloud1_2_motion_speed";
  DROP TYPE "public"."enum__pages_v_blocks_hero1_2_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_section_header_2_section_width";
  DROP TYPE "public"."enum__pages_v_blocks_section_header_2_stack_align";
  DROP TYPE "public"."enum__pages_v_blocks_carousel1_2_size";
  DROP TYPE "public"."enum__pages_v_blocks_carousel1_2_indicators";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_2_kinds";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_2_filters_regions";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_2_fill";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_2_sort";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_2_layout";
  DROP TYPE "public"."enum__pages_v_blocks_people_widget_2_region";
  DROP TYPE "public"."enum__pages_v_blocks_grid_row_2_mode";
  DROP TYPE "public"."enum__pages_v_blocks_grid_row_2_grid_columns";
  DROP TYPE "public"."enum__pages_v_blocks_grid_row_2_card_variant";
  DROP TYPE "public"."enum__pages_v_blocks_atlas_embed_2_region";
  DROP TYPE "public"."enum__pages_v_blocks_cta1_2_section_width";
  DROP TYPE "public"."enum__pages_v_blocks_cta1_2_stack_align";
  DROP TYPE "public"."enum__pages_v_blocks_logo_cloud1_2_images_org_type";
  DROP TYPE "public"."enum__pages_v_blocks_logo_cloud1_2_layout";
  DROP TYPE "public"."enum__pages_v_blocks_logo_cloud1_2_motion_speed";`)
}
