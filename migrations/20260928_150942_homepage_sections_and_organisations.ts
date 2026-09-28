import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_hp_s_hero1_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_hp_s_sectionHeader_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_hp_s_sectionHeader_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_hp_s_carousel1_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum_hp_s_carousel1_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum_hp_s_contentFeed_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum_hp_s_contentFeed_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_hp_s_contentFeed_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum_hp_s_contentFeed_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum_hp_s_contentFeed_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum_hp_s_peopleWidget_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_hp_s_gridRow_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_hp_s_gridRow_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_hp_s_gridRow_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_hp_s_atlasEmbed_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_hp_s_cta1_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_hp_s_cta1_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_hp_s_logoCloud1_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_hp_s_logoCloud1_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_hp_s_logoCloud1_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum_hp_l_hero1_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_hp_l_sectionHeader_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_hp_l_sectionHeader_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_hp_l_carousel1_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum_hp_l_carousel1_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum_hp_l_contentFeed_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum_hp_l_contentFeed_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_hp_l_contentFeed_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum_hp_l_contentFeed_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum_hp_l_contentFeed_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum_hp_l_peopleWidget_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_hp_l_gridRow_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_hp_l_gridRow_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_hp_l_gridRow_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_hp_l_atlasEmbed_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_hp_l_cta1_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_hp_l_cta1_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_hp_l_logoCloud1_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_hp_l_logoCloud1_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_hp_l_logoCloud1_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__hp_s_hero1_v_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__hp_s_sectionHeader_v_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__hp_s_sectionHeader_v_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__hp_s_carousel1_v_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum__hp_s_carousel1_v_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum__hp_s_contentFeed_v_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum__hp_s_contentFeed_v_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__hp_s_contentFeed_v_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum__hp_s_contentFeed_v_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum__hp_s_contentFeed_v_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum__hp_s_peopleWidget_v_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__hp_s_gridRow_v_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__hp_s_gridRow_v_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__hp_s_gridRow_v_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__hp_s_atlasEmbed_v_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__hp_s_cta1_v_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__hp_s_cta1_v_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__hp_s_logoCloud1_v_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__hp_s_logoCloud1_v_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__hp_s_logoCloud1_v_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__hp_l_hero1_v_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__hp_l_sectionHeader_v_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__hp_l_sectionHeader_v_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__hp_l_carousel1_v_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum__hp_l_carousel1_v_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum__hp_l_contentFeed_v_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum__hp_l_contentFeed_v_filters_regions" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__hp_l_contentFeed_v_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum__hp_l_contentFeed_v_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum__hp_l_contentFeed_v_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum__hp_l_peopleWidget_v_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__hp_l_gridRow_v_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__hp_l_gridRow_v_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__hp_l_gridRow_v_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__hp_l_atlasEmbed_v_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__hp_l_cta1_v_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__hp_l_cta1_v_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__hp_l_logoCloud1_v_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__hp_l_logoCloud1_v_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__hp_l_logoCloud1_v_motion_speed" AS ENUM('default', 'slow');
  CREATE TABLE "hp_s_hero1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "hp_s_hero1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_hero1" (
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
  	"image_asset_id" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"image_position" "enum_hp_s_hero1_image_position" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_hero1_locales" (
  	"background_image_alt" varchar,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_hero2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "hp_s_hero2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_hero2" (
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
  
  CREATE TABLE "hp_s_hero2_locales" (
  	"background_image_alt" varchar,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_sectionHeader" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum_hp_s_sectionHeader_section_width" DEFAULT 'default',
  	"stack_align" "enum_hp_s_sectionHeader_stack_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_sectionHeader_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_splitContent" (
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
  
  CREATE TABLE "hp_s_splitContent_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_splitImage" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_splitImage_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_splitRow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_carousel1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar
  );
  
  CREATE TABLE "hp_s_carousel1_images_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_carousel1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_hp_s_carousel1_size" DEFAULT 'one',
  	"indicators" "enum_hp_s_carousel1_indicators" DEFAULT 'dots',
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
  
  CREATE TABLE "hp_s_carousel1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_timelineRow_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "hp_s_timelineRow_timelines_locales" (
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_timelineRow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_faqs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "hp_s_faqs_faqs_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_contentFeed_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_hp_s_contentFeed_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "hp_s_contentFeed_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_hp_s_contentFeed_filters_regions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "hp_s_contentFeed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"fill" "enum_hp_s_contentFeed_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum_hp_s_contentFeed_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum_hp_s_contentFeed_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_contentFeed_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_eventsCalendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"upcoming_limit" numeric DEFAULT 6,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_eventsCalendar_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_peopleWidget" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 12,
  	"region" "enum_hp_s_peopleWidget_region",
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_peopleWidget_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_gridCard" (
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
  
  CREATE TABLE "hp_s_gridCard_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_gridAgenda" (
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
  
  CREATE TABLE "hp_s_gridNews" (
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
  
  CREATE TABLE "hp_s_gridNews_locales" (
  	"custom_excerpt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_gridRow" (
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
  	"header_image_asset_id" varchar,
  	"grid_columns" "enum_hp_s_gridRow_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum_hp_s_gridRow_card_variant" DEFAULT 'classic',
  	"mode" "enum_hp_s_gridRow_mode" DEFAULT 'manual',
  	"max_items" numeric DEFAULT 3,
  	"initial_display_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_gridRow_locales" (
  	"background_image_alt" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_regionMap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_regionMap_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_atlasEmbed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" "enum_hp_s_atlasEmbed_region",
  	"show_breakdown" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_cta1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "hp_s_cta1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_cta1" (
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
  	"section_width" "enum_hp_s_cta1_section_width" DEFAULT 'default',
  	"stack_align" "enum_hp_s_cta1_stack_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_cta1_locales" (
  	"background_image_alt" varchar,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_submitStoryBanner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"illustration_asset_id" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_submitStoryBanner_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_formNewsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_formNewsletter_locales" (
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_logoCloud1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"org_type" "enum_hp_s_logoCloud1_images_org_type"
  );
  
  CREATE TABLE "hp_s_logoCloud1_images_locales" (
  	"alt" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_logoCloud1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"layout" "enum_hp_s_logoCloud1_layout" DEFAULT 'marquee',
  	"motion_speed" "enum_hp_s_logoCloud1_motion_speed" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_logoCloud1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_s_carousel2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_s_carousel2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hp_l_hero1_links" (
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
  
  CREATE TABLE "hp_l_hero1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  	"image_asset_id" varchar,
  	"image_alt" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"image_position" "enum_hp_l_hero1_image_position" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_hero2_links" (
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
  
  CREATE TABLE "hp_l_hero2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
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
  
  CREATE TABLE "hp_l_sectionHeader" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum_hp_l_sectionHeader_section_width" DEFAULT 'default',
  	"stack_align" "enum_hp_l_sectionHeader_stack_align" DEFAULT 'left',
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_splitContent" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
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
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_splitImage" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_splitRow" (
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
  
  CREATE TABLE "hp_l_carousel1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar
  );
  
  CREATE TABLE "hp_l_carousel1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"size" "enum_hp_l_carousel1_size" DEFAULT 'one',
  	"indicators" "enum_hp_l_carousel1_indicators" DEFAULT 'dots',
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
  
  CREATE TABLE "hp_l_timelineRow_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "hp_l_timelineRow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_faqs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "hp_l_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_contentFeed_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_hp_l_contentFeed_kinds",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "hp_l_contentFeed_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_hp_l_contentFeed_filters_regions",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "hp_l_contentFeed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"fill" "enum_hp_l_contentFeed_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum_hp_l_contentFeed_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum_hp_l_contentFeed_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"view_all_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_eventsCalendar" (
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
  
  CREATE TABLE "hp_l_peopleWidget" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 12,
  	"region" "enum_hp_l_peopleWidget_region",
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_gridCard" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
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
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_gridAgenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"agenda_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_gridNews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"news_post_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_author" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_location" boolean DEFAULT false,
  	"custom_excerpt" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_gridRow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
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
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_asset_id" varchar,
  	"header_image_alt" varchar,
  	"grid_columns" "enum_hp_l_gridRow_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum_hp_l_gridRow_card_variant" DEFAULT 'classic',
  	"mode" "enum_hp_l_gridRow_mode" DEFAULT 'manual',
  	"max_items" numeric DEFAULT 3,
  	"initial_display_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_regionMap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_atlasEmbed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" "enum_hp_l_atlasEmbed_region",
  	"show_breakdown" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_cta1_links" (
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
  
  CREATE TABLE "hp_l_cta1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
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
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"section_width" "enum_hp_l_cta1_section_width" DEFAULT 'default',
  	"stack_align" "enum_hp_l_cta1_stack_align" DEFAULT 'left',
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_submitStoryBanner" (
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
  
  CREATE TABLE "hp_l_formNewsletter" (
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
  
  CREATE TABLE "hp_l_logoCloud1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum_hp_l_logoCloud1_images_org_type"
  );
  
  CREATE TABLE "hp_l_logoCloud1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum_hp_l_logoCloud1_layout" DEFAULT 'marquee',
  	"motion_speed" "enum_hp_l_logoCloud1_motion_speed" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "hp_l_carousel2" (
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
  
  CREATE TABLE "_hp_s_hero1_v_links" (
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
  
  CREATE TABLE "_hp_s_hero1_v_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_hero1_v" (
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
  	"image_asset_id" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"image_position" "enum__hp_s_hero1_v_image_position" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_hero1_v_locales" (
  	"background_image_alt" varchar,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_hero2_v_links" (
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
  
  CREATE TABLE "_hp_s_hero2_v_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_hero2_v" (
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
  
  CREATE TABLE "_hp_s_hero2_v_locales" (
  	"background_image_alt" varchar,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_sectionHeader_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum__hp_s_sectionHeader_v_section_width" DEFAULT 'default',
  	"stack_align" "enum__hp_s_sectionHeader_v_stack_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_sectionHeader_v_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_splitContent_v" (
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
  
  CREATE TABLE "_hp_s_splitContent_v_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_splitImage_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_splitImage_v_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_splitRow_v" (
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
  
  CREATE TABLE "_hp_s_carousel1_v_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_s_carousel1_v_images_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_carousel1_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "enum__hp_s_carousel1_v_size" DEFAULT 'one',
  	"indicators" "enum__hp_s_carousel1_v_indicators" DEFAULT 'dots',
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
  
  CREATE TABLE "_hp_s_carousel1_v_locales" (
  	"title" varchar,
  	"description" varchar,
  	"background_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_timelineRow_v_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_s_timelineRow_v_timelines_locales" (
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_timelineRow_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_faqs_v_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_s_faqs_v_faqs_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_faqs_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_contentFeed_v_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__hp_s_contentFeed_v_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_hp_s_contentFeed_v_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__hp_s_contentFeed_v_filters_regions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_hp_s_contentFeed_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"fill" "enum__hp_s_contentFeed_v_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum__hp_s_contentFeed_v_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum__hp_s_contentFeed_v_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_contentFeed_v_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_eventsCalendar_v" (
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
  
  CREATE TABLE "_hp_s_eventsCalendar_v_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_peopleWidget_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 12,
  	"region" "enum__hp_s_peopleWidget_v_region",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_peopleWidget_v_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_gridCard_v" (
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
  
  CREATE TABLE "_hp_s_gridCard_v_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_gridAgenda_v" (
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
  
  CREATE TABLE "_hp_s_gridNews_v" (
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
  
  CREATE TABLE "_hp_s_gridNews_v_locales" (
  	"custom_excerpt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_gridRow_v" (
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
  	"header_image_asset_id" varchar,
  	"grid_columns" "enum__hp_s_gridRow_v_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum__hp_s_gridRow_v_card_variant" DEFAULT 'classic',
  	"mode" "enum__hp_s_gridRow_v_mode" DEFAULT 'manual',
  	"max_items" numeric DEFAULT 3,
  	"initial_display_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_gridRow_v_locales" (
  	"background_image_alt" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_regionMap_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_regionMap_v_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_atlasEmbed_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum__hp_s_atlasEmbed_v_region",
  	"show_breakdown" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_cta1_v_links" (
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
  
  CREATE TABLE "_hp_s_cta1_v_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_cta1_v" (
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
  	"section_width" "enum__hp_s_cta1_v_section_width" DEFAULT 'default',
  	"stack_align" "enum__hp_s_cta1_v_stack_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_cta1_v_locales" (
  	"background_image_alt" varchar,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_submitStoryBanner_v" (
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
  
  CREATE TABLE "_hp_s_submitStoryBanner_v_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_formNewsletter_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_formNewsletter_v_locales" (
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_logoCloud1_v_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"org_type" "enum__hp_s_logoCloud1_v_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_s_logoCloud1_v_images_locales" (
  	"alt" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_logoCloud1_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"layout" "enum__hp_s_logoCloud1_v_layout" DEFAULT 'marquee',
  	"motion_speed" "enum__hp_s_logoCloud1_v_motion_speed" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_logoCloud1_v_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_s_carousel2_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_s_carousel2_v_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hp_l_hero1_v_links" (
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
  
  CREATE TABLE "_hp_l_hero1_v" (
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
  	"image_position" "enum__hp_l_hero1_v_image_position" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_l_hero2_v_links" (
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
  
  CREATE TABLE "_hp_l_hero2_v" (
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
  
  CREATE TABLE "_hp_l_sectionHeader_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum__hp_l_sectionHeader_v_section_width" DEFAULT 'default',
  	"stack_align" "enum__hp_l_sectionHeader_v_stack_align" DEFAULT 'left',
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_l_splitContent_v" (
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
  
  CREATE TABLE "_hp_l_splitImage_v" (
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
  
  CREATE TABLE "_hp_l_splitRow_v" (
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
  
  CREATE TABLE "_hp_l_carousel1_v_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_l_carousel1_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"size" "enum__hp_l_carousel1_v_size" DEFAULT 'one',
  	"indicators" "enum__hp_l_carousel1_v_indicators" DEFAULT 'dots',
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
  
  CREATE TABLE "_hp_l_timelineRow_v_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_l_timelineRow_v" (
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
  
  CREATE TABLE "_hp_l_faqs_v_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_l_faqs_v" (
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
  
  CREATE TABLE "_hp_l_contentFeed_v_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__hp_l_contentFeed_v_kinds",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_hp_l_contentFeed_v_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__hp_l_contentFeed_v_filters_regions",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_hp_l_contentFeed_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"fill" "enum__hp_l_contentFeed_v_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum__hp_l_contentFeed_v_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum__hp_l_contentFeed_v_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"view_all_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_l_eventsCalendar_v" (
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
  
  CREATE TABLE "_hp_l_peopleWidget_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 12,
  	"region" "enum__hp_l_peopleWidget_v_region",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_l_gridCard_v" (
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
  
  CREATE TABLE "_hp_l_gridAgenda_v" (
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
  
  CREATE TABLE "_hp_l_gridNews_v" (
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
  
  CREATE TABLE "_hp_l_gridRow_v" (
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
  	"grid_columns" "enum__hp_l_gridRow_v_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum__hp_l_gridRow_v_card_variant" DEFAULT 'classic',
  	"mode" "enum__hp_l_gridRow_v_mode" DEFAULT 'manual',
  	"max_items" numeric DEFAULT 3,
  	"initial_display_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_l_regionMap_v" (
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
  
  CREATE TABLE "_hp_l_atlasEmbed_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum__hp_l_atlasEmbed_v_region",
  	"show_breakdown" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_l_cta1_v_links" (
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
  
  CREATE TABLE "_hp_l_cta1_v" (
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
  	"section_width" "enum__hp_l_cta1_v_section_width" DEFAULT 'default',
  	"stack_align" "enum__hp_l_cta1_v_stack_align" DEFAULT 'left',
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_l_submitStoryBanner_v" (
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
  
  CREATE TABLE "_hp_l_formNewsletter_v" (
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
  
  CREATE TABLE "_hp_l_logoCloud1_v_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum__hp_l_logoCloud1_v_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_l_logoCloud1_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum__hp_l_logoCloud1_v_layout" DEFAULT 'marquee',
  	"motion_speed" "enum__hp_l_logoCloud1_v_motion_speed" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hp_l_carousel2_v" (
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
  ALTER TABLE "homepage_rels" ADD COLUMN "case_studies_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "news_posts_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "events_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "lived_experiences_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "research_outputs_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "agendas_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "regional_communities_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "tags_id" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "organizations_id" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_layout_per_language" boolean DEFAULT false;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "case_studies_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "news_posts_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "events_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "lived_experiences_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "research_outputs_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "agendas_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "regional_communities_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "tags_id" varchar;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "organizations_id" varchar;
  ALTER TABLE "hp_s_hero1_links" ADD CONSTRAINT "hp_s_hero1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_hero1_links_locales" ADD CONSTRAINT "hp_s_hero1_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_hero1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_hero1" ADD CONSTRAINT "hp_s_hero1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_hero1" ADD CONSTRAINT "hp_s_hero1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_hero1" ADD CONSTRAINT "hp_s_hero1_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_hero1" ADD CONSTRAINT "hp_s_hero1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_hero1_locales" ADD CONSTRAINT "hp_s_hero1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_hero2_links" ADD CONSTRAINT "hp_s_hero2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_hero2_links_locales" ADD CONSTRAINT "hp_s_hero2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_hero2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_hero2" ADD CONSTRAINT "hp_s_hero2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_hero2" ADD CONSTRAINT "hp_s_hero2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_hero2" ADD CONSTRAINT "hp_s_hero2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_hero2_locales" ADD CONSTRAINT "hp_s_hero2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_sectionHeader" ADD CONSTRAINT "hp_s_sectionHeader_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_sectionHeader_locales" ADD CONSTRAINT "hp_s_sectionHeader_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_sectionHeader"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_splitContent" ADD CONSTRAINT "hp_s_splitContent_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_splitContent_locales" ADD CONSTRAINT "hp_s_splitContent_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_splitContent"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_splitImage" ADD CONSTRAINT "hp_s_splitImage_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_splitImage" ADD CONSTRAINT "hp_s_splitImage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_splitImage_locales" ADD CONSTRAINT "hp_s_splitImage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_splitImage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_splitRow" ADD CONSTRAINT "hp_s_splitRow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_carousel1_images" ADD CONSTRAINT "hp_s_carousel1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_carousel1_images" ADD CONSTRAINT "hp_s_carousel1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_carousel1_images_locales" ADD CONSTRAINT "hp_s_carousel1_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_carousel1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_carousel1" ADD CONSTRAINT "hp_s_carousel1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_carousel1" ADD CONSTRAINT "hp_s_carousel1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_carousel1" ADD CONSTRAINT "hp_s_carousel1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_carousel1_locales" ADD CONSTRAINT "hp_s_carousel1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_timelineRow_timelines" ADD CONSTRAINT "hp_s_timelineRow_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_timelineRow"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_timelineRow_timelines_locales" ADD CONSTRAINT "hp_s_timelineRow_timelines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_timelineRow_timelines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_timelineRow" ADD CONSTRAINT "hp_s_timelineRow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_faqs_faqs" ADD CONSTRAINT "hp_s_faqs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_faqs_faqs_locales" ADD CONSTRAINT "hp_s_faqs_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_faqs_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_faqs" ADD CONSTRAINT "hp_s_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_contentFeed_kinds" ADD CONSTRAINT "hp_s_contentFeed_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hp_s_contentFeed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_contentFeed_filters_regions" ADD CONSTRAINT "hp_s_contentFeed_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hp_s_contentFeed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_contentFeed" ADD CONSTRAINT "hp_s_contentFeed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_contentFeed_locales" ADD CONSTRAINT "hp_s_contentFeed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_contentFeed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_eventsCalendar" ADD CONSTRAINT "hp_s_eventsCalendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_eventsCalendar_locales" ADD CONSTRAINT "hp_s_eventsCalendar_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_eventsCalendar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_peopleWidget" ADD CONSTRAINT "hp_s_peopleWidget_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_peopleWidget_locales" ADD CONSTRAINT "hp_s_peopleWidget_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_peopleWidget"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_gridCard" ADD CONSTRAINT "hp_s_gridCard_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_gridCard" ADD CONSTRAINT "hp_s_gridCard_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_gridCard_locales" ADD CONSTRAINT "hp_s_gridCard_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_gridCard"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_gridAgenda" ADD CONSTRAINT "hp_s_gridAgenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_gridAgenda" ADD CONSTRAINT "hp_s_gridAgenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_gridNews" ADD CONSTRAINT "hp_s_gridNews_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_gridNews" ADD CONSTRAINT "hp_s_gridNews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_gridNews_locales" ADD CONSTRAINT "hp_s_gridNews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_gridNews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_gridRow" ADD CONSTRAINT "hp_s_gridRow_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_gridRow" ADD CONSTRAINT "hp_s_gridRow_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_gridRow" ADD CONSTRAINT "hp_s_gridRow_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_gridRow" ADD CONSTRAINT "hp_s_gridRow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_gridRow_locales" ADD CONSTRAINT "hp_s_gridRow_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_gridRow"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_regionMap" ADD CONSTRAINT "hp_s_regionMap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_regionMap_locales" ADD CONSTRAINT "hp_s_regionMap_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_regionMap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_atlasEmbed" ADD CONSTRAINT "hp_s_atlasEmbed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_cta1_links" ADD CONSTRAINT "hp_s_cta1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_cta1_links_locales" ADD CONSTRAINT "hp_s_cta1_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_cta1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_cta1" ADD CONSTRAINT "hp_s_cta1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_cta1" ADD CONSTRAINT "hp_s_cta1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_cta1" ADD CONSTRAINT "hp_s_cta1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_cta1_locales" ADD CONSTRAINT "hp_s_cta1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_submitStoryBanner" ADD CONSTRAINT "hp_s_submitStoryBanner_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_submitStoryBanner" ADD CONSTRAINT "hp_s_submitStoryBanner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_submitStoryBanner_locales" ADD CONSTRAINT "hp_s_submitStoryBanner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_submitStoryBanner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_formNewsletter" ADD CONSTRAINT "hp_s_formNewsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_formNewsletter_locales" ADD CONSTRAINT "hp_s_formNewsletter_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_formNewsletter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_logoCloud1_images" ADD CONSTRAINT "hp_s_logoCloud1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_s_logoCloud1_images" ADD CONSTRAINT "hp_s_logoCloud1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_logoCloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_logoCloud1_images_locales" ADD CONSTRAINT "hp_s_logoCloud1_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_logoCloud1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_logoCloud1" ADD CONSTRAINT "hp_s_logoCloud1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_logoCloud1_locales" ADD CONSTRAINT "hp_s_logoCloud1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_logoCloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_carousel2" ADD CONSTRAINT "hp_s_carousel2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_s_carousel2_locales" ADD CONSTRAINT "hp_s_carousel2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_s_carousel2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_hero1_links" ADD CONSTRAINT "hp_l_hero1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_l_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_hero1" ADD CONSTRAINT "hp_l_hero1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_hero1" ADD CONSTRAINT "hp_l_hero1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_hero1" ADD CONSTRAINT "hp_l_hero1_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_hero1" ADD CONSTRAINT "hp_l_hero1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_hero2_links" ADD CONSTRAINT "hp_l_hero2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_l_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_hero2" ADD CONSTRAINT "hp_l_hero2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_hero2" ADD CONSTRAINT "hp_l_hero2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_hero2" ADD CONSTRAINT "hp_l_hero2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_sectionHeader" ADD CONSTRAINT "hp_l_sectionHeader_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_splitContent" ADD CONSTRAINT "hp_l_splitContent_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_splitImage" ADD CONSTRAINT "hp_l_splitImage_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_splitImage" ADD CONSTRAINT "hp_l_splitImage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_splitRow" ADD CONSTRAINT "hp_l_splitRow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_carousel1_images" ADD CONSTRAINT "hp_l_carousel1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_carousel1_images" ADD CONSTRAINT "hp_l_carousel1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_l_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_carousel1" ADD CONSTRAINT "hp_l_carousel1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_carousel1" ADD CONSTRAINT "hp_l_carousel1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_carousel1" ADD CONSTRAINT "hp_l_carousel1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_timelineRow_timelines" ADD CONSTRAINT "hp_l_timelineRow_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_l_timelineRow"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_timelineRow" ADD CONSTRAINT "hp_l_timelineRow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_faqs_faqs" ADD CONSTRAINT "hp_l_faqs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_l_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_faqs" ADD CONSTRAINT "hp_l_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_contentFeed_kinds" ADD CONSTRAINT "hp_l_contentFeed_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hp_l_contentFeed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_contentFeed_filters_regions" ADD CONSTRAINT "hp_l_contentFeed_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hp_l_contentFeed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_contentFeed" ADD CONSTRAINT "hp_l_contentFeed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_eventsCalendar" ADD CONSTRAINT "hp_l_eventsCalendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_peopleWidget" ADD CONSTRAINT "hp_l_peopleWidget_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_gridCard" ADD CONSTRAINT "hp_l_gridCard_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_gridCard" ADD CONSTRAINT "hp_l_gridCard_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_gridAgenda" ADD CONSTRAINT "hp_l_gridAgenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_gridAgenda" ADD CONSTRAINT "hp_l_gridAgenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_gridNews" ADD CONSTRAINT "hp_l_gridNews_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_gridNews" ADD CONSTRAINT "hp_l_gridNews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_gridRow" ADD CONSTRAINT "hp_l_gridRow_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_gridRow" ADD CONSTRAINT "hp_l_gridRow_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_gridRow" ADD CONSTRAINT "hp_l_gridRow_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_gridRow" ADD CONSTRAINT "hp_l_gridRow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_regionMap" ADD CONSTRAINT "hp_l_regionMap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_atlasEmbed" ADD CONSTRAINT "hp_l_atlasEmbed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_cta1_links" ADD CONSTRAINT "hp_l_cta1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_l_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_cta1" ADD CONSTRAINT "hp_l_cta1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_cta1" ADD CONSTRAINT "hp_l_cta1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_cta1" ADD CONSTRAINT "hp_l_cta1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_submitStoryBanner" ADD CONSTRAINT "hp_l_submitStoryBanner_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_submitStoryBanner" ADD CONSTRAINT "hp_l_submitStoryBanner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_formNewsletter" ADD CONSTRAINT "hp_l_formNewsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_logoCloud1_images" ADD CONSTRAINT "hp_l_logoCloud1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hp_l_logoCloud1_images" ADD CONSTRAINT "hp_l_logoCloud1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_l_logoCloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_logoCloud1" ADD CONSTRAINT "hp_l_logoCloud1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_l_carousel2" ADD CONSTRAINT "hp_l_carousel2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_hero1_v_links" ADD CONSTRAINT "_hp_s_hero1_v_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_hero1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_hero1_v_links_locales" ADD CONSTRAINT "_hp_s_hero1_v_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_hero1_v_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_hero1_v" ADD CONSTRAINT "_hp_s_hero1_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_hero1_v" ADD CONSTRAINT "_hp_s_hero1_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_hero1_v" ADD CONSTRAINT "_hp_s_hero1_v_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_hero1_v" ADD CONSTRAINT "_hp_s_hero1_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_hero1_v_locales" ADD CONSTRAINT "_hp_s_hero1_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_hero1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_hero2_v_links" ADD CONSTRAINT "_hp_s_hero2_v_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_hero2_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_hero2_v_links_locales" ADD CONSTRAINT "_hp_s_hero2_v_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_hero2_v_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_hero2_v" ADD CONSTRAINT "_hp_s_hero2_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_hero2_v" ADD CONSTRAINT "_hp_s_hero2_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_hero2_v" ADD CONSTRAINT "_hp_s_hero2_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_hero2_v_locales" ADD CONSTRAINT "_hp_s_hero2_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_hero2_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_sectionHeader_v" ADD CONSTRAINT "_hp_s_sectionHeader_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_sectionHeader_v_locales" ADD CONSTRAINT "_hp_s_sectionHeader_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_sectionHeader_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_splitContent_v" ADD CONSTRAINT "_hp_s_splitContent_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_splitContent_v_locales" ADD CONSTRAINT "_hp_s_splitContent_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_splitContent_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_splitImage_v" ADD CONSTRAINT "_hp_s_splitImage_v_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_splitImage_v" ADD CONSTRAINT "_hp_s_splitImage_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_splitImage_v_locales" ADD CONSTRAINT "_hp_s_splitImage_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_splitImage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_splitRow_v" ADD CONSTRAINT "_hp_s_splitRow_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel1_v_images" ADD CONSTRAINT "_hp_s_carousel1_v_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel1_v_images" ADD CONSTRAINT "_hp_s_carousel1_v_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_carousel1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel1_v_images_locales" ADD CONSTRAINT "_hp_s_carousel1_v_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_carousel1_v_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel1_v" ADD CONSTRAINT "_hp_s_carousel1_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel1_v" ADD CONSTRAINT "_hp_s_carousel1_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel1_v" ADD CONSTRAINT "_hp_s_carousel1_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel1_v_locales" ADD CONSTRAINT "_hp_s_carousel1_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_carousel1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_timelineRow_v_timelines" ADD CONSTRAINT "_hp_s_timelineRow_v_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_timelineRow_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_timelineRow_v_timelines_locales" ADD CONSTRAINT "_hp_s_timelineRow_v_timelines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_timelineRow_v_timelines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_timelineRow_v" ADD CONSTRAINT "_hp_s_timelineRow_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_faqs_v_faqs" ADD CONSTRAINT "_hp_s_faqs_v_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_faqs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_faqs_v_faqs_locales" ADD CONSTRAINT "_hp_s_faqs_v_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_faqs_v_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_faqs_v" ADD CONSTRAINT "_hp_s_faqs_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_contentFeed_v_kinds" ADD CONSTRAINT "_hp_s_contentFeed_v_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_hp_s_contentFeed_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_contentFeed_v_filters_regions" ADD CONSTRAINT "_hp_s_contentFeed_v_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_hp_s_contentFeed_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_contentFeed_v" ADD CONSTRAINT "_hp_s_contentFeed_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_contentFeed_v_locales" ADD CONSTRAINT "_hp_s_contentFeed_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_contentFeed_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_eventsCalendar_v" ADD CONSTRAINT "_hp_s_eventsCalendar_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_eventsCalendar_v_locales" ADD CONSTRAINT "_hp_s_eventsCalendar_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_eventsCalendar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_peopleWidget_v" ADD CONSTRAINT "_hp_s_peopleWidget_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_peopleWidget_v_locales" ADD CONSTRAINT "_hp_s_peopleWidget_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_peopleWidget_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_gridCard_v" ADD CONSTRAINT "_hp_s_gridCard_v_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_gridCard_v" ADD CONSTRAINT "_hp_s_gridCard_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_gridCard_v_locales" ADD CONSTRAINT "_hp_s_gridCard_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_gridCard_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_gridAgenda_v" ADD CONSTRAINT "_hp_s_gridAgenda_v_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_gridAgenda_v" ADD CONSTRAINT "_hp_s_gridAgenda_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_gridNews_v" ADD CONSTRAINT "_hp_s_gridNews_v_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_gridNews_v" ADD CONSTRAINT "_hp_s_gridNews_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_gridNews_v_locales" ADD CONSTRAINT "_hp_s_gridNews_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_gridNews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_gridRow_v" ADD CONSTRAINT "_hp_s_gridRow_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_gridRow_v" ADD CONSTRAINT "_hp_s_gridRow_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_gridRow_v" ADD CONSTRAINT "_hp_s_gridRow_v_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_gridRow_v" ADD CONSTRAINT "_hp_s_gridRow_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_gridRow_v_locales" ADD CONSTRAINT "_hp_s_gridRow_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_gridRow_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_regionMap_v" ADD CONSTRAINT "_hp_s_regionMap_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_regionMap_v_locales" ADD CONSTRAINT "_hp_s_regionMap_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_regionMap_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_atlasEmbed_v" ADD CONSTRAINT "_hp_s_atlasEmbed_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_cta1_v_links" ADD CONSTRAINT "_hp_s_cta1_v_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_cta1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_cta1_v_links_locales" ADD CONSTRAINT "_hp_s_cta1_v_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_cta1_v_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_cta1_v" ADD CONSTRAINT "_hp_s_cta1_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_cta1_v" ADD CONSTRAINT "_hp_s_cta1_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_cta1_v" ADD CONSTRAINT "_hp_s_cta1_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_cta1_v_locales" ADD CONSTRAINT "_hp_s_cta1_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_cta1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_submitStoryBanner_v" ADD CONSTRAINT "_hp_s_submitStoryBanner_v_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_submitStoryBanner_v" ADD CONSTRAINT "_hp_s_submitStoryBanner_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_submitStoryBanner_v_locales" ADD CONSTRAINT "_hp_s_submitStoryBanner_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_submitStoryBanner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_formNewsletter_v" ADD CONSTRAINT "_hp_s_formNewsletter_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_formNewsletter_v_locales" ADD CONSTRAINT "_hp_s_formNewsletter_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_formNewsletter_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_logoCloud1_v_images" ADD CONSTRAINT "_hp_s_logoCloud1_v_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_s_logoCloud1_v_images" ADD CONSTRAINT "_hp_s_logoCloud1_v_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_logoCloud1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_logoCloud1_v_images_locales" ADD CONSTRAINT "_hp_s_logoCloud1_v_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_logoCloud1_v_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_logoCloud1_v" ADD CONSTRAINT "_hp_s_logoCloud1_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_logoCloud1_v_locales" ADD CONSTRAINT "_hp_s_logoCloud1_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_logoCloud1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel2_v" ADD CONSTRAINT "_hp_s_carousel2_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_s_carousel2_v_locales" ADD CONSTRAINT "_hp_s_carousel2_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_s_carousel2_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_hero1_v_links" ADD CONSTRAINT "_hp_l_hero1_v_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_l_hero1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_hero1_v" ADD CONSTRAINT "_hp_l_hero1_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_hero1_v" ADD CONSTRAINT "_hp_l_hero1_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_hero1_v" ADD CONSTRAINT "_hp_l_hero1_v_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_hero1_v" ADD CONSTRAINT "_hp_l_hero1_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_hero2_v_links" ADD CONSTRAINT "_hp_l_hero2_v_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_l_hero2_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_hero2_v" ADD CONSTRAINT "_hp_l_hero2_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_hero2_v" ADD CONSTRAINT "_hp_l_hero2_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_hero2_v" ADD CONSTRAINT "_hp_l_hero2_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_sectionHeader_v" ADD CONSTRAINT "_hp_l_sectionHeader_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_splitContent_v" ADD CONSTRAINT "_hp_l_splitContent_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_splitImage_v" ADD CONSTRAINT "_hp_l_splitImage_v_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_splitImage_v" ADD CONSTRAINT "_hp_l_splitImage_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_splitRow_v" ADD CONSTRAINT "_hp_l_splitRow_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_carousel1_v_images" ADD CONSTRAINT "_hp_l_carousel1_v_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_carousel1_v_images" ADD CONSTRAINT "_hp_l_carousel1_v_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_l_carousel1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_carousel1_v" ADD CONSTRAINT "_hp_l_carousel1_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_carousel1_v" ADD CONSTRAINT "_hp_l_carousel1_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_carousel1_v" ADD CONSTRAINT "_hp_l_carousel1_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_timelineRow_v_timelines" ADD CONSTRAINT "_hp_l_timelineRow_v_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_l_timelineRow_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_timelineRow_v" ADD CONSTRAINT "_hp_l_timelineRow_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_faqs_v_faqs" ADD CONSTRAINT "_hp_l_faqs_v_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_l_faqs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_faqs_v" ADD CONSTRAINT "_hp_l_faqs_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_contentFeed_v_kinds" ADD CONSTRAINT "_hp_l_contentFeed_v_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_hp_l_contentFeed_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_contentFeed_v_filters_regions" ADD CONSTRAINT "_hp_l_contentFeed_v_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_hp_l_contentFeed_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_contentFeed_v" ADD CONSTRAINT "_hp_l_contentFeed_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_eventsCalendar_v" ADD CONSTRAINT "_hp_l_eventsCalendar_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_peopleWidget_v" ADD CONSTRAINT "_hp_l_peopleWidget_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_gridCard_v" ADD CONSTRAINT "_hp_l_gridCard_v_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_gridCard_v" ADD CONSTRAINT "_hp_l_gridCard_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_gridAgenda_v" ADD CONSTRAINT "_hp_l_gridAgenda_v_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_gridAgenda_v" ADD CONSTRAINT "_hp_l_gridAgenda_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_gridNews_v" ADD CONSTRAINT "_hp_l_gridNews_v_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_gridNews_v" ADD CONSTRAINT "_hp_l_gridNews_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_gridRow_v" ADD CONSTRAINT "_hp_l_gridRow_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_gridRow_v" ADD CONSTRAINT "_hp_l_gridRow_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_gridRow_v" ADD CONSTRAINT "_hp_l_gridRow_v_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_gridRow_v" ADD CONSTRAINT "_hp_l_gridRow_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_regionMap_v" ADD CONSTRAINT "_hp_l_regionMap_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_atlasEmbed_v" ADD CONSTRAINT "_hp_l_atlasEmbed_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_cta1_v_links" ADD CONSTRAINT "_hp_l_cta1_v_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_l_cta1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_cta1_v" ADD CONSTRAINT "_hp_l_cta1_v_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_cta1_v" ADD CONSTRAINT "_hp_l_cta1_v_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_cta1_v" ADD CONSTRAINT "_hp_l_cta1_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_submitStoryBanner_v" ADD CONSTRAINT "_hp_l_submitStoryBanner_v_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_submitStoryBanner_v" ADD CONSTRAINT "_hp_l_submitStoryBanner_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_formNewsletter_v" ADD CONSTRAINT "_hp_l_formNewsletter_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_logoCloud1_v_images" ADD CONSTRAINT "_hp_l_logoCloud1_v_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hp_l_logoCloud1_v_images" ADD CONSTRAINT "_hp_l_logoCloud1_v_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_l_logoCloud1_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_logoCloud1_v" ADD CONSTRAINT "_hp_l_logoCloud1_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_l_carousel2_v" ADD CONSTRAINT "_hp_l_carousel2_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hp_s_hero1_links_order_idx" ON "hp_s_hero1_links" USING btree ("_order");
  CREATE INDEX "hp_s_hero1_links_parent_id_idx" ON "hp_s_hero1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hp_s_hero1_links_locales_locale_parent_id_unique" ON "hp_s_hero1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_hero1_order_idx" ON "hp_s_hero1" USING btree ("_order");
  CREATE INDEX "hp_s_hero1_parent_id_idx" ON "hp_s_hero1" USING btree ("_parent_id");
  CREATE INDEX "hp_s_hero1_path_idx" ON "hp_s_hero1" USING btree ("_path");
  CREATE INDEX "hp_s_hero1_background_background_svg_pattern_idx" ON "hp_s_hero1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_s_hero1_background_image_background_image_asset_idx" ON "hp_s_hero1" USING btree ("background_image_asset_id");
  CREATE INDEX "hp_s_hero1_image_image_asset_idx" ON "hp_s_hero1" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "hp_s_hero1_locales_locale_parent_id_unique" ON "hp_s_hero1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_hero2_links_order_idx" ON "hp_s_hero2_links" USING btree ("_order");
  CREATE INDEX "hp_s_hero2_links_parent_id_idx" ON "hp_s_hero2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hp_s_hero2_links_locales_locale_parent_id_unique" ON "hp_s_hero2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_hero2_order_idx" ON "hp_s_hero2" USING btree ("_order");
  CREATE INDEX "hp_s_hero2_parent_id_idx" ON "hp_s_hero2" USING btree ("_parent_id");
  CREATE INDEX "hp_s_hero2_path_idx" ON "hp_s_hero2" USING btree ("_path");
  CREATE INDEX "hp_s_hero2_background_background_svg_pattern_idx" ON "hp_s_hero2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_s_hero2_background_image_background_image_asset_idx" ON "hp_s_hero2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "hp_s_hero2_locales_locale_parent_id_unique" ON "hp_s_hero2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_sectionHeader_order_idx" ON "hp_s_sectionHeader" USING btree ("_order");
  CREATE INDEX "hp_s_sectionHeader_parent_id_idx" ON "hp_s_sectionHeader" USING btree ("_parent_id");
  CREATE INDEX "hp_s_sectionHeader_path_idx" ON "hp_s_sectionHeader" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_sectionHeader_locales_locale_parent_id_unique" ON "hp_s_sectionHeader_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_splitContent_order_idx" ON "hp_s_splitContent" USING btree ("_order");
  CREATE INDEX "hp_s_splitContent_parent_id_idx" ON "hp_s_splitContent" USING btree ("_parent_id");
  CREATE INDEX "hp_s_splitContent_path_idx" ON "hp_s_splitContent" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_splitContent_locales_locale_parent_id_unique" ON "hp_s_splitContent_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_splitImage_order_idx" ON "hp_s_splitImage" USING btree ("_order");
  CREATE INDEX "hp_s_splitImage_parent_id_idx" ON "hp_s_splitImage" USING btree ("_parent_id");
  CREATE INDEX "hp_s_splitImage_path_idx" ON "hp_s_splitImage" USING btree ("_path");
  CREATE INDEX "hp_s_splitImage_image_image_asset_idx" ON "hp_s_splitImage" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "hp_s_splitImage_locales_locale_parent_id_unique" ON "hp_s_splitImage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_splitRow_order_idx" ON "hp_s_splitRow" USING btree ("_order");
  CREATE INDEX "hp_s_splitRow_parent_id_idx" ON "hp_s_splitRow" USING btree ("_parent_id");
  CREATE INDEX "hp_s_splitRow_path_idx" ON "hp_s_splitRow" USING btree ("_path");
  CREATE INDEX "hp_s_carousel1_images_order_idx" ON "hp_s_carousel1_images" USING btree ("_order");
  CREATE INDEX "hp_s_carousel1_images_parent_id_idx" ON "hp_s_carousel1_images" USING btree ("_parent_id");
  CREATE INDEX "hp_s_carousel1_images_asset_idx" ON "hp_s_carousel1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "hp_s_carousel1_images_locales_locale_parent_id_unique" ON "hp_s_carousel1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_carousel1_order_idx" ON "hp_s_carousel1" USING btree ("_order");
  CREATE INDEX "hp_s_carousel1_parent_id_idx" ON "hp_s_carousel1" USING btree ("_parent_id");
  CREATE INDEX "hp_s_carousel1_path_idx" ON "hp_s_carousel1" USING btree ("_path");
  CREATE INDEX "hp_s_carousel1_background_background_svg_pattern_idx" ON "hp_s_carousel1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_s_carousel1_background_image_background_image_asset_idx" ON "hp_s_carousel1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "hp_s_carousel1_locales_locale_parent_id_unique" ON "hp_s_carousel1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_timelineRow_timelines_order_idx" ON "hp_s_timelineRow_timelines" USING btree ("_order");
  CREATE INDEX "hp_s_timelineRow_timelines_parent_id_idx" ON "hp_s_timelineRow_timelines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hp_s_timelineRow_timelines_locales_locale_parent_id_unique" ON "hp_s_timelineRow_timelines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_timelineRow_order_idx" ON "hp_s_timelineRow" USING btree ("_order");
  CREATE INDEX "hp_s_timelineRow_parent_id_idx" ON "hp_s_timelineRow" USING btree ("_parent_id");
  CREATE INDEX "hp_s_timelineRow_path_idx" ON "hp_s_timelineRow" USING btree ("_path");
  CREATE INDEX "hp_s_faqs_faqs_order_idx" ON "hp_s_faqs_faqs" USING btree ("_order");
  CREATE INDEX "hp_s_faqs_faqs_parent_id_idx" ON "hp_s_faqs_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hp_s_faqs_faqs_locales_locale_parent_id_unique" ON "hp_s_faqs_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_faqs_order_idx" ON "hp_s_faqs" USING btree ("_order");
  CREATE INDEX "hp_s_faqs_parent_id_idx" ON "hp_s_faqs" USING btree ("_parent_id");
  CREATE INDEX "hp_s_faqs_path_idx" ON "hp_s_faqs" USING btree ("_path");
  CREATE INDEX "hp_s_contentFeed_kinds_order_idx" ON "hp_s_contentFeed_kinds" USING btree ("order");
  CREATE INDEX "hp_s_contentFeed_kinds_parent_idx" ON "hp_s_contentFeed_kinds" USING btree ("parent_id");
  CREATE INDEX "hp_s_contentFeed_filters_regions_order_idx" ON "hp_s_contentFeed_filters_regions" USING btree ("order");
  CREATE INDEX "hp_s_contentFeed_filters_regions_parent_idx" ON "hp_s_contentFeed_filters_regions" USING btree ("parent_id");
  CREATE INDEX "hp_s_contentFeed_order_idx" ON "hp_s_contentFeed" USING btree ("_order");
  CREATE INDEX "hp_s_contentFeed_parent_id_idx" ON "hp_s_contentFeed" USING btree ("_parent_id");
  CREATE INDEX "hp_s_contentFeed_path_idx" ON "hp_s_contentFeed" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_contentFeed_locales_locale_parent_id_unique" ON "hp_s_contentFeed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_eventsCalendar_order_idx" ON "hp_s_eventsCalendar" USING btree ("_order");
  CREATE INDEX "hp_s_eventsCalendar_parent_id_idx" ON "hp_s_eventsCalendar" USING btree ("_parent_id");
  CREATE INDEX "hp_s_eventsCalendar_path_idx" ON "hp_s_eventsCalendar" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_eventsCalendar_locales_locale_parent_id_unique" ON "hp_s_eventsCalendar_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_peopleWidget_order_idx" ON "hp_s_peopleWidget" USING btree ("_order");
  CREATE INDEX "hp_s_peopleWidget_parent_id_idx" ON "hp_s_peopleWidget" USING btree ("_parent_id");
  CREATE INDEX "hp_s_peopleWidget_path_idx" ON "hp_s_peopleWidget" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_peopleWidget_locales_locale_parent_id_unique" ON "hp_s_peopleWidget_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_gridCard_order_idx" ON "hp_s_gridCard" USING btree ("_order");
  CREATE INDEX "hp_s_gridCard_parent_id_idx" ON "hp_s_gridCard" USING btree ("_parent_id");
  CREATE INDEX "hp_s_gridCard_path_idx" ON "hp_s_gridCard" USING btree ("_path");
  CREATE INDEX "hp_s_gridCard_image_image_asset_idx" ON "hp_s_gridCard" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "hp_s_gridCard_locales_locale_parent_id_unique" ON "hp_s_gridCard_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_gridAgenda_order_idx" ON "hp_s_gridAgenda" USING btree ("_order");
  CREATE INDEX "hp_s_gridAgenda_parent_id_idx" ON "hp_s_gridAgenda" USING btree ("_parent_id");
  CREATE INDEX "hp_s_gridAgenda_path_idx" ON "hp_s_gridAgenda" USING btree ("_path");
  CREATE INDEX "hp_s_gridAgenda_agenda_idx" ON "hp_s_gridAgenda" USING btree ("agenda_id");
  CREATE INDEX "hp_s_gridNews_order_idx" ON "hp_s_gridNews" USING btree ("_order");
  CREATE INDEX "hp_s_gridNews_parent_id_idx" ON "hp_s_gridNews" USING btree ("_parent_id");
  CREATE INDEX "hp_s_gridNews_path_idx" ON "hp_s_gridNews" USING btree ("_path");
  CREATE INDEX "hp_s_gridNews_news_post_idx" ON "hp_s_gridNews" USING btree ("news_post_id");
  CREATE UNIQUE INDEX "hp_s_gridNews_locales_locale_parent_id_unique" ON "hp_s_gridNews_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_gridRow_order_idx" ON "hp_s_gridRow" USING btree ("_order");
  CREATE INDEX "hp_s_gridRow_parent_id_idx" ON "hp_s_gridRow" USING btree ("_parent_id");
  CREATE INDEX "hp_s_gridRow_path_idx" ON "hp_s_gridRow" USING btree ("_path");
  CREATE INDEX "hp_s_gridRow_background_background_svg_pattern_idx" ON "hp_s_gridRow" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_s_gridRow_background_image_background_image_asset_idx" ON "hp_s_gridRow" USING btree ("background_image_asset_id");
  CREATE INDEX "hp_s_gridRow_header_image_header_image_asset_idx" ON "hp_s_gridRow" USING btree ("header_image_asset_id");
  CREATE UNIQUE INDEX "hp_s_gridRow_locales_locale_parent_id_unique" ON "hp_s_gridRow_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_regionMap_order_idx" ON "hp_s_regionMap" USING btree ("_order");
  CREATE INDEX "hp_s_regionMap_parent_id_idx" ON "hp_s_regionMap" USING btree ("_parent_id");
  CREATE INDEX "hp_s_regionMap_path_idx" ON "hp_s_regionMap" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_regionMap_locales_locale_parent_id_unique" ON "hp_s_regionMap_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_atlasEmbed_order_idx" ON "hp_s_atlasEmbed" USING btree ("_order");
  CREATE INDEX "hp_s_atlasEmbed_parent_id_idx" ON "hp_s_atlasEmbed" USING btree ("_parent_id");
  CREATE INDEX "hp_s_atlasEmbed_path_idx" ON "hp_s_atlasEmbed" USING btree ("_path");
  CREATE INDEX "hp_s_cta1_links_order_idx" ON "hp_s_cta1_links" USING btree ("_order");
  CREATE INDEX "hp_s_cta1_links_parent_id_idx" ON "hp_s_cta1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hp_s_cta1_links_locales_locale_parent_id_unique" ON "hp_s_cta1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_cta1_order_idx" ON "hp_s_cta1" USING btree ("_order");
  CREATE INDEX "hp_s_cta1_parent_id_idx" ON "hp_s_cta1" USING btree ("_parent_id");
  CREATE INDEX "hp_s_cta1_path_idx" ON "hp_s_cta1" USING btree ("_path");
  CREATE INDEX "hp_s_cta1_background_background_svg_pattern_idx" ON "hp_s_cta1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_s_cta1_background_image_background_image_asset_idx" ON "hp_s_cta1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "hp_s_cta1_locales_locale_parent_id_unique" ON "hp_s_cta1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_submitStoryBanner_order_idx" ON "hp_s_submitStoryBanner" USING btree ("_order");
  CREATE INDEX "hp_s_submitStoryBanner_parent_id_idx" ON "hp_s_submitStoryBanner" USING btree ("_parent_id");
  CREATE INDEX "hp_s_submitStoryBanner_path_idx" ON "hp_s_submitStoryBanner" USING btree ("_path");
  CREATE INDEX "hp_s_submitStoryBanner_illustration_illustration_asset_idx" ON "hp_s_submitStoryBanner" USING btree ("illustration_asset_id");
  CREATE UNIQUE INDEX "hp_s_submitStoryBanner_locales_locale_parent_id_unique" ON "hp_s_submitStoryBanner_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_formNewsletter_order_idx" ON "hp_s_formNewsletter" USING btree ("_order");
  CREATE INDEX "hp_s_formNewsletter_parent_id_idx" ON "hp_s_formNewsletter" USING btree ("_parent_id");
  CREATE INDEX "hp_s_formNewsletter_path_idx" ON "hp_s_formNewsletter" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_formNewsletter_locales_locale_parent_id_unique" ON "hp_s_formNewsletter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_logoCloud1_images_order_idx" ON "hp_s_logoCloud1_images" USING btree ("_order");
  CREATE INDEX "hp_s_logoCloud1_images_parent_id_idx" ON "hp_s_logoCloud1_images" USING btree ("_parent_id");
  CREATE INDEX "hp_s_logoCloud1_images_asset_idx" ON "hp_s_logoCloud1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "hp_s_logoCloud1_images_locales_locale_parent_id_unique" ON "hp_s_logoCloud1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_logoCloud1_order_idx" ON "hp_s_logoCloud1" USING btree ("_order");
  CREATE INDEX "hp_s_logoCloud1_parent_id_idx" ON "hp_s_logoCloud1" USING btree ("_parent_id");
  CREATE INDEX "hp_s_logoCloud1_path_idx" ON "hp_s_logoCloud1" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_logoCloud1_locales_locale_parent_id_unique" ON "hp_s_logoCloud1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_s_carousel2_order_idx" ON "hp_s_carousel2" USING btree ("_order");
  CREATE INDEX "hp_s_carousel2_parent_id_idx" ON "hp_s_carousel2" USING btree ("_parent_id");
  CREATE INDEX "hp_s_carousel2_path_idx" ON "hp_s_carousel2" USING btree ("_path");
  CREATE UNIQUE INDEX "hp_s_carousel2_locales_locale_parent_id_unique" ON "hp_s_carousel2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_l_hero1_links_order_idx" ON "hp_l_hero1_links" USING btree ("_order");
  CREATE INDEX "hp_l_hero1_links_parent_id_idx" ON "hp_l_hero1_links" USING btree ("_parent_id");
  CREATE INDEX "hp_l_hero1_links_locale_idx" ON "hp_l_hero1_links" USING btree ("_locale");
  CREATE INDEX "hp_l_hero1_order_idx" ON "hp_l_hero1" USING btree ("_order");
  CREATE INDEX "hp_l_hero1_parent_id_idx" ON "hp_l_hero1" USING btree ("_parent_id");
  CREATE INDEX "hp_l_hero1_path_idx" ON "hp_l_hero1" USING btree ("_path");
  CREATE INDEX "hp_l_hero1_locale_idx" ON "hp_l_hero1" USING btree ("_locale");
  CREATE INDEX "hp_l_hero1_background_background_svg_pattern_idx" ON "hp_l_hero1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_l_hero1_background_image_background_image_asset_idx" ON "hp_l_hero1" USING btree ("background_image_asset_id");
  CREATE INDEX "hp_l_hero1_image_image_asset_idx" ON "hp_l_hero1" USING btree ("image_asset_id");
  CREATE INDEX "hp_l_hero2_links_order_idx" ON "hp_l_hero2_links" USING btree ("_order");
  CREATE INDEX "hp_l_hero2_links_parent_id_idx" ON "hp_l_hero2_links" USING btree ("_parent_id");
  CREATE INDEX "hp_l_hero2_links_locale_idx" ON "hp_l_hero2_links" USING btree ("_locale");
  CREATE INDEX "hp_l_hero2_order_idx" ON "hp_l_hero2" USING btree ("_order");
  CREATE INDEX "hp_l_hero2_parent_id_idx" ON "hp_l_hero2" USING btree ("_parent_id");
  CREATE INDEX "hp_l_hero2_path_idx" ON "hp_l_hero2" USING btree ("_path");
  CREATE INDEX "hp_l_hero2_locale_idx" ON "hp_l_hero2" USING btree ("_locale");
  CREATE INDEX "hp_l_hero2_background_background_svg_pattern_idx" ON "hp_l_hero2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_l_hero2_background_image_background_image_asset_idx" ON "hp_l_hero2" USING btree ("background_image_asset_id");
  CREATE INDEX "hp_l_sectionHeader_order_idx" ON "hp_l_sectionHeader" USING btree ("_order");
  CREATE INDEX "hp_l_sectionHeader_parent_id_idx" ON "hp_l_sectionHeader" USING btree ("_parent_id");
  CREATE INDEX "hp_l_sectionHeader_path_idx" ON "hp_l_sectionHeader" USING btree ("_path");
  CREATE INDEX "hp_l_sectionHeader_locale_idx" ON "hp_l_sectionHeader" USING btree ("_locale");
  CREATE INDEX "hp_l_splitContent_order_idx" ON "hp_l_splitContent" USING btree ("_order");
  CREATE INDEX "hp_l_splitContent_parent_id_idx" ON "hp_l_splitContent" USING btree ("_parent_id");
  CREATE INDEX "hp_l_splitContent_path_idx" ON "hp_l_splitContent" USING btree ("_path");
  CREATE INDEX "hp_l_splitContent_locale_idx" ON "hp_l_splitContent" USING btree ("_locale");
  CREATE INDEX "hp_l_splitImage_order_idx" ON "hp_l_splitImage" USING btree ("_order");
  CREATE INDEX "hp_l_splitImage_parent_id_idx" ON "hp_l_splitImage" USING btree ("_parent_id");
  CREATE INDEX "hp_l_splitImage_path_idx" ON "hp_l_splitImage" USING btree ("_path");
  CREATE INDEX "hp_l_splitImage_locale_idx" ON "hp_l_splitImage" USING btree ("_locale");
  CREATE INDEX "hp_l_splitImage_image_image_asset_idx" ON "hp_l_splitImage" USING btree ("image_asset_id");
  CREATE INDEX "hp_l_splitRow_order_idx" ON "hp_l_splitRow" USING btree ("_order");
  CREATE INDEX "hp_l_splitRow_parent_id_idx" ON "hp_l_splitRow" USING btree ("_parent_id");
  CREATE INDEX "hp_l_splitRow_path_idx" ON "hp_l_splitRow" USING btree ("_path");
  CREATE INDEX "hp_l_splitRow_locale_idx" ON "hp_l_splitRow" USING btree ("_locale");
  CREATE INDEX "hp_l_carousel1_images_order_idx" ON "hp_l_carousel1_images" USING btree ("_order");
  CREATE INDEX "hp_l_carousel1_images_parent_id_idx" ON "hp_l_carousel1_images" USING btree ("_parent_id");
  CREATE INDEX "hp_l_carousel1_images_locale_idx" ON "hp_l_carousel1_images" USING btree ("_locale");
  CREATE INDEX "hp_l_carousel1_images_asset_idx" ON "hp_l_carousel1_images" USING btree ("asset_id");
  CREATE INDEX "hp_l_carousel1_order_idx" ON "hp_l_carousel1" USING btree ("_order");
  CREATE INDEX "hp_l_carousel1_parent_id_idx" ON "hp_l_carousel1" USING btree ("_parent_id");
  CREATE INDEX "hp_l_carousel1_path_idx" ON "hp_l_carousel1" USING btree ("_path");
  CREATE INDEX "hp_l_carousel1_locale_idx" ON "hp_l_carousel1" USING btree ("_locale");
  CREATE INDEX "hp_l_carousel1_background_background_svg_pattern_idx" ON "hp_l_carousel1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_l_carousel1_background_image_background_image_asset_idx" ON "hp_l_carousel1" USING btree ("background_image_asset_id");
  CREATE INDEX "hp_l_timelineRow_timelines_order_idx" ON "hp_l_timelineRow_timelines" USING btree ("_order");
  CREATE INDEX "hp_l_timelineRow_timelines_parent_id_idx" ON "hp_l_timelineRow_timelines" USING btree ("_parent_id");
  CREATE INDEX "hp_l_timelineRow_timelines_locale_idx" ON "hp_l_timelineRow_timelines" USING btree ("_locale");
  CREATE INDEX "hp_l_timelineRow_order_idx" ON "hp_l_timelineRow" USING btree ("_order");
  CREATE INDEX "hp_l_timelineRow_parent_id_idx" ON "hp_l_timelineRow" USING btree ("_parent_id");
  CREATE INDEX "hp_l_timelineRow_path_idx" ON "hp_l_timelineRow" USING btree ("_path");
  CREATE INDEX "hp_l_timelineRow_locale_idx" ON "hp_l_timelineRow" USING btree ("_locale");
  CREATE INDEX "hp_l_faqs_faqs_order_idx" ON "hp_l_faqs_faqs" USING btree ("_order");
  CREATE INDEX "hp_l_faqs_faqs_parent_id_idx" ON "hp_l_faqs_faqs" USING btree ("_parent_id");
  CREATE INDEX "hp_l_faqs_faqs_locale_idx" ON "hp_l_faqs_faqs" USING btree ("_locale");
  CREATE INDEX "hp_l_faqs_order_idx" ON "hp_l_faqs" USING btree ("_order");
  CREATE INDEX "hp_l_faqs_parent_id_idx" ON "hp_l_faqs" USING btree ("_parent_id");
  CREATE INDEX "hp_l_faqs_path_idx" ON "hp_l_faqs" USING btree ("_path");
  CREATE INDEX "hp_l_faqs_locale_idx" ON "hp_l_faqs" USING btree ("_locale");
  CREATE INDEX "hp_l_contentFeed_kinds_order_idx" ON "hp_l_contentFeed_kinds" USING btree ("order");
  CREATE INDEX "hp_l_contentFeed_kinds_parent_idx" ON "hp_l_contentFeed_kinds" USING btree ("parent_id");
  CREATE INDEX "hp_l_contentFeed_kinds_locale_idx" ON "hp_l_contentFeed_kinds" USING btree ("locale");
  CREATE INDEX "hp_l_contentFeed_filters_regions_order_idx" ON "hp_l_contentFeed_filters_regions" USING btree ("order");
  CREATE INDEX "hp_l_contentFeed_filters_regions_parent_idx" ON "hp_l_contentFeed_filters_regions" USING btree ("parent_id");
  CREATE INDEX "hp_l_contentFeed_filters_regions_locale_idx" ON "hp_l_contentFeed_filters_regions" USING btree ("locale");
  CREATE INDEX "hp_l_contentFeed_order_idx" ON "hp_l_contentFeed" USING btree ("_order");
  CREATE INDEX "hp_l_contentFeed_parent_id_idx" ON "hp_l_contentFeed" USING btree ("_parent_id");
  CREATE INDEX "hp_l_contentFeed_path_idx" ON "hp_l_contentFeed" USING btree ("_path");
  CREATE INDEX "hp_l_contentFeed_locale_idx" ON "hp_l_contentFeed" USING btree ("_locale");
  CREATE INDEX "hp_l_eventsCalendar_order_idx" ON "hp_l_eventsCalendar" USING btree ("_order");
  CREATE INDEX "hp_l_eventsCalendar_parent_id_idx" ON "hp_l_eventsCalendar" USING btree ("_parent_id");
  CREATE INDEX "hp_l_eventsCalendar_path_idx" ON "hp_l_eventsCalendar" USING btree ("_path");
  CREATE INDEX "hp_l_eventsCalendar_locale_idx" ON "hp_l_eventsCalendar" USING btree ("_locale");
  CREATE INDEX "hp_l_peopleWidget_order_idx" ON "hp_l_peopleWidget" USING btree ("_order");
  CREATE INDEX "hp_l_peopleWidget_parent_id_idx" ON "hp_l_peopleWidget" USING btree ("_parent_id");
  CREATE INDEX "hp_l_peopleWidget_path_idx" ON "hp_l_peopleWidget" USING btree ("_path");
  CREATE INDEX "hp_l_peopleWidget_locale_idx" ON "hp_l_peopleWidget" USING btree ("_locale");
  CREATE INDEX "hp_l_gridCard_order_idx" ON "hp_l_gridCard" USING btree ("_order");
  CREATE INDEX "hp_l_gridCard_parent_id_idx" ON "hp_l_gridCard" USING btree ("_parent_id");
  CREATE INDEX "hp_l_gridCard_path_idx" ON "hp_l_gridCard" USING btree ("_path");
  CREATE INDEX "hp_l_gridCard_locale_idx" ON "hp_l_gridCard" USING btree ("_locale");
  CREATE INDEX "hp_l_gridCard_image_image_asset_idx" ON "hp_l_gridCard" USING btree ("image_asset_id");
  CREATE INDEX "hp_l_gridAgenda_order_idx" ON "hp_l_gridAgenda" USING btree ("_order");
  CREATE INDEX "hp_l_gridAgenda_parent_id_idx" ON "hp_l_gridAgenda" USING btree ("_parent_id");
  CREATE INDEX "hp_l_gridAgenda_path_idx" ON "hp_l_gridAgenda" USING btree ("_path");
  CREATE INDEX "hp_l_gridAgenda_locale_idx" ON "hp_l_gridAgenda" USING btree ("_locale");
  CREATE INDEX "hp_l_gridAgenda_agenda_idx" ON "hp_l_gridAgenda" USING btree ("agenda_id");
  CREATE INDEX "hp_l_gridNews_order_idx" ON "hp_l_gridNews" USING btree ("_order");
  CREATE INDEX "hp_l_gridNews_parent_id_idx" ON "hp_l_gridNews" USING btree ("_parent_id");
  CREATE INDEX "hp_l_gridNews_path_idx" ON "hp_l_gridNews" USING btree ("_path");
  CREATE INDEX "hp_l_gridNews_locale_idx" ON "hp_l_gridNews" USING btree ("_locale");
  CREATE INDEX "hp_l_gridNews_news_post_idx" ON "hp_l_gridNews" USING btree ("news_post_id");
  CREATE INDEX "hp_l_gridRow_order_idx" ON "hp_l_gridRow" USING btree ("_order");
  CREATE INDEX "hp_l_gridRow_parent_id_idx" ON "hp_l_gridRow" USING btree ("_parent_id");
  CREATE INDEX "hp_l_gridRow_path_idx" ON "hp_l_gridRow" USING btree ("_path");
  CREATE INDEX "hp_l_gridRow_locale_idx" ON "hp_l_gridRow" USING btree ("_locale");
  CREATE INDEX "hp_l_gridRow_background_background_svg_pattern_idx" ON "hp_l_gridRow" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_l_gridRow_background_image_background_image_asset_idx" ON "hp_l_gridRow" USING btree ("background_image_asset_id");
  CREATE INDEX "hp_l_gridRow_header_image_header_image_asset_idx" ON "hp_l_gridRow" USING btree ("header_image_asset_id");
  CREATE INDEX "hp_l_regionMap_order_idx" ON "hp_l_regionMap" USING btree ("_order");
  CREATE INDEX "hp_l_regionMap_parent_id_idx" ON "hp_l_regionMap" USING btree ("_parent_id");
  CREATE INDEX "hp_l_regionMap_path_idx" ON "hp_l_regionMap" USING btree ("_path");
  CREATE INDEX "hp_l_regionMap_locale_idx" ON "hp_l_regionMap" USING btree ("_locale");
  CREATE INDEX "hp_l_atlasEmbed_order_idx" ON "hp_l_atlasEmbed" USING btree ("_order");
  CREATE INDEX "hp_l_atlasEmbed_parent_id_idx" ON "hp_l_atlasEmbed" USING btree ("_parent_id");
  CREATE INDEX "hp_l_atlasEmbed_path_idx" ON "hp_l_atlasEmbed" USING btree ("_path");
  CREATE INDEX "hp_l_atlasEmbed_locale_idx" ON "hp_l_atlasEmbed" USING btree ("_locale");
  CREATE INDEX "hp_l_cta1_links_order_idx" ON "hp_l_cta1_links" USING btree ("_order");
  CREATE INDEX "hp_l_cta1_links_parent_id_idx" ON "hp_l_cta1_links" USING btree ("_parent_id");
  CREATE INDEX "hp_l_cta1_links_locale_idx" ON "hp_l_cta1_links" USING btree ("_locale");
  CREATE INDEX "hp_l_cta1_order_idx" ON "hp_l_cta1" USING btree ("_order");
  CREATE INDEX "hp_l_cta1_parent_id_idx" ON "hp_l_cta1" USING btree ("_parent_id");
  CREATE INDEX "hp_l_cta1_path_idx" ON "hp_l_cta1" USING btree ("_path");
  CREATE INDEX "hp_l_cta1_locale_idx" ON "hp_l_cta1" USING btree ("_locale");
  CREATE INDEX "hp_l_cta1_background_background_svg_pattern_idx" ON "hp_l_cta1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "hp_l_cta1_background_image_background_image_asset_idx" ON "hp_l_cta1" USING btree ("background_image_asset_id");
  CREATE INDEX "hp_l_submitStoryBanner_order_idx" ON "hp_l_submitStoryBanner" USING btree ("_order");
  CREATE INDEX "hp_l_submitStoryBanner_parent_id_idx" ON "hp_l_submitStoryBanner" USING btree ("_parent_id");
  CREATE INDEX "hp_l_submitStoryBanner_path_idx" ON "hp_l_submitStoryBanner" USING btree ("_path");
  CREATE INDEX "hp_l_submitStoryBanner_locale_idx" ON "hp_l_submitStoryBanner" USING btree ("_locale");
  CREATE INDEX "hp_l_submitStoryBanner_illustration_illustration_asset_idx" ON "hp_l_submitStoryBanner" USING btree ("illustration_asset_id");
  CREATE INDEX "hp_l_formNewsletter_order_idx" ON "hp_l_formNewsletter" USING btree ("_order");
  CREATE INDEX "hp_l_formNewsletter_parent_id_idx" ON "hp_l_formNewsletter" USING btree ("_parent_id");
  CREATE INDEX "hp_l_formNewsletter_path_idx" ON "hp_l_formNewsletter" USING btree ("_path");
  CREATE INDEX "hp_l_formNewsletter_locale_idx" ON "hp_l_formNewsletter" USING btree ("_locale");
  CREATE INDEX "hp_l_logoCloud1_images_order_idx" ON "hp_l_logoCloud1_images" USING btree ("_order");
  CREATE INDEX "hp_l_logoCloud1_images_parent_id_idx" ON "hp_l_logoCloud1_images" USING btree ("_parent_id");
  CREATE INDEX "hp_l_logoCloud1_images_locale_idx" ON "hp_l_logoCloud1_images" USING btree ("_locale");
  CREATE INDEX "hp_l_logoCloud1_images_asset_idx" ON "hp_l_logoCloud1_images" USING btree ("asset_id");
  CREATE INDEX "hp_l_logoCloud1_order_idx" ON "hp_l_logoCloud1" USING btree ("_order");
  CREATE INDEX "hp_l_logoCloud1_parent_id_idx" ON "hp_l_logoCloud1" USING btree ("_parent_id");
  CREATE INDEX "hp_l_logoCloud1_path_idx" ON "hp_l_logoCloud1" USING btree ("_path");
  CREATE INDEX "hp_l_logoCloud1_locale_idx" ON "hp_l_logoCloud1" USING btree ("_locale");
  CREATE INDEX "hp_l_carousel2_order_idx" ON "hp_l_carousel2" USING btree ("_order");
  CREATE INDEX "hp_l_carousel2_parent_id_idx" ON "hp_l_carousel2" USING btree ("_parent_id");
  CREATE INDEX "hp_l_carousel2_path_idx" ON "hp_l_carousel2" USING btree ("_path");
  CREATE INDEX "hp_l_carousel2_locale_idx" ON "hp_l_carousel2" USING btree ("_locale");
  CREATE INDEX "_hp_s_hero1_v_links_order_idx" ON "_hp_s_hero1_v_links" USING btree ("_order");
  CREATE INDEX "_hp_s_hero1_v_links_parent_id_idx" ON "_hp_s_hero1_v_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hp_s_hero1_v_links_locales_locale_parent_id_unique" ON "_hp_s_hero1_v_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_hero1_v_order_idx" ON "_hp_s_hero1_v" USING btree ("_order");
  CREATE INDEX "_hp_s_hero1_v_parent_id_idx" ON "_hp_s_hero1_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_hero1_v_path_idx" ON "_hp_s_hero1_v" USING btree ("_path");
  CREATE INDEX "_hp_s_hero1_v_background_background_svg_pattern_idx" ON "_hp_s_hero1_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_s_hero1_v_background_image_background_image_asset_idx" ON "_hp_s_hero1_v" USING btree ("background_image_asset_id");
  CREATE INDEX "_hp_s_hero1_v_image_image_asset_idx" ON "_hp_s_hero1_v" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_hp_s_hero1_v_locales_locale_parent_id_unique" ON "_hp_s_hero1_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_hero2_v_links_order_idx" ON "_hp_s_hero2_v_links" USING btree ("_order");
  CREATE INDEX "_hp_s_hero2_v_links_parent_id_idx" ON "_hp_s_hero2_v_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hp_s_hero2_v_links_locales_locale_parent_id_unique" ON "_hp_s_hero2_v_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_hero2_v_order_idx" ON "_hp_s_hero2_v" USING btree ("_order");
  CREATE INDEX "_hp_s_hero2_v_parent_id_idx" ON "_hp_s_hero2_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_hero2_v_path_idx" ON "_hp_s_hero2_v" USING btree ("_path");
  CREATE INDEX "_hp_s_hero2_v_background_background_svg_pattern_idx" ON "_hp_s_hero2_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_s_hero2_v_background_image_background_image_asset_idx" ON "_hp_s_hero2_v" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_hp_s_hero2_v_locales_locale_parent_id_unique" ON "_hp_s_hero2_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_sectionHeader_v_order_idx" ON "_hp_s_sectionHeader_v" USING btree ("_order");
  CREATE INDEX "_hp_s_sectionHeader_v_parent_id_idx" ON "_hp_s_sectionHeader_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_sectionHeader_v_path_idx" ON "_hp_s_sectionHeader_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_sectionHeader_v_locales_locale_parent_id_unique" ON "_hp_s_sectionHeader_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_splitContent_v_order_idx" ON "_hp_s_splitContent_v" USING btree ("_order");
  CREATE INDEX "_hp_s_splitContent_v_parent_id_idx" ON "_hp_s_splitContent_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_splitContent_v_path_idx" ON "_hp_s_splitContent_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_splitContent_v_locales_locale_parent_id_unique" ON "_hp_s_splitContent_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_splitImage_v_order_idx" ON "_hp_s_splitImage_v" USING btree ("_order");
  CREATE INDEX "_hp_s_splitImage_v_parent_id_idx" ON "_hp_s_splitImage_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_splitImage_v_path_idx" ON "_hp_s_splitImage_v" USING btree ("_path");
  CREATE INDEX "_hp_s_splitImage_v_image_image_asset_idx" ON "_hp_s_splitImage_v" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_hp_s_splitImage_v_locales_locale_parent_id_unique" ON "_hp_s_splitImage_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_splitRow_v_order_idx" ON "_hp_s_splitRow_v" USING btree ("_order");
  CREATE INDEX "_hp_s_splitRow_v_parent_id_idx" ON "_hp_s_splitRow_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_splitRow_v_path_idx" ON "_hp_s_splitRow_v" USING btree ("_path");
  CREATE INDEX "_hp_s_carousel1_v_images_order_idx" ON "_hp_s_carousel1_v_images" USING btree ("_order");
  CREATE INDEX "_hp_s_carousel1_v_images_parent_id_idx" ON "_hp_s_carousel1_v_images" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_carousel1_v_images_asset_idx" ON "_hp_s_carousel1_v_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "_hp_s_carousel1_v_images_locales_locale_parent_id_unique" ON "_hp_s_carousel1_v_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_carousel1_v_order_idx" ON "_hp_s_carousel1_v" USING btree ("_order");
  CREATE INDEX "_hp_s_carousel1_v_parent_id_idx" ON "_hp_s_carousel1_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_carousel1_v_path_idx" ON "_hp_s_carousel1_v" USING btree ("_path");
  CREATE INDEX "_hp_s_carousel1_v_background_background_svg_pattern_idx" ON "_hp_s_carousel1_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_s_carousel1_v_background_image_background_image_asse_idx" ON "_hp_s_carousel1_v" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_hp_s_carousel1_v_locales_locale_parent_id_unique" ON "_hp_s_carousel1_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_timelineRow_v_timelines_order_idx" ON "_hp_s_timelineRow_v_timelines" USING btree ("_order");
  CREATE INDEX "_hp_s_timelineRow_v_timelines_parent_id_idx" ON "_hp_s_timelineRow_v_timelines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hp_s_timelineRow_v_timelines_locales_locale_parent_id_uniqu" ON "_hp_s_timelineRow_v_timelines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_timelineRow_v_order_idx" ON "_hp_s_timelineRow_v" USING btree ("_order");
  CREATE INDEX "_hp_s_timelineRow_v_parent_id_idx" ON "_hp_s_timelineRow_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_timelineRow_v_path_idx" ON "_hp_s_timelineRow_v" USING btree ("_path");
  CREATE INDEX "_hp_s_faqs_v_faqs_order_idx" ON "_hp_s_faqs_v_faqs" USING btree ("_order");
  CREATE INDEX "_hp_s_faqs_v_faqs_parent_id_idx" ON "_hp_s_faqs_v_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hp_s_faqs_v_faqs_locales_locale_parent_id_unique" ON "_hp_s_faqs_v_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_faqs_v_order_idx" ON "_hp_s_faqs_v" USING btree ("_order");
  CREATE INDEX "_hp_s_faqs_v_parent_id_idx" ON "_hp_s_faqs_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_faqs_v_path_idx" ON "_hp_s_faqs_v" USING btree ("_path");
  CREATE INDEX "_hp_s_contentFeed_v_kinds_order_idx" ON "_hp_s_contentFeed_v_kinds" USING btree ("order");
  CREATE INDEX "_hp_s_contentFeed_v_kinds_parent_idx" ON "_hp_s_contentFeed_v_kinds" USING btree ("parent_id");
  CREATE INDEX "_hp_s_contentFeed_v_filters_regions_order_idx" ON "_hp_s_contentFeed_v_filters_regions" USING btree ("order");
  CREATE INDEX "_hp_s_contentFeed_v_filters_regions_parent_idx" ON "_hp_s_contentFeed_v_filters_regions" USING btree ("parent_id");
  CREATE INDEX "_hp_s_contentFeed_v_order_idx" ON "_hp_s_contentFeed_v" USING btree ("_order");
  CREATE INDEX "_hp_s_contentFeed_v_parent_id_idx" ON "_hp_s_contentFeed_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_contentFeed_v_path_idx" ON "_hp_s_contentFeed_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_contentFeed_v_locales_locale_parent_id_unique" ON "_hp_s_contentFeed_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_eventsCalendar_v_order_idx" ON "_hp_s_eventsCalendar_v" USING btree ("_order");
  CREATE INDEX "_hp_s_eventsCalendar_v_parent_id_idx" ON "_hp_s_eventsCalendar_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_eventsCalendar_v_path_idx" ON "_hp_s_eventsCalendar_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_eventsCalendar_v_locales_locale_parent_id_unique" ON "_hp_s_eventsCalendar_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_peopleWidget_v_order_idx" ON "_hp_s_peopleWidget_v" USING btree ("_order");
  CREATE INDEX "_hp_s_peopleWidget_v_parent_id_idx" ON "_hp_s_peopleWidget_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_peopleWidget_v_path_idx" ON "_hp_s_peopleWidget_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_peopleWidget_v_locales_locale_parent_id_unique" ON "_hp_s_peopleWidget_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_gridCard_v_order_idx" ON "_hp_s_gridCard_v" USING btree ("_order");
  CREATE INDEX "_hp_s_gridCard_v_parent_id_idx" ON "_hp_s_gridCard_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_gridCard_v_path_idx" ON "_hp_s_gridCard_v" USING btree ("_path");
  CREATE INDEX "_hp_s_gridCard_v_image_image_asset_idx" ON "_hp_s_gridCard_v" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_hp_s_gridCard_v_locales_locale_parent_id_unique" ON "_hp_s_gridCard_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_gridAgenda_v_order_idx" ON "_hp_s_gridAgenda_v" USING btree ("_order");
  CREATE INDEX "_hp_s_gridAgenda_v_parent_id_idx" ON "_hp_s_gridAgenda_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_gridAgenda_v_path_idx" ON "_hp_s_gridAgenda_v" USING btree ("_path");
  CREATE INDEX "_hp_s_gridAgenda_v_agenda_idx" ON "_hp_s_gridAgenda_v" USING btree ("agenda_id");
  CREATE INDEX "_hp_s_gridNews_v_order_idx" ON "_hp_s_gridNews_v" USING btree ("_order");
  CREATE INDEX "_hp_s_gridNews_v_parent_id_idx" ON "_hp_s_gridNews_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_gridNews_v_path_idx" ON "_hp_s_gridNews_v" USING btree ("_path");
  CREATE INDEX "_hp_s_gridNews_v_news_post_idx" ON "_hp_s_gridNews_v" USING btree ("news_post_id");
  CREATE UNIQUE INDEX "_hp_s_gridNews_v_locales_locale_parent_id_unique" ON "_hp_s_gridNews_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_gridRow_v_order_idx" ON "_hp_s_gridRow_v" USING btree ("_order");
  CREATE INDEX "_hp_s_gridRow_v_parent_id_idx" ON "_hp_s_gridRow_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_gridRow_v_path_idx" ON "_hp_s_gridRow_v" USING btree ("_path");
  CREATE INDEX "_hp_s_gridRow_v_background_background_svg_pattern_idx" ON "_hp_s_gridRow_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_s_gridRow_v_background_image_background_image_asset_idx" ON "_hp_s_gridRow_v" USING btree ("background_image_asset_id");
  CREATE INDEX "_hp_s_gridRow_v_header_image_header_image_asset_idx" ON "_hp_s_gridRow_v" USING btree ("header_image_asset_id");
  CREATE UNIQUE INDEX "_hp_s_gridRow_v_locales_locale_parent_id_unique" ON "_hp_s_gridRow_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_regionMap_v_order_idx" ON "_hp_s_regionMap_v" USING btree ("_order");
  CREATE INDEX "_hp_s_regionMap_v_parent_id_idx" ON "_hp_s_regionMap_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_regionMap_v_path_idx" ON "_hp_s_regionMap_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_regionMap_v_locales_locale_parent_id_unique" ON "_hp_s_regionMap_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_atlasEmbed_v_order_idx" ON "_hp_s_atlasEmbed_v" USING btree ("_order");
  CREATE INDEX "_hp_s_atlasEmbed_v_parent_id_idx" ON "_hp_s_atlasEmbed_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_atlasEmbed_v_path_idx" ON "_hp_s_atlasEmbed_v" USING btree ("_path");
  CREATE INDEX "_hp_s_cta1_v_links_order_idx" ON "_hp_s_cta1_v_links" USING btree ("_order");
  CREATE INDEX "_hp_s_cta1_v_links_parent_id_idx" ON "_hp_s_cta1_v_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hp_s_cta1_v_links_locales_locale_parent_id_unique" ON "_hp_s_cta1_v_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_cta1_v_order_idx" ON "_hp_s_cta1_v" USING btree ("_order");
  CREATE INDEX "_hp_s_cta1_v_parent_id_idx" ON "_hp_s_cta1_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_cta1_v_path_idx" ON "_hp_s_cta1_v" USING btree ("_path");
  CREATE INDEX "_hp_s_cta1_v_background_background_svg_pattern_idx" ON "_hp_s_cta1_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_s_cta1_v_background_image_background_image_asset_idx" ON "_hp_s_cta1_v" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_hp_s_cta1_v_locales_locale_parent_id_unique" ON "_hp_s_cta1_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_submitStoryBanner_v_order_idx" ON "_hp_s_submitStoryBanner_v" USING btree ("_order");
  CREATE INDEX "_hp_s_submitStoryBanner_v_parent_id_idx" ON "_hp_s_submitStoryBanner_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_submitStoryBanner_v_path_idx" ON "_hp_s_submitStoryBanner_v" USING btree ("_path");
  CREATE INDEX "_hp_s_submitStoryBanner_v_illustration_illustration_asse_idx" ON "_hp_s_submitStoryBanner_v" USING btree ("illustration_asset_id");
  CREATE UNIQUE INDEX "_hp_s_submitStoryBanner_v_locales_locale_parent_id_unique" ON "_hp_s_submitStoryBanner_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_formNewsletter_v_order_idx" ON "_hp_s_formNewsletter_v" USING btree ("_order");
  CREATE INDEX "_hp_s_formNewsletter_v_parent_id_idx" ON "_hp_s_formNewsletter_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_formNewsletter_v_path_idx" ON "_hp_s_formNewsletter_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_formNewsletter_v_locales_locale_parent_id_unique" ON "_hp_s_formNewsletter_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_logoCloud1_v_images_order_idx" ON "_hp_s_logoCloud1_v_images" USING btree ("_order");
  CREATE INDEX "_hp_s_logoCloud1_v_images_parent_id_idx" ON "_hp_s_logoCloud1_v_images" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_logoCloud1_v_images_asset_idx" ON "_hp_s_logoCloud1_v_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "_hp_s_logoCloud1_v_images_locales_locale_parent_id_unique" ON "_hp_s_logoCloud1_v_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_logoCloud1_v_order_idx" ON "_hp_s_logoCloud1_v" USING btree ("_order");
  CREATE INDEX "_hp_s_logoCloud1_v_parent_id_idx" ON "_hp_s_logoCloud1_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_logoCloud1_v_path_idx" ON "_hp_s_logoCloud1_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_logoCloud1_v_locales_locale_parent_id_unique" ON "_hp_s_logoCloud1_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_s_carousel2_v_order_idx" ON "_hp_s_carousel2_v" USING btree ("_order");
  CREATE INDEX "_hp_s_carousel2_v_parent_id_idx" ON "_hp_s_carousel2_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_s_carousel2_v_path_idx" ON "_hp_s_carousel2_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hp_s_carousel2_v_locales_locale_parent_id_unique" ON "_hp_s_carousel2_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_l_hero1_v_links_order_idx" ON "_hp_l_hero1_v_links" USING btree ("_order");
  CREATE INDEX "_hp_l_hero1_v_links_parent_id_idx" ON "_hp_l_hero1_v_links" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_hero1_v_links_locale_idx" ON "_hp_l_hero1_v_links" USING btree ("_locale");
  CREATE INDEX "_hp_l_hero1_v_order_idx" ON "_hp_l_hero1_v" USING btree ("_order");
  CREATE INDEX "_hp_l_hero1_v_parent_id_idx" ON "_hp_l_hero1_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_hero1_v_path_idx" ON "_hp_l_hero1_v" USING btree ("_path");
  CREATE INDEX "_hp_l_hero1_v_locale_idx" ON "_hp_l_hero1_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_hero1_v_background_background_svg_pattern_idx" ON "_hp_l_hero1_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_l_hero1_v_background_image_background_image_asset_idx" ON "_hp_l_hero1_v" USING btree ("background_image_asset_id");
  CREATE INDEX "_hp_l_hero1_v_image_image_asset_idx" ON "_hp_l_hero1_v" USING btree ("image_asset_id");
  CREATE INDEX "_hp_l_hero2_v_links_order_idx" ON "_hp_l_hero2_v_links" USING btree ("_order");
  CREATE INDEX "_hp_l_hero2_v_links_parent_id_idx" ON "_hp_l_hero2_v_links" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_hero2_v_links_locale_idx" ON "_hp_l_hero2_v_links" USING btree ("_locale");
  CREATE INDEX "_hp_l_hero2_v_order_idx" ON "_hp_l_hero2_v" USING btree ("_order");
  CREATE INDEX "_hp_l_hero2_v_parent_id_idx" ON "_hp_l_hero2_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_hero2_v_path_idx" ON "_hp_l_hero2_v" USING btree ("_path");
  CREATE INDEX "_hp_l_hero2_v_locale_idx" ON "_hp_l_hero2_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_hero2_v_background_background_svg_pattern_idx" ON "_hp_l_hero2_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_l_hero2_v_background_image_background_image_asset_idx" ON "_hp_l_hero2_v" USING btree ("background_image_asset_id");
  CREATE INDEX "_hp_l_sectionHeader_v_order_idx" ON "_hp_l_sectionHeader_v" USING btree ("_order");
  CREATE INDEX "_hp_l_sectionHeader_v_parent_id_idx" ON "_hp_l_sectionHeader_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_sectionHeader_v_path_idx" ON "_hp_l_sectionHeader_v" USING btree ("_path");
  CREATE INDEX "_hp_l_sectionHeader_v_locale_idx" ON "_hp_l_sectionHeader_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_splitContent_v_order_idx" ON "_hp_l_splitContent_v" USING btree ("_order");
  CREATE INDEX "_hp_l_splitContent_v_parent_id_idx" ON "_hp_l_splitContent_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_splitContent_v_path_idx" ON "_hp_l_splitContent_v" USING btree ("_path");
  CREATE INDEX "_hp_l_splitContent_v_locale_idx" ON "_hp_l_splitContent_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_splitImage_v_order_idx" ON "_hp_l_splitImage_v" USING btree ("_order");
  CREATE INDEX "_hp_l_splitImage_v_parent_id_idx" ON "_hp_l_splitImage_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_splitImage_v_path_idx" ON "_hp_l_splitImage_v" USING btree ("_path");
  CREATE INDEX "_hp_l_splitImage_v_locale_idx" ON "_hp_l_splitImage_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_splitImage_v_image_image_asset_idx" ON "_hp_l_splitImage_v" USING btree ("image_asset_id");
  CREATE INDEX "_hp_l_splitRow_v_order_idx" ON "_hp_l_splitRow_v" USING btree ("_order");
  CREATE INDEX "_hp_l_splitRow_v_parent_id_idx" ON "_hp_l_splitRow_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_splitRow_v_path_idx" ON "_hp_l_splitRow_v" USING btree ("_path");
  CREATE INDEX "_hp_l_splitRow_v_locale_idx" ON "_hp_l_splitRow_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_carousel1_v_images_order_idx" ON "_hp_l_carousel1_v_images" USING btree ("_order");
  CREATE INDEX "_hp_l_carousel1_v_images_parent_id_idx" ON "_hp_l_carousel1_v_images" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_carousel1_v_images_locale_idx" ON "_hp_l_carousel1_v_images" USING btree ("_locale");
  CREATE INDEX "_hp_l_carousel1_v_images_asset_idx" ON "_hp_l_carousel1_v_images" USING btree ("asset_id");
  CREATE INDEX "_hp_l_carousel1_v_order_idx" ON "_hp_l_carousel1_v" USING btree ("_order");
  CREATE INDEX "_hp_l_carousel1_v_parent_id_idx" ON "_hp_l_carousel1_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_carousel1_v_path_idx" ON "_hp_l_carousel1_v" USING btree ("_path");
  CREATE INDEX "_hp_l_carousel1_v_locale_idx" ON "_hp_l_carousel1_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_carousel1_v_background_background_svg_pattern_idx" ON "_hp_l_carousel1_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_l_carousel1_v_background_image_background_image_asse_idx" ON "_hp_l_carousel1_v" USING btree ("background_image_asset_id");
  CREATE INDEX "_hp_l_timelineRow_v_timelines_order_idx" ON "_hp_l_timelineRow_v_timelines" USING btree ("_order");
  CREATE INDEX "_hp_l_timelineRow_v_timelines_parent_id_idx" ON "_hp_l_timelineRow_v_timelines" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_timelineRow_v_timelines_locale_idx" ON "_hp_l_timelineRow_v_timelines" USING btree ("_locale");
  CREATE INDEX "_hp_l_timelineRow_v_order_idx" ON "_hp_l_timelineRow_v" USING btree ("_order");
  CREATE INDEX "_hp_l_timelineRow_v_parent_id_idx" ON "_hp_l_timelineRow_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_timelineRow_v_path_idx" ON "_hp_l_timelineRow_v" USING btree ("_path");
  CREATE INDEX "_hp_l_timelineRow_v_locale_idx" ON "_hp_l_timelineRow_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_faqs_v_faqs_order_idx" ON "_hp_l_faqs_v_faqs" USING btree ("_order");
  CREATE INDEX "_hp_l_faqs_v_faqs_parent_id_idx" ON "_hp_l_faqs_v_faqs" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_faqs_v_faqs_locale_idx" ON "_hp_l_faqs_v_faqs" USING btree ("_locale");
  CREATE INDEX "_hp_l_faqs_v_order_idx" ON "_hp_l_faqs_v" USING btree ("_order");
  CREATE INDEX "_hp_l_faqs_v_parent_id_idx" ON "_hp_l_faqs_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_faqs_v_path_idx" ON "_hp_l_faqs_v" USING btree ("_path");
  CREATE INDEX "_hp_l_faqs_v_locale_idx" ON "_hp_l_faqs_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_contentFeed_v_kinds_order_idx" ON "_hp_l_contentFeed_v_kinds" USING btree ("order");
  CREATE INDEX "_hp_l_contentFeed_v_kinds_parent_idx" ON "_hp_l_contentFeed_v_kinds" USING btree ("parent_id");
  CREATE INDEX "_hp_l_contentFeed_v_kinds_locale_idx" ON "_hp_l_contentFeed_v_kinds" USING btree ("locale");
  CREATE INDEX "_hp_l_contentFeed_v_filters_regions_order_idx" ON "_hp_l_contentFeed_v_filters_regions" USING btree ("order");
  CREATE INDEX "_hp_l_contentFeed_v_filters_regions_parent_idx" ON "_hp_l_contentFeed_v_filters_regions" USING btree ("parent_id");
  CREATE INDEX "_hp_l_contentFeed_v_filters_regions_locale_idx" ON "_hp_l_contentFeed_v_filters_regions" USING btree ("locale");
  CREATE INDEX "_hp_l_contentFeed_v_order_idx" ON "_hp_l_contentFeed_v" USING btree ("_order");
  CREATE INDEX "_hp_l_contentFeed_v_parent_id_idx" ON "_hp_l_contentFeed_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_contentFeed_v_path_idx" ON "_hp_l_contentFeed_v" USING btree ("_path");
  CREATE INDEX "_hp_l_contentFeed_v_locale_idx" ON "_hp_l_contentFeed_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_eventsCalendar_v_order_idx" ON "_hp_l_eventsCalendar_v" USING btree ("_order");
  CREATE INDEX "_hp_l_eventsCalendar_v_parent_id_idx" ON "_hp_l_eventsCalendar_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_eventsCalendar_v_path_idx" ON "_hp_l_eventsCalendar_v" USING btree ("_path");
  CREATE INDEX "_hp_l_eventsCalendar_v_locale_idx" ON "_hp_l_eventsCalendar_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_peopleWidget_v_order_idx" ON "_hp_l_peopleWidget_v" USING btree ("_order");
  CREATE INDEX "_hp_l_peopleWidget_v_parent_id_idx" ON "_hp_l_peopleWidget_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_peopleWidget_v_path_idx" ON "_hp_l_peopleWidget_v" USING btree ("_path");
  CREATE INDEX "_hp_l_peopleWidget_v_locale_idx" ON "_hp_l_peopleWidget_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_gridCard_v_order_idx" ON "_hp_l_gridCard_v" USING btree ("_order");
  CREATE INDEX "_hp_l_gridCard_v_parent_id_idx" ON "_hp_l_gridCard_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_gridCard_v_path_idx" ON "_hp_l_gridCard_v" USING btree ("_path");
  CREATE INDEX "_hp_l_gridCard_v_locale_idx" ON "_hp_l_gridCard_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_gridCard_v_image_image_asset_idx" ON "_hp_l_gridCard_v" USING btree ("image_asset_id");
  CREATE INDEX "_hp_l_gridAgenda_v_order_idx" ON "_hp_l_gridAgenda_v" USING btree ("_order");
  CREATE INDEX "_hp_l_gridAgenda_v_parent_id_idx" ON "_hp_l_gridAgenda_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_gridAgenda_v_path_idx" ON "_hp_l_gridAgenda_v" USING btree ("_path");
  CREATE INDEX "_hp_l_gridAgenda_v_locale_idx" ON "_hp_l_gridAgenda_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_gridAgenda_v_agenda_idx" ON "_hp_l_gridAgenda_v" USING btree ("agenda_id");
  CREATE INDEX "_hp_l_gridNews_v_order_idx" ON "_hp_l_gridNews_v" USING btree ("_order");
  CREATE INDEX "_hp_l_gridNews_v_parent_id_idx" ON "_hp_l_gridNews_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_gridNews_v_path_idx" ON "_hp_l_gridNews_v" USING btree ("_path");
  CREATE INDEX "_hp_l_gridNews_v_locale_idx" ON "_hp_l_gridNews_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_gridNews_v_news_post_idx" ON "_hp_l_gridNews_v" USING btree ("news_post_id");
  CREATE INDEX "_hp_l_gridRow_v_order_idx" ON "_hp_l_gridRow_v" USING btree ("_order");
  CREATE INDEX "_hp_l_gridRow_v_parent_id_idx" ON "_hp_l_gridRow_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_gridRow_v_path_idx" ON "_hp_l_gridRow_v" USING btree ("_path");
  CREATE INDEX "_hp_l_gridRow_v_locale_idx" ON "_hp_l_gridRow_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_gridRow_v_background_background_svg_pattern_idx" ON "_hp_l_gridRow_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_l_gridRow_v_background_image_background_image_asset_idx" ON "_hp_l_gridRow_v" USING btree ("background_image_asset_id");
  CREATE INDEX "_hp_l_gridRow_v_header_image_header_image_asset_idx" ON "_hp_l_gridRow_v" USING btree ("header_image_asset_id");
  CREATE INDEX "_hp_l_regionMap_v_order_idx" ON "_hp_l_regionMap_v" USING btree ("_order");
  CREATE INDEX "_hp_l_regionMap_v_parent_id_idx" ON "_hp_l_regionMap_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_regionMap_v_path_idx" ON "_hp_l_regionMap_v" USING btree ("_path");
  CREATE INDEX "_hp_l_regionMap_v_locale_idx" ON "_hp_l_regionMap_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_atlasEmbed_v_order_idx" ON "_hp_l_atlasEmbed_v" USING btree ("_order");
  CREATE INDEX "_hp_l_atlasEmbed_v_parent_id_idx" ON "_hp_l_atlasEmbed_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_atlasEmbed_v_path_idx" ON "_hp_l_atlasEmbed_v" USING btree ("_path");
  CREATE INDEX "_hp_l_atlasEmbed_v_locale_idx" ON "_hp_l_atlasEmbed_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_cta1_v_links_order_idx" ON "_hp_l_cta1_v_links" USING btree ("_order");
  CREATE INDEX "_hp_l_cta1_v_links_parent_id_idx" ON "_hp_l_cta1_v_links" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_cta1_v_links_locale_idx" ON "_hp_l_cta1_v_links" USING btree ("_locale");
  CREATE INDEX "_hp_l_cta1_v_order_idx" ON "_hp_l_cta1_v" USING btree ("_order");
  CREATE INDEX "_hp_l_cta1_v_parent_id_idx" ON "_hp_l_cta1_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_cta1_v_path_idx" ON "_hp_l_cta1_v" USING btree ("_path");
  CREATE INDEX "_hp_l_cta1_v_locale_idx" ON "_hp_l_cta1_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_cta1_v_background_background_svg_pattern_idx" ON "_hp_l_cta1_v" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_hp_l_cta1_v_background_image_background_image_asset_idx" ON "_hp_l_cta1_v" USING btree ("background_image_asset_id");
  CREATE INDEX "_hp_l_submitStoryBanner_v_order_idx" ON "_hp_l_submitStoryBanner_v" USING btree ("_order");
  CREATE INDEX "_hp_l_submitStoryBanner_v_parent_id_idx" ON "_hp_l_submitStoryBanner_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_submitStoryBanner_v_path_idx" ON "_hp_l_submitStoryBanner_v" USING btree ("_path");
  CREATE INDEX "_hp_l_submitStoryBanner_v_locale_idx" ON "_hp_l_submitStoryBanner_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_submitStoryBanner_v_illustration_illustration_asse_idx" ON "_hp_l_submitStoryBanner_v" USING btree ("illustration_asset_id");
  CREATE INDEX "_hp_l_formNewsletter_v_order_idx" ON "_hp_l_formNewsletter_v" USING btree ("_order");
  CREATE INDEX "_hp_l_formNewsletter_v_parent_id_idx" ON "_hp_l_formNewsletter_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_formNewsletter_v_path_idx" ON "_hp_l_formNewsletter_v" USING btree ("_path");
  CREATE INDEX "_hp_l_formNewsletter_v_locale_idx" ON "_hp_l_formNewsletter_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_logoCloud1_v_images_order_idx" ON "_hp_l_logoCloud1_v_images" USING btree ("_order");
  CREATE INDEX "_hp_l_logoCloud1_v_images_parent_id_idx" ON "_hp_l_logoCloud1_v_images" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_logoCloud1_v_images_locale_idx" ON "_hp_l_logoCloud1_v_images" USING btree ("_locale");
  CREATE INDEX "_hp_l_logoCloud1_v_images_asset_idx" ON "_hp_l_logoCloud1_v_images" USING btree ("asset_id");
  CREATE INDEX "_hp_l_logoCloud1_v_order_idx" ON "_hp_l_logoCloud1_v" USING btree ("_order");
  CREATE INDEX "_hp_l_logoCloud1_v_parent_id_idx" ON "_hp_l_logoCloud1_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_logoCloud1_v_path_idx" ON "_hp_l_logoCloud1_v" USING btree ("_path");
  CREATE INDEX "_hp_l_logoCloud1_v_locale_idx" ON "_hp_l_logoCloud1_v" USING btree ("_locale");
  CREATE INDEX "_hp_l_carousel2_v_order_idx" ON "_hp_l_carousel2_v" USING btree ("_order");
  CREATE INDEX "_hp_l_carousel2_v_parent_id_idx" ON "_hp_l_carousel2_v" USING btree ("_parent_id");
  CREATE INDEX "_hp_l_carousel2_v_path_idx" ON "_hp_l_carousel2_v" USING btree ("_path");
  CREATE INDEX "_hp_l_carousel2_v_locale_idx" ON "_hp_l_carousel2_v" USING btree ("_locale");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_rels" ADD CONSTRAINT "regional_pages_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_rels" ADD CONSTRAINT "_regional_pages_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_organizations_id_idx" ON "pages_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "_pages_v_rels_organizations_id_idx" ON "_pages_v_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "regional_pages_rels_organizations_id_idx" ON "regional_pages_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "_regional_pages_v_rels_organizations_id_idx" ON "_regional_pages_v_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "homepage_rels_case_studies_id_idx" ON "homepage_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "homepage_rels_news_posts_id_idx" ON "homepage_rels" USING btree ("news_posts_id","locale");
  CREATE INDEX "homepage_rels_events_id_idx" ON "homepage_rels" USING btree ("events_id","locale");
  CREATE INDEX "homepage_rels_lived_experiences_id_idx" ON "homepage_rels" USING btree ("lived_experiences_id","locale");
  CREATE INDEX "homepage_rels_research_outputs_id_idx" ON "homepage_rels" USING btree ("research_outputs_id","locale");
  CREATE INDEX "homepage_rels_agendas_id_idx" ON "homepage_rels" USING btree ("agendas_id","locale");
  CREATE INDEX "homepage_rels_regional_communities_id_idx" ON "homepage_rels" USING btree ("regional_communities_id","locale");
  CREATE INDEX "homepage_rels_tags_id_idx" ON "homepage_rels" USING btree ("tags_id","locale");
  CREATE INDEX "homepage_rels_organizations_id_idx" ON "homepage_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "_homepage_v_rels_case_studies_id_idx" ON "_homepage_v_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "_homepage_v_rels_news_posts_id_idx" ON "_homepage_v_rels" USING btree ("news_posts_id","locale");
  CREATE INDEX "_homepage_v_rels_events_id_idx" ON "_homepage_v_rels" USING btree ("events_id","locale");
  CREATE INDEX "_homepage_v_rels_lived_experiences_id_idx" ON "_homepage_v_rels" USING btree ("lived_experiences_id","locale");
  CREATE INDEX "_homepage_v_rels_research_outputs_id_idx" ON "_homepage_v_rels" USING btree ("research_outputs_id","locale");
  CREATE INDEX "_homepage_v_rels_agendas_id_idx" ON "_homepage_v_rels" USING btree ("agendas_id","locale");
  CREATE INDEX "_homepage_v_rels_regional_communities_id_idx" ON "_homepage_v_rels" USING btree ("regional_communities_id","locale");
  CREATE INDEX "_homepage_v_rels_tags_id_idx" ON "_homepage_v_rels" USING btree ("tags_id","locale");
  CREATE INDEX "_homepage_v_rels_organizations_id_idx" ON "_homepage_v_rels" USING btree ("organizations_id","locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hp_s_hero1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_hero1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_hero1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_hero1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_hero2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_hero2_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_hero2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_hero2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_sectionHeader" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_sectionHeader_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_splitContent" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_splitContent_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_splitImage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_splitImage_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_splitRow" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_carousel1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_carousel1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_carousel1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_carousel1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_timelineRow_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_timelineRow_timelines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_timelineRow" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_faqs_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_faqs_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_contentFeed_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_contentFeed_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_contentFeed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_contentFeed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_eventsCalendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_eventsCalendar_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_peopleWidget" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_peopleWidget_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_gridCard" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_gridCard_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_gridAgenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_gridNews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_gridNews_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_gridRow" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_gridRow_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_regionMap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_regionMap_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_atlasEmbed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_cta1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_cta1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_cta1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_cta1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_submitStoryBanner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_submitStoryBanner_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_formNewsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_formNewsletter_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_logoCloud1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_logoCloud1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_logoCloud1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_logoCloud1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_carousel2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_s_carousel2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_hero1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_hero1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_hero2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_hero2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_sectionHeader" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_splitContent" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_splitImage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_splitRow" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_carousel1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_carousel1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_timelineRow_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_timelineRow" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_faqs_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_contentFeed_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_contentFeed_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_contentFeed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_eventsCalendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_peopleWidget" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_gridCard" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_gridAgenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_gridNews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_gridRow" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_regionMap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_atlasEmbed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_cta1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_cta1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_submitStoryBanner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_formNewsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_logoCloud1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_logoCloud1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hp_l_carousel2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_hero1_v_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_hero1_v_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_hero1_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_hero1_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_hero2_v_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_hero2_v_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_hero2_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_hero2_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_sectionHeader_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_sectionHeader_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_splitContent_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_splitContent_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_splitImage_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_splitImage_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_splitRow_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_carousel1_v_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_carousel1_v_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_carousel1_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_carousel1_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_timelineRow_v_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_timelineRow_v_timelines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_timelineRow_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_faqs_v_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_faqs_v_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_faqs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_contentFeed_v_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_contentFeed_v_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_contentFeed_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_contentFeed_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_eventsCalendar_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_eventsCalendar_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_peopleWidget_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_peopleWidget_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_gridCard_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_gridCard_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_gridAgenda_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_gridNews_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_gridNews_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_gridRow_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_gridRow_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_regionMap_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_regionMap_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_atlasEmbed_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_cta1_v_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_cta1_v_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_cta1_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_cta1_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_submitStoryBanner_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_submitStoryBanner_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_formNewsletter_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_formNewsletter_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_logoCloud1_v_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_logoCloud1_v_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_logoCloud1_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_logoCloud1_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_carousel2_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_s_carousel2_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_hero1_v_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_hero1_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_hero2_v_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_hero2_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_sectionHeader_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_splitContent_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_splitImage_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_splitRow_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_carousel1_v_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_carousel1_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_timelineRow_v_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_timelineRow_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_faqs_v_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_faqs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_contentFeed_v_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_contentFeed_v_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_contentFeed_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_eventsCalendar_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_peopleWidget_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_gridCard_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_gridAgenda_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_gridNews_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_gridRow_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_regionMap_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_atlasEmbed_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_cta1_v_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_cta1_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_submitStoryBanner_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_formNewsletter_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_logoCloud1_v_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_logoCloud1_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hp_l_carousel2_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hp_s_hero1_links" CASCADE;
  DROP TABLE "hp_s_hero1_links_locales" CASCADE;
  DROP TABLE "hp_s_hero1" CASCADE;
  DROP TABLE "hp_s_hero1_locales" CASCADE;
  DROP TABLE "hp_s_hero2_links" CASCADE;
  DROP TABLE "hp_s_hero2_links_locales" CASCADE;
  DROP TABLE "hp_s_hero2" CASCADE;
  DROP TABLE "hp_s_hero2_locales" CASCADE;
  DROP TABLE "hp_s_sectionHeader" CASCADE;
  DROP TABLE "hp_s_sectionHeader_locales" CASCADE;
  DROP TABLE "hp_s_splitContent" CASCADE;
  DROP TABLE "hp_s_splitContent_locales" CASCADE;
  DROP TABLE "hp_s_splitImage" CASCADE;
  DROP TABLE "hp_s_splitImage_locales" CASCADE;
  DROP TABLE "hp_s_splitRow" CASCADE;
  DROP TABLE "hp_s_carousel1_images" CASCADE;
  DROP TABLE "hp_s_carousel1_images_locales" CASCADE;
  DROP TABLE "hp_s_carousel1" CASCADE;
  DROP TABLE "hp_s_carousel1_locales" CASCADE;
  DROP TABLE "hp_s_timelineRow_timelines" CASCADE;
  DROP TABLE "hp_s_timelineRow_timelines_locales" CASCADE;
  DROP TABLE "hp_s_timelineRow" CASCADE;
  DROP TABLE "hp_s_faqs_faqs" CASCADE;
  DROP TABLE "hp_s_faqs_faqs_locales" CASCADE;
  DROP TABLE "hp_s_faqs" CASCADE;
  DROP TABLE "hp_s_contentFeed_kinds" CASCADE;
  DROP TABLE "hp_s_contentFeed_filters_regions" CASCADE;
  DROP TABLE "hp_s_contentFeed" CASCADE;
  DROP TABLE "hp_s_contentFeed_locales" CASCADE;
  DROP TABLE "hp_s_eventsCalendar" CASCADE;
  DROP TABLE "hp_s_eventsCalendar_locales" CASCADE;
  DROP TABLE "hp_s_peopleWidget" CASCADE;
  DROP TABLE "hp_s_peopleWidget_locales" CASCADE;
  DROP TABLE "hp_s_gridCard" CASCADE;
  DROP TABLE "hp_s_gridCard_locales" CASCADE;
  DROP TABLE "hp_s_gridAgenda" CASCADE;
  DROP TABLE "hp_s_gridNews" CASCADE;
  DROP TABLE "hp_s_gridNews_locales" CASCADE;
  DROP TABLE "hp_s_gridRow" CASCADE;
  DROP TABLE "hp_s_gridRow_locales" CASCADE;
  DROP TABLE "hp_s_regionMap" CASCADE;
  DROP TABLE "hp_s_regionMap_locales" CASCADE;
  DROP TABLE "hp_s_atlasEmbed" CASCADE;
  DROP TABLE "hp_s_cta1_links" CASCADE;
  DROP TABLE "hp_s_cta1_links_locales" CASCADE;
  DROP TABLE "hp_s_cta1" CASCADE;
  DROP TABLE "hp_s_cta1_locales" CASCADE;
  DROP TABLE "hp_s_submitStoryBanner" CASCADE;
  DROP TABLE "hp_s_submitStoryBanner_locales" CASCADE;
  DROP TABLE "hp_s_formNewsletter" CASCADE;
  DROP TABLE "hp_s_formNewsletter_locales" CASCADE;
  DROP TABLE "hp_s_logoCloud1_images" CASCADE;
  DROP TABLE "hp_s_logoCloud1_images_locales" CASCADE;
  DROP TABLE "hp_s_logoCloud1" CASCADE;
  DROP TABLE "hp_s_logoCloud1_locales" CASCADE;
  DROP TABLE "hp_s_carousel2" CASCADE;
  DROP TABLE "hp_s_carousel2_locales" CASCADE;
  DROP TABLE "hp_l_hero1_links" CASCADE;
  DROP TABLE "hp_l_hero1" CASCADE;
  DROP TABLE "hp_l_hero2_links" CASCADE;
  DROP TABLE "hp_l_hero2" CASCADE;
  DROP TABLE "hp_l_sectionHeader" CASCADE;
  DROP TABLE "hp_l_splitContent" CASCADE;
  DROP TABLE "hp_l_splitImage" CASCADE;
  DROP TABLE "hp_l_splitRow" CASCADE;
  DROP TABLE "hp_l_carousel1_images" CASCADE;
  DROP TABLE "hp_l_carousel1" CASCADE;
  DROP TABLE "hp_l_timelineRow_timelines" CASCADE;
  DROP TABLE "hp_l_timelineRow" CASCADE;
  DROP TABLE "hp_l_faqs_faqs" CASCADE;
  DROP TABLE "hp_l_faqs" CASCADE;
  DROP TABLE "hp_l_contentFeed_kinds" CASCADE;
  DROP TABLE "hp_l_contentFeed_filters_regions" CASCADE;
  DROP TABLE "hp_l_contentFeed" CASCADE;
  DROP TABLE "hp_l_eventsCalendar" CASCADE;
  DROP TABLE "hp_l_peopleWidget" CASCADE;
  DROP TABLE "hp_l_gridCard" CASCADE;
  DROP TABLE "hp_l_gridAgenda" CASCADE;
  DROP TABLE "hp_l_gridNews" CASCADE;
  DROP TABLE "hp_l_gridRow" CASCADE;
  DROP TABLE "hp_l_regionMap" CASCADE;
  DROP TABLE "hp_l_atlasEmbed" CASCADE;
  DROP TABLE "hp_l_cta1_links" CASCADE;
  DROP TABLE "hp_l_cta1" CASCADE;
  DROP TABLE "hp_l_submitStoryBanner" CASCADE;
  DROP TABLE "hp_l_formNewsletter" CASCADE;
  DROP TABLE "hp_l_logoCloud1_images" CASCADE;
  DROP TABLE "hp_l_logoCloud1" CASCADE;
  DROP TABLE "hp_l_carousel2" CASCADE;
  DROP TABLE "_hp_s_hero1_v_links" CASCADE;
  DROP TABLE "_hp_s_hero1_v_links_locales" CASCADE;
  DROP TABLE "_hp_s_hero1_v" CASCADE;
  DROP TABLE "_hp_s_hero1_v_locales" CASCADE;
  DROP TABLE "_hp_s_hero2_v_links" CASCADE;
  DROP TABLE "_hp_s_hero2_v_links_locales" CASCADE;
  DROP TABLE "_hp_s_hero2_v" CASCADE;
  DROP TABLE "_hp_s_hero2_v_locales" CASCADE;
  DROP TABLE "_hp_s_sectionHeader_v" CASCADE;
  DROP TABLE "_hp_s_sectionHeader_v_locales" CASCADE;
  DROP TABLE "_hp_s_splitContent_v" CASCADE;
  DROP TABLE "_hp_s_splitContent_v_locales" CASCADE;
  DROP TABLE "_hp_s_splitImage_v" CASCADE;
  DROP TABLE "_hp_s_splitImage_v_locales" CASCADE;
  DROP TABLE "_hp_s_splitRow_v" CASCADE;
  DROP TABLE "_hp_s_carousel1_v_images" CASCADE;
  DROP TABLE "_hp_s_carousel1_v_images_locales" CASCADE;
  DROP TABLE "_hp_s_carousel1_v" CASCADE;
  DROP TABLE "_hp_s_carousel1_v_locales" CASCADE;
  DROP TABLE "_hp_s_timelineRow_v_timelines" CASCADE;
  DROP TABLE "_hp_s_timelineRow_v_timelines_locales" CASCADE;
  DROP TABLE "_hp_s_timelineRow_v" CASCADE;
  DROP TABLE "_hp_s_faqs_v_faqs" CASCADE;
  DROP TABLE "_hp_s_faqs_v_faqs_locales" CASCADE;
  DROP TABLE "_hp_s_faqs_v" CASCADE;
  DROP TABLE "_hp_s_contentFeed_v_kinds" CASCADE;
  DROP TABLE "_hp_s_contentFeed_v_filters_regions" CASCADE;
  DROP TABLE "_hp_s_contentFeed_v" CASCADE;
  DROP TABLE "_hp_s_contentFeed_v_locales" CASCADE;
  DROP TABLE "_hp_s_eventsCalendar_v" CASCADE;
  DROP TABLE "_hp_s_eventsCalendar_v_locales" CASCADE;
  DROP TABLE "_hp_s_peopleWidget_v" CASCADE;
  DROP TABLE "_hp_s_peopleWidget_v_locales" CASCADE;
  DROP TABLE "_hp_s_gridCard_v" CASCADE;
  DROP TABLE "_hp_s_gridCard_v_locales" CASCADE;
  DROP TABLE "_hp_s_gridAgenda_v" CASCADE;
  DROP TABLE "_hp_s_gridNews_v" CASCADE;
  DROP TABLE "_hp_s_gridNews_v_locales" CASCADE;
  DROP TABLE "_hp_s_gridRow_v" CASCADE;
  DROP TABLE "_hp_s_gridRow_v_locales" CASCADE;
  DROP TABLE "_hp_s_regionMap_v" CASCADE;
  DROP TABLE "_hp_s_regionMap_v_locales" CASCADE;
  DROP TABLE "_hp_s_atlasEmbed_v" CASCADE;
  DROP TABLE "_hp_s_cta1_v_links" CASCADE;
  DROP TABLE "_hp_s_cta1_v_links_locales" CASCADE;
  DROP TABLE "_hp_s_cta1_v" CASCADE;
  DROP TABLE "_hp_s_cta1_v_locales" CASCADE;
  DROP TABLE "_hp_s_submitStoryBanner_v" CASCADE;
  DROP TABLE "_hp_s_submitStoryBanner_v_locales" CASCADE;
  DROP TABLE "_hp_s_formNewsletter_v" CASCADE;
  DROP TABLE "_hp_s_formNewsletter_v_locales" CASCADE;
  DROP TABLE "_hp_s_logoCloud1_v_images" CASCADE;
  DROP TABLE "_hp_s_logoCloud1_v_images_locales" CASCADE;
  DROP TABLE "_hp_s_logoCloud1_v" CASCADE;
  DROP TABLE "_hp_s_logoCloud1_v_locales" CASCADE;
  DROP TABLE "_hp_s_carousel2_v" CASCADE;
  DROP TABLE "_hp_s_carousel2_v_locales" CASCADE;
  DROP TABLE "_hp_l_hero1_v_links" CASCADE;
  DROP TABLE "_hp_l_hero1_v" CASCADE;
  DROP TABLE "_hp_l_hero2_v_links" CASCADE;
  DROP TABLE "_hp_l_hero2_v" CASCADE;
  DROP TABLE "_hp_l_sectionHeader_v" CASCADE;
  DROP TABLE "_hp_l_splitContent_v" CASCADE;
  DROP TABLE "_hp_l_splitImage_v" CASCADE;
  DROP TABLE "_hp_l_splitRow_v" CASCADE;
  DROP TABLE "_hp_l_carousel1_v_images" CASCADE;
  DROP TABLE "_hp_l_carousel1_v" CASCADE;
  DROP TABLE "_hp_l_timelineRow_v_timelines" CASCADE;
  DROP TABLE "_hp_l_timelineRow_v" CASCADE;
  DROP TABLE "_hp_l_faqs_v_faqs" CASCADE;
  DROP TABLE "_hp_l_faqs_v" CASCADE;
  DROP TABLE "_hp_l_contentFeed_v_kinds" CASCADE;
  DROP TABLE "_hp_l_contentFeed_v_filters_regions" CASCADE;
  DROP TABLE "_hp_l_contentFeed_v" CASCADE;
  DROP TABLE "_hp_l_eventsCalendar_v" CASCADE;
  DROP TABLE "_hp_l_peopleWidget_v" CASCADE;
  DROP TABLE "_hp_l_gridCard_v" CASCADE;
  DROP TABLE "_hp_l_gridAgenda_v" CASCADE;
  DROP TABLE "_hp_l_gridNews_v" CASCADE;
  DROP TABLE "_hp_l_gridRow_v" CASCADE;
  DROP TABLE "_hp_l_regionMap_v" CASCADE;
  DROP TABLE "_hp_l_atlasEmbed_v" CASCADE;
  DROP TABLE "_hp_l_cta1_v_links" CASCADE;
  DROP TABLE "_hp_l_cta1_v" CASCADE;
  DROP TABLE "_hp_l_submitStoryBanner_v" CASCADE;
  DROP TABLE "_hp_l_formNewsletter_v" CASCADE;
  DROP TABLE "_hp_l_logoCloud1_v_images" CASCADE;
  DROP TABLE "_hp_l_logoCloud1_v" CASCADE;
  DROP TABLE "_hp_l_carousel2_v" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_organizations_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_organizations_fk";
  
  ALTER TABLE "regional_pages_rels" DROP CONSTRAINT "regional_pages_rels_organizations_fk";
  
  ALTER TABLE "_regional_pages_v_rels" DROP CONSTRAINT "_regional_pages_v_rels_organizations_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_case_studies_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_news_posts_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_events_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_lived_experiences_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_research_outputs_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_agendas_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_regional_communities_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_tags_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_organizations_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_case_studies_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_news_posts_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_events_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_lived_experiences_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_research_outputs_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_agendas_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_regional_communities_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_tags_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT "_homepage_v_rels_organizations_fk";
  
  DROP INDEX "pages_rels_organizations_id_idx";
  DROP INDEX "_pages_v_rels_organizations_id_idx";
  DROP INDEX "regional_pages_rels_organizations_id_idx";
  DROP INDEX "_regional_pages_v_rels_organizations_id_idx";
  DROP INDEX "homepage_rels_case_studies_id_idx";
  DROP INDEX "homepage_rels_news_posts_id_idx";
  DROP INDEX "homepage_rels_events_id_idx";
  DROP INDEX "homepage_rels_lived_experiences_id_idx";
  DROP INDEX "homepage_rels_research_outputs_id_idx";
  DROP INDEX "homepage_rels_agendas_id_idx";
  DROP INDEX "homepage_rels_regional_communities_id_idx";
  DROP INDEX "homepage_rels_tags_id_idx";
  DROP INDEX "homepage_rels_organizations_id_idx";
  DROP INDEX "_homepage_v_rels_case_studies_id_idx";
  DROP INDEX "_homepage_v_rels_news_posts_id_idx";
  DROP INDEX "_homepage_v_rels_events_id_idx";
  DROP INDEX "_homepage_v_rels_lived_experiences_id_idx";
  DROP INDEX "_homepage_v_rels_research_outputs_id_idx";
  DROP INDEX "_homepage_v_rels_agendas_id_idx";
  DROP INDEX "_homepage_v_rels_regional_communities_id_idx";
  DROP INDEX "_homepage_v_rels_tags_id_idx";
  DROP INDEX "_homepage_v_rels_organizations_id_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "regional_pages_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "_regional_pages_v_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "organizations" DROP COLUMN "show_on_site";
  ALTER TABLE "homepage" DROP COLUMN "layout_per_language";
  ALTER TABLE "homepage_rels" DROP COLUMN "case_studies_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "news_posts_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "events_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "lived_experiences_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "research_outputs_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "agendas_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "regional_communities_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "tags_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_layout_per_language";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "case_studies_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "news_posts_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "events_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "lived_experiences_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "research_outputs_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "agendas_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "regional_communities_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "tags_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "organizations_id";
  DROP TYPE "public"."enum_hp_s_hero1_image_position";
  DROP TYPE "public"."enum_hp_s_sectionHeader_section_width";
  DROP TYPE "public"."enum_hp_s_sectionHeader_stack_align";
  DROP TYPE "public"."enum_hp_s_carousel1_size";
  DROP TYPE "public"."enum_hp_s_carousel1_indicators";
  DROP TYPE "public"."enum_hp_s_contentFeed_kinds";
  DROP TYPE "public"."enum_hp_s_contentFeed_filters_regions";
  DROP TYPE "public"."enum_hp_s_contentFeed_fill";
  DROP TYPE "public"."enum_hp_s_contentFeed_sort";
  DROP TYPE "public"."enum_hp_s_contentFeed_layout";
  DROP TYPE "public"."enum_hp_s_peopleWidget_region";
  DROP TYPE "public"."enum_hp_s_gridRow_grid_columns";
  DROP TYPE "public"."enum_hp_s_gridRow_card_variant";
  DROP TYPE "public"."enum_hp_s_gridRow_mode";
  DROP TYPE "public"."enum_hp_s_atlasEmbed_region";
  DROP TYPE "public"."enum_hp_s_cta1_section_width";
  DROP TYPE "public"."enum_hp_s_cta1_stack_align";
  DROP TYPE "public"."enum_hp_s_logoCloud1_images_org_type";
  DROP TYPE "public"."enum_hp_s_logoCloud1_layout";
  DROP TYPE "public"."enum_hp_s_logoCloud1_motion_speed";
  DROP TYPE "public"."enum_hp_l_hero1_image_position";
  DROP TYPE "public"."enum_hp_l_sectionHeader_section_width";
  DROP TYPE "public"."enum_hp_l_sectionHeader_stack_align";
  DROP TYPE "public"."enum_hp_l_carousel1_size";
  DROP TYPE "public"."enum_hp_l_carousel1_indicators";
  DROP TYPE "public"."enum_hp_l_contentFeed_kinds";
  DROP TYPE "public"."enum_hp_l_contentFeed_filters_regions";
  DROP TYPE "public"."enum_hp_l_contentFeed_fill";
  DROP TYPE "public"."enum_hp_l_contentFeed_sort";
  DROP TYPE "public"."enum_hp_l_contentFeed_layout";
  DROP TYPE "public"."enum_hp_l_peopleWidget_region";
  DROP TYPE "public"."enum_hp_l_gridRow_grid_columns";
  DROP TYPE "public"."enum_hp_l_gridRow_card_variant";
  DROP TYPE "public"."enum_hp_l_gridRow_mode";
  DROP TYPE "public"."enum_hp_l_atlasEmbed_region";
  DROP TYPE "public"."enum_hp_l_cta1_section_width";
  DROP TYPE "public"."enum_hp_l_cta1_stack_align";
  DROP TYPE "public"."enum_hp_l_logoCloud1_images_org_type";
  DROP TYPE "public"."enum_hp_l_logoCloud1_layout";
  DROP TYPE "public"."enum_hp_l_logoCloud1_motion_speed";
  DROP TYPE "public"."enum__hp_s_hero1_v_image_position";
  DROP TYPE "public"."enum__hp_s_sectionHeader_v_section_width";
  DROP TYPE "public"."enum__hp_s_sectionHeader_v_stack_align";
  DROP TYPE "public"."enum__hp_s_carousel1_v_size";
  DROP TYPE "public"."enum__hp_s_carousel1_v_indicators";
  DROP TYPE "public"."enum__hp_s_contentFeed_v_kinds";
  DROP TYPE "public"."enum__hp_s_contentFeed_v_filters_regions";
  DROP TYPE "public"."enum__hp_s_contentFeed_v_fill";
  DROP TYPE "public"."enum__hp_s_contentFeed_v_sort";
  DROP TYPE "public"."enum__hp_s_contentFeed_v_layout";
  DROP TYPE "public"."enum__hp_s_peopleWidget_v_region";
  DROP TYPE "public"."enum__hp_s_gridRow_v_grid_columns";
  DROP TYPE "public"."enum__hp_s_gridRow_v_card_variant";
  DROP TYPE "public"."enum__hp_s_gridRow_v_mode";
  DROP TYPE "public"."enum__hp_s_atlasEmbed_v_region";
  DROP TYPE "public"."enum__hp_s_cta1_v_section_width";
  DROP TYPE "public"."enum__hp_s_cta1_v_stack_align";
  DROP TYPE "public"."enum__hp_s_logoCloud1_v_images_org_type";
  DROP TYPE "public"."enum__hp_s_logoCloud1_v_layout";
  DROP TYPE "public"."enum__hp_s_logoCloud1_v_motion_speed";
  DROP TYPE "public"."enum__hp_l_hero1_v_image_position";
  DROP TYPE "public"."enum__hp_l_sectionHeader_v_section_width";
  DROP TYPE "public"."enum__hp_l_sectionHeader_v_stack_align";
  DROP TYPE "public"."enum__hp_l_carousel1_v_size";
  DROP TYPE "public"."enum__hp_l_carousel1_v_indicators";
  DROP TYPE "public"."enum__hp_l_contentFeed_v_kinds";
  DROP TYPE "public"."enum__hp_l_contentFeed_v_filters_regions";
  DROP TYPE "public"."enum__hp_l_contentFeed_v_fill";
  DROP TYPE "public"."enum__hp_l_contentFeed_v_sort";
  DROP TYPE "public"."enum__hp_l_contentFeed_v_layout";
  DROP TYPE "public"."enum__hp_l_peopleWidget_v_region";
  DROP TYPE "public"."enum__hp_l_gridRow_v_grid_columns";
  DROP TYPE "public"."enum__hp_l_gridRow_v_card_variant";
  DROP TYPE "public"."enum__hp_l_gridRow_v_mode";
  DROP TYPE "public"."enum__hp_l_atlasEmbed_v_region";
  DROP TYPE "public"."enum__hp_l_cta1_v_section_width";
  DROP TYPE "public"."enum__hp_l_cta1_v_stack_align";
  DROP TYPE "public"."enum__hp_l_logoCloud1_v_images_org_type";
  DROP TYPE "public"."enum__hp_l_logoCloud1_v_layout";
  DROP TYPE "public"."enum__hp_l_logoCloud1_v_motion_speed";`)
}
