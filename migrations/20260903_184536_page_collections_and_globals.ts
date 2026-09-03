import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_btn_variant" AS ENUM('default', 'secondary', 'outline', 'ghost', 'link', 'invert', 'light-invert', 'destructive', 'primary');
  CREATE TYPE "public"."enum_btn_size" AS ENUM('default', 'lg', 'wide', 'sm', 'thick');
  CREATE TYPE "public"."enum_btn_stroke" AS ENUM('none', 'light', 'midnight');
  CREATE TYPE "public"."enum_bg_type" AS ENUM('none', 'ccm-palette', 'color', 'gradient', 'svg', 'image');
  CREATE TYPE "public"."enum_bg_ccm_color" AS ENUM('ccm-sky', 'ccm-water', 'ccm-sea', 'ccm-midnight');
  CREATE TYPE "public"."enum_bg_gradient_direction" AS ENUM('to-r', 'to-l', 'to-b', 'to-t', 'to-br', 'to-bl', 'to-tr', 'to-tl');
  CREATE TYPE "public"."enum_pages_blocks_hero1_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_pages_blocks_section_header_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_pages_blocks_section_header_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_pages_blocks_grid_row_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_pages_blocks_grid_row_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_grid_row_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_pages_blocks_cta1_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_pages_blocks_cta1_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_pages_blocks_logo_cloud1_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_pages_blocks_logo_cloud1_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_pages_blocks_logo_cloud1_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum_regional_pages_blocks_grid_case_study_custom_layout" AS ENUM('default', 'compact', 'featured', 'minimal');
  CREATE TYPE "public"."enum_regional_pages_blocks_content_grid_content_type" AS ENUM('agendas', 'caseStudies', 'news', 'livedExperiences', 'team', 'testimonials');
  CREATE TYPE "public"."enum_regional_pages_blocks_content_grid_mode" AS ENUM('manual', 'dynamic-featured', 'dynamic-recent', 'dynamic-with-pinned', 'dynamic');
  CREATE TYPE "public"."enum_regional_pages_blocks_content_grid_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_regional_pages_logo_cloud_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_regional_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_regional_pages_welcome_hero_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_regional_pages_why_join_c_t_a_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_regional_pages_logo_cloud_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_regional_pages_logo_cloud_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__regional_pages_v_blocks_grid_case_study_custom_layout" AS ENUM('default', 'compact', 'featured', 'minimal');
  CREATE TYPE "public"."enum__regional_pages_v_blocks_content_grid_content_type" AS ENUM('agendas', 'caseStudies', 'news', 'livedExperiences', 'team', 'testimonials');
  CREATE TYPE "public"."enum__regional_pages_v_blocks_content_grid_mode" AS ENUM('manual', 'dynamic-featured', 'dynamic-recent', 'dynamic-with-pinned', 'dynamic');
  CREATE TYPE "public"."enum__regional_pages_v_blocks_content_grid_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__regional_pages_v_version_logo_cloud_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__regional_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__regional_pages_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TYPE "public"."enum__regional_pages_v_version_welcome_hero_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__regional_pages_v_version_why_join_c_t_a_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__regional_pages_v_version_logo_cloud_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__regional_pages_v_version_logo_cloud_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum_homepage_partner_logos_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_homepage_hero_welcome_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_homepage_agendas_module_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_homepage_agendas_module_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_homepage_agendas_module_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_homepage_regional_communities_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_homepage_regional_communities_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_homepage_regional_communities_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_homepage_news_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_homepage_news_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_homepage_news_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_homepage_mental_health_definition_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_homepage_mental_health_definition_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_partner_logos_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_homepage_partner_logos_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum_site_announcement_variant" AS ENUM('brand', 'info', 'success', 'warning');
  CREATE TABLE "pages_blocks_hero1_links" (
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
  
  CREATE TABLE "pages_blocks_hero1" (
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
  	"background_svg_pattern_id" integer,
  	"background_image_asset_id" integer,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_asset_id" integer,
  	"image_alt" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"image_position" "enum_pages_blocks_hero1_image_position" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_section_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum_pages_blocks_section_header_section_width" DEFAULT 'default',
  	"stack_align" "enum_pages_blocks_section_header_stack_align" DEFAULT 'left',
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_split_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
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
  
  CREATE TABLE "pages_blocks_split_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" integer,
  	"image_alt" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_split_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_grid_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"image_asset_id" integer,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_grid_agenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"agenda_id" varchar NOT NULL,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_grid_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"news_post_id" varchar NOT NULL,
  	"show_tags" boolean DEFAULT true,
  	"show_author" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_location" boolean DEFAULT false,
  	"custom_excerpt" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_grid_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
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
  	"background_svg_pattern_id" integer,
  	"background_image_asset_id" integer,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_asset_id" integer,
  	"header_image_alt" varchar,
  	"grid_columns" "enum_pages_blocks_grid_row_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum_pages_blocks_grid_row_card_variant" DEFAULT 'classic',
  	"mode" "enum_pages_blocks_grid_row_mode" DEFAULT 'manual',
  	"max_items" numeric DEFAULT 3,
  	"initial_display_count" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta1_links" (
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
  
  CREATE TABLE "pages_blocks_cta1" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
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
  	"background_svg_pattern_id" integer,
  	"background_image_asset_id" integer,
  	"background_image_alt" varchar,
  	"background_light_text" boolean DEFAULT false,
  	"background_blob_accent" boolean DEFAULT false,
  	"section_width" "enum_pages_blocks_cta1_section_width" DEFAULT 'default',
  	"stack_align" "enum_pages_blocks_cta1_stack_align" DEFAULT 'left',
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_logo_cloud1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" integer,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum_pages_blocks_logo_cloud1_images_org_type"
  );
  
  CREATE TABLE "pages_blocks_logo_cloud1" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum_pages_blocks_logo_cloud1_layout" DEFAULT 'marquee',
  	"motion_speed" "enum_pages_blocks_logo_cloud1_motion_speed" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"noindex" boolean DEFAULT false,
  	"og_image_asset_id" integer,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"testimonials_id" varchar
  );
  
  CREATE TABLE "regional_pages_welcome_hero_links" (
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
  
  CREATE TABLE "regional_pages_why_join_c_t_a_links" (
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
  
  CREATE TABLE "regional_pages_blocks_grid_agenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"agenda_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_pages_blocks_grid_case_study" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"case_study_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_authors" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_study_period" boolean DEFAULT false,
  	"show_location" boolean DEFAULT false,
  	"custom_excerpt" varchar,
  	"custom_layout" "enum_regional_pages_blocks_grid_case_study_custom_layout" DEFAULT 'default',
  	"priority" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_pages_blocks_grid_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
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
  
  CREATE TABLE "regional_pages_blocks_content_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content_type" "enum_regional_pages_blocks_content_grid_content_type",
  	"mode" "enum_regional_pages_blocks_content_grid_mode" DEFAULT 'dynamic-featured',
  	"grid_columns" "enum_regional_pages_blocks_content_grid_grid_columns" DEFAULT 'grid-cols-3',
  	"max_items" numeric,
  	"initial_display_count" numeric,
  	"show_title" boolean DEFAULT true,
  	"title" varchar,
  	"subtitle" varchar,
  	"show_description" boolean DEFAULT false,
  	"description" jsonb,
  	"header_image_asset_id" integer,
  	"header_image_alt" varchar,
  	"display_role" boolean DEFAULT true,
  	"display_affiliation" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_pages_logo_cloud_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" integer,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum_regional_pages_logo_cloud_images_org_type"
  );
  
  CREATE TABLE "regional_pages" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"regional_community_id" varchar,
  	"atlas_embed_enabled" boolean,
  	"atlas_embed_show_breakdown" boolean DEFAULT true,
  	"noindex" boolean DEFAULT false,
  	"og_image_asset_id" integer,
  	"order_rank" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_regional_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "regional_pages_locales" (
  	"title" varchar,
  	"welcome_hero_background_type" "enum_bg_type" DEFAULT 'none',
  	"welcome_hero_background_ccm_color" "enum_bg_ccm_color",
  	"welcome_hero_background_color" varchar,
  	"welcome_hero_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"welcome_hero_background_gradient_start_color" varchar,
  	"welcome_hero_background_gradient_end_color" varchar,
  	"welcome_hero_background_svg_pattern_id" integer,
  	"welcome_hero_background_image_asset_id" integer,
  	"welcome_hero_background_image_alt" varchar,
  	"welcome_hero_background_light_text" boolean DEFAULT false,
  	"welcome_hero_background_blob_accent" boolean DEFAULT false,
  	"welcome_hero_tag_line" varchar,
  	"welcome_hero_title" varchar,
  	"welcome_hero_body" jsonb,
  	"welcome_hero_image_asset_id" integer,
  	"welcome_hero_image_alt" varchar,
  	"welcome_hero_padding_top" boolean,
  	"welcome_hero_padding_bottom" boolean,
  	"welcome_hero_image_position" "enum_regional_pages_welcome_hero_image_position" DEFAULT 'right',
  	"why_join_c_t_a_background_type" "enum_bg_type" DEFAULT 'none',
  	"why_join_c_t_a_background_ccm_color" "enum_bg_ccm_color",
  	"why_join_c_t_a_background_color" varchar,
  	"why_join_c_t_a_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"why_join_c_t_a_background_gradient_start_color" varchar,
  	"why_join_c_t_a_background_gradient_end_color" varchar,
  	"why_join_c_t_a_background_svg_pattern_id" integer,
  	"why_join_c_t_a_background_image_asset_id" integer,
  	"why_join_c_t_a_background_image_alt" varchar,
  	"why_join_c_t_a_background_light_text" boolean DEFAULT false,
  	"why_join_c_t_a_background_blob_accent" boolean DEFAULT false,
  	"why_join_c_t_a_tag_line" varchar,
  	"why_join_c_t_a_title" varchar,
  	"why_join_c_t_a_body" jsonb,
  	"why_join_c_t_a_image_asset_id" integer,
  	"why_join_c_t_a_image_alt" varchar,
  	"why_join_c_t_a_padding_top" boolean,
  	"why_join_c_t_a_padding_bottom" boolean,
  	"why_join_c_t_a_image_position" "enum_regional_pages_why_join_c_t_a_image_position" DEFAULT 'right',
  	"logo_cloud_padding_top" boolean,
  	"logo_cloud_padding_bottom" boolean,
  	"logo_cloud_title" varchar,
  	"logo_cloud_description" varchar,
  	"logo_cloud_layout" "enum_regional_pages_logo_cloud_layout" DEFAULT 'marquee',
  	"logo_cloud_motion_speed" "enum_regional_pages_logo_cloud_motion_speed" DEFAULT 'default',
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"authors_id" varchar,
  	"testimonials_id" varchar
  );
  
  CREATE TABLE "_regional_pages_v_version_welcome_hero_links" (
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
  
  CREATE TABLE "_regional_pages_v_version_why_join_c_t_a_links" (
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
  
  CREATE TABLE "_regional_pages_v_blocks_grid_agenda" (
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
  
  CREATE TABLE "_regional_pages_v_blocks_grid_case_study" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"case_study_id" varchar,
  	"show_tags" boolean DEFAULT true,
  	"show_authors" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_study_period" boolean DEFAULT false,
  	"show_location" boolean DEFAULT false,
  	"custom_excerpt" varchar,
  	"custom_layout" "enum__regional_pages_v_blocks_grid_case_study_custom_layout" DEFAULT 'default',
  	"priority" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_pages_v_blocks_grid_news" (
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
  
  CREATE TABLE "_regional_pages_v_blocks_content_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content_type" "enum__regional_pages_v_blocks_content_grid_content_type",
  	"mode" "enum__regional_pages_v_blocks_content_grid_mode" DEFAULT 'dynamic-featured',
  	"grid_columns" "enum__regional_pages_v_blocks_content_grid_grid_columns" DEFAULT 'grid-cols-3',
  	"max_items" numeric,
  	"initial_display_count" numeric,
  	"show_title" boolean DEFAULT true,
  	"title" varchar,
  	"subtitle" varchar,
  	"show_description" boolean DEFAULT false,
  	"description" jsonb,
  	"header_image_asset_id" integer,
  	"header_image_alt" varchar,
  	"display_role" boolean DEFAULT true,
  	"display_affiliation" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_pages_v_version_logo_cloud_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" integer,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum__regional_pages_v_version_logo_cloud_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_slug" varchar,
  	"version_regional_community_id" varchar,
  	"version_atlas_embed_enabled" boolean,
  	"version_atlas_embed_show_breakdown" boolean DEFAULT true,
  	"version_noindex" boolean DEFAULT false,
  	"version_og_image_asset_id" integer,
  	"version_order_rank" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__regional_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__regional_pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_regional_pages_v_locales" (
  	"version_title" varchar,
  	"version_welcome_hero_background_type" "enum_bg_type" DEFAULT 'none',
  	"version_welcome_hero_background_ccm_color" "enum_bg_ccm_color",
  	"version_welcome_hero_background_color" varchar,
  	"version_welcome_hero_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"version_welcome_hero_background_gradient_start_color" varchar,
  	"version_welcome_hero_background_gradient_end_color" varchar,
  	"version_welcome_hero_background_svg_pattern_id" integer,
  	"version_welcome_hero_background_image_asset_id" integer,
  	"version_welcome_hero_background_image_alt" varchar,
  	"version_welcome_hero_background_light_text" boolean DEFAULT false,
  	"version_welcome_hero_background_blob_accent" boolean DEFAULT false,
  	"version_welcome_hero_tag_line" varchar,
  	"version_welcome_hero_title" varchar,
  	"version_welcome_hero_body" jsonb,
  	"version_welcome_hero_image_asset_id" integer,
  	"version_welcome_hero_image_alt" varchar,
  	"version_welcome_hero_padding_top" boolean,
  	"version_welcome_hero_padding_bottom" boolean,
  	"version_welcome_hero_image_position" "enum__regional_pages_v_version_welcome_hero_image_position" DEFAULT 'right',
  	"version_why_join_c_t_a_background_type" "enum_bg_type" DEFAULT 'none',
  	"version_why_join_c_t_a_background_ccm_color" "enum_bg_ccm_color",
  	"version_why_join_c_t_a_background_color" varchar,
  	"version_why_join_c_t_a_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"version_why_join_c_t_a_background_gradient_start_color" varchar,
  	"version_why_join_c_t_a_background_gradient_end_color" varchar,
  	"version_why_join_c_t_a_background_svg_pattern_id" integer,
  	"version_why_join_c_t_a_background_image_asset_id" integer,
  	"version_why_join_c_t_a_background_image_alt" varchar,
  	"version_why_join_c_t_a_background_light_text" boolean DEFAULT false,
  	"version_why_join_c_t_a_background_blob_accent" boolean DEFAULT false,
  	"version_why_join_c_t_a_tag_line" varchar,
  	"version_why_join_c_t_a_title" varchar,
  	"version_why_join_c_t_a_body" jsonb,
  	"version_why_join_c_t_a_image_asset_id" integer,
  	"version_why_join_c_t_a_image_alt" varchar,
  	"version_why_join_c_t_a_padding_top" boolean,
  	"version_why_join_c_t_a_padding_bottom" boolean,
  	"version_why_join_c_t_a_image_position" "enum__regional_pages_v_version_why_join_c_t_a_image_position" DEFAULT 'right',
  	"version_logo_cloud_padding_top" boolean,
  	"version_logo_cloud_padding_bottom" boolean,
  	"version_logo_cloud_title" varchar,
  	"version_logo_cloud_description" varchar,
  	"version_logo_cloud_layout" "enum__regional_pages_v_version_logo_cloud_layout" DEFAULT 'marquee',
  	"version_logo_cloud_motion_speed" "enum__regional_pages_v_version_logo_cloud_motion_speed" DEFAULT 'default',
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"authors_id" varchar,
  	"testimonials_id" varchar
  );
  
  CREATE TABLE "homepage_hero_welcome_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "homepage_blocks_split_content" (
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
  
  CREATE TABLE "homepage_blocks_split_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" integer,
  	"image_alt" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_grid_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"image_asset_id" integer,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"link_href" varchar,
  	"link_target" boolean,
  	"link_button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"link_button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"link_button_variant_stroke" "enum_btn_stroke" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_grid_agenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"agenda_id" varchar NOT NULL,
  	"show_tags" boolean DEFAULT true,
  	"show_download_buttons" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_grid_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"news_post_id" varchar NOT NULL,
  	"show_tags" boolean DEFAULT true,
  	"show_author" boolean DEFAULT true,
  	"show_metadata" boolean DEFAULT true,
  	"show_location" boolean DEFAULT false,
  	"custom_excerpt" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_mental_health_definition_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "homepage_partner_logos_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" integer,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum_homepage_partner_logos_images_org_type"
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"noindex" boolean DEFAULT false,
  	"og_image_asset_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_locales" (
  	"title" varchar,
  	"hero_welcome_background_type" "enum_bg_type" DEFAULT 'none',
  	"hero_welcome_background_ccm_color" "enum_bg_ccm_color",
  	"hero_welcome_background_color" varchar,
  	"hero_welcome_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"hero_welcome_background_gradient_start_color" varchar,
  	"hero_welcome_background_gradient_end_color" varchar,
  	"hero_welcome_background_svg_pattern_id" integer,
  	"hero_welcome_background_image_asset_id" integer,
  	"hero_welcome_background_image_alt" varchar,
  	"hero_welcome_background_light_text" boolean DEFAULT false,
  	"hero_welcome_background_blob_accent" boolean DEFAULT false,
  	"hero_welcome_tag_line" varchar,
  	"hero_welcome_title" varchar,
  	"hero_welcome_body" jsonb,
  	"hero_welcome_image_asset_id" integer,
  	"hero_welcome_image_alt" varchar,
  	"hero_welcome_padding_top" boolean,
  	"hero_welcome_padding_bottom" boolean,
  	"hero_welcome_image_position" "enum_homepage_hero_welcome_image_position" DEFAULT 'right',
  	"global_agenda_padding_top" boolean,
  	"global_agenda_padding_bottom" boolean,
  	"global_agenda_no_gap" boolean DEFAULT false,
  	"how_to_use_padding_top" boolean,
  	"how_to_use_padding_bottom" boolean,
  	"how_to_use_no_gap" boolean DEFAULT false,
  	"agendas_module_padding_top" boolean,
  	"agendas_module_padding_bottom" boolean,
  	"agendas_module_background_type" "enum_bg_type" DEFAULT 'none',
  	"agendas_module_background_ccm_color" "enum_bg_ccm_color",
  	"agendas_module_background_color" varchar,
  	"agendas_module_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"agendas_module_background_gradient_start_color" varchar,
  	"agendas_module_background_gradient_end_color" varchar,
  	"agendas_module_background_svg_pattern_id" integer,
  	"agendas_module_background_image_asset_id" integer,
  	"agendas_module_background_image_alt" varchar,
  	"agendas_module_background_light_text" boolean DEFAULT false,
  	"agendas_module_background_blob_accent" boolean DEFAULT false,
  	"agendas_module_title" varchar,
  	"agendas_module_subtitle" varchar,
  	"agendas_module_description" jsonb,
  	"agendas_module_header_image_asset_id" integer,
  	"agendas_module_header_image_alt" varchar,
  	"agendas_module_grid_columns" "enum_homepage_agendas_module_grid_columns" DEFAULT 'grid-cols-3',
  	"agendas_module_card_variant" "enum_homepage_agendas_module_card_variant" DEFAULT 'classic',
  	"agendas_module_mode" "enum_homepage_agendas_module_mode" DEFAULT 'manual',
  	"agendas_module_max_items" numeric DEFAULT 3,
  	"agendas_module_initial_display_count" numeric,
  	"lived_experiences_title" varchar,
  	"lived_experiences_description" varchar,
  	"lived_experiences_padding_top" boolean,
  	"lived_experiences_padding_bottom" boolean,
  	"regional_communities_padding_top" boolean,
  	"regional_communities_padding_bottom" boolean,
  	"regional_communities_background_type" "enum_bg_type" DEFAULT 'none',
  	"regional_communities_background_ccm_color" "enum_bg_ccm_color",
  	"regional_communities_background_color" varchar,
  	"regional_communities_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"regional_communities_background_gradient_start_color" varchar,
  	"regional_communities_background_gradient_end_color" varchar,
  	"regional_communities_background_svg_pattern_id" integer,
  	"regional_communities_background_image_asset_id" integer,
  	"regional_communities_background_image_alt" varchar,
  	"regional_communities_background_light_text" boolean DEFAULT false,
  	"regional_communities_background_blob_accent" boolean DEFAULT false,
  	"regional_communities_title" varchar,
  	"regional_communities_subtitle" varchar,
  	"regional_communities_description" jsonb,
  	"regional_communities_header_image_asset_id" integer,
  	"regional_communities_header_image_alt" varchar,
  	"regional_communities_grid_columns" "enum_homepage_regional_communities_grid_columns" DEFAULT 'grid-cols-3',
  	"regional_communities_card_variant" "enum_homepage_regional_communities_card_variant" DEFAULT 'classic',
  	"regional_communities_mode" "enum_homepage_regional_communities_mode" DEFAULT 'manual',
  	"regional_communities_max_items" numeric DEFAULT 3,
  	"regional_communities_initial_display_count" numeric,
  	"collaboration_padding_top" boolean,
  	"collaboration_padding_bottom" boolean,
  	"collaboration_no_gap" boolean DEFAULT false,
  	"news_padding_top" boolean,
  	"news_padding_bottom" boolean,
  	"news_background_type" "enum_bg_type" DEFAULT 'none',
  	"news_background_ccm_color" "enum_bg_ccm_color",
  	"news_background_color" varchar,
  	"news_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"news_background_gradient_start_color" varchar,
  	"news_background_gradient_end_color" varchar,
  	"news_background_svg_pattern_id" integer,
  	"news_background_image_asset_id" integer,
  	"news_background_image_alt" varchar,
  	"news_background_light_text" boolean DEFAULT false,
  	"news_background_blob_accent" boolean DEFAULT false,
  	"news_title" varchar,
  	"news_subtitle" varchar,
  	"news_description" jsonb,
  	"news_header_image_asset_id" integer,
  	"news_header_image_alt" varchar,
  	"news_grid_columns" "enum_homepage_news_grid_columns" DEFAULT 'grid-cols-3',
  	"news_card_variant" "enum_homepage_news_card_variant" DEFAULT 'classic',
  	"news_mode" "enum_homepage_news_mode" DEFAULT 'manual',
  	"news_max_items" numeric DEFAULT 3,
  	"news_initial_display_count" numeric,
  	"project_info_padding_top" boolean,
  	"project_info_padding_bottom" boolean,
  	"project_info_no_gap" boolean DEFAULT false,
  	"mental_health_definition_padding_top" boolean,
  	"mental_health_definition_padding_bottom" boolean,
  	"mental_health_definition_background_type" "enum_bg_type" DEFAULT 'none',
  	"mental_health_definition_background_ccm_color" "enum_bg_ccm_color",
  	"mental_health_definition_background_color" varchar,
  	"mental_health_definition_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r',
  	"mental_health_definition_background_gradient_start_color" varchar,
  	"mental_health_definition_background_gradient_end_color" varchar,
  	"mental_health_definition_background_svg_pattern_id" integer,
  	"mental_health_definition_background_image_asset_id" integer,
  	"mental_health_definition_background_image_alt" varchar,
  	"mental_health_definition_background_light_text" boolean DEFAULT false,
  	"mental_health_definition_background_blob_accent" boolean DEFAULT false,
  	"mental_health_definition_section_width" "enum_homepage_mental_health_definition_section_width" DEFAULT 'default',
  	"mental_health_definition_stack_align" "enum_homepage_mental_health_definition_stack_align" DEFAULT 'left',
  	"mental_health_definition_tag_line" varchar,
  	"mental_health_definition_title" varchar,
  	"mental_health_definition_body" jsonb,
  	"partner_logos_padding_top" boolean,
  	"partner_logos_padding_bottom" boolean,
  	"partner_logos_title" varchar,
  	"partner_logos_description" varchar,
  	"partner_logos_layout" "enum_homepage_partner_logos_layout" DEFAULT 'marquee',
  	"partner_logos_motion_speed" "enum_homepage_partner_logos_motion_speed" DEFAULT 'default',
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"testimonials_id" varchar
  );
  
  CREATE TABLE "site_announcement" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"variant" "enum_site_announcement_variant" DEFAULT 'brand',
  	"link_url" varchar,
  	"dismissible" boolean DEFAULT true,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_announcement_locales" (
  	"message" varchar NOT NULL,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "moderation_settings_block_terms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"term" varchar NOT NULL
  );
  
  CREATE TABLE "moderation_settings_review_terms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"term" varchar NOT NULL
  );
  
  CREATE TABLE "moderation_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "hub_illustrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"atlas_header_asset_id" integer,
  	"search_header_asset_id" integer,
  	"collaborate_header_asset_id" integer,
  	"empty_state_asset_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "hub_illustrations_locales" (
  	"atlas_header_alt" varchar,
  	"search_header_alt" varchar,
  	"collaborate_header_alt" varchar,
  	"empty_state_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "onboarding_content_welcome_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "onboarding_content_welcome_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step" varchar
  );
  
  CREATE TABLE "onboarding_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "onboarding_content_locales" (
  	"title" varchar,
  	"welcome_title" varchar,
  	"welcome_subtitle" varchar,
  	"welcome_description" varchar,
  	"getting_started_title" varchar,
  	"getting_started_description" varchar,
  	"get_started_text" varchar,
  	"time_estimate" varchar,
  	"basic_info_title" varchar,
  	"basic_info_description" varchar,
  	"basic_info_field_hints_username_hint" varchar,
  	"basic_info_field_hints_headline_hint" varchar,
  	"basic_info_field_hints_bio_hint" varchar,
  	"basic_info_field_hints_motivation_hint" varchar,
  	"basic_info_field_hints_language_hint" varchar,
  	"work_info_title" varchar,
  	"work_info_description" varchar,
  	"work_info_field_hints_work_types_description" varchar,
  	"work_info_field_hints_expertise_description" varchar,
  	"work_info_field_hints_work_bio_hint" varchar,
  	"work_info_field_hints_social_links_description" varchar,
  	"work_info_field_hints_communities_description" varchar,
  	"community_info_title" varchar,
  	"community_info_description" varchar,
  	"community_info_field_hints_communities_description" varchar,
  	"community_info_field_hints_communities_hint" varchar,
  	"community_info_field_hints_optional_note" varchar,
  	"recent_work_title" varchar,
  	"recent_work_description" varchar,
  	"recent_work_field_hints_work_link_hint" varchar,
  	"recent_work_field_hints_is_ongoing_hint" varchar,
  	"recent_work_field_hints_no_work_description" varchar,
  	"privacy_title" varchar,
  	"privacy_description" varchar,
  	"searchability_title" varchar,
  	"searchability_description" varchar,
  	"searchability_hint" varchar,
  	"visibility_title" varchar,
  	"visibility_description" varchar,
  	"visibility_options_public_title" varchar,
  	"visibility_options_public_description" varchar,
  	"visibility_options_members_title" varchar,
  	"visibility_options_members_description" varchar,
  	"visibility_options_private_title" varchar,
  	"visibility_options_private_description" varchar,
  	"profile_info_title" varchar,
  	"profile_info_description" varchar,
  	"privacy_field_hints_email_hint" varchar,
  	"privacy_field_hints_phone_hint" varchar,
  	"privacy_field_hints_work_hint" varchar,
  	"privacy_field_hints_social_hint" varchar,
  	"privacy_field_hints_location_hint" varchar,
  	"review_title" varchar,
  	"review_description" varchar,
  	"review_ready_title" varchar,
  	"review_ready_description" varchar,
  	"complete_onboarding_text" varchar,
  	"redirect_dialog_title" varchar,
  	"redirect_dialog_message" varchar,
  	"proceed_to_onboarding_text" varchar,
  	"continue_to_hub_text" varchar,
  	"one_time_waiver_text" varchar,
  	"navigation_texts_continue" varchar,
  	"navigation_texts_back" varchar,
  	"navigation_texts_submit" varchar,
  	"navigation_texts_submitting" varchar,
  	"validation_messages_basic_info_first_name_required" varchar,
  	"validation_messages_basic_info_first_name_too_long" varchar,
  	"validation_messages_basic_info_last_name_required" varchar,
  	"validation_messages_basic_info_last_name_too_long" varchar,
  	"validation_messages_basic_info_username_required" varchar,
  	"validation_messages_basic_info_username_too_short" varchar,
  	"validation_messages_basic_info_username_too_long" varchar,
  	"validation_messages_basic_info_username_invalid_format" varchar,
  	"validation_messages_basic_info_bio_too_long" varchar,
  	"validation_messages_basic_info_country_required" varchar,
  	"validation_messages_basic_info_city_required" varchar,
  	"validation_messages_work_info_work_types_required" varchar,
  	"validation_messages_work_info_expertise_areas_required" varchar,
  	"validation_messages_work_info_work_bio_too_long" varchar,
  	"validation_messages_work_info_invalid_linked_in_url" varchar,
  	"validation_messages_work_info_invalid_website_url" varchar,
  	"validation_messages_work_info_invalid_social_link_url" varchar,
  	"validation_messages_work_info_social_link_platform_required" varchar,
  	"validation_messages_recent_work_title_required" varchar,
  	"validation_messages_recent_work_title_too_long" varchar,
  	"validation_messages_recent_work_description_required" varchar,
  	"validation_messages_recent_work_description_too_long" varchar,
  	"validation_messages_recent_work_invalid_url" varchar,
  	"validation_messages_recent_work_start_date_required" varchar,
  	"validation_messages_recent_work_end_date_required" varchar,
  	"validation_messages_general_please_complete_required" varchar,
  	"validation_messages_general_validation_error" varchar,
  	"validation_messages_general_submission_error" varchar,
  	"field_labels_basic_info_first_name" varchar,
  	"field_labels_basic_info_last_name" varchar,
  	"field_labels_basic_info_username" varchar,
  	"field_labels_basic_info_headline" varchar,
  	"field_labels_basic_info_headline_placeholder" varchar,
  	"field_labels_basic_info_bio" varchar,
  	"field_labels_basic_info_bio_placeholder" varchar,
  	"field_labels_basic_info_motivation" varchar,
  	"field_labels_basic_info_motivation_placeholder" varchar,
  	"field_labels_basic_info_age_group" varchar,
  	"field_labels_basic_info_select_age" varchar,
  	"field_labels_basic_info_under18" varchar,
  	"field_labels_basic_info_above18" varchar,
  	"field_labels_basic_info_country" varchar,
  	"field_labels_basic_info_city" varchar,
  	"field_labels_basic_info_preferred_language" varchar,
  	"field_labels_basic_info_first_name_placeholder" varchar,
  	"field_labels_basic_info_last_name_placeholder" varchar,
  	"field_labels_basic_info_username_placeholder" varchar,
  	"field_labels_basic_info_country_placeholder" varchar,
  	"field_labels_basic_info_city_placeholder" varchar,
  	"field_labels_work_info_work_types" varchar,
  	"field_labels_work_info_expertise_areas" varchar,
  	"field_labels_work_info_regional_communities" varchar,
  	"field_labels_work_info_regional_communities_hint" varchar,
  	"field_labels_work_info_organization" varchar,
  	"field_labels_work_info_organization_placeholder" varchar,
  	"field_labels_work_info_position" varchar,
  	"field_labels_work_info_position_placeholder" varchar,
  	"field_labels_work_info_work_bio" varchar,
  	"field_labels_work_info_work_bio_placeholder" varchar,
  	"field_labels_work_info_social_links" varchar,
  	"field_labels_work_info_linkedin" varchar,
  	"field_labels_work_info_linkedin_placeholder" varchar,
  	"field_labels_work_info_other_links" varchar,
  	"field_labels_work_info_other_links_hint" varchar,
  	"field_labels_work_info_website" varchar,
  	"field_labels_work_info_website_placeholder" varchar,
  	"field_labels_recent_work_your_work" varchar,
  	"field_labels_recent_work_add_work" varchar,
  	"field_labels_recent_work_edit_work" varchar,
  	"field_labels_recent_work_update_work" varchar,
  	"field_labels_recent_work_work_title" varchar,
  	"field_labels_recent_work_work_title_placeholder" varchar,
  	"field_labels_recent_work_description" varchar,
  	"field_labels_recent_work_description_placeholder" varchar,
  	"field_labels_recent_work_project_link" varchar,
  	"field_labels_recent_work_start_date" varchar,
  	"field_labels_recent_work_end_date" varchar,
  	"field_labels_recent_work_ongoing_project" varchar,
  	"field_labels_recent_work_ongoing" varchar,
  	"field_labels_recent_work_view_project" varchar,
  	"field_labels_recent_work_cancel" varchar,
  	"field_labels_recent_work_no_work_added" varchar,
  	"field_labels_recent_work_add_work_hint" varchar,
  	"field_labels_review_basic_info" varchar,
  	"field_labels_review_work_info" varchar,
  	"field_labels_review_recent_work" varchar,
  	"field_labels_review_privacy_settings" varchar,
  	"field_labels_review_name" varchar,
  	"field_labels_review_username" varchar,
  	"field_labels_review_location" varchar,
  	"field_labels_review_language" varchar,
  	"field_labels_review_age_group" varchar,
  	"field_labels_review_bio" varchar,
  	"field_labels_review_work_types" varchar,
  	"field_labels_review_expertise_areas" varchar,
  	"field_labels_review_regional_communities" varchar,
  	"field_labels_review_organization" varchar,
  	"field_labels_review_position" varchar,
  	"field_labels_review_work_bio" varchar,
  	"field_labels_review_social_links" varchar,
  	"field_labels_review_profile_visibility" varchar,
  	"field_labels_review_searchable" varchar,
  	"field_labels_review_show_email" varchar,
  	"field_labels_review_show_phone" varchar,
  	"field_labels_review_show_work" varchar,
  	"field_labels_review_show_social" varchar,
  	"field_labels_review_show_location" varchar,
  	"field_labels_review_yes" varchar,
  	"field_labels_review_no" varchar,
  	"field_labels_review_under18" varchar,
  	"field_labels_review_above18" varchar,
  	"field_labels_review_ready_to_submit" varchar,
  	"field_labels_review_submission_note" varchar,
  	"privacy_field_labels_allow_search" varchar,
  	"privacy_field_labels_search_hint" varchar,
  	"privacy_field_labels_show_email" varchar,
  	"privacy_field_labels_email_hint" varchar,
  	"privacy_field_labels_show_phone" varchar,
  	"privacy_field_labels_phone_hint" varchar,
  	"privacy_field_labels_show_work" varchar,
  	"privacy_field_labels_work_hint" varchar,
  	"privacy_field_labels_show_social" varchar,
  	"privacy_field_labels_social_hint" varchar,
  	"privacy_field_labels_show_location" varchar,
  	"privacy_field_labels_location_hint" varchar,
  	"visibility_labels_public" varchar,
  	"visibility_labels_members" varchar,
  	"visibility_labels_private" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "regional_pages_id" varchar;
  ALTER TABLE "pages_blocks_hero1_links" ADD CONSTRAINT "pages_blocks_hero1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1" ADD CONSTRAINT "pages_blocks_hero1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1" ADD CONSTRAINT "pages_blocks_hero1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1" ADD CONSTRAINT "pages_blocks_hero1_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero1" ADD CONSTRAINT "pages_blocks_hero1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_section_header" ADD CONSTRAINT "pages_blocks_section_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_content" ADD CONSTRAINT "pages_blocks_split_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_image" ADD CONSTRAINT "pages_blocks_split_image_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_image" ADD CONSTRAINT "pages_blocks_split_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_split_row" ADD CONSTRAINT "pages_blocks_split_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_card" ADD CONSTRAINT "pages_blocks_grid_card_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_card" ADD CONSTRAINT "pages_blocks_grid_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_agenda" ADD CONSTRAINT "pages_blocks_grid_agenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_agenda" ADD CONSTRAINT "pages_blocks_grid_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_news" ADD CONSTRAINT "pages_blocks_grid_news_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_news" ADD CONSTRAINT "pages_blocks_grid_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row" ADD CONSTRAINT "pages_blocks_grid_row_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row" ADD CONSTRAINT "pages_blocks_grid_row_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row" ADD CONSTRAINT "pages_blocks_grid_row_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_grid_row" ADD CONSTRAINT "pages_blocks_grid_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel2" ADD CONSTRAINT "pages_blocks_carousel2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1_links" ADD CONSTRAINT "pages_blocks_cta1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1" ADD CONSTRAINT "pages_blocks_cta1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1" ADD CONSTRAINT "pages_blocks_cta1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta1" ADD CONSTRAINT "pages_blocks_cta1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud1_images" ADD CONSTRAINT "pages_blocks_logo_cloud1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud1_images" ADD CONSTRAINT "pages_blocks_logo_cloud1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_cloud1" ADD CONSTRAINT "pages_blocks_logo_cloud1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_og_image_asset_id_media_id_fk" FOREIGN KEY ("og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_welcome_hero_links" ADD CONSTRAINT "regional_pages_welcome_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_why_join_c_t_a_links" ADD CONSTRAINT "regional_pages_why_join_c_t_a_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_blocks_grid_agenda" ADD CONSTRAINT "regional_pages_blocks_grid_agenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_blocks_grid_agenda" ADD CONSTRAINT "regional_pages_blocks_grid_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_blocks_grid_case_study" ADD CONSTRAINT "regional_pages_blocks_grid_case_study_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_blocks_grid_case_study" ADD CONSTRAINT "regional_pages_blocks_grid_case_study_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_blocks_grid_news" ADD CONSTRAINT "regional_pages_blocks_grid_news_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_blocks_grid_news" ADD CONSTRAINT "regional_pages_blocks_grid_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_blocks_content_grid" ADD CONSTRAINT "regional_pages_blocks_content_grid_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_blocks_content_grid" ADD CONSTRAINT "regional_pages_blocks_content_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_logo_cloud_images" ADD CONSTRAINT "regional_pages_logo_cloud_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_logo_cloud_images" ADD CONSTRAINT "regional_pages_logo_cloud_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages" ADD CONSTRAINT "regional_pages_regional_community_id_regional_communities_id_fk" FOREIGN KEY ("regional_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages" ADD CONSTRAINT "regional_pages_og_image_asset_id_media_id_fk" FOREIGN KEY ("og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_locales" ADD CONSTRAINT "regional_pages_locales_welcome_hero_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("welcome_hero_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_locales" ADD CONSTRAINT "regional_pages_locales_welcome_hero_background_image_asset_id_media_id_fk" FOREIGN KEY ("welcome_hero_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_locales" ADD CONSTRAINT "regional_pages_locales_welcome_hero_image_asset_id_media_id_fk" FOREIGN KEY ("welcome_hero_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_locales" ADD CONSTRAINT "regional_pages_locales_why_join_c_t_a_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("why_join_c_t_a_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_locales" ADD CONSTRAINT "regional_pages_locales_why_join_c_t_a_background_image_asset_id_media_id_fk" FOREIGN KEY ("why_join_c_t_a_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_locales" ADD CONSTRAINT "regional_pages_locales_why_join_c_t_a_image_asset_id_media_id_fk" FOREIGN KEY ("why_join_c_t_a_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_pages_locales" ADD CONSTRAINT "regional_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_rels" ADD CONSTRAINT "regional_pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_rels" ADD CONSTRAINT "regional_pages_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_pages_rels" ADD CONSTRAINT "regional_pages_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_version_welcome_hero_links" ADD CONSTRAINT "_regional_pages_v_version_welcome_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_version_why_join_c_t_a_links" ADD CONSTRAINT "_regional_pages_v_version_why_join_c_t_a_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_blocks_grid_agenda" ADD CONSTRAINT "_regional_pages_v_blocks_grid_agenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_blocks_grid_agenda" ADD CONSTRAINT "_regional_pages_v_blocks_grid_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_blocks_grid_case_study" ADD CONSTRAINT "_regional_pages_v_blocks_grid_case_study_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_blocks_grid_case_study" ADD CONSTRAINT "_regional_pages_v_blocks_grid_case_study_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_blocks_grid_news" ADD CONSTRAINT "_regional_pages_v_blocks_grid_news_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_blocks_grid_news" ADD CONSTRAINT "_regional_pages_v_blocks_grid_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_blocks_content_grid" ADD CONSTRAINT "_regional_pages_v_blocks_content_grid_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_blocks_content_grid" ADD CONSTRAINT "_regional_pages_v_blocks_content_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_version_logo_cloud_images" ADD CONSTRAINT "_regional_pages_v_version_logo_cloud_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_version_logo_cloud_images" ADD CONSTRAINT "_regional_pages_v_version_logo_cloud_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v" ADD CONSTRAINT "_regional_pages_v_parent_id_regional_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v" ADD CONSTRAINT "_regional_pages_v_version_regional_community_id_regional_communities_id_fk" FOREIGN KEY ("version_regional_community_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v" ADD CONSTRAINT "_regional_pages_v_version_og_image_asset_id_media_id_fk" FOREIGN KEY ("version_og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_locales" ADD CONSTRAINT "_regional_pages_v_locales_version_welcome_hero_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("version_welcome_hero_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_locales" ADD CONSTRAINT "_regional_pages_v_locales_version_welcome_hero_background_image_asset_id_media_id_fk" FOREIGN KEY ("version_welcome_hero_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_locales" ADD CONSTRAINT "_regional_pages_v_locales_version_welcome_hero_image_asset_id_media_id_fk" FOREIGN KEY ("version_welcome_hero_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_locales" ADD CONSTRAINT "_regional_pages_v_locales_version_why_join_c_t_a_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("version_why_join_c_t_a_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_locales" ADD CONSTRAINT "_regional_pages_v_locales_version_why_join_c_t_a_background_image_asset_id_media_id_fk" FOREIGN KEY ("version_why_join_c_t_a_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_locales" ADD CONSTRAINT "_regional_pages_v_locales_version_why_join_c_t_a_image_asset_id_media_id_fk" FOREIGN KEY ("version_why_join_c_t_a_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_locales" ADD CONSTRAINT "_regional_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_rels" ADD CONSTRAINT "_regional_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_regional_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_rels" ADD CONSTRAINT "_regional_pages_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_pages_v_rels" ADD CONSTRAINT "_regional_pages_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_hero_welcome_links" ADD CONSTRAINT "homepage_hero_welcome_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_content" ADD CONSTRAINT "homepage_blocks_split_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_image" ADD CONSTRAINT "homepage_blocks_split_image_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_split_image" ADD CONSTRAINT "homepage_blocks_split_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_card" ADD CONSTRAINT "homepage_blocks_grid_card_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_card" ADD CONSTRAINT "homepage_blocks_grid_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_agenda" ADD CONSTRAINT "homepage_blocks_grid_agenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_agenda" ADD CONSTRAINT "homepage_blocks_grid_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_news" ADD CONSTRAINT "homepage_blocks_grid_news_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_grid_news" ADD CONSTRAINT "homepage_blocks_grid_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_mental_health_definition_links" ADD CONSTRAINT "homepage_mental_health_definition_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_partner_logos_images" ADD CONSTRAINT "homepage_partner_logos_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_partner_logos_images" ADD CONSTRAINT "homepage_partner_logos_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_og_image_asset_id_media_id_fk" FOREIGN KEY ("og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_hero_welcome_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("hero_welcome_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_hero_welcome_background_image_asset_id_media_id_fk" FOREIGN KEY ("hero_welcome_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_hero_welcome_image_asset_id_media_id_fk" FOREIGN KEY ("hero_welcome_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_agendas_module_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("agendas_module_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_agendas_module_background_image_asset_id_media_id_fk" FOREIGN KEY ("agendas_module_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_agendas_module_header_image_asset_id_media_id_fk" FOREIGN KEY ("agendas_module_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_regional_communities_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("regional_communities_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_regional_communities_background_image_asset_id_media_id_fk" FOREIGN KEY ("regional_communities_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_regional_communities_header_image_asset_id_media_id_fk" FOREIGN KEY ("regional_communities_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_news_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("news_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_news_background_image_asset_id_media_id_fk" FOREIGN KEY ("news_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_news_header_image_asset_id_media_id_fk" FOREIGN KEY ("news_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_mental_health_definition_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("mental_health_definition_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_mental_health_definition_background_image_asset_id_media_id_fk" FOREIGN KEY ("mental_health_definition_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_announcement_locales" ADD CONSTRAINT "site_announcement_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_announcement"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "moderation_settings_block_terms" ADD CONSTRAINT "moderation_settings_block_terms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."moderation_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "moderation_settings_review_terms" ADD CONSTRAINT "moderation_settings_review_terms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."moderation_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hub_illustrations" ADD CONSTRAINT "hub_illustrations_atlas_header_asset_id_media_id_fk" FOREIGN KEY ("atlas_header_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hub_illustrations" ADD CONSTRAINT "hub_illustrations_search_header_asset_id_media_id_fk" FOREIGN KEY ("search_header_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hub_illustrations" ADD CONSTRAINT "hub_illustrations_collaborate_header_asset_id_media_id_fk" FOREIGN KEY ("collaborate_header_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hub_illustrations" ADD CONSTRAINT "hub_illustrations_empty_state_asset_id_media_id_fk" FOREIGN KEY ("empty_state_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hub_illustrations_locales" ADD CONSTRAINT "hub_illustrations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hub_illustrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_content_welcome_features" ADD CONSTRAINT "onboarding_content_welcome_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_content_welcome_steps" ADD CONSTRAINT "onboarding_content_welcome_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_content_locales" ADD CONSTRAINT "onboarding_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero1_links_order_idx" ON "pages_blocks_hero1_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero1_links_parent_id_idx" ON "pages_blocks_hero1_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero1_links_locale_idx" ON "pages_blocks_hero1_links" USING btree ("_locale");
  CREATE INDEX "pages_blocks_hero1_order_idx" ON "pages_blocks_hero1" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero1_parent_id_idx" ON "pages_blocks_hero1" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero1_path_idx" ON "pages_blocks_hero1" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero1_locale_idx" ON "pages_blocks_hero1" USING btree ("_locale");
  CREATE INDEX "pages_blocks_hero1_background_background_svg_pattern_idx" ON "pages_blocks_hero1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_hero1_background_image_background_image_ass_idx" ON "pages_blocks_hero1" USING btree ("background_image_asset_id");
  CREATE INDEX "pages_blocks_hero1_image_image_asset_idx" ON "pages_blocks_hero1" USING btree ("image_asset_id");
  CREATE INDEX "pages_blocks_section_header_order_idx" ON "pages_blocks_section_header" USING btree ("_order");
  CREATE INDEX "pages_blocks_section_header_parent_id_idx" ON "pages_blocks_section_header" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_section_header_path_idx" ON "pages_blocks_section_header" USING btree ("_path");
  CREATE INDEX "pages_blocks_section_header_locale_idx" ON "pages_blocks_section_header" USING btree ("_locale");
  CREATE INDEX "pages_blocks_split_content_order_idx" ON "pages_blocks_split_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_content_parent_id_idx" ON "pages_blocks_split_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_content_path_idx" ON "pages_blocks_split_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_split_content_locale_idx" ON "pages_blocks_split_content" USING btree ("_locale");
  CREATE INDEX "pages_blocks_split_image_order_idx" ON "pages_blocks_split_image" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_image_parent_id_idx" ON "pages_blocks_split_image" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_image_path_idx" ON "pages_blocks_split_image" USING btree ("_path");
  CREATE INDEX "pages_blocks_split_image_locale_idx" ON "pages_blocks_split_image" USING btree ("_locale");
  CREATE INDEX "pages_blocks_split_image_image_image_asset_idx" ON "pages_blocks_split_image" USING btree ("image_asset_id");
  CREATE INDEX "pages_blocks_split_row_order_idx" ON "pages_blocks_split_row" USING btree ("_order");
  CREATE INDEX "pages_blocks_split_row_parent_id_idx" ON "pages_blocks_split_row" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_split_row_path_idx" ON "pages_blocks_split_row" USING btree ("_path");
  CREATE INDEX "pages_blocks_split_row_locale_idx" ON "pages_blocks_split_row" USING btree ("_locale");
  CREATE INDEX "pages_blocks_grid_card_order_idx" ON "pages_blocks_grid_card" USING btree ("_order");
  CREATE INDEX "pages_blocks_grid_card_parent_id_idx" ON "pages_blocks_grid_card" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_grid_card_path_idx" ON "pages_blocks_grid_card" USING btree ("_path");
  CREATE INDEX "pages_blocks_grid_card_locale_idx" ON "pages_blocks_grid_card" USING btree ("_locale");
  CREATE INDEX "pages_blocks_grid_card_image_image_asset_idx" ON "pages_blocks_grid_card" USING btree ("image_asset_id");
  CREATE INDEX "pages_blocks_grid_agenda_order_idx" ON "pages_blocks_grid_agenda" USING btree ("_order");
  CREATE INDEX "pages_blocks_grid_agenda_parent_id_idx" ON "pages_blocks_grid_agenda" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_grid_agenda_path_idx" ON "pages_blocks_grid_agenda" USING btree ("_path");
  CREATE INDEX "pages_blocks_grid_agenda_locale_idx" ON "pages_blocks_grid_agenda" USING btree ("_locale");
  CREATE INDEX "pages_blocks_grid_agenda_agenda_idx" ON "pages_blocks_grid_agenda" USING btree ("agenda_id");
  CREATE INDEX "pages_blocks_grid_news_order_idx" ON "pages_blocks_grid_news" USING btree ("_order");
  CREATE INDEX "pages_blocks_grid_news_parent_id_idx" ON "pages_blocks_grid_news" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_grid_news_path_idx" ON "pages_blocks_grid_news" USING btree ("_path");
  CREATE INDEX "pages_blocks_grid_news_locale_idx" ON "pages_blocks_grid_news" USING btree ("_locale");
  CREATE INDEX "pages_blocks_grid_news_news_post_idx" ON "pages_blocks_grid_news" USING btree ("news_post_id");
  CREATE INDEX "pages_blocks_grid_row_order_idx" ON "pages_blocks_grid_row" USING btree ("_order");
  CREATE INDEX "pages_blocks_grid_row_parent_id_idx" ON "pages_blocks_grid_row" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_grid_row_path_idx" ON "pages_blocks_grid_row" USING btree ("_path");
  CREATE INDEX "pages_blocks_grid_row_locale_idx" ON "pages_blocks_grid_row" USING btree ("_locale");
  CREATE INDEX "pages_blocks_grid_row_background_background_svg_pattern_idx" ON "pages_blocks_grid_row" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_grid_row_background_image_background_image__idx" ON "pages_blocks_grid_row" USING btree ("background_image_asset_id");
  CREATE INDEX "pages_blocks_grid_row_header_image_header_image_asset_idx" ON "pages_blocks_grid_row" USING btree ("header_image_asset_id");
  CREATE INDEX "pages_blocks_carousel2_order_idx" ON "pages_blocks_carousel2" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel2_parent_id_idx" ON "pages_blocks_carousel2" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel2_path_idx" ON "pages_blocks_carousel2" USING btree ("_path");
  CREATE INDEX "pages_blocks_carousel2_locale_idx" ON "pages_blocks_carousel2" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta1_links_order_idx" ON "pages_blocks_cta1_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta1_links_parent_id_idx" ON "pages_blocks_cta1_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta1_links_locale_idx" ON "pages_blocks_cta1_links" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta1_order_idx" ON "pages_blocks_cta1" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta1_parent_id_idx" ON "pages_blocks_cta1" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta1_path_idx" ON "pages_blocks_cta1" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta1_locale_idx" ON "pages_blocks_cta1" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta1_background_background_svg_pattern_idx" ON "pages_blocks_cta1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "pages_blocks_cta1_background_image_background_image_asse_idx" ON "pages_blocks_cta1" USING btree ("background_image_asset_id");
  CREATE INDEX "pages_blocks_logo_cloud1_images_order_idx" ON "pages_blocks_logo_cloud1_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_cloud1_images_parent_id_idx" ON "pages_blocks_logo_cloud1_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_cloud1_images_locale_idx" ON "pages_blocks_logo_cloud1_images" USING btree ("_locale");
  CREATE INDEX "pages_blocks_logo_cloud1_images_asset_idx" ON "pages_blocks_logo_cloud1_images" USING btree ("asset_id");
  CREATE INDEX "pages_blocks_logo_cloud1_order_idx" ON "pages_blocks_logo_cloud1" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_cloud1_parent_id_idx" ON "pages_blocks_logo_cloud1" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_cloud1_path_idx" ON "pages_blocks_logo_cloud1" USING btree ("_path");
  CREATE INDEX "pages_blocks_logo_cloud1_locale_idx" ON "pages_blocks_logo_cloud1" USING btree ("_locale");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_og_image_og_image_asset_idx" ON "pages" USING btree ("og_image_asset_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_locale_idx" ON "pages_rels" USING btree ("locale");
  CREATE INDEX "pages_rels_testimonials_id_idx" ON "pages_rels" USING btree ("testimonials_id","locale");
  CREATE INDEX "regional_pages_welcome_hero_links_order_idx" ON "regional_pages_welcome_hero_links" USING btree ("_order");
  CREATE INDEX "regional_pages_welcome_hero_links_parent_id_idx" ON "regional_pages_welcome_hero_links" USING btree ("_parent_id");
  CREATE INDEX "regional_pages_welcome_hero_links_locale_idx" ON "regional_pages_welcome_hero_links" USING btree ("_locale");
  CREATE INDEX "regional_pages_why_join_c_t_a_links_order_idx" ON "regional_pages_why_join_c_t_a_links" USING btree ("_order");
  CREATE INDEX "regional_pages_why_join_c_t_a_links_parent_id_idx" ON "regional_pages_why_join_c_t_a_links" USING btree ("_parent_id");
  CREATE INDEX "regional_pages_why_join_c_t_a_links_locale_idx" ON "regional_pages_why_join_c_t_a_links" USING btree ("_locale");
  CREATE INDEX "regional_pages_blocks_grid_agenda_order_idx" ON "regional_pages_blocks_grid_agenda" USING btree ("_order");
  CREATE INDEX "regional_pages_blocks_grid_agenda_parent_id_idx" ON "regional_pages_blocks_grid_agenda" USING btree ("_parent_id");
  CREATE INDEX "regional_pages_blocks_grid_agenda_path_idx" ON "regional_pages_blocks_grid_agenda" USING btree ("_path");
  CREATE INDEX "regional_pages_blocks_grid_agenda_locale_idx" ON "regional_pages_blocks_grid_agenda" USING btree ("_locale");
  CREATE INDEX "regional_pages_blocks_grid_agenda_agenda_idx" ON "regional_pages_blocks_grid_agenda" USING btree ("agenda_id");
  CREATE INDEX "regional_pages_blocks_grid_case_study_order_idx" ON "regional_pages_blocks_grid_case_study" USING btree ("_order");
  CREATE INDEX "regional_pages_blocks_grid_case_study_parent_id_idx" ON "regional_pages_blocks_grid_case_study" USING btree ("_parent_id");
  CREATE INDEX "regional_pages_blocks_grid_case_study_path_idx" ON "regional_pages_blocks_grid_case_study" USING btree ("_path");
  CREATE INDEX "regional_pages_blocks_grid_case_study_locale_idx" ON "regional_pages_blocks_grid_case_study" USING btree ("_locale");
  CREATE INDEX "regional_pages_blocks_grid_case_study_case_study_idx" ON "regional_pages_blocks_grid_case_study" USING btree ("case_study_id");
  CREATE INDEX "regional_pages_blocks_grid_news_order_idx" ON "regional_pages_blocks_grid_news" USING btree ("_order");
  CREATE INDEX "regional_pages_blocks_grid_news_parent_id_idx" ON "regional_pages_blocks_grid_news" USING btree ("_parent_id");
  CREATE INDEX "regional_pages_blocks_grid_news_path_idx" ON "regional_pages_blocks_grid_news" USING btree ("_path");
  CREATE INDEX "regional_pages_blocks_grid_news_locale_idx" ON "regional_pages_blocks_grid_news" USING btree ("_locale");
  CREATE INDEX "regional_pages_blocks_grid_news_news_post_idx" ON "regional_pages_blocks_grid_news" USING btree ("news_post_id");
  CREATE INDEX "regional_pages_blocks_content_grid_order_idx" ON "regional_pages_blocks_content_grid" USING btree ("_order");
  CREATE INDEX "regional_pages_blocks_content_grid_parent_id_idx" ON "regional_pages_blocks_content_grid" USING btree ("_parent_id");
  CREATE INDEX "regional_pages_blocks_content_grid_path_idx" ON "regional_pages_blocks_content_grid" USING btree ("_path");
  CREATE INDEX "regional_pages_blocks_content_grid_locale_idx" ON "regional_pages_blocks_content_grid" USING btree ("_locale");
  CREATE INDEX "regional_pages_blocks_content_grid_header_image_header_i_idx" ON "regional_pages_blocks_content_grid" USING btree ("header_image_asset_id");
  CREATE INDEX "regional_pages_logo_cloud_images_order_idx" ON "regional_pages_logo_cloud_images" USING btree ("_order");
  CREATE INDEX "regional_pages_logo_cloud_images_parent_id_idx" ON "regional_pages_logo_cloud_images" USING btree ("_parent_id");
  CREATE INDEX "regional_pages_logo_cloud_images_locale_idx" ON "regional_pages_logo_cloud_images" USING btree ("_locale");
  CREATE INDEX "regional_pages_logo_cloud_images_asset_idx" ON "regional_pages_logo_cloud_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "regional_pages_slug_idx" ON "regional_pages" USING btree ("slug");
  CREATE INDEX "regional_pages_regional_community_idx" ON "regional_pages" USING btree ("regional_community_id");
  CREATE INDEX "regional_pages_og_image_og_image_asset_idx" ON "regional_pages" USING btree ("og_image_asset_id");
  CREATE INDEX "regional_pages_updated_at_idx" ON "regional_pages" USING btree ("updated_at");
  CREATE INDEX "regional_pages_created_at_idx" ON "regional_pages" USING btree ("created_at");
  CREATE INDEX "regional_pages__status_idx" ON "regional_pages" USING btree ("_status");
  CREATE INDEX "regional_pages_welcome_hero_background_welcome_hero_back_idx" ON "regional_pages_locales" USING btree ("welcome_hero_background_svg_pattern_id");
  CREATE INDEX "regional_pages_welcome_hero_background_image_welcome_her_idx" ON "regional_pages_locales" USING btree ("welcome_hero_background_image_asset_id");
  CREATE INDEX "regional_pages_welcome_hero_image_welcome_hero_image_ass_idx" ON "regional_pages_locales" USING btree ("welcome_hero_image_asset_id");
  CREATE INDEX "regional_pages_why_join_c_t_a_background_why_join_c_t_a__idx" ON "regional_pages_locales" USING btree ("why_join_c_t_a_background_svg_pattern_id");
  CREATE INDEX "regional_pages_why_join_c_t_a_background_image_why_join__idx" ON "regional_pages_locales" USING btree ("why_join_c_t_a_background_image_asset_id");
  CREATE INDEX "regional_pages_why_join_c_t_a_image_why_join_c_t_a_image_idx" ON "regional_pages_locales" USING btree ("why_join_c_t_a_image_asset_id");
  CREATE UNIQUE INDEX "regional_pages_locales_locale_parent_id_unique" ON "regional_pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_pages_rels_order_idx" ON "regional_pages_rels" USING btree ("order");
  CREATE INDEX "regional_pages_rels_parent_idx" ON "regional_pages_rels" USING btree ("parent_id");
  CREATE INDEX "regional_pages_rels_path_idx" ON "regional_pages_rels" USING btree ("path");
  CREATE INDEX "regional_pages_rels_locale_idx" ON "regional_pages_rels" USING btree ("locale");
  CREATE INDEX "regional_pages_rels_authors_id_idx" ON "regional_pages_rels" USING btree ("authors_id","locale");
  CREATE INDEX "regional_pages_rels_testimonials_id_idx" ON "regional_pages_rels" USING btree ("testimonials_id","locale");
  CREATE INDEX "_regional_pages_v_version_welcome_hero_links_order_idx" ON "_regional_pages_v_version_welcome_hero_links" USING btree ("_order");
  CREATE INDEX "_regional_pages_v_version_welcome_hero_links_parent_id_idx" ON "_regional_pages_v_version_welcome_hero_links" USING btree ("_parent_id");
  CREATE INDEX "_regional_pages_v_version_welcome_hero_links_locale_idx" ON "_regional_pages_v_version_welcome_hero_links" USING btree ("_locale");
  CREATE INDEX "_regional_pages_v_version_why_join_c_t_a_links_order_idx" ON "_regional_pages_v_version_why_join_c_t_a_links" USING btree ("_order");
  CREATE INDEX "_regional_pages_v_version_why_join_c_t_a_links_parent_id_idx" ON "_regional_pages_v_version_why_join_c_t_a_links" USING btree ("_parent_id");
  CREATE INDEX "_regional_pages_v_version_why_join_c_t_a_links_locale_idx" ON "_regional_pages_v_version_why_join_c_t_a_links" USING btree ("_locale");
  CREATE INDEX "_regional_pages_v_blocks_grid_agenda_order_idx" ON "_regional_pages_v_blocks_grid_agenda" USING btree ("_order");
  CREATE INDEX "_regional_pages_v_blocks_grid_agenda_parent_id_idx" ON "_regional_pages_v_blocks_grid_agenda" USING btree ("_parent_id");
  CREATE INDEX "_regional_pages_v_blocks_grid_agenda_path_idx" ON "_regional_pages_v_blocks_grid_agenda" USING btree ("_path");
  CREATE INDEX "_regional_pages_v_blocks_grid_agenda_locale_idx" ON "_regional_pages_v_blocks_grid_agenda" USING btree ("_locale");
  CREATE INDEX "_regional_pages_v_blocks_grid_agenda_agenda_idx" ON "_regional_pages_v_blocks_grid_agenda" USING btree ("agenda_id");
  CREATE INDEX "_regional_pages_v_blocks_grid_case_study_order_idx" ON "_regional_pages_v_blocks_grid_case_study" USING btree ("_order");
  CREATE INDEX "_regional_pages_v_blocks_grid_case_study_parent_id_idx" ON "_regional_pages_v_blocks_grid_case_study" USING btree ("_parent_id");
  CREATE INDEX "_regional_pages_v_blocks_grid_case_study_path_idx" ON "_regional_pages_v_blocks_grid_case_study" USING btree ("_path");
  CREATE INDEX "_regional_pages_v_blocks_grid_case_study_locale_idx" ON "_regional_pages_v_blocks_grid_case_study" USING btree ("_locale");
  CREATE INDEX "_regional_pages_v_blocks_grid_case_study_case_study_idx" ON "_regional_pages_v_blocks_grid_case_study" USING btree ("case_study_id");
  CREATE INDEX "_regional_pages_v_blocks_grid_news_order_idx" ON "_regional_pages_v_blocks_grid_news" USING btree ("_order");
  CREATE INDEX "_regional_pages_v_blocks_grid_news_parent_id_idx" ON "_regional_pages_v_blocks_grid_news" USING btree ("_parent_id");
  CREATE INDEX "_regional_pages_v_blocks_grid_news_path_idx" ON "_regional_pages_v_blocks_grid_news" USING btree ("_path");
  CREATE INDEX "_regional_pages_v_blocks_grid_news_locale_idx" ON "_regional_pages_v_blocks_grid_news" USING btree ("_locale");
  CREATE INDEX "_regional_pages_v_blocks_grid_news_news_post_idx" ON "_regional_pages_v_blocks_grid_news" USING btree ("news_post_id");
  CREATE INDEX "_regional_pages_v_blocks_content_grid_order_idx" ON "_regional_pages_v_blocks_content_grid" USING btree ("_order");
  CREATE INDEX "_regional_pages_v_blocks_content_grid_parent_id_idx" ON "_regional_pages_v_blocks_content_grid" USING btree ("_parent_id");
  CREATE INDEX "_regional_pages_v_blocks_content_grid_path_idx" ON "_regional_pages_v_blocks_content_grid" USING btree ("_path");
  CREATE INDEX "_regional_pages_v_blocks_content_grid_locale_idx" ON "_regional_pages_v_blocks_content_grid" USING btree ("_locale");
  CREATE INDEX "_regional_pages_v_blocks_content_grid_header_image_heade_idx" ON "_regional_pages_v_blocks_content_grid" USING btree ("header_image_asset_id");
  CREATE INDEX "_regional_pages_v_version_logo_cloud_images_order_idx" ON "_regional_pages_v_version_logo_cloud_images" USING btree ("_order");
  CREATE INDEX "_regional_pages_v_version_logo_cloud_images_parent_id_idx" ON "_regional_pages_v_version_logo_cloud_images" USING btree ("_parent_id");
  CREATE INDEX "_regional_pages_v_version_logo_cloud_images_locale_idx" ON "_regional_pages_v_version_logo_cloud_images" USING btree ("_locale");
  CREATE INDEX "_regional_pages_v_version_logo_cloud_images_asset_idx" ON "_regional_pages_v_version_logo_cloud_images" USING btree ("asset_id");
  CREATE INDEX "_regional_pages_v_parent_idx" ON "_regional_pages_v" USING btree ("parent_id");
  CREATE INDEX "_regional_pages_v_version_version_slug_idx" ON "_regional_pages_v" USING btree ("version_slug");
  CREATE INDEX "_regional_pages_v_version_version_regional_community_idx" ON "_regional_pages_v" USING btree ("version_regional_community_id");
  CREATE INDEX "_regional_pages_v_version_og_image_version_og_image_asse_idx" ON "_regional_pages_v" USING btree ("version_og_image_asset_id");
  CREATE INDEX "_regional_pages_v_version_version_updated_at_idx" ON "_regional_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_regional_pages_v_version_version_created_at_idx" ON "_regional_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_regional_pages_v_version_version__status_idx" ON "_regional_pages_v" USING btree ("version__status");
  CREATE INDEX "_regional_pages_v_created_at_idx" ON "_regional_pages_v" USING btree ("created_at");
  CREATE INDEX "_regional_pages_v_updated_at_idx" ON "_regional_pages_v" USING btree ("updated_at");
  CREATE INDEX "_regional_pages_v_snapshot_idx" ON "_regional_pages_v" USING btree ("snapshot");
  CREATE INDEX "_regional_pages_v_published_locale_idx" ON "_regional_pages_v" USING btree ("published_locale");
  CREATE INDEX "_regional_pages_v_latest_idx" ON "_regional_pages_v" USING btree ("latest");
  CREATE INDEX "_regional_pages_v_version_welcome_hero_background_versio_idx" ON "_regional_pages_v_locales" USING btree ("version_welcome_hero_background_svg_pattern_id");
  CREATE INDEX "_regional_pages_v_version_welcome_hero_background_image__idx" ON "_regional_pages_v_locales" USING btree ("version_welcome_hero_background_image_asset_id");
  CREATE INDEX "_regional_pages_v_version_welcome_hero_image_version_wel_idx" ON "_regional_pages_v_locales" USING btree ("version_welcome_hero_image_asset_id");
  CREATE INDEX "_regional_pages_v_version_why_join_c_t_a_background_vers_idx" ON "_regional_pages_v_locales" USING btree ("version_why_join_c_t_a_background_svg_pattern_id");
  CREATE INDEX "_regional_pages_v_version_why_join_c_t_a_background_imag_idx" ON "_regional_pages_v_locales" USING btree ("version_why_join_c_t_a_background_image_asset_id");
  CREATE INDEX "_regional_pages_v_version_why_join_c_t_a_image_version_w_idx" ON "_regional_pages_v_locales" USING btree ("version_why_join_c_t_a_image_asset_id");
  CREATE UNIQUE INDEX "_regional_pages_v_locales_locale_parent_id_unique" ON "_regional_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_pages_v_rels_order_idx" ON "_regional_pages_v_rels" USING btree ("order");
  CREATE INDEX "_regional_pages_v_rels_parent_idx" ON "_regional_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_regional_pages_v_rels_path_idx" ON "_regional_pages_v_rels" USING btree ("path");
  CREATE INDEX "_regional_pages_v_rels_locale_idx" ON "_regional_pages_v_rels" USING btree ("locale");
  CREATE INDEX "_regional_pages_v_rels_authors_id_idx" ON "_regional_pages_v_rels" USING btree ("authors_id","locale");
  CREATE INDEX "_regional_pages_v_rels_testimonials_id_idx" ON "_regional_pages_v_rels" USING btree ("testimonials_id","locale");
  CREATE INDEX "homepage_hero_welcome_links_order_idx" ON "homepage_hero_welcome_links" USING btree ("_order");
  CREATE INDEX "homepage_hero_welcome_links_parent_id_idx" ON "homepage_hero_welcome_links" USING btree ("_parent_id");
  CREATE INDEX "homepage_hero_welcome_links_locale_idx" ON "homepage_hero_welcome_links" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_split_content_order_idx" ON "homepage_blocks_split_content" USING btree ("_order");
  CREATE INDEX "homepage_blocks_split_content_parent_id_idx" ON "homepage_blocks_split_content" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_split_content_path_idx" ON "homepage_blocks_split_content" USING btree ("_path");
  CREATE INDEX "homepage_blocks_split_content_locale_idx" ON "homepage_blocks_split_content" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_split_image_order_idx" ON "homepage_blocks_split_image" USING btree ("_order");
  CREATE INDEX "homepage_blocks_split_image_parent_id_idx" ON "homepage_blocks_split_image" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_split_image_path_idx" ON "homepage_blocks_split_image" USING btree ("_path");
  CREATE INDEX "homepage_blocks_split_image_locale_idx" ON "homepage_blocks_split_image" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_split_image_image_image_asset_idx" ON "homepage_blocks_split_image" USING btree ("image_asset_id");
  CREATE INDEX "homepage_blocks_grid_card_order_idx" ON "homepage_blocks_grid_card" USING btree ("_order");
  CREATE INDEX "homepage_blocks_grid_card_parent_id_idx" ON "homepage_blocks_grid_card" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_grid_card_path_idx" ON "homepage_blocks_grid_card" USING btree ("_path");
  CREATE INDEX "homepage_blocks_grid_card_locale_idx" ON "homepage_blocks_grid_card" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_grid_card_image_image_asset_idx" ON "homepage_blocks_grid_card" USING btree ("image_asset_id");
  CREATE INDEX "homepage_blocks_grid_agenda_order_idx" ON "homepage_blocks_grid_agenda" USING btree ("_order");
  CREATE INDEX "homepage_blocks_grid_agenda_parent_id_idx" ON "homepage_blocks_grid_agenda" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_grid_agenda_path_idx" ON "homepage_blocks_grid_agenda" USING btree ("_path");
  CREATE INDEX "homepage_blocks_grid_agenda_locale_idx" ON "homepage_blocks_grid_agenda" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_grid_agenda_agenda_idx" ON "homepage_blocks_grid_agenda" USING btree ("agenda_id");
  CREATE INDEX "homepage_blocks_grid_news_order_idx" ON "homepage_blocks_grid_news" USING btree ("_order");
  CREATE INDEX "homepage_blocks_grid_news_parent_id_idx" ON "homepage_blocks_grid_news" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_grid_news_path_idx" ON "homepage_blocks_grid_news" USING btree ("_path");
  CREATE INDEX "homepage_blocks_grid_news_locale_idx" ON "homepage_blocks_grid_news" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_grid_news_news_post_idx" ON "homepage_blocks_grid_news" USING btree ("news_post_id");
  CREATE INDEX "homepage_mental_health_definition_links_order_idx" ON "homepage_mental_health_definition_links" USING btree ("_order");
  CREATE INDEX "homepage_mental_health_definition_links_parent_id_idx" ON "homepage_mental_health_definition_links" USING btree ("_parent_id");
  CREATE INDEX "homepage_mental_health_definition_links_locale_idx" ON "homepage_mental_health_definition_links" USING btree ("_locale");
  CREATE INDEX "homepage_partner_logos_images_order_idx" ON "homepage_partner_logos_images" USING btree ("_order");
  CREATE INDEX "homepage_partner_logos_images_parent_id_idx" ON "homepage_partner_logos_images" USING btree ("_parent_id");
  CREATE INDEX "homepage_partner_logos_images_locale_idx" ON "homepage_partner_logos_images" USING btree ("_locale");
  CREATE INDEX "homepage_partner_logos_images_asset_idx" ON "homepage_partner_logos_images" USING btree ("asset_id");
  CREATE INDEX "homepage_og_image_og_image_asset_idx" ON "homepage" USING btree ("og_image_asset_id");
  CREATE INDEX "homepage_hero_welcome_background_hero_welcome_background_idx" ON "homepage_locales" USING btree ("hero_welcome_background_svg_pattern_id");
  CREATE INDEX "homepage_hero_welcome_background_image_hero_welcome_back_idx" ON "homepage_locales" USING btree ("hero_welcome_background_image_asset_id");
  CREATE INDEX "homepage_hero_welcome_image_hero_welcome_image_asset_idx" ON "homepage_locales" USING btree ("hero_welcome_image_asset_id");
  CREATE INDEX "homepage_agendas_module_background_agendas_module_backgr_idx" ON "homepage_locales" USING btree ("agendas_module_background_svg_pattern_id");
  CREATE INDEX "homepage_agendas_module_background_image_agendas_module__idx" ON "homepage_locales" USING btree ("agendas_module_background_image_asset_id");
  CREATE INDEX "homepage_agendas_module_header_image_agendas_module_head_idx" ON "homepage_locales" USING btree ("agendas_module_header_image_asset_id");
  CREATE INDEX "homepage_regional_communities_background_regional_commun_idx" ON "homepage_locales" USING btree ("regional_communities_background_svg_pattern_id");
  CREATE INDEX "homepage_regional_communities_background_image_regional__idx" ON "homepage_locales" USING btree ("regional_communities_background_image_asset_id");
  CREATE INDEX "homepage_regional_communities_header_image_regional_comm_idx" ON "homepage_locales" USING btree ("regional_communities_header_image_asset_id");
  CREATE INDEX "homepage_news_background_news_background_svg_pattern_idx" ON "homepage_locales" USING btree ("news_background_svg_pattern_id");
  CREATE INDEX "homepage_news_background_image_news_background_image_ass_idx" ON "homepage_locales" USING btree ("news_background_image_asset_id");
  CREATE INDEX "homepage_news_header_image_news_header_image_asset_idx" ON "homepage_locales" USING btree ("news_header_image_asset_id");
  CREATE INDEX "homepage_mental_health_definition_background_mental_heal_idx" ON "homepage_locales" USING btree ("mental_health_definition_background_svg_pattern_id");
  CREATE INDEX "homepage_mental_health_definition_background_image_menta_idx" ON "homepage_locales" USING btree ("mental_health_definition_background_image_asset_id");
  CREATE UNIQUE INDEX "homepage_locales_locale_parent_id_unique" ON "homepage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_locale_idx" ON "homepage_rels" USING btree ("locale");
  CREATE INDEX "homepage_rels_testimonials_id_idx" ON "homepage_rels" USING btree ("testimonials_id","locale");
  CREATE UNIQUE INDEX "site_announcement_locales_locale_parent_id_unique" ON "site_announcement_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "moderation_settings_block_terms_order_idx" ON "moderation_settings_block_terms" USING btree ("_order");
  CREATE INDEX "moderation_settings_block_terms_parent_id_idx" ON "moderation_settings_block_terms" USING btree ("_parent_id");
  CREATE INDEX "moderation_settings_review_terms_order_idx" ON "moderation_settings_review_terms" USING btree ("_order");
  CREATE INDEX "moderation_settings_review_terms_parent_id_idx" ON "moderation_settings_review_terms" USING btree ("_parent_id");
  CREATE INDEX "hub_illustrations_atlas_header_atlas_header_asset_idx" ON "hub_illustrations" USING btree ("atlas_header_asset_id");
  CREATE INDEX "hub_illustrations_search_header_search_header_asset_idx" ON "hub_illustrations" USING btree ("search_header_asset_id");
  CREATE INDEX "hub_illustrations_collaborate_header_collaborate_header__idx" ON "hub_illustrations" USING btree ("collaborate_header_asset_id");
  CREATE INDEX "hub_illustrations_empty_state_empty_state_asset_idx" ON "hub_illustrations" USING btree ("empty_state_asset_id");
  CREATE UNIQUE INDEX "hub_illustrations_locales_locale_parent_id_unique" ON "hub_illustrations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "onboarding_content_welcome_features_order_idx" ON "onboarding_content_welcome_features" USING btree ("_order");
  CREATE INDEX "onboarding_content_welcome_features_parent_id_idx" ON "onboarding_content_welcome_features" USING btree ("_parent_id");
  CREATE INDEX "onboarding_content_welcome_features_locale_idx" ON "onboarding_content_welcome_features" USING btree ("_locale");
  CREATE INDEX "onboarding_content_welcome_steps_order_idx" ON "onboarding_content_welcome_steps" USING btree ("_order");
  CREATE INDEX "onboarding_content_welcome_steps_parent_id_idx" ON "onboarding_content_welcome_steps" USING btree ("_parent_id");
  CREATE INDEX "onboarding_content_welcome_steps_locale_idx" ON "onboarding_content_welcome_steps" USING btree ("_locale");
  CREATE UNIQUE INDEX "onboarding_content_locales_locale_parent_id_unique" ON "onboarding_content_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_regional_community_pages_fk" FOREIGN KEY ("regional_pages_id") REFERENCES "public"."regional_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_regional_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("regional_pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_section_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_split_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_split_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_split_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_grid_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_grid_agenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_grid_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_grid_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_carousel2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_logo_cloud1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_logo_cloud1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_welcome_hero_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_why_join_c_t_a_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_blocks_grid_agenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_blocks_grid_case_study" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_blocks_grid_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_blocks_content_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_logo_cloud_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_version_welcome_hero_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_version_why_join_c_t_a_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_blocks_grid_agenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_blocks_grid_case_study" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_blocks_grid_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_blocks_content_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_version_logo_cloud_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_hero_welcome_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_split_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_split_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_agenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_grid_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_mental_health_definition_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_partner_logos_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_announcement" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_announcement_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "moderation_settings_block_terms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "moderation_settings_review_terms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "moderation_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hub_illustrations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hub_illustrations_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_content_welcome_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_content_welcome_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_content_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero1_links" CASCADE;
  DROP TABLE "pages_blocks_hero1" CASCADE;
  DROP TABLE "pages_blocks_section_header" CASCADE;
  DROP TABLE "pages_blocks_split_content" CASCADE;
  DROP TABLE "pages_blocks_split_image" CASCADE;
  DROP TABLE "pages_blocks_split_row" CASCADE;
  DROP TABLE "pages_blocks_grid_card" CASCADE;
  DROP TABLE "pages_blocks_grid_agenda" CASCADE;
  DROP TABLE "pages_blocks_grid_news" CASCADE;
  DROP TABLE "pages_blocks_grid_row" CASCADE;
  DROP TABLE "pages_blocks_carousel2" CASCADE;
  DROP TABLE "pages_blocks_cta1_links" CASCADE;
  DROP TABLE "pages_blocks_cta1" CASCADE;
  DROP TABLE "pages_blocks_logo_cloud1_images" CASCADE;
  DROP TABLE "pages_blocks_logo_cloud1" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "regional_pages_welcome_hero_links" CASCADE;
  DROP TABLE "regional_pages_why_join_c_t_a_links" CASCADE;
  DROP TABLE "regional_pages_blocks_grid_agenda" CASCADE;
  DROP TABLE "regional_pages_blocks_grid_case_study" CASCADE;
  DROP TABLE "regional_pages_blocks_grid_news" CASCADE;
  DROP TABLE "regional_pages_blocks_content_grid" CASCADE;
  DROP TABLE "regional_pages_logo_cloud_images" CASCADE;
  DROP TABLE "regional_pages" CASCADE;
  DROP TABLE "regional_pages_locales" CASCADE;
  DROP TABLE "regional_pages_rels" CASCADE;
  DROP TABLE "_regional_pages_v_version_welcome_hero_links" CASCADE;
  DROP TABLE "_regional_pages_v_version_why_join_c_t_a_links" CASCADE;
  DROP TABLE "_regional_pages_v_blocks_grid_agenda" CASCADE;
  DROP TABLE "_regional_pages_v_blocks_grid_case_study" CASCADE;
  DROP TABLE "_regional_pages_v_blocks_grid_news" CASCADE;
  DROP TABLE "_regional_pages_v_blocks_content_grid" CASCADE;
  DROP TABLE "_regional_pages_v_version_logo_cloud_images" CASCADE;
  DROP TABLE "_regional_pages_v" CASCADE;
  DROP TABLE "_regional_pages_v_locales" CASCADE;
  DROP TABLE "_regional_pages_v_rels" CASCADE;
  DROP TABLE "homepage_hero_welcome_links" CASCADE;
  DROP TABLE "homepage_blocks_split_content" CASCADE;
  DROP TABLE "homepage_blocks_split_image" CASCADE;
  DROP TABLE "homepage_blocks_grid_card" CASCADE;
  DROP TABLE "homepage_blocks_grid_agenda" CASCADE;
  DROP TABLE "homepage_blocks_grid_news" CASCADE;
  DROP TABLE "homepage_mental_health_definition_links" CASCADE;
  DROP TABLE "homepage_partner_logos_images" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_locales" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "site_announcement" CASCADE;
  DROP TABLE "site_announcement_locales" CASCADE;
  DROP TABLE "moderation_settings_block_terms" CASCADE;
  DROP TABLE "moderation_settings_review_terms" CASCADE;
  DROP TABLE "moderation_settings" CASCADE;
  DROP TABLE "hub_illustrations" CASCADE;
  DROP TABLE "hub_illustrations_locales" CASCADE;
  DROP TABLE "onboarding_content_welcome_features" CASCADE;
  DROP TABLE "onboarding_content_welcome_steps" CASCADE;
  DROP TABLE "onboarding_content" CASCADE;
  DROP TABLE "onboarding_content_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_regional_community_pages_fk";
  
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_regional_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "regional_pages_id";
  DROP TYPE "public"."enum_btn_variant";
  DROP TYPE "public"."enum_btn_size";
  DROP TYPE "public"."enum_btn_stroke";
  DROP TYPE "public"."enum_bg_type";
  DROP TYPE "public"."enum_bg_ccm_color";
  DROP TYPE "public"."enum_bg_gradient_direction";
  DROP TYPE "public"."enum_pages_blocks_hero1_image_position";
  DROP TYPE "public"."enum_pages_blocks_section_header_section_width";
  DROP TYPE "public"."enum_pages_blocks_section_header_stack_align";
  DROP TYPE "public"."enum_pages_blocks_grid_row_grid_columns";
  DROP TYPE "public"."enum_pages_blocks_grid_row_card_variant";
  DROP TYPE "public"."enum_pages_blocks_grid_row_mode";
  DROP TYPE "public"."enum_pages_blocks_cta1_section_width";
  DROP TYPE "public"."enum_pages_blocks_cta1_stack_align";
  DROP TYPE "public"."enum_pages_blocks_logo_cloud1_images_org_type";
  DROP TYPE "public"."enum_pages_blocks_logo_cloud1_layout";
  DROP TYPE "public"."enum_pages_blocks_logo_cloud1_motion_speed";
  DROP TYPE "public"."enum_regional_pages_blocks_grid_case_study_custom_layout";
  DROP TYPE "public"."enum_regional_pages_blocks_content_grid_content_type";
  DROP TYPE "public"."enum_regional_pages_blocks_content_grid_mode";
  DROP TYPE "public"."enum_regional_pages_blocks_content_grid_grid_columns";
  DROP TYPE "public"."enum_regional_pages_logo_cloud_images_org_type";
  DROP TYPE "public"."enum_regional_pages_status";
  DROP TYPE "public"."enum_regional_pages_welcome_hero_image_position";
  DROP TYPE "public"."enum_regional_pages_why_join_c_t_a_image_position";
  DROP TYPE "public"."enum_regional_pages_logo_cloud_layout";
  DROP TYPE "public"."enum_regional_pages_logo_cloud_motion_speed";
  DROP TYPE "public"."enum__regional_pages_v_blocks_grid_case_study_custom_layout";
  DROP TYPE "public"."enum__regional_pages_v_blocks_content_grid_content_type";
  DROP TYPE "public"."enum__regional_pages_v_blocks_content_grid_mode";
  DROP TYPE "public"."enum__regional_pages_v_blocks_content_grid_grid_columns";
  DROP TYPE "public"."enum__regional_pages_v_version_logo_cloud_images_org_type";
  DROP TYPE "public"."enum__regional_pages_v_version_status";
  DROP TYPE "public"."enum__regional_pages_v_published_locale";
  DROP TYPE "public"."enum__regional_pages_v_version_welcome_hero_image_position";
  DROP TYPE "public"."enum__regional_pages_v_version_why_join_c_t_a_image_position";
  DROP TYPE "public"."enum__regional_pages_v_version_logo_cloud_layout";
  DROP TYPE "public"."enum__regional_pages_v_version_logo_cloud_motion_speed";
  DROP TYPE "public"."enum_homepage_partner_logos_images_org_type";
  DROP TYPE "public"."enum_homepage_hero_welcome_image_position";
  DROP TYPE "public"."enum_homepage_agendas_module_grid_columns";
  DROP TYPE "public"."enum_homepage_agendas_module_card_variant";
  DROP TYPE "public"."enum_homepage_agendas_module_mode";
  DROP TYPE "public"."enum_homepage_regional_communities_grid_columns";
  DROP TYPE "public"."enum_homepage_regional_communities_card_variant";
  DROP TYPE "public"."enum_homepage_regional_communities_mode";
  DROP TYPE "public"."enum_homepage_news_grid_columns";
  DROP TYPE "public"."enum_homepage_news_card_variant";
  DROP TYPE "public"."enum_homepage_news_mode";
  DROP TYPE "public"."enum_homepage_mental_health_definition_section_width";
  DROP TYPE "public"."enum_homepage_mental_health_definition_stack_align";
  DROP TYPE "public"."enum_homepage_partner_logos_layout";
  DROP TYPE "public"."enum_homepage_partner_logos_motion_speed";
  DROP TYPE "public"."enum_site_announcement_variant";`)
}
