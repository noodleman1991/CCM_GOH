import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_homepage_blocks_hero1_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_homepage_blocks_section_header_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_homepage_blocks_section_header_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_blocks_carousel1_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum_homepage_blocks_carousel1_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum_homepage_blocks_people_widget_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_homepage_blocks_grid_row_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_homepage_blocks_grid_row_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_homepage_blocks_grid_row_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_homepage_blocks_atlas_embed_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_homepage_blocks_cta1_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_homepage_blocks_cta1_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_blocks_logo_cloud1_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_homepage_blocks_logo_cloud1_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_homepage_blocks_logo_cloud1_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum_homepage_blocks_hero1_2_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_homepage_blocks_section_header_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_homepage_blocks_section_header_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_blocks_carousel1_2_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum_homepage_blocks_carousel1_2_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_2_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_2_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_2_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_2_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum_homepage_blocks_content_feed_2_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum_homepage_blocks_people_widget_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_homepage_blocks_grid_row_2_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_homepage_blocks_grid_row_2_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_homepage_blocks_grid_row_2_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_homepage_blocks_atlas_embed_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_homepage_blocks_cta1_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_homepage_blocks_cta1_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_blocks_logo_cloud1_2_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_homepage_blocks_logo_cloud1_2_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_homepage_blocks_logo_cloud1_2_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__homepage_v_blocks_hero1_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__homepage_v_blocks_section_header_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__homepage_v_blocks_section_header_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__homepage_v_blocks_carousel1_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum__homepage_v_blocks_carousel1_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum__homepage_v_blocks_people_widget_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__homepage_v_blocks_grid_row_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__homepage_v_blocks_grid_row_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__homepage_v_blocks_grid_row_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__homepage_v_blocks_atlas_embed_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__homepage_v_blocks_cta1_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__homepage_v_blocks_cta1_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__homepage_v_blocks_logo_cloud1_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__homepage_v_blocks_logo_cloud1_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__homepage_v_blocks_logo_cloud1_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__homepage_v_blocks_hero1_2_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__homepage_v_blocks_section_header_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__homepage_v_blocks_section_header_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__homepage_v_blocks_carousel1_2_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum__homepage_v_blocks_carousel1_2_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_2_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_2_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_2_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_2_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_feed_2_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum__homepage_v_blocks_people_widget_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__homepage_v_blocks_grid_row_2_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__homepage_v_blocks_grid_row_2_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__homepage_v_blocks_grid_row_2_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__homepage_v_blocks_atlas_embed_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__homepage_v_blocks_cta1_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__homepage_v_blocks_cta1_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__homepage_v_blocks_logo_cloud1_2_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__homepage_v_blocks_logo_cloud1_2_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__homepage_v_blocks_logo_cloud1_2_motion_speed" AS ENUM('default', 'slow');
  CREATE TABLE "homepage_blocks_hero1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "homepage_blocks_hero1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  	"image_position" "enum_homepage_blocks_hero1_image_position" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_hero1_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_alt" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "homepage_blocks_hero2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  
  CREATE TABLE "homepage_blocks_hero2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_section_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum_homepage_blocks_section_header_section_width" DEFAULT 'default',
  	"stack_align" "enum_homepage_blocks_section_header_stack_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_section_header_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_split_content_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  
  CREATE TABLE "homepage_blocks_split_content_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_split_image_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_split_image_2_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_split_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_carousel1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar
  );
  
  CREATE TABLE "homepage_blocks_carousel1_images_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_carousel1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_homepage_blocks_carousel1_size" DEFAULT 'one',
  	"indicators" "enum_homepage_blocks_carousel1_indicators" DEFAULT 'dots',
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
  
  CREATE TABLE "homepage_blocks_carousel1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_timeline_row_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_timeline_row_timelines_locales" (
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_timeline_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_faqs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_faqs_faqs_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_content_feed_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_homepage_blocks_content_feed_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_content_feed_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_homepage_blocks_content_feed_filters_regions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_content_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"fill" "enum_homepage_blocks_content_feed_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum_homepage_blocks_content_feed_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum_homepage_blocks_content_feed_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_content_feed_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_events_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"upcoming_limit" numeric DEFAULT 6,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_events_calendar_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_people_widget" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 12,
  	"region" "enum_homepage_blocks_people_widget_region",
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_people_widget_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_grid_card_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  
  CREATE TABLE "homepage_blocks_grid_card_2_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_grid_agenda_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"agenda_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_grid_news_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"news_post_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_author" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_location" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_grid_news_2_locales" (
  	"custom_excerpt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_grid_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header_image_asset_id" varchar,
  	"mode" "enum_homepage_blocks_grid_row_mode" DEFAULT 'manual',
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
  	"grid_columns" "enum_homepage_blocks_grid_row_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum_homepage_blocks_grid_row_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_grid_row_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_alt" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_region_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_region_map_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_atlas_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" "enum_homepage_blocks_atlas_embed_region",
  	"show_breakdown" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_cta1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "homepage_blocks_cta1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_cta1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  	"section_width" "enum_homepage_blocks_cta1_section_width" DEFAULT 'default',
  	"stack_align" "enum_homepage_blocks_cta1_stack_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_cta1_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_submit_story_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"illustration_asset_id" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_submit_story_banner_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_form_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_form_newsletter_locales" (
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_logo_cloud1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"org_type" "enum_homepage_blocks_logo_cloud1_images_org_type"
  );
  
  CREATE TABLE "homepage_blocks_logo_cloud1_images_locales" (
  	"alt" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_logo_cloud1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_homepage_blocks_logo_cloud1_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum_homepage_blocks_logo_cloud1_motion_speed" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_logo_cloud1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_carousel2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_carousel2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero1_2_links" (
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
  
  CREATE TABLE "homepage_blocks_hero1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
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
  	"image_position" "enum_homepage_blocks_hero1_2_image_position" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_hero2_2_links" (
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
  
  CREATE TABLE "homepage_blocks_hero2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
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
  
  CREATE TABLE "homepage_blocks_section_header_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum_homepage_blocks_section_header_2_section_width" DEFAULT 'default',
  	"stack_align" "enum_homepage_blocks_section_header_2_stack_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_split_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_carousel1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar
  );
  
  CREATE TABLE "homepage_blocks_carousel1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"size" "enum_homepage_blocks_carousel1_2_size" DEFAULT 'one',
  	"indicators" "enum_homepage_blocks_carousel1_2_indicators" DEFAULT 'dots',
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
  
  CREATE TABLE "homepage_blocks_timeline_row_2_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "homepage_blocks_timeline_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_faqs_2_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "homepage_blocks_faqs_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_content_feed_2_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_homepage_blocks_content_feed_2_kinds",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_content_feed_2_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_homepage_blocks_content_feed_2_filters_regions",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_content_feed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"fill" "enum_homepage_blocks_content_feed_2_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum_homepage_blocks_content_feed_2_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum_homepage_blocks_content_feed_2_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"view_all_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_events_calendar_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  
  CREATE TABLE "homepage_blocks_people_widget_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 12,
  	"region" "enum_homepage_blocks_people_widget_2_region",
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_grid_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_asset_id" varchar,
  	"header_image_alt" varchar,
  	"mode" "enum_homepage_blocks_grid_row_2_mode" DEFAULT 'manual',
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
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"grid_columns" "enum_homepage_blocks_grid_row_2_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum_homepage_blocks_grid_row_2_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_region_map_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_atlas_embed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" "enum_homepage_blocks_atlas_embed_2_region",
  	"show_breakdown" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_cta1_2_links" (
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
  
  CREATE TABLE "homepage_blocks_cta1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
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
  	"section_width" "enum_homepage_blocks_cta1_2_section_width" DEFAULT 'default',
  	"stack_align" "enum_homepage_blocks_cta1_2_stack_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_submit_story_banner_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  
  CREATE TABLE "homepage_blocks_form_newsletter_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  
  CREATE TABLE "homepage_blocks_logo_cloud1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum_homepage_blocks_logo_cloud1_2_images_org_type"
  );
  
  CREATE TABLE "homepage_blocks_logo_cloud1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum_homepage_blocks_logo_cloud1_2_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum_homepage_blocks_logo_cloud1_2_motion_speed" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_carousel2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_hero1_links" (
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
  
  CREATE TABLE "_homepage_v_blocks_hero1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_hero1" (
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
  	"image_position" "enum__homepage_v_blocks_hero1_image_position" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_hero1_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_alt" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_hero2_links" (
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
  
  CREATE TABLE "_homepage_v_blocks_hero2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_hero2" (
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
  
  CREATE TABLE "_homepage_v_blocks_hero2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_section_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum__homepage_v_blocks_section_header_section_width" DEFAULT 'default',
  	"stack_align" "enum__homepage_v_blocks_section_header_stack_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_section_header_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_split_content_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_split_content_2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_split_image_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_split_image_2_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_split_row" (
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
  
  CREATE TABLE "_homepage_v_blocks_carousel1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_carousel1_images_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_carousel1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "enum__homepage_v_blocks_carousel1_size" DEFAULT 'one',
  	"indicators" "enum__homepage_v_blocks_carousel1_indicators" DEFAULT 'dots',
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
  
  CREATE TABLE "_homepage_v_blocks_carousel1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_timeline_row_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_timeline_row_timelines_locales" (
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_timeline_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_faqs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_faqs_faqs_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_content_feed_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__homepage_v_blocks_content_feed_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_content_feed_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__homepage_v_blocks_content_feed_filters_regions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_content_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"fill" "enum__homepage_v_blocks_content_feed_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum__homepage_v_blocks_content_feed_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum__homepage_v_blocks_content_feed_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_content_feed_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_events_calendar" (
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
  
  CREATE TABLE "_homepage_v_blocks_events_calendar_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_people_widget" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 12,
  	"region" "enum__homepage_v_blocks_people_widget_region",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_people_widget_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_grid_card_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_grid_card_2_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_grid_agenda_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_grid_news_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_grid_news_2_locales" (
  	"custom_excerpt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_grid_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_image_asset_id" varchar,
  	"mode" "enum__homepage_v_blocks_grid_row_mode" DEFAULT 'manual',
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
  	"grid_columns" "enum__homepage_v_blocks_grid_row_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum__homepage_v_blocks_grid_row_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_grid_row_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_alt" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_region_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_region_map_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_atlas_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum__homepage_v_blocks_atlas_embed_region",
  	"show_breakdown" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_cta1_links" (
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
  
  CREATE TABLE "_homepage_v_blocks_cta1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_cta1" (
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
  	"section_width" "enum__homepage_v_blocks_cta1_section_width" DEFAULT 'default',
  	"stack_align" "enum__homepage_v_blocks_cta1_stack_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_cta1_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_submit_story_banner" (
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
  
  CREATE TABLE "_homepage_v_blocks_submit_story_banner_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_form_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_form_newsletter_locales" (
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_logo_cloud1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"org_type" "enum__homepage_v_blocks_logo_cloud1_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_logo_cloud1_images_locales" (
  	"alt" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_logo_cloud1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum__homepage_v_blocks_logo_cloud1_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum__homepage_v_blocks_logo_cloud1_motion_speed" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_logo_cloud1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_carousel2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_carousel2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_hero1_2_links" (
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
  
  CREATE TABLE "_homepage_v_blocks_hero1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
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
  	"image_position" "enum__homepage_v_blocks_hero1_2_image_position" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_hero2_2_links" (
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
  
  CREATE TABLE "_homepage_v_blocks_hero2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
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
  
  CREATE TABLE "_homepage_v_blocks_section_header_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum__homepage_v_blocks_section_header_2_section_width" DEFAULT 'default',
  	"stack_align" "enum__homepage_v_blocks_section_header_2_stack_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_split_row_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_carousel1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_carousel1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"size" "enum__homepage_v_blocks_carousel1_2_size" DEFAULT 'one',
  	"indicators" "enum__homepage_v_blocks_carousel1_2_indicators" DEFAULT 'dots',
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
  
  CREATE TABLE "_homepage_v_blocks_timeline_row_2_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_timeline_row_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_faqs_2_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_faqs_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_content_feed_2_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__homepage_v_blocks_content_feed_2_kinds",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_content_feed_2_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__homepage_v_blocks_content_feed_2_filters_regions",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_content_feed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"fill" "enum__homepage_v_blocks_content_feed_2_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum__homepage_v_blocks_content_feed_2_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum__homepage_v_blocks_content_feed_2_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"view_all_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_events_calendar_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_people_widget_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 12,
  	"region" "enum__homepage_v_blocks_people_widget_2_region",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_grid_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_asset_id" varchar,
  	"header_image_alt" varchar,
  	"mode" "enum__homepage_v_blocks_grid_row_2_mode" DEFAULT 'manual',
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
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"grid_columns" "enum__homepage_v_blocks_grid_row_2_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum__homepage_v_blocks_grid_row_2_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_region_map_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_atlas_embed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum__homepage_v_blocks_atlas_embed_2_region",
  	"show_breakdown" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_cta1_2_links" (
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
  
  CREATE TABLE "_homepage_v_blocks_cta1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
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
  	"section_width" "enum__homepage_v_blocks_cta1_2_section_width" DEFAULT 'default',
  	"stack_align" "enum__homepage_v_blocks_cta1_2_stack_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_submit_story_banner_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_form_newsletter_2" (
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
  
  CREATE TABLE "_homepage_v_blocks_logo_cloud1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum__homepage_v_blocks_logo_cloud1_2_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_logo_cloud1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum__homepage_v_blocks_logo_cloud1_2_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum__homepage_v_blocks_logo_cloud1_2_motion_speed" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_carousel2_2" (
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
  
  ALTER TABLE "pages_rels" ADD COLUMN "organizations_id" varchar;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "organizations_id" varchar;
  ALTER TABLE "regional_pages_rels" ADD COLUMN "organizations_id" varchar;
  ALTER TABLE "_regional_pages_v_rels" ADD COLUMN "organizations_id" varchar;
  ALTER TABLE "organizations" ADD COLUMN "show_on_site" boolean DEFAULT true;
  ALTER TABLE "homepage" ADD COLUMN "layout_per_language" boolean DEFAULT false;
  ALTER TABLE "homepage_rels" ADD COLUMN "organizations_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "case_studies_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "news_posts_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "events_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "lived_experiences_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "research_outputs_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "agendas_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "regional_communities_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "tags_id" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_layout_per_language" boolean DEFAULT false;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "organizations_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "case_studies_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "news_posts_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "events_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "lived_experiences_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "research_outputs_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "agendas_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "regional_communities_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "tags_id" varchar;
  ALTER TABLE "homepage_blocks_hero1_links" ADD CONSTRAINT "homepage_blocks_hero1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1_links_locales" ADD CONSTRAINT "homepage_blocks_hero1_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1" ADD CONSTRAINT "homepage_blocks_hero1_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1" ADD CONSTRAINT "homepage_blocks_hero1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1" ADD CONSTRAINT "homepage_blocks_hero1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1" ADD CONSTRAINT "homepage_blocks_hero1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1_locales" ADD CONSTRAINT "homepage_blocks_hero1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2_links" ADD CONSTRAINT "homepage_blocks_hero2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2_links_locales" ADD CONSTRAINT "homepage_blocks_hero2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2" ADD CONSTRAINT "homepage_blocks_hero2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2" ADD CONSTRAINT "homepage_blocks_hero2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2" ADD CONSTRAINT "homepage_blocks_hero2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2_locales" ADD CONSTRAINT "homepage_blocks_hero2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_section_header" ADD CONSTRAINT "homepage_blocks_section_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_section_header_locales" ADD CONSTRAINT "homepage_blocks_section_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_section_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_content_2" ADD CONSTRAINT "homepage_blocks_split_content_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_content_2_locales" ADD CONSTRAINT "homepage_blocks_split_content_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_split_content_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_image_2" ADD CONSTRAINT "homepage_blocks_split_image_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_image_2" ADD CONSTRAINT "homepage_blocks_split_image_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_image_2_locales" ADD CONSTRAINT "homepage_blocks_split_image_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_split_image_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_row" ADD CONSTRAINT "homepage_blocks_split_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_images" ADD CONSTRAINT "homepage_blocks_carousel1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_images" ADD CONSTRAINT "homepage_blocks_carousel1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_images_locales" ADD CONSTRAINT "homepage_blocks_carousel1_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_carousel1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1" ADD CONSTRAINT "homepage_blocks_carousel1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1" ADD CONSTRAINT "homepage_blocks_carousel1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1" ADD CONSTRAINT "homepage_blocks_carousel1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_locales" ADD CONSTRAINT "homepage_blocks_carousel1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_timeline_row_timelines" ADD CONSTRAINT "homepage_blocks_timeline_row_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_timeline_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_timeline_row_timelines_locales" ADD CONSTRAINT "homepage_blocks_timeline_row_timelines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_timeline_row_timelines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_timeline_row" ADD CONSTRAINT "homepage_blocks_timeline_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faqs_faqs" ADD CONSTRAINT "homepage_blocks_faqs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faqs_faqs_locales" ADD CONSTRAINT "homepage_blocks_faqs_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_faqs_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faqs" ADD CONSTRAINT "homepage_blocks_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content_feed_kinds" ADD CONSTRAINT "homepage_blocks_content_feed_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content_feed_filters_regions" ADD CONSTRAINT "homepage_blocks_content_feed_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content_feed" ADD CONSTRAINT "homepage_blocks_content_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content_feed_locales" ADD CONSTRAINT "homepage_blocks_content_feed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_events_calendar" ADD CONSTRAINT "homepage_blocks_events_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_events_calendar_locales" ADD CONSTRAINT "homepage_blocks_events_calendar_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_events_calendar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_people_widget" ADD CONSTRAINT "homepage_blocks_people_widget_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_people_widget_locales" ADD CONSTRAINT "homepage_blocks_people_widget_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_people_widget"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_card_2" ADD CONSTRAINT "homepage_blocks_grid_card_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_card_2" ADD CONSTRAINT "homepage_blocks_grid_card_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_card_2_locales" ADD CONSTRAINT "homepage_blocks_grid_card_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_grid_card_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_agenda_2" ADD CONSTRAINT "homepage_blocks_grid_agenda_2_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_agenda_2" ADD CONSTRAINT "homepage_blocks_grid_agenda_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_news_2" ADD CONSTRAINT "homepage_blocks_grid_news_2_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_news_2" ADD CONSTRAINT "homepage_blocks_grid_news_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_news_2_locales" ADD CONSTRAINT "homepage_blocks_grid_news_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_grid_news_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row" ADD CONSTRAINT "homepage_blocks_grid_row_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row" ADD CONSTRAINT "homepage_blocks_grid_row_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row" ADD CONSTRAINT "homepage_blocks_grid_row_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row" ADD CONSTRAINT "homepage_blocks_grid_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row_locales" ADD CONSTRAINT "homepage_blocks_grid_row_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_grid_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_region_map" ADD CONSTRAINT "homepage_blocks_region_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_region_map_locales" ADD CONSTRAINT "homepage_blocks_region_map_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_region_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_atlas_embed" ADD CONSTRAINT "homepage_blocks_atlas_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1_links" ADD CONSTRAINT "homepage_blocks_cta1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1_links_locales" ADD CONSTRAINT "homepage_blocks_cta1_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_cta1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1" ADD CONSTRAINT "homepage_blocks_cta1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1" ADD CONSTRAINT "homepage_blocks_cta1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1" ADD CONSTRAINT "homepage_blocks_cta1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1_locales" ADD CONSTRAINT "homepage_blocks_cta1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_submit_story_banner" ADD CONSTRAINT "homepage_blocks_submit_story_banner_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_submit_story_banner" ADD CONSTRAINT "homepage_blocks_submit_story_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_submit_story_banner_locales" ADD CONSTRAINT "homepage_blocks_submit_story_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_submit_story_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_form_newsletter" ADD CONSTRAINT "homepage_blocks_form_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_form_newsletter_locales" ADD CONSTRAINT "homepage_blocks_form_newsletter_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_form_newsletter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_logo_cloud1_images" ADD CONSTRAINT "homepage_blocks_logo_cloud1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_logo_cloud1_images" ADD CONSTRAINT "homepage_blocks_logo_cloud1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_logo_cloud1_images_locales" ADD CONSTRAINT "homepage_blocks_logo_cloud1_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_logo_cloud1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_logo_cloud1" ADD CONSTRAINT "homepage_blocks_logo_cloud1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_logo_cloud1_locales" ADD CONSTRAINT "homepage_blocks_logo_cloud1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel2" ADD CONSTRAINT "homepage_blocks_carousel2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel2_locales" ADD CONSTRAINT "homepage_blocks_carousel2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_carousel2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1_2_links" ADD CONSTRAINT "homepage_blocks_hero1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1_2" ADD CONSTRAINT "homepage_blocks_hero1_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1_2" ADD CONSTRAINT "homepage_blocks_hero1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1_2" ADD CONSTRAINT "homepage_blocks_hero1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero1_2" ADD CONSTRAINT "homepage_blocks_hero1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2_2_links" ADD CONSTRAINT "homepage_blocks_hero2_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2_2" ADD CONSTRAINT "homepage_blocks_hero2_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2_2" ADD CONSTRAINT "homepage_blocks_hero2_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero2_2" ADD CONSTRAINT "homepage_blocks_hero2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_section_header_2" ADD CONSTRAINT "homepage_blocks_section_header_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_row_2" ADD CONSTRAINT "homepage_blocks_split_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_2_images" ADD CONSTRAINT "homepage_blocks_carousel1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_2_images" ADD CONSTRAINT "homepage_blocks_carousel1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_carousel1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_2" ADD CONSTRAINT "homepage_blocks_carousel1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_2" ADD CONSTRAINT "homepage_blocks_carousel1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel1_2" ADD CONSTRAINT "homepage_blocks_carousel1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_timeline_row_2_timelines" ADD CONSTRAINT "homepage_blocks_timeline_row_2_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_timeline_row_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_timeline_row_2" ADD CONSTRAINT "homepage_blocks_timeline_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faqs_2_faqs" ADD CONSTRAINT "homepage_blocks_faqs_2_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_faqs_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faqs_2" ADD CONSTRAINT "homepage_blocks_faqs_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content_feed_2_kinds" ADD CONSTRAINT "homepage_blocks_content_feed_2_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content_feed_2_filters_regions" ADD CONSTRAINT "homepage_blocks_content_feed_2_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content_feed_2" ADD CONSTRAINT "homepage_blocks_content_feed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_events_calendar_2" ADD CONSTRAINT "homepage_blocks_events_calendar_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_people_widget_2" ADD CONSTRAINT "homepage_blocks_people_widget_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row_2" ADD CONSTRAINT "homepage_blocks_grid_row_2_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row_2" ADD CONSTRAINT "homepage_blocks_grid_row_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row_2" ADD CONSTRAINT "homepage_blocks_grid_row_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_row_2" ADD CONSTRAINT "homepage_blocks_grid_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_region_map_2" ADD CONSTRAINT "homepage_blocks_region_map_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_atlas_embed_2" ADD CONSTRAINT "homepage_blocks_atlas_embed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1_2_links" ADD CONSTRAINT "homepage_blocks_cta1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_cta1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1_2" ADD CONSTRAINT "homepage_blocks_cta1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1_2" ADD CONSTRAINT "homepage_blocks_cta1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta1_2" ADD CONSTRAINT "homepage_blocks_cta1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_submit_story_banner_2" ADD CONSTRAINT "homepage_blocks_submit_story_banner_2_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_submit_story_banner_2" ADD CONSTRAINT "homepage_blocks_submit_story_banner_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_form_newsletter_2" ADD CONSTRAINT "homepage_blocks_form_newsletter_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_logo_cloud1_2_images" ADD CONSTRAINT "homepage_blocks_logo_cloud1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_logo_cloud1_2_images" ADD CONSTRAINT "homepage_blocks_logo_cloud1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_logo_cloud1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_logo_cloud1_2" ADD CONSTRAINT "homepage_blocks_logo_cloud1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel2_2" ADD CONSTRAINT "homepage_blocks_carousel2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1_links" ADD CONSTRAINT "_homepage_v_blocks_hero1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1_links_locales" ADD CONSTRAINT "_homepage_v_blocks_hero1_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1" ADD CONSTRAINT "_homepage_v_blocks_hero1_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1" ADD CONSTRAINT "_homepage_v_blocks_hero1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1" ADD CONSTRAINT "_homepage_v_blocks_hero1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1" ADD CONSTRAINT "_homepage_v_blocks_hero1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1_locales" ADD CONSTRAINT "_homepage_v_blocks_hero1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2_links" ADD CONSTRAINT "_homepage_v_blocks_hero2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2_links_locales" ADD CONSTRAINT "_homepage_v_blocks_hero2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2" ADD CONSTRAINT "_homepage_v_blocks_hero2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2" ADD CONSTRAINT "_homepage_v_blocks_hero2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2" ADD CONSTRAINT "_homepage_v_blocks_hero2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2_locales" ADD CONSTRAINT "_homepage_v_blocks_hero2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_section_header" ADD CONSTRAINT "_homepage_v_blocks_section_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_section_header_locales" ADD CONSTRAINT "_homepage_v_blocks_section_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_section_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_content_2" ADD CONSTRAINT "_homepage_v_blocks_split_content_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_content_2_locales" ADD CONSTRAINT "_homepage_v_blocks_split_content_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_split_content_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_image_2" ADD CONSTRAINT "_homepage_v_blocks_split_image_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_image_2" ADD CONSTRAINT "_homepage_v_blocks_split_image_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_image_2_locales" ADD CONSTRAINT "_homepage_v_blocks_split_image_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_split_image_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_row" ADD CONSTRAINT "_homepage_v_blocks_split_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_images" ADD CONSTRAINT "_homepage_v_blocks_carousel1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_images" ADD CONSTRAINT "_homepage_v_blocks_carousel1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_images_locales" ADD CONSTRAINT "_homepage_v_blocks_carousel1_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_carousel1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1" ADD CONSTRAINT "_homepage_v_blocks_carousel1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1" ADD CONSTRAINT "_homepage_v_blocks_carousel1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1" ADD CONSTRAINT "_homepage_v_blocks_carousel1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_locales" ADD CONSTRAINT "_homepage_v_blocks_carousel1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_timeline_row_timelines" ADD CONSTRAINT "_homepage_v_blocks_timeline_row_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_timeline_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_timeline_row_timelines_locales" ADD CONSTRAINT "_homepage_v_blocks_timeline_row_timelines_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_timeline_row_timelines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_timeline_row" ADD CONSTRAINT "_homepage_v_blocks_timeline_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faqs_faqs" ADD CONSTRAINT "_homepage_v_blocks_faqs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faqs_faqs_locales" ADD CONSTRAINT "_homepage_v_blocks_faqs_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_faqs_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faqs" ADD CONSTRAINT "_homepage_v_blocks_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_content_feed_kinds" ADD CONSTRAINT "_homepage_v_blocks_content_feed_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_content_feed_filters_regions" ADD CONSTRAINT "_homepage_v_blocks_content_feed_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_content_feed" ADD CONSTRAINT "_homepage_v_blocks_content_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_content_feed_locales" ADD CONSTRAINT "_homepage_v_blocks_content_feed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_events_calendar" ADD CONSTRAINT "_homepage_v_blocks_events_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_events_calendar_locales" ADD CONSTRAINT "_homepage_v_blocks_events_calendar_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_events_calendar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_people_widget" ADD CONSTRAINT "_homepage_v_blocks_people_widget_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_people_widget_locales" ADD CONSTRAINT "_homepage_v_blocks_people_widget_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_people_widget"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_card_2" ADD CONSTRAINT "_homepage_v_blocks_grid_card_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_card_2" ADD CONSTRAINT "_homepage_v_blocks_grid_card_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_card_2_locales" ADD CONSTRAINT "_homepage_v_blocks_grid_card_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_grid_card_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_agenda_2" ADD CONSTRAINT "_homepage_v_blocks_grid_agenda_2_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_agenda_2" ADD CONSTRAINT "_homepage_v_blocks_grid_agenda_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_news_2" ADD CONSTRAINT "_homepage_v_blocks_grid_news_2_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_news_2" ADD CONSTRAINT "_homepage_v_blocks_grid_news_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_news_2_locales" ADD CONSTRAINT "_homepage_v_blocks_grid_news_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_grid_news_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row" ADD CONSTRAINT "_homepage_v_blocks_grid_row_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row" ADD CONSTRAINT "_homepage_v_blocks_grid_row_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row" ADD CONSTRAINT "_homepage_v_blocks_grid_row_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row" ADD CONSTRAINT "_homepage_v_blocks_grid_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row_locales" ADD CONSTRAINT "_homepage_v_blocks_grid_row_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_grid_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_region_map" ADD CONSTRAINT "_homepage_v_blocks_region_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_region_map_locales" ADD CONSTRAINT "_homepage_v_blocks_region_map_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_region_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_atlas_embed" ADD CONSTRAINT "_homepage_v_blocks_atlas_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1_links" ADD CONSTRAINT "_homepage_v_blocks_cta1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1_links_locales" ADD CONSTRAINT "_homepage_v_blocks_cta1_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_cta1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1" ADD CONSTRAINT "_homepage_v_blocks_cta1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1" ADD CONSTRAINT "_homepage_v_blocks_cta1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1" ADD CONSTRAINT "_homepage_v_blocks_cta1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1_locales" ADD CONSTRAINT "_homepage_v_blocks_cta1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_submit_story_banner" ADD CONSTRAINT "_homepage_v_blocks_submit_story_banner_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_submit_story_banner" ADD CONSTRAINT "_homepage_v_blocks_submit_story_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_submit_story_banner_locales" ADD CONSTRAINT "_homepage_v_blocks_submit_story_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_submit_story_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_form_newsletter" ADD CONSTRAINT "_homepage_v_blocks_form_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_form_newsletter_locales" ADD CONSTRAINT "_homepage_v_blocks_form_newsletter_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_form_newsletter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_images" ADD CONSTRAINT "_homepage_v_blocks_logo_cloud1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_images" ADD CONSTRAINT "_homepage_v_blocks_logo_cloud1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_images_locales" ADD CONSTRAINT "_homepage_v_blocks_logo_cloud1_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_logo_cloud1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1" ADD CONSTRAINT "_homepage_v_blocks_logo_cloud1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_locales" ADD CONSTRAINT "_homepage_v_blocks_logo_cloud1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel2" ADD CONSTRAINT "_homepage_v_blocks_carousel2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel2_locales" ADD CONSTRAINT "_homepage_v_blocks_carousel2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_carousel2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1_2_links" ADD CONSTRAINT "_homepage_v_blocks_hero1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1_2" ADD CONSTRAINT "_homepage_v_blocks_hero1_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1_2" ADD CONSTRAINT "_homepage_v_blocks_hero1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1_2" ADD CONSTRAINT "_homepage_v_blocks_hero1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero1_2" ADD CONSTRAINT "_homepage_v_blocks_hero1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2_2_links" ADD CONSTRAINT "_homepage_v_blocks_hero2_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2_2" ADD CONSTRAINT "_homepage_v_blocks_hero2_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2_2" ADD CONSTRAINT "_homepage_v_blocks_hero2_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero2_2" ADD CONSTRAINT "_homepage_v_blocks_hero2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_section_header_2" ADD CONSTRAINT "_homepage_v_blocks_section_header_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_split_row_2" ADD CONSTRAINT "_homepage_v_blocks_split_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_2_images" ADD CONSTRAINT "_homepage_v_blocks_carousel1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_2_images" ADD CONSTRAINT "_homepage_v_blocks_carousel1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_carousel1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_2" ADD CONSTRAINT "_homepage_v_blocks_carousel1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_2" ADD CONSTRAINT "_homepage_v_blocks_carousel1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel1_2" ADD CONSTRAINT "_homepage_v_blocks_carousel1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_timeline_row_2_timelines" ADD CONSTRAINT "_homepage_v_blocks_timeline_row_2_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_timeline_row_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_timeline_row_2" ADD CONSTRAINT "_homepage_v_blocks_timeline_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faqs_2_faqs" ADD CONSTRAINT "_homepage_v_blocks_faqs_2_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_faqs_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faqs_2" ADD CONSTRAINT "_homepage_v_blocks_faqs_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_content_feed_2_kinds" ADD CONSTRAINT "_homepage_v_blocks_content_feed_2_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_content_feed_2_filters_regions" ADD CONSTRAINT "_homepage_v_blocks_content_feed_2_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_content_feed_2" ADD CONSTRAINT "_homepage_v_blocks_content_feed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_events_calendar_2" ADD CONSTRAINT "_homepage_v_blocks_events_calendar_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_people_widget_2" ADD CONSTRAINT "_homepage_v_blocks_people_widget_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row_2" ADD CONSTRAINT "_homepage_v_blocks_grid_row_2_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row_2" ADD CONSTRAINT "_homepage_v_blocks_grid_row_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row_2" ADD CONSTRAINT "_homepage_v_blocks_grid_row_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_grid_row_2" ADD CONSTRAINT "_homepage_v_blocks_grid_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_region_map_2" ADD CONSTRAINT "_homepage_v_blocks_region_map_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_atlas_embed_2" ADD CONSTRAINT "_homepage_v_blocks_atlas_embed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1_2_links" ADD CONSTRAINT "_homepage_v_blocks_cta1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_cta1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1_2" ADD CONSTRAINT "_homepage_v_blocks_cta1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1_2" ADD CONSTRAINT "_homepage_v_blocks_cta1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta1_2" ADD CONSTRAINT "_homepage_v_blocks_cta1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_submit_story_banner_2" ADD CONSTRAINT "_homepage_v_blocks_submit_story_banner_2_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_submit_story_banner_2" ADD CONSTRAINT "_homepage_v_blocks_submit_story_banner_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_form_newsletter_2" ADD CONSTRAINT "_homepage_v_blocks_form_newsletter_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_2_images" ADD CONSTRAINT "_homepage_v_blocks_logo_cloud1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_2_images" ADD CONSTRAINT "_homepage_v_blocks_logo_cloud1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_logo_cloud1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_2" ADD CONSTRAINT "_homepage_v_blocks_logo_cloud1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_carousel2_2" ADD CONSTRAINT "_homepage_v_blocks_carousel2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_blocks_hero1_links_order_idx" ON "homepage_blocks_hero1_links" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero1_links_parent_id_idx" ON "homepage_blocks_hero1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_hero1_links_locales_locale_parent_id_unique" ON "homepage_blocks_hero1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_hero1_order_idx" ON "homepage_blocks_hero1" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero1_parent_id_idx" ON "homepage_blocks_hero1" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero1_path_idx" ON "homepage_blocks_hero1" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero1_image_image_asset_idx" ON "homepage_blocks_hero1" USING btree ("image_asset_id");
  CREATE INDEX "homepage_blocks_hero1_background_background_svg_pattern_idx" ON "homepage_blocks_hero1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_hero1_background_image_background_image__idx" ON "homepage_blocks_hero1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_hero1_locales_locale_parent_id_unique" ON "homepage_blocks_hero1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_hero2_links_order_idx" ON "homepage_blocks_hero2_links" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero2_links_parent_id_idx" ON "homepage_blocks_hero2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_hero2_links_locales_locale_parent_id_unique" ON "homepage_blocks_hero2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_hero2_order_idx" ON "homepage_blocks_hero2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero2_parent_id_idx" ON "homepage_blocks_hero2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero2_path_idx" ON "homepage_blocks_hero2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero2_background_background_svg_pattern_idx" ON "homepage_blocks_hero2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_hero2_background_image_background_image__idx" ON "homepage_blocks_hero2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_hero2_locales_locale_parent_id_unique" ON "homepage_blocks_hero2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_section_header_order_idx" ON "homepage_blocks_section_header" USING btree ("_order");
  CREATE INDEX "homepage_blocks_section_header_parent_id_idx" ON "homepage_blocks_section_header" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_section_header_path_idx" ON "homepage_blocks_section_header" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_section_header_locales_locale_parent_id_uniq" ON "homepage_blocks_section_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_split_content_2_order_idx" ON "homepage_blocks_split_content_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_split_content_2_parent_id_idx" ON "homepage_blocks_split_content_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_split_content_2_path_idx" ON "homepage_blocks_split_content_2" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_split_content_2_locales_locale_parent_id_uni" ON "homepage_blocks_split_content_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_split_image_2_order_idx" ON "homepage_blocks_split_image_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_split_image_2_parent_id_idx" ON "homepage_blocks_split_image_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_split_image_2_path_idx" ON "homepage_blocks_split_image_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_split_image_2_image_image_asset_idx" ON "homepage_blocks_split_image_2" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_split_image_2_locales_locale_parent_id_uniqu" ON "homepage_blocks_split_image_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_split_row_order_idx" ON "homepage_blocks_split_row" USING btree ("_order");
  CREATE INDEX "homepage_blocks_split_row_parent_id_idx" ON "homepage_blocks_split_row" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_split_row_path_idx" ON "homepage_blocks_split_row" USING btree ("_path");
  CREATE INDEX "homepage_blocks_carousel1_images_order_idx" ON "homepage_blocks_carousel1_images" USING btree ("_order");
  CREATE INDEX "homepage_blocks_carousel1_images_parent_id_idx" ON "homepage_blocks_carousel1_images" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_carousel1_images_asset_idx" ON "homepage_blocks_carousel1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_carousel1_images_locales_locale_parent_id_un" ON "homepage_blocks_carousel1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_carousel1_order_idx" ON "homepage_blocks_carousel1" USING btree ("_order");
  CREATE INDEX "homepage_blocks_carousel1_parent_id_idx" ON "homepage_blocks_carousel1" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_carousel1_path_idx" ON "homepage_blocks_carousel1" USING btree ("_path");
  CREATE INDEX "homepage_blocks_carousel1_background_background_svg_patt_idx" ON "homepage_blocks_carousel1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_carousel1_background_image_background_im_idx" ON "homepage_blocks_carousel1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_carousel1_locales_locale_parent_id_unique" ON "homepage_blocks_carousel1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_timeline_row_timelines_order_idx" ON "homepage_blocks_timeline_row_timelines" USING btree ("_order");
  CREATE INDEX "homepage_blocks_timeline_row_timelines_parent_id_idx" ON "homepage_blocks_timeline_row_timelines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_timeline_row_timelines_locales_locale_parent" ON "homepage_blocks_timeline_row_timelines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_timeline_row_order_idx" ON "homepage_blocks_timeline_row" USING btree ("_order");
  CREATE INDEX "homepage_blocks_timeline_row_parent_id_idx" ON "homepage_blocks_timeline_row" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_timeline_row_path_idx" ON "homepage_blocks_timeline_row" USING btree ("_path");
  CREATE INDEX "homepage_blocks_faqs_faqs_order_idx" ON "homepage_blocks_faqs_faqs" USING btree ("_order");
  CREATE INDEX "homepage_blocks_faqs_faqs_parent_id_idx" ON "homepage_blocks_faqs_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_faqs_faqs_locales_locale_parent_id_unique" ON "homepage_blocks_faqs_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_faqs_order_idx" ON "homepage_blocks_faqs" USING btree ("_order");
  CREATE INDEX "homepage_blocks_faqs_parent_id_idx" ON "homepage_blocks_faqs" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_faqs_path_idx" ON "homepage_blocks_faqs" USING btree ("_path");
  CREATE INDEX "homepage_blocks_content_feed_kinds_order_idx" ON "homepage_blocks_content_feed_kinds" USING btree ("order");
  CREATE INDEX "homepage_blocks_content_feed_kinds_parent_idx" ON "homepage_blocks_content_feed_kinds" USING btree ("parent_id");
  CREATE INDEX "homepage_blocks_content_feed_filters_regions_order_idx" ON "homepage_blocks_content_feed_filters_regions" USING btree ("order");
  CREATE INDEX "homepage_blocks_content_feed_filters_regions_parent_idx" ON "homepage_blocks_content_feed_filters_regions" USING btree ("parent_id");
  CREATE INDEX "homepage_blocks_content_feed_order_idx" ON "homepage_blocks_content_feed" USING btree ("_order");
  CREATE INDEX "homepage_blocks_content_feed_parent_id_idx" ON "homepage_blocks_content_feed" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_content_feed_path_idx" ON "homepage_blocks_content_feed" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_content_feed_locales_locale_parent_id_unique" ON "homepage_blocks_content_feed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_events_calendar_order_idx" ON "homepage_blocks_events_calendar" USING btree ("_order");
  CREATE INDEX "homepage_blocks_events_calendar_parent_id_idx" ON "homepage_blocks_events_calendar" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_events_calendar_path_idx" ON "homepage_blocks_events_calendar" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_events_calendar_locales_locale_parent_id_uni" ON "homepage_blocks_events_calendar_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_people_widget_order_idx" ON "homepage_blocks_people_widget" USING btree ("_order");
  CREATE INDEX "homepage_blocks_people_widget_parent_id_idx" ON "homepage_blocks_people_widget" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_people_widget_path_idx" ON "homepage_blocks_people_widget" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_people_widget_locales_locale_parent_id_uniqu" ON "homepage_blocks_people_widget_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_grid_card_2_order_idx" ON "homepage_blocks_grid_card_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_grid_card_2_parent_id_idx" ON "homepage_blocks_grid_card_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_grid_card_2_path_idx" ON "homepage_blocks_grid_card_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_grid_card_2_image_image_asset_idx" ON "homepage_blocks_grid_card_2" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_grid_card_2_locales_locale_parent_id_unique" ON "homepage_blocks_grid_card_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_grid_agenda_2_order_idx" ON "homepage_blocks_grid_agenda_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_grid_agenda_2_parent_id_idx" ON "homepage_blocks_grid_agenda_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_grid_agenda_2_path_idx" ON "homepage_blocks_grid_agenda_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_grid_agenda_2_agenda_idx" ON "homepage_blocks_grid_agenda_2" USING btree ("agenda_id");
  CREATE INDEX "homepage_blocks_grid_news_2_order_idx" ON "homepage_blocks_grid_news_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_grid_news_2_parent_id_idx" ON "homepage_blocks_grid_news_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_grid_news_2_path_idx" ON "homepage_blocks_grid_news_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_grid_news_2_news_post_idx" ON "homepage_blocks_grid_news_2" USING btree ("news_post_id");
  CREATE UNIQUE INDEX "homepage_blocks_grid_news_2_locales_locale_parent_id_unique" ON "homepage_blocks_grid_news_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_grid_row_order_idx" ON "homepage_blocks_grid_row" USING btree ("_order");
  CREATE INDEX "homepage_blocks_grid_row_parent_id_idx" ON "homepage_blocks_grid_row" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_grid_row_path_idx" ON "homepage_blocks_grid_row" USING btree ("_path");
  CREATE INDEX "homepage_blocks_grid_row_header_image_header_image_asset_idx" ON "homepage_blocks_grid_row" USING btree ("header_image_asset_id");
  CREATE INDEX "homepage_blocks_grid_row_background_background_svg_patte_idx" ON "homepage_blocks_grid_row" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_grid_row_background_image_background_ima_idx" ON "homepage_blocks_grid_row" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_grid_row_locales_locale_parent_id_unique" ON "homepage_blocks_grid_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_region_map_order_idx" ON "homepage_blocks_region_map" USING btree ("_order");
  CREATE INDEX "homepage_blocks_region_map_parent_id_idx" ON "homepage_blocks_region_map" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_region_map_path_idx" ON "homepage_blocks_region_map" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_region_map_locales_locale_parent_id_unique" ON "homepage_blocks_region_map_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_atlas_embed_order_idx" ON "homepage_blocks_atlas_embed" USING btree ("_order");
  CREATE INDEX "homepage_blocks_atlas_embed_parent_id_idx" ON "homepage_blocks_atlas_embed" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_atlas_embed_path_idx" ON "homepage_blocks_atlas_embed" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cta1_links_order_idx" ON "homepage_blocks_cta1_links" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cta1_links_parent_id_idx" ON "homepage_blocks_cta1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_cta1_links_locales_locale_parent_id_unique" ON "homepage_blocks_cta1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_cta1_order_idx" ON "homepage_blocks_cta1" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cta1_parent_id_idx" ON "homepage_blocks_cta1" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cta1_path_idx" ON "homepage_blocks_cta1" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cta1_background_background_svg_pattern_idx" ON "homepage_blocks_cta1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_cta1_background_image_background_image_a_idx" ON "homepage_blocks_cta1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_cta1_locales_locale_parent_id_unique" ON "homepage_blocks_cta1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_submit_story_banner_order_idx" ON "homepage_blocks_submit_story_banner" USING btree ("_order");
  CREATE INDEX "homepage_blocks_submit_story_banner_parent_id_idx" ON "homepage_blocks_submit_story_banner" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_submit_story_banner_path_idx" ON "homepage_blocks_submit_story_banner" USING btree ("_path");
  CREATE INDEX "homepage_blocks_submit_story_banner_illustration_illustr_idx" ON "homepage_blocks_submit_story_banner" USING btree ("illustration_asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_submit_story_banner_locales_locale_parent_id" ON "homepage_blocks_submit_story_banner_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_form_newsletter_order_idx" ON "homepage_blocks_form_newsletter" USING btree ("_order");
  CREATE INDEX "homepage_blocks_form_newsletter_parent_id_idx" ON "homepage_blocks_form_newsletter" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_form_newsletter_path_idx" ON "homepage_blocks_form_newsletter" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_form_newsletter_locales_locale_parent_id_uni" ON "homepage_blocks_form_newsletter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_logo_cloud1_images_order_idx" ON "homepage_blocks_logo_cloud1_images" USING btree ("_order");
  CREATE INDEX "homepage_blocks_logo_cloud1_images_parent_id_idx" ON "homepage_blocks_logo_cloud1_images" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_logo_cloud1_images_asset_idx" ON "homepage_blocks_logo_cloud1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "homepage_blocks_logo_cloud1_images_locales_locale_parent_id_" ON "homepage_blocks_logo_cloud1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_logo_cloud1_order_idx" ON "homepage_blocks_logo_cloud1" USING btree ("_order");
  CREATE INDEX "homepage_blocks_logo_cloud1_parent_id_idx" ON "homepage_blocks_logo_cloud1" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_logo_cloud1_path_idx" ON "homepage_blocks_logo_cloud1" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_logo_cloud1_locales_locale_parent_id_unique" ON "homepage_blocks_logo_cloud1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_carousel2_order_idx" ON "homepage_blocks_carousel2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_carousel2_parent_id_idx" ON "homepage_blocks_carousel2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_carousel2_path_idx" ON "homepage_blocks_carousel2" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_carousel2_locales_locale_parent_id_unique" ON "homepage_blocks_carousel2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_hero1_2_links_order_idx" ON "homepage_blocks_hero1_2_links" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero1_2_links_parent_id_idx" ON "homepage_blocks_hero1_2_links" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero1_2_links_locale_idx" ON "homepage_blocks_hero1_2_links" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_hero1_2_order_idx" ON "homepage_blocks_hero1_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero1_2_parent_id_idx" ON "homepage_blocks_hero1_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero1_2_path_idx" ON "homepage_blocks_hero1_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero1_2_locale_idx" ON "homepage_blocks_hero1_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_hero1_2_image_image_asset_idx" ON "homepage_blocks_hero1_2" USING btree ("image_asset_id");
  CREATE INDEX "homepage_blocks_hero1_2_background_background_svg_patter_idx" ON "homepage_blocks_hero1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_hero1_2_background_image_background_imag_idx" ON "homepage_blocks_hero1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "homepage_blocks_hero2_2_links_order_idx" ON "homepage_blocks_hero2_2_links" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero2_2_links_parent_id_idx" ON "homepage_blocks_hero2_2_links" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero2_2_links_locale_idx" ON "homepage_blocks_hero2_2_links" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_hero2_2_order_idx" ON "homepage_blocks_hero2_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero2_2_parent_id_idx" ON "homepage_blocks_hero2_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero2_2_path_idx" ON "homepage_blocks_hero2_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero2_2_locale_idx" ON "homepage_blocks_hero2_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_hero2_2_background_background_svg_patter_idx" ON "homepage_blocks_hero2_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_hero2_2_background_image_background_imag_idx" ON "homepage_blocks_hero2_2" USING btree ("background_image_asset_id");
  CREATE INDEX "homepage_blocks_section_header_2_order_idx" ON "homepage_blocks_section_header_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_section_header_2_parent_id_idx" ON "homepage_blocks_section_header_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_section_header_2_path_idx" ON "homepage_blocks_section_header_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_section_header_2_locale_idx" ON "homepage_blocks_section_header_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_split_row_2_order_idx" ON "homepage_blocks_split_row_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_split_row_2_parent_id_idx" ON "homepage_blocks_split_row_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_split_row_2_path_idx" ON "homepage_blocks_split_row_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_split_row_2_locale_idx" ON "homepage_blocks_split_row_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_carousel1_2_images_order_idx" ON "homepage_blocks_carousel1_2_images" USING btree ("_order");
  CREATE INDEX "homepage_blocks_carousel1_2_images_parent_id_idx" ON "homepage_blocks_carousel1_2_images" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_carousel1_2_images_locale_idx" ON "homepage_blocks_carousel1_2_images" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_carousel1_2_images_asset_idx" ON "homepage_blocks_carousel1_2_images" USING btree ("asset_id");
  CREATE INDEX "homepage_blocks_carousel1_2_order_idx" ON "homepage_blocks_carousel1_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_carousel1_2_parent_id_idx" ON "homepage_blocks_carousel1_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_carousel1_2_path_idx" ON "homepage_blocks_carousel1_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_carousel1_2_locale_idx" ON "homepage_blocks_carousel1_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_carousel1_2_background_background_svg_pa_idx" ON "homepage_blocks_carousel1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_carousel1_2_background_image_background__idx" ON "homepage_blocks_carousel1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "homepage_blocks_timeline_row_2_timelines_order_idx" ON "homepage_blocks_timeline_row_2_timelines" USING btree ("_order");
  CREATE INDEX "homepage_blocks_timeline_row_2_timelines_parent_id_idx" ON "homepage_blocks_timeline_row_2_timelines" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_timeline_row_2_timelines_locale_idx" ON "homepage_blocks_timeline_row_2_timelines" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_timeline_row_2_order_idx" ON "homepage_blocks_timeline_row_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_timeline_row_2_parent_id_idx" ON "homepage_blocks_timeline_row_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_timeline_row_2_path_idx" ON "homepage_blocks_timeline_row_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_timeline_row_2_locale_idx" ON "homepage_blocks_timeline_row_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_faqs_2_faqs_order_idx" ON "homepage_blocks_faqs_2_faqs" USING btree ("_order");
  CREATE INDEX "homepage_blocks_faqs_2_faqs_parent_id_idx" ON "homepage_blocks_faqs_2_faqs" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_faqs_2_faqs_locale_idx" ON "homepage_blocks_faqs_2_faqs" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_faqs_2_order_idx" ON "homepage_blocks_faqs_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_faqs_2_parent_id_idx" ON "homepage_blocks_faqs_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_faqs_2_path_idx" ON "homepage_blocks_faqs_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_faqs_2_locale_idx" ON "homepage_blocks_faqs_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_content_feed_2_kinds_order_idx" ON "homepage_blocks_content_feed_2_kinds" USING btree ("order");
  CREATE INDEX "homepage_blocks_content_feed_2_kinds_parent_idx" ON "homepage_blocks_content_feed_2_kinds" USING btree ("parent_id");
  CREATE INDEX "homepage_blocks_content_feed_2_kinds_locale_idx" ON "homepage_blocks_content_feed_2_kinds" USING btree ("locale");
  CREATE INDEX "homepage_blocks_content_feed_2_filters_regions_order_idx" ON "homepage_blocks_content_feed_2_filters_regions" USING btree ("order");
  CREATE INDEX "homepage_blocks_content_feed_2_filters_regions_parent_idx" ON "homepage_blocks_content_feed_2_filters_regions" USING btree ("parent_id");
  CREATE INDEX "homepage_blocks_content_feed_2_filters_regions_locale_idx" ON "homepage_blocks_content_feed_2_filters_regions" USING btree ("locale");
  CREATE INDEX "homepage_blocks_content_feed_2_order_idx" ON "homepage_blocks_content_feed_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_content_feed_2_parent_id_idx" ON "homepage_blocks_content_feed_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_content_feed_2_path_idx" ON "homepage_blocks_content_feed_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_content_feed_2_locale_idx" ON "homepage_blocks_content_feed_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_events_calendar_2_order_idx" ON "homepage_blocks_events_calendar_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_events_calendar_2_parent_id_idx" ON "homepage_blocks_events_calendar_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_events_calendar_2_path_idx" ON "homepage_blocks_events_calendar_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_events_calendar_2_locale_idx" ON "homepage_blocks_events_calendar_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_people_widget_2_order_idx" ON "homepage_blocks_people_widget_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_people_widget_2_parent_id_idx" ON "homepage_blocks_people_widget_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_people_widget_2_path_idx" ON "homepage_blocks_people_widget_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_people_widget_2_locale_idx" ON "homepage_blocks_people_widget_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_grid_row_2_order_idx" ON "homepage_blocks_grid_row_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_grid_row_2_parent_id_idx" ON "homepage_blocks_grid_row_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_grid_row_2_path_idx" ON "homepage_blocks_grid_row_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_grid_row_2_locale_idx" ON "homepage_blocks_grid_row_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_grid_row_2_header_image_header_image_ass_idx" ON "homepage_blocks_grid_row_2" USING btree ("header_image_asset_id");
  CREATE INDEX "homepage_blocks_grid_row_2_background_background_svg_pat_idx" ON "homepage_blocks_grid_row_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_grid_row_2_background_image_background_i_idx" ON "homepage_blocks_grid_row_2" USING btree ("background_image_asset_id");
  CREATE INDEX "homepage_blocks_region_map_2_order_idx" ON "homepage_blocks_region_map_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_region_map_2_parent_id_idx" ON "homepage_blocks_region_map_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_region_map_2_path_idx" ON "homepage_blocks_region_map_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_region_map_2_locale_idx" ON "homepage_blocks_region_map_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_atlas_embed_2_order_idx" ON "homepage_blocks_atlas_embed_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_atlas_embed_2_parent_id_idx" ON "homepage_blocks_atlas_embed_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_atlas_embed_2_path_idx" ON "homepage_blocks_atlas_embed_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_atlas_embed_2_locale_idx" ON "homepage_blocks_atlas_embed_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_cta1_2_links_order_idx" ON "homepage_blocks_cta1_2_links" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cta1_2_links_parent_id_idx" ON "homepage_blocks_cta1_2_links" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cta1_2_links_locale_idx" ON "homepage_blocks_cta1_2_links" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_cta1_2_order_idx" ON "homepage_blocks_cta1_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cta1_2_parent_id_idx" ON "homepage_blocks_cta1_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cta1_2_path_idx" ON "homepage_blocks_cta1_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cta1_2_locale_idx" ON "homepage_blocks_cta1_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_cta1_2_background_background_svg_pattern_idx" ON "homepage_blocks_cta1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "homepage_blocks_cta1_2_background_image_background_image_idx" ON "homepage_blocks_cta1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "homepage_blocks_submit_story_banner_2_order_idx" ON "homepage_blocks_submit_story_banner_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_submit_story_banner_2_parent_id_idx" ON "homepage_blocks_submit_story_banner_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_submit_story_banner_2_path_idx" ON "homepage_blocks_submit_story_banner_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_submit_story_banner_2_locale_idx" ON "homepage_blocks_submit_story_banner_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_submit_story_banner_2_illustration_illus_idx" ON "homepage_blocks_submit_story_banner_2" USING btree ("illustration_asset_id");
  CREATE INDEX "homepage_blocks_form_newsletter_2_order_idx" ON "homepage_blocks_form_newsletter_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_form_newsletter_2_parent_id_idx" ON "homepage_blocks_form_newsletter_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_form_newsletter_2_path_idx" ON "homepage_blocks_form_newsletter_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_form_newsletter_2_locale_idx" ON "homepage_blocks_form_newsletter_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_logo_cloud1_2_images_order_idx" ON "homepage_blocks_logo_cloud1_2_images" USING btree ("_order");
  CREATE INDEX "homepage_blocks_logo_cloud1_2_images_parent_id_idx" ON "homepage_blocks_logo_cloud1_2_images" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_logo_cloud1_2_images_locale_idx" ON "homepage_blocks_logo_cloud1_2_images" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_logo_cloud1_2_images_asset_idx" ON "homepage_blocks_logo_cloud1_2_images" USING btree ("asset_id");
  CREATE INDEX "homepage_blocks_logo_cloud1_2_order_idx" ON "homepage_blocks_logo_cloud1_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_logo_cloud1_2_parent_id_idx" ON "homepage_blocks_logo_cloud1_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_logo_cloud1_2_path_idx" ON "homepage_blocks_logo_cloud1_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_logo_cloud1_2_locale_idx" ON "homepage_blocks_logo_cloud1_2" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_carousel2_2_order_idx" ON "homepage_blocks_carousel2_2" USING btree ("_order");
  CREATE INDEX "homepage_blocks_carousel2_2_parent_id_idx" ON "homepage_blocks_carousel2_2" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_carousel2_2_path_idx" ON "homepage_blocks_carousel2_2" USING btree ("_path");
  CREATE INDEX "homepage_blocks_carousel2_2_locale_idx" ON "homepage_blocks_carousel2_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_hero1_links_order_idx" ON "_homepage_v_blocks_hero1_links" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero1_links_parent_id_idx" ON "_homepage_v_blocks_hero1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_hero1_links_locales_locale_parent_id_uniq" ON "_homepage_v_blocks_hero1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero1_order_idx" ON "_homepage_v_blocks_hero1" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero1_parent_id_idx" ON "_homepage_v_blocks_hero1" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero1_path_idx" ON "_homepage_v_blocks_hero1" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_hero1_image_image_asset_idx" ON "_homepage_v_blocks_hero1" USING btree ("image_asset_id");
  CREATE INDEX "_homepage_v_blocks_hero1_background_background_svg_patte_idx" ON "_homepage_v_blocks_hero1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_hero1_background_image_background_ima_idx" ON "_homepage_v_blocks_hero1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_hero1_locales_locale_parent_id_unique" ON "_homepage_v_blocks_hero1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero2_links_order_idx" ON "_homepage_v_blocks_hero2_links" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero2_links_parent_id_idx" ON "_homepage_v_blocks_hero2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_hero2_links_locales_locale_parent_id_uniq" ON "_homepage_v_blocks_hero2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero2_order_idx" ON "_homepage_v_blocks_hero2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero2_parent_id_idx" ON "_homepage_v_blocks_hero2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero2_path_idx" ON "_homepage_v_blocks_hero2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_hero2_background_background_svg_patte_idx" ON "_homepage_v_blocks_hero2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_hero2_background_image_background_ima_idx" ON "_homepage_v_blocks_hero2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_hero2_locales_locale_parent_id_unique" ON "_homepage_v_blocks_hero2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_section_header_order_idx" ON "_homepage_v_blocks_section_header" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_section_header_parent_id_idx" ON "_homepage_v_blocks_section_header" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_section_header_path_idx" ON "_homepage_v_blocks_section_header" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_section_header_locales_locale_parent_id_u" ON "_homepage_v_blocks_section_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_content_2_order_idx" ON "_homepage_v_blocks_split_content_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_split_content_2_parent_id_idx" ON "_homepage_v_blocks_split_content_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_content_2_path_idx" ON "_homepage_v_blocks_split_content_2" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_split_content_2_locales_locale_parent_id_" ON "_homepage_v_blocks_split_content_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_image_2_order_idx" ON "_homepage_v_blocks_split_image_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_split_image_2_parent_id_idx" ON "_homepage_v_blocks_split_image_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_image_2_path_idx" ON "_homepage_v_blocks_split_image_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_split_image_2_image_image_asset_idx" ON "_homepage_v_blocks_split_image_2" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_split_image_2_locales_locale_parent_id_un" ON "_homepage_v_blocks_split_image_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_row_order_idx" ON "_homepage_v_blocks_split_row" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_split_row_parent_id_idx" ON "_homepage_v_blocks_split_row" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_row_path_idx" ON "_homepage_v_blocks_split_row" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_carousel1_images_order_idx" ON "_homepage_v_blocks_carousel1_images" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_carousel1_images_parent_id_idx" ON "_homepage_v_blocks_carousel1_images" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_carousel1_images_asset_idx" ON "_homepage_v_blocks_carousel1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_carousel1_images_locales_locale_parent_id" ON "_homepage_v_blocks_carousel1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_carousel1_order_idx" ON "_homepage_v_blocks_carousel1" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_carousel1_parent_id_idx" ON "_homepage_v_blocks_carousel1" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_carousel1_path_idx" ON "_homepage_v_blocks_carousel1" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_carousel1_background_background_svg_p_idx" ON "_homepage_v_blocks_carousel1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_carousel1_background_image_background_idx" ON "_homepage_v_blocks_carousel1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_carousel1_locales_locale_parent_id_unique" ON "_homepage_v_blocks_carousel1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_timeline_row_timelines_order_idx" ON "_homepage_v_blocks_timeline_row_timelines" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_timeline_row_timelines_parent_id_idx" ON "_homepage_v_blocks_timeline_row_timelines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_timeline_row_timelines_locales_locale_par" ON "_homepage_v_blocks_timeline_row_timelines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_timeline_row_order_idx" ON "_homepage_v_blocks_timeline_row" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_timeline_row_parent_id_idx" ON "_homepage_v_blocks_timeline_row" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_timeline_row_path_idx" ON "_homepage_v_blocks_timeline_row" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_faqs_faqs_order_idx" ON "_homepage_v_blocks_faqs_faqs" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_faqs_faqs_parent_id_idx" ON "_homepage_v_blocks_faqs_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_faqs_faqs_locales_locale_parent_id_unique" ON "_homepage_v_blocks_faqs_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_faqs_order_idx" ON "_homepage_v_blocks_faqs" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_faqs_parent_id_idx" ON "_homepage_v_blocks_faqs" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_faqs_path_idx" ON "_homepage_v_blocks_faqs" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_content_feed_kinds_order_idx" ON "_homepage_v_blocks_content_feed_kinds" USING btree ("order");
  CREATE INDEX "_homepage_v_blocks_content_feed_kinds_parent_idx" ON "_homepage_v_blocks_content_feed_kinds" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_blocks_content_feed_filters_regions_order_idx" ON "_homepage_v_blocks_content_feed_filters_regions" USING btree ("order");
  CREATE INDEX "_homepage_v_blocks_content_feed_filters_regions_parent_idx" ON "_homepage_v_blocks_content_feed_filters_regions" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_blocks_content_feed_order_idx" ON "_homepage_v_blocks_content_feed" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_content_feed_parent_id_idx" ON "_homepage_v_blocks_content_feed" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_content_feed_path_idx" ON "_homepage_v_blocks_content_feed" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_content_feed_locales_locale_parent_id_uni" ON "_homepage_v_blocks_content_feed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_events_calendar_order_idx" ON "_homepage_v_blocks_events_calendar" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_events_calendar_parent_id_idx" ON "_homepage_v_blocks_events_calendar" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_events_calendar_path_idx" ON "_homepage_v_blocks_events_calendar" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_events_calendar_locales_locale_parent_id_" ON "_homepage_v_blocks_events_calendar_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_people_widget_order_idx" ON "_homepage_v_blocks_people_widget" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_people_widget_parent_id_idx" ON "_homepage_v_blocks_people_widget" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_people_widget_path_idx" ON "_homepage_v_blocks_people_widget" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_people_widget_locales_locale_parent_id_un" ON "_homepage_v_blocks_people_widget_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_card_2_order_idx" ON "_homepage_v_blocks_grid_card_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_grid_card_2_parent_id_idx" ON "_homepage_v_blocks_grid_card_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_card_2_path_idx" ON "_homepage_v_blocks_grid_card_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_grid_card_2_image_image_asset_idx" ON "_homepage_v_blocks_grid_card_2" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_grid_card_2_locales_locale_parent_id_uniq" ON "_homepage_v_blocks_grid_card_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_2_order_idx" ON "_homepage_v_blocks_grid_agenda_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_2_parent_id_idx" ON "_homepage_v_blocks_grid_agenda_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_2_path_idx" ON "_homepage_v_blocks_grid_agenda_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_grid_agenda_2_agenda_idx" ON "_homepage_v_blocks_grid_agenda_2" USING btree ("agenda_id");
  CREATE INDEX "_homepage_v_blocks_grid_news_2_order_idx" ON "_homepage_v_blocks_grid_news_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_grid_news_2_parent_id_idx" ON "_homepage_v_blocks_grid_news_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_news_2_path_idx" ON "_homepage_v_blocks_grid_news_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_grid_news_2_news_post_idx" ON "_homepage_v_blocks_grid_news_2" USING btree ("news_post_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_grid_news_2_locales_locale_parent_id_uniq" ON "_homepage_v_blocks_grid_news_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_row_order_idx" ON "_homepage_v_blocks_grid_row" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_grid_row_parent_id_idx" ON "_homepage_v_blocks_grid_row" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_row_path_idx" ON "_homepage_v_blocks_grid_row" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_grid_row_header_image_header_image_as_idx" ON "_homepage_v_blocks_grid_row" USING btree ("header_image_asset_id");
  CREATE INDEX "_homepage_v_blocks_grid_row_background_background_svg_pa_idx" ON "_homepage_v_blocks_grid_row" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_grid_row_background_image_background__idx" ON "_homepage_v_blocks_grid_row" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_grid_row_locales_locale_parent_id_unique" ON "_homepage_v_blocks_grid_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_region_map_order_idx" ON "_homepage_v_blocks_region_map" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_region_map_parent_id_idx" ON "_homepage_v_blocks_region_map" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_region_map_path_idx" ON "_homepage_v_blocks_region_map" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_region_map_locales_locale_parent_id_uniqu" ON "_homepage_v_blocks_region_map_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_atlas_embed_order_idx" ON "_homepage_v_blocks_atlas_embed" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_atlas_embed_parent_id_idx" ON "_homepage_v_blocks_atlas_embed" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_atlas_embed_path_idx" ON "_homepage_v_blocks_atlas_embed" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_cta1_links_order_idx" ON "_homepage_v_blocks_cta1_links" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_cta1_links_parent_id_idx" ON "_homepage_v_blocks_cta1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_cta1_links_locales_locale_parent_id_uniqu" ON "_homepage_v_blocks_cta1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_cta1_order_idx" ON "_homepage_v_blocks_cta1" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_cta1_parent_id_idx" ON "_homepage_v_blocks_cta1" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_cta1_path_idx" ON "_homepage_v_blocks_cta1" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_cta1_background_background_svg_patter_idx" ON "_homepage_v_blocks_cta1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_cta1_background_image_background_imag_idx" ON "_homepage_v_blocks_cta1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_cta1_locales_locale_parent_id_unique" ON "_homepage_v_blocks_cta1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_order_idx" ON "_homepage_v_blocks_submit_story_banner" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_parent_id_idx" ON "_homepage_v_blocks_submit_story_banner" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_path_idx" ON "_homepage_v_blocks_submit_story_banner" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_illustration_illu_idx" ON "_homepage_v_blocks_submit_story_banner" USING btree ("illustration_asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_submit_story_banner_locales_locale_parent" ON "_homepage_v_blocks_submit_story_banner_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_form_newsletter_order_idx" ON "_homepage_v_blocks_form_newsletter" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_form_newsletter_parent_id_idx" ON "_homepage_v_blocks_form_newsletter" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_form_newsletter_path_idx" ON "_homepage_v_blocks_form_newsletter" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_form_newsletter_locales_locale_parent_id_" ON "_homepage_v_blocks_form_newsletter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_images_order_idx" ON "_homepage_v_blocks_logo_cloud1_images" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_images_parent_id_idx" ON "_homepage_v_blocks_logo_cloud1_images" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_images_asset_idx" ON "_homepage_v_blocks_logo_cloud1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_logo_cloud1_images_locales_locale_parent_" ON "_homepage_v_blocks_logo_cloud1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_order_idx" ON "_homepage_v_blocks_logo_cloud1" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_parent_id_idx" ON "_homepage_v_blocks_logo_cloud1" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_path_idx" ON "_homepage_v_blocks_logo_cloud1" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_logo_cloud1_locales_locale_parent_id_uniq" ON "_homepage_v_blocks_logo_cloud1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_carousel2_order_idx" ON "_homepage_v_blocks_carousel2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_carousel2_parent_id_idx" ON "_homepage_v_blocks_carousel2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_carousel2_path_idx" ON "_homepage_v_blocks_carousel2" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_carousel2_locales_locale_parent_id_unique" ON "_homepage_v_blocks_carousel2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero1_2_links_order_idx" ON "_homepage_v_blocks_hero1_2_links" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero1_2_links_parent_id_idx" ON "_homepage_v_blocks_hero1_2_links" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero1_2_links_locale_idx" ON "_homepage_v_blocks_hero1_2_links" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_hero1_2_order_idx" ON "_homepage_v_blocks_hero1_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero1_2_parent_id_idx" ON "_homepage_v_blocks_hero1_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero1_2_path_idx" ON "_homepage_v_blocks_hero1_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_hero1_2_locale_idx" ON "_homepage_v_blocks_hero1_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_hero1_2_image_image_asset_idx" ON "_homepage_v_blocks_hero1_2" USING btree ("image_asset_id");
  CREATE INDEX "_homepage_v_blocks_hero1_2_background_background_svg_pat_idx" ON "_homepage_v_blocks_hero1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_hero1_2_background_image_background_i_idx" ON "_homepage_v_blocks_hero1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_homepage_v_blocks_hero2_2_links_order_idx" ON "_homepage_v_blocks_hero2_2_links" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero2_2_links_parent_id_idx" ON "_homepage_v_blocks_hero2_2_links" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero2_2_links_locale_idx" ON "_homepage_v_blocks_hero2_2_links" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_hero2_2_order_idx" ON "_homepage_v_blocks_hero2_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero2_2_parent_id_idx" ON "_homepage_v_blocks_hero2_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero2_2_path_idx" ON "_homepage_v_blocks_hero2_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_hero2_2_locale_idx" ON "_homepage_v_blocks_hero2_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_hero2_2_background_background_svg_pat_idx" ON "_homepage_v_blocks_hero2_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_hero2_2_background_image_background_i_idx" ON "_homepage_v_blocks_hero2_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_homepage_v_blocks_section_header_2_order_idx" ON "_homepage_v_blocks_section_header_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_section_header_2_parent_id_idx" ON "_homepage_v_blocks_section_header_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_section_header_2_path_idx" ON "_homepage_v_blocks_section_header_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_section_header_2_locale_idx" ON "_homepage_v_blocks_section_header_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_split_row_2_order_idx" ON "_homepage_v_blocks_split_row_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_split_row_2_parent_id_idx" ON "_homepage_v_blocks_split_row_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_split_row_2_path_idx" ON "_homepage_v_blocks_split_row_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_split_row_2_locale_idx" ON "_homepage_v_blocks_split_row_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_images_order_idx" ON "_homepage_v_blocks_carousel1_2_images" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_images_parent_id_idx" ON "_homepage_v_blocks_carousel1_2_images" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_images_locale_idx" ON "_homepage_v_blocks_carousel1_2_images" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_images_asset_idx" ON "_homepage_v_blocks_carousel1_2_images" USING btree ("asset_id");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_order_idx" ON "_homepage_v_blocks_carousel1_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_parent_id_idx" ON "_homepage_v_blocks_carousel1_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_path_idx" ON "_homepage_v_blocks_carousel1_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_locale_idx" ON "_homepage_v_blocks_carousel1_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_background_background_svg_idx" ON "_homepage_v_blocks_carousel1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_carousel1_2_background_image_backgrou_idx" ON "_homepage_v_blocks_carousel1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_homepage_v_blocks_timeline_row_2_timelines_order_idx" ON "_homepage_v_blocks_timeline_row_2_timelines" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_timeline_row_2_timelines_parent_id_idx" ON "_homepage_v_blocks_timeline_row_2_timelines" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_timeline_row_2_timelines_locale_idx" ON "_homepage_v_blocks_timeline_row_2_timelines" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_timeline_row_2_order_idx" ON "_homepage_v_blocks_timeline_row_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_timeline_row_2_parent_id_idx" ON "_homepage_v_blocks_timeline_row_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_timeline_row_2_path_idx" ON "_homepage_v_blocks_timeline_row_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_timeline_row_2_locale_idx" ON "_homepage_v_blocks_timeline_row_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_faqs_2_faqs_order_idx" ON "_homepage_v_blocks_faqs_2_faqs" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_faqs_2_faqs_parent_id_idx" ON "_homepage_v_blocks_faqs_2_faqs" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_faqs_2_faqs_locale_idx" ON "_homepage_v_blocks_faqs_2_faqs" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_faqs_2_order_idx" ON "_homepage_v_blocks_faqs_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_faqs_2_parent_id_idx" ON "_homepage_v_blocks_faqs_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_faqs_2_path_idx" ON "_homepage_v_blocks_faqs_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_faqs_2_locale_idx" ON "_homepage_v_blocks_faqs_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_kinds_order_idx" ON "_homepage_v_blocks_content_feed_2_kinds" USING btree ("order");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_kinds_parent_idx" ON "_homepage_v_blocks_content_feed_2_kinds" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_kinds_locale_idx" ON "_homepage_v_blocks_content_feed_2_kinds" USING btree ("locale");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_filters_regions_order_idx" ON "_homepage_v_blocks_content_feed_2_filters_regions" USING btree ("order");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_filters_regions_parent_idx" ON "_homepage_v_blocks_content_feed_2_filters_regions" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_filters_regions_locale_idx" ON "_homepage_v_blocks_content_feed_2_filters_regions" USING btree ("locale");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_order_idx" ON "_homepage_v_blocks_content_feed_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_parent_id_idx" ON "_homepage_v_blocks_content_feed_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_path_idx" ON "_homepage_v_blocks_content_feed_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_content_feed_2_locale_idx" ON "_homepage_v_blocks_content_feed_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_events_calendar_2_order_idx" ON "_homepage_v_blocks_events_calendar_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_events_calendar_2_parent_id_idx" ON "_homepage_v_blocks_events_calendar_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_events_calendar_2_path_idx" ON "_homepage_v_blocks_events_calendar_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_events_calendar_2_locale_idx" ON "_homepage_v_blocks_events_calendar_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_people_widget_2_order_idx" ON "_homepage_v_blocks_people_widget_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_people_widget_2_parent_id_idx" ON "_homepage_v_blocks_people_widget_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_people_widget_2_path_idx" ON "_homepage_v_blocks_people_widget_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_people_widget_2_locale_idx" ON "_homepage_v_blocks_people_widget_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_grid_row_2_order_idx" ON "_homepage_v_blocks_grid_row_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_grid_row_2_parent_id_idx" ON "_homepage_v_blocks_grid_row_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_grid_row_2_path_idx" ON "_homepage_v_blocks_grid_row_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_grid_row_2_locale_idx" ON "_homepage_v_blocks_grid_row_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_grid_row_2_header_image_header_image__idx" ON "_homepage_v_blocks_grid_row_2" USING btree ("header_image_asset_id");
  CREATE INDEX "_homepage_v_blocks_grid_row_2_background_background_svg__idx" ON "_homepage_v_blocks_grid_row_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_grid_row_2_background_image_backgroun_idx" ON "_homepage_v_blocks_grid_row_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_homepage_v_blocks_region_map_2_order_idx" ON "_homepage_v_blocks_region_map_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_region_map_2_parent_id_idx" ON "_homepage_v_blocks_region_map_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_region_map_2_path_idx" ON "_homepage_v_blocks_region_map_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_region_map_2_locale_idx" ON "_homepage_v_blocks_region_map_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_atlas_embed_2_order_idx" ON "_homepage_v_blocks_atlas_embed_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_atlas_embed_2_parent_id_idx" ON "_homepage_v_blocks_atlas_embed_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_atlas_embed_2_path_idx" ON "_homepage_v_blocks_atlas_embed_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_atlas_embed_2_locale_idx" ON "_homepage_v_blocks_atlas_embed_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_cta1_2_links_order_idx" ON "_homepage_v_blocks_cta1_2_links" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_cta1_2_links_parent_id_idx" ON "_homepage_v_blocks_cta1_2_links" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_cta1_2_links_locale_idx" ON "_homepage_v_blocks_cta1_2_links" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_cta1_2_order_idx" ON "_homepage_v_blocks_cta1_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_cta1_2_parent_id_idx" ON "_homepage_v_blocks_cta1_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_cta1_2_path_idx" ON "_homepage_v_blocks_cta1_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_cta1_2_locale_idx" ON "_homepage_v_blocks_cta1_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_cta1_2_background_background_svg_patt_idx" ON "_homepage_v_blocks_cta1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_homepage_v_blocks_cta1_2_background_image_background_im_idx" ON "_homepage_v_blocks_cta1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_2_order_idx" ON "_homepage_v_blocks_submit_story_banner_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_2_parent_id_idx" ON "_homepage_v_blocks_submit_story_banner_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_2_path_idx" ON "_homepage_v_blocks_submit_story_banner_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_2_locale_idx" ON "_homepage_v_blocks_submit_story_banner_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_submit_story_banner_2_illustration_il_idx" ON "_homepage_v_blocks_submit_story_banner_2" USING btree ("illustration_asset_id");
  CREATE INDEX "_homepage_v_blocks_form_newsletter_2_order_idx" ON "_homepage_v_blocks_form_newsletter_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_form_newsletter_2_parent_id_idx" ON "_homepage_v_blocks_form_newsletter_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_form_newsletter_2_path_idx" ON "_homepage_v_blocks_form_newsletter_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_form_newsletter_2_locale_idx" ON "_homepage_v_blocks_form_newsletter_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_2_images_order_idx" ON "_homepage_v_blocks_logo_cloud1_2_images" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_2_images_parent_id_idx" ON "_homepage_v_blocks_logo_cloud1_2_images" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_2_images_locale_idx" ON "_homepage_v_blocks_logo_cloud1_2_images" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_2_images_asset_idx" ON "_homepage_v_blocks_logo_cloud1_2_images" USING btree ("asset_id");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_2_order_idx" ON "_homepage_v_blocks_logo_cloud1_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_2_parent_id_idx" ON "_homepage_v_blocks_logo_cloud1_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_2_path_idx" ON "_homepage_v_blocks_logo_cloud1_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_logo_cloud1_2_locale_idx" ON "_homepage_v_blocks_logo_cloud1_2" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_carousel2_2_order_idx" ON "_homepage_v_blocks_carousel2_2" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_carousel2_2_parent_id_idx" ON "_homepage_v_blocks_carousel2_2" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_carousel2_2_path_idx" ON "_homepage_v_blocks_carousel2_2" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_carousel2_2_locale_idx" ON "_homepage_v_blocks_carousel2_2" USING btree ("_locale");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_rels" ADD CONSTRAINT "regional_pages_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_rels" ADD CONSTRAINT "_regional_pages_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_organizations_id_idx" ON "pages_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "_pages_v_rels_organizations_id_idx" ON "_pages_v_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "regional_pages_rels_organizations_id_idx" ON "regional_pages_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "_regional_pages_v_rels_organizations_id_idx" ON "_regional_pages_v_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "homepage_rels_organizations_id_idx" ON "homepage_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "homepage_rels_case_studies_id_idx" ON "homepage_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "homepage_rels_news_posts_id_idx" ON "homepage_rels" USING btree ("news_posts_id","locale");
  CREATE INDEX "homepage_rels_events_id_idx" ON "homepage_rels" USING btree ("events_id","locale");
  CREATE INDEX "homepage_rels_lived_experiences_id_idx" ON "homepage_rels" USING btree ("lived_experiences_id","locale");
  CREATE INDEX "homepage_rels_research_outputs_id_idx" ON "homepage_rels" USING btree ("research_outputs_id","locale");
  CREATE INDEX "homepage_rels_agendas_id_idx" ON "homepage_rels" USING btree ("agendas_id","locale");
  CREATE INDEX "homepage_rels_regional_communities_id_idx" ON "homepage_rels" USING btree ("regional_communities_id","locale");
  CREATE INDEX "homepage_rels_tags_id_idx" ON "homepage_rels" USING btree ("tags_id","locale");
  CREATE INDEX "_homepage_v_rels_organizations_id_idx" ON "_homepage_v_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "_homepage_v_rels_case_studies_id_idx" ON "_homepage_v_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "_homepage_v_rels_news_posts_id_idx" ON "_homepage_v_rels" USING btree ("news_posts_id","locale");
  CREATE INDEX "_homepage_v_rels_events_id_idx" ON "_homepage_v_rels" USING btree ("events_id","locale");
  CREATE INDEX "_homepage_v_rels_lived_experiences_id_idx" ON "_homepage_v_rels" USING btree ("lived_experiences_id","locale");
  CREATE INDEX "_homepage_v_rels_research_outputs_id_idx" ON "_homepage_v_rels" USING btree ("research_outputs_id","locale");
  CREATE INDEX "_homepage_v_rels_agendas_id_idx" ON "_homepage_v_rels" USING btree ("agendas_id","locale");
  CREATE INDEX "_homepage_v_rels_regional_communities_id_idx" ON "_homepage_v_rels" USING btree ("regional_communities_id","locale");
  CREATE INDEX "_homepage_v_rels_tags_id_idx" ON "_homepage_v_rels" USING btree ("tags_id","locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage_blocks_hero1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero2_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_section_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_section_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_split_content_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_split_content_2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_split_image_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_split_image_2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_split_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_timeline_row_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_timeline_row_timelines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_timeline_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_faqs_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_faqs_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_content_feed_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_content_feed_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_content_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_content_feed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_events_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_events_calendar_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_people_widget" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_people_widget_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_card_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_card_2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_agenda_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_news_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_news_2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_row_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_region_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_region_map_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_atlas_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_cta1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_cta1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_cta1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_cta1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_submit_story_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_submit_story_banner_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_form_newsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_form_newsletter_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_logo_cloud1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_logo_cloud1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_logo_cloud1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_logo_cloud1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero1_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero2_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero2_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_section_header_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_split_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel1_2_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_timeline_row_2_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_timeline_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_faqs_2_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_faqs_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_content_feed_2_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_content_feed_2_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_content_feed_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_events_calendar_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_people_widget_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_region_map_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_atlas_embed_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_cta1_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_cta1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_submit_story_banner_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_form_newsletter_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_logo_cloud1_2_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_logo_cloud1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_carousel2_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero2_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_section_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_section_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_split_content_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_split_content_2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_split_image_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_split_image_2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_split_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_timeline_row_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_timeline_row_timelines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_timeline_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_faqs_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_faqs_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_content_feed_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_content_feed_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_content_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_content_feed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_events_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_events_calendar_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_people_widget" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_people_widget_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_card_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_card_2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_agenda_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_news_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_news_2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_row_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_region_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_region_map_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_atlas_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_cta1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_cta1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_cta1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_cta1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_submit_story_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_submit_story_banner_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_form_newsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_form_newsletter_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero1_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero2_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero2_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_section_header_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_split_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel1_2_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_timeline_row_2_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_timeline_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_faqs_2_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_faqs_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_content_feed_2_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_content_feed_2_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_content_feed_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_events_calendar_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_people_widget_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_grid_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_region_map_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_atlas_embed_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_cta1_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_cta1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_submit_story_banner_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_form_newsletter_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_2_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_logo_cloud1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_carousel2_2" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "homepage_blocks_hero1_links" CASCADE;
  DROP TABLE "homepage_blocks_hero1_links_locales" CASCADE;
  DROP TABLE "homepage_blocks_hero1" CASCADE;
  DROP TABLE "homepage_blocks_hero1_locales" CASCADE;
  DROP TABLE "homepage_blocks_hero2_links" CASCADE;
  DROP TABLE "homepage_blocks_hero2_links_locales" CASCADE;
  DROP TABLE "homepage_blocks_hero2" CASCADE;
  DROP TABLE "homepage_blocks_hero2_locales" CASCADE;
  DROP TABLE "homepage_blocks_section_header" CASCADE;
  DROP TABLE "homepage_blocks_section_header_locales" CASCADE;
  DROP TABLE "homepage_blocks_split_content_2" CASCADE;
  DROP TABLE "homepage_blocks_split_content_2_locales" CASCADE;
  DROP TABLE "homepage_blocks_split_image_2" CASCADE;
  DROP TABLE "homepage_blocks_split_image_2_locales" CASCADE;
  DROP TABLE "homepage_blocks_split_row" CASCADE;
  DROP TABLE "homepage_blocks_carousel1_images" CASCADE;
  DROP TABLE "homepage_blocks_carousel1_images_locales" CASCADE;
  DROP TABLE "homepage_blocks_carousel1" CASCADE;
  DROP TABLE "homepage_blocks_carousel1_locales" CASCADE;
  DROP TABLE "homepage_blocks_timeline_row_timelines" CASCADE;
  DROP TABLE "homepage_blocks_timeline_row_timelines_locales" CASCADE;
  DROP TABLE "homepage_blocks_timeline_row" CASCADE;
  DROP TABLE "homepage_blocks_faqs_faqs" CASCADE;
  DROP TABLE "homepage_blocks_faqs_faqs_locales" CASCADE;
  DROP TABLE "homepage_blocks_faqs" CASCADE;
  DROP TABLE "homepage_blocks_content_feed_kinds" CASCADE;
  DROP TABLE "homepage_blocks_content_feed_filters_regions" CASCADE;
  DROP TABLE "homepage_blocks_content_feed" CASCADE;
  DROP TABLE "homepage_blocks_content_feed_locales" CASCADE;
  DROP TABLE "homepage_blocks_events_calendar" CASCADE;
  DROP TABLE "homepage_blocks_events_calendar_locales" CASCADE;
  DROP TABLE "homepage_blocks_people_widget" CASCADE;
  DROP TABLE "homepage_blocks_people_widget_locales" CASCADE;
  DROP TABLE "homepage_blocks_grid_card_2" CASCADE;
  DROP TABLE "homepage_blocks_grid_card_2_locales" CASCADE;
  DROP TABLE "homepage_blocks_grid_agenda_2" CASCADE;
  DROP TABLE "homepage_blocks_grid_news_2" CASCADE;
  DROP TABLE "homepage_blocks_grid_news_2_locales" CASCADE;
  DROP TABLE "homepage_blocks_grid_row" CASCADE;
  DROP TABLE "homepage_blocks_grid_row_locales" CASCADE;
  DROP TABLE "homepage_blocks_region_map" CASCADE;
  DROP TABLE "homepage_blocks_region_map_locales" CASCADE;
  DROP TABLE "homepage_blocks_atlas_embed" CASCADE;
  DROP TABLE "homepage_blocks_cta1_links" CASCADE;
  DROP TABLE "homepage_blocks_cta1_links_locales" CASCADE;
  DROP TABLE "homepage_blocks_cta1" CASCADE;
  DROP TABLE "homepage_blocks_cta1_locales" CASCADE;
  DROP TABLE "homepage_blocks_submit_story_banner" CASCADE;
  DROP TABLE "homepage_blocks_submit_story_banner_locales" CASCADE;
  DROP TABLE "homepage_blocks_form_newsletter" CASCADE;
  DROP TABLE "homepage_blocks_form_newsletter_locales" CASCADE;
  DROP TABLE "homepage_blocks_logo_cloud1_images" CASCADE;
  DROP TABLE "homepage_blocks_logo_cloud1_images_locales" CASCADE;
  DROP TABLE "homepage_blocks_logo_cloud1" CASCADE;
  DROP TABLE "homepage_blocks_logo_cloud1_locales" CASCADE;
  DROP TABLE "homepage_blocks_carousel2" CASCADE;
  DROP TABLE "homepage_blocks_carousel2_locales" CASCADE;
  DROP TABLE "homepage_blocks_hero1_2_links" CASCADE;
  DROP TABLE "homepage_blocks_hero1_2" CASCADE;
  DROP TABLE "homepage_blocks_hero2_2_links" CASCADE;
  DROP TABLE "homepage_blocks_hero2_2" CASCADE;
  DROP TABLE "homepage_blocks_section_header_2" CASCADE;
  DROP TABLE "homepage_blocks_split_row_2" CASCADE;
  DROP TABLE "homepage_blocks_carousel1_2_images" CASCADE;
  DROP TABLE "homepage_blocks_carousel1_2" CASCADE;
  DROP TABLE "homepage_blocks_timeline_row_2_timelines" CASCADE;
  DROP TABLE "homepage_blocks_timeline_row_2" CASCADE;
  DROP TABLE "homepage_blocks_faqs_2_faqs" CASCADE;
  DROP TABLE "homepage_blocks_faqs_2" CASCADE;
  DROP TABLE "homepage_blocks_content_feed_2_kinds" CASCADE;
  DROP TABLE "homepage_blocks_content_feed_2_filters_regions" CASCADE;
  DROP TABLE "homepage_blocks_content_feed_2" CASCADE;
  DROP TABLE "homepage_blocks_events_calendar_2" CASCADE;
  DROP TABLE "homepage_blocks_people_widget_2" CASCADE;
  DROP TABLE "homepage_blocks_grid_row_2" CASCADE;
  DROP TABLE "homepage_blocks_region_map_2" CASCADE;
  DROP TABLE "homepage_blocks_atlas_embed_2" CASCADE;
  DROP TABLE "homepage_blocks_cta1_2_links" CASCADE;
  DROP TABLE "homepage_blocks_cta1_2" CASCADE;
  DROP TABLE "homepage_blocks_submit_story_banner_2" CASCADE;
  DROP TABLE "homepage_blocks_form_newsletter_2" CASCADE;
  DROP TABLE "homepage_blocks_logo_cloud1_2_images" CASCADE;
  DROP TABLE "homepage_blocks_logo_cloud1_2" CASCADE;
  DROP TABLE "homepage_blocks_carousel2_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero1_links" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero1_links_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero1" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero1_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero2_links" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero2_links_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero2" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero2_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_section_header" CASCADE;
  DROP TABLE "_homepage_v_blocks_section_header_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_split_content_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_split_content_2_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_split_image_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_split_image_2_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_split_row" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel1_images" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel1_images_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel1" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel1_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_timeline_row_timelines" CASCADE;
  DROP TABLE "_homepage_v_blocks_timeline_row_timelines_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_timeline_row" CASCADE;
  DROP TABLE "_homepage_v_blocks_faqs_faqs" CASCADE;
  DROP TABLE "_homepage_v_blocks_faqs_faqs_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_faqs" CASCADE;
  DROP TABLE "_homepage_v_blocks_content_feed_kinds" CASCADE;
  DROP TABLE "_homepage_v_blocks_content_feed_filters_regions" CASCADE;
  DROP TABLE "_homepage_v_blocks_content_feed" CASCADE;
  DROP TABLE "_homepage_v_blocks_content_feed_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_events_calendar" CASCADE;
  DROP TABLE "_homepage_v_blocks_events_calendar_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_people_widget" CASCADE;
  DROP TABLE "_homepage_v_blocks_people_widget_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_card_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_card_2_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_agenda_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_news_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_news_2_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_row" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_row_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_region_map" CASCADE;
  DROP TABLE "_homepage_v_blocks_region_map_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_atlas_embed" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta1_links" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta1_links_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta1" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta1_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_submit_story_banner" CASCADE;
  DROP TABLE "_homepage_v_blocks_submit_story_banner_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_form_newsletter" CASCADE;
  DROP TABLE "_homepage_v_blocks_form_newsletter_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_logo_cloud1_images" CASCADE;
  DROP TABLE "_homepage_v_blocks_logo_cloud1_images_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_logo_cloud1" CASCADE;
  DROP TABLE "_homepage_v_blocks_logo_cloud1_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel2" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel2_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero1_2_links" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero1_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero2_2_links" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero2_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_section_header_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_split_row_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel1_2_images" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel1_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_timeline_row_2_timelines" CASCADE;
  DROP TABLE "_homepage_v_blocks_timeline_row_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_faqs_2_faqs" CASCADE;
  DROP TABLE "_homepage_v_blocks_faqs_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_content_feed_2_kinds" CASCADE;
  DROP TABLE "_homepage_v_blocks_content_feed_2_filters_regions" CASCADE;
  DROP TABLE "_homepage_v_blocks_content_feed_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_events_calendar_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_people_widget_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_grid_row_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_region_map_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_atlas_embed_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta1_2_links" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta1_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_submit_story_banner_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_form_newsletter_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_logo_cloud1_2_images" CASCADE;
  DROP TABLE "_homepage_v_blocks_logo_cloud1_2" CASCADE;
  DROP TABLE "_homepage_v_blocks_carousel2_2" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_organizations_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_organizations_fk";
  
  ALTER TABLE "regional_pages_rels" DROP CONSTRAINT "regional_pages_rels_organizations_fk";
  
  ALTER TABLE "_regional_pages_v_rels" DROP CONSTRAINT "_regional_pages_v_rels_organizations_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_organizations_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_case_studies_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_news_posts_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_events_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_lived_experiences_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_research_outputs_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_agendas_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_regional_communities_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_tags_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_organizations_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_case_studies_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_news_posts_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_events_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_lived_experiences_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_research_outputs_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_agendas_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_regional_communities_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_tags_fk";
  
  DROP INDEX "pages_rels_organizations_id_idx";
  DROP INDEX "_pages_v_rels_organizations_id_idx";
  DROP INDEX "regional_pages_rels_organizations_id_idx";
  DROP INDEX "_regional_pages_v_rels_organizations_id_idx";
  DROP INDEX "homepage_rels_organizations_id_idx";
  DROP INDEX "homepage_rels_case_studies_id_idx";
  DROP INDEX "homepage_rels_news_posts_id_idx";
  DROP INDEX "homepage_rels_events_id_idx";
  DROP INDEX "homepage_rels_lived_experiences_id_idx";
  DROP INDEX "homepage_rels_research_outputs_id_idx";
  DROP INDEX "homepage_rels_agendas_id_idx";
  DROP INDEX "homepage_rels_regional_communities_id_idx";
  DROP INDEX "homepage_rels_tags_id_idx";
  DROP INDEX "_homepage_v_rels_organizations_id_idx";
  DROP INDEX "_homepage_v_rels_case_studies_id_idx";
  DROP INDEX "_homepage_v_rels_news_posts_id_idx";
  DROP INDEX "_homepage_v_rels_events_id_idx";
  DROP INDEX "_homepage_v_rels_lived_experiences_id_idx";
  DROP INDEX "_homepage_v_rels_research_outputs_id_idx";
  DROP INDEX "_homepage_v_rels_agendas_id_idx";
  DROP INDEX "_homepage_v_rels_regional_communities_id_idx";
  DROP INDEX "_homepage_v_rels_tags_id_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "regional_pages_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "_regional_pages_v_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "organizations" DROP COLUMN "show_on_site";
  ALTER TABLE "homepage" DROP COLUMN "layout_per_language";
  ALTER TABLE "homepage_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "case_studies_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "news_posts_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "events_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "lived_experiences_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "research_outputs_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "agendas_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "regional_communities_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "tags_id";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_layout_per_language";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "case_studies_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "news_posts_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "events_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "lived_experiences_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "research_outputs_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "agendas_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "regional_communities_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "tags_id";
  DROP TYPE "public"."enum_homepage_blocks_hero1_image_position";
  DROP TYPE "public"."enum_homepage_blocks_section_header_section_width";
  DROP TYPE "public"."enum_homepage_blocks_section_header_stack_align";
  DROP TYPE "public"."enum_homepage_blocks_carousel1_size";
  DROP TYPE "public"."enum_homepage_blocks_carousel1_indicators";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_kinds";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_filters_regions";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_fill";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_sort";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_layout";
  DROP TYPE "public"."enum_homepage_blocks_people_widget_region";
  DROP TYPE "public"."enum_homepage_blocks_grid_row_mode";
  DROP TYPE "public"."enum_homepage_blocks_grid_row_grid_columns";
  DROP TYPE "public"."enum_homepage_blocks_grid_row_card_variant";
  DROP TYPE "public"."enum_homepage_blocks_atlas_embed_region";
  DROP TYPE "public"."enum_homepage_blocks_cta1_section_width";
  DROP TYPE "public"."enum_homepage_blocks_cta1_stack_align";
  DROP TYPE "public"."enum_homepage_blocks_logo_cloud1_images_org_type";
  DROP TYPE "public"."enum_homepage_blocks_logo_cloud1_layout";
  DROP TYPE "public"."enum_homepage_blocks_logo_cloud1_motion_speed";
  DROP TYPE "public"."enum_homepage_blocks_hero1_2_image_position";
  DROP TYPE "public"."enum_homepage_blocks_section_header_2_section_width";
  DROP TYPE "public"."enum_homepage_blocks_section_header_2_stack_align";
  DROP TYPE "public"."enum_homepage_blocks_carousel1_2_size";
  DROP TYPE "public"."enum_homepage_blocks_carousel1_2_indicators";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_2_kinds";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_2_filters_regions";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_2_fill";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_2_sort";
  DROP TYPE "public"."enum_homepage_blocks_content_feed_2_layout";
  DROP TYPE "public"."enum_homepage_blocks_people_widget_2_region";
  DROP TYPE "public"."enum_homepage_blocks_grid_row_2_mode";
  DROP TYPE "public"."enum_homepage_blocks_grid_row_2_grid_columns";
  DROP TYPE "public"."enum_homepage_blocks_grid_row_2_card_variant";
  DROP TYPE "public"."enum_homepage_blocks_atlas_embed_2_region";
  DROP TYPE "public"."enum_homepage_blocks_cta1_2_section_width";
  DROP TYPE "public"."enum_homepage_blocks_cta1_2_stack_align";
  DROP TYPE "public"."enum_homepage_blocks_logo_cloud1_2_images_org_type";
  DROP TYPE "public"."enum_homepage_blocks_logo_cloud1_2_layout";
  DROP TYPE "public"."enum_homepage_blocks_logo_cloud1_2_motion_speed";
  DROP TYPE "public"."enum__homepage_v_blocks_hero1_image_position";
  DROP TYPE "public"."enum__homepage_v_blocks_section_header_section_width";
  DROP TYPE "public"."enum__homepage_v_blocks_section_header_stack_align";
  DROP TYPE "public"."enum__homepage_v_blocks_carousel1_size";
  DROP TYPE "public"."enum__homepage_v_blocks_carousel1_indicators";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_kinds";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_filters_regions";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_fill";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_sort";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_layout";
  DROP TYPE "public"."enum__homepage_v_blocks_people_widget_region";
  DROP TYPE "public"."enum__homepage_v_blocks_grid_row_mode";
  DROP TYPE "public"."enum__homepage_v_blocks_grid_row_grid_columns";
  DROP TYPE "public"."enum__homepage_v_blocks_grid_row_card_variant";
  DROP TYPE "public"."enum__homepage_v_blocks_atlas_embed_region";
  DROP TYPE "public"."enum__homepage_v_blocks_cta1_section_width";
  DROP TYPE "public"."enum__homepage_v_blocks_cta1_stack_align";
  DROP TYPE "public"."enum__homepage_v_blocks_logo_cloud1_images_org_type";
  DROP TYPE "public"."enum__homepage_v_blocks_logo_cloud1_layout";
  DROP TYPE "public"."enum__homepage_v_blocks_logo_cloud1_motion_speed";
  DROP TYPE "public"."enum__homepage_v_blocks_hero1_2_image_position";
  DROP TYPE "public"."enum__homepage_v_blocks_section_header_2_section_width";
  DROP TYPE "public"."enum__homepage_v_blocks_section_header_2_stack_align";
  DROP TYPE "public"."enum__homepage_v_blocks_carousel1_2_size";
  DROP TYPE "public"."enum__homepage_v_blocks_carousel1_2_indicators";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_2_kinds";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_2_filters_regions";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_2_fill";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_2_sort";
  DROP TYPE "public"."enum__homepage_v_blocks_content_feed_2_layout";
  DROP TYPE "public"."enum__homepage_v_blocks_people_widget_2_region";
  DROP TYPE "public"."enum__homepage_v_blocks_grid_row_2_mode";
  DROP TYPE "public"."enum__homepage_v_blocks_grid_row_2_grid_columns";
  DROP TYPE "public"."enum__homepage_v_blocks_grid_row_2_card_variant";
  DROP TYPE "public"."enum__homepage_v_blocks_atlas_embed_2_region";
  DROP TYPE "public"."enum__homepage_v_blocks_cta1_2_section_width";
  DROP TYPE "public"."enum__homepage_v_blocks_cta1_2_stack_align";
  DROP TYPE "public"."enum__homepage_v_blocks_logo_cloud1_2_images_org_type";
  DROP TYPE "public"."enum__homepage_v_blocks_logo_cloud1_2_layout";
  DROP TYPE "public"."enum__homepage_v_blocks_logo_cloud1_2_motion_speed";`)
}
