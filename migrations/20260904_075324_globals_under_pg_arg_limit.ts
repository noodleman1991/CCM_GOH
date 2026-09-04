import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "onboarding_basic_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "onboarding_basic_info_locales" (
  	"basic_info_title" varchar,
  	"basic_info_description" varchar,
  	"basic_info_field_hints_username_hint" varchar,
  	"basic_info_field_hints_headline_hint" varchar,
  	"basic_info_field_hints_bio_hint" varchar,
  	"basic_info_field_hints_motivation_hint" varchar,
  	"basic_info_field_hints_language_hint" varchar,
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
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "onboarding_work_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "onboarding_work_info_locales" (
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
  	"validation_messages_work_info_work_types_required" varchar,
  	"validation_messages_work_info_expertise_areas_required" varchar,
  	"validation_messages_work_info_work_bio_too_long" varchar,
  	"validation_messages_work_info_invalid_linked_in_url" varchar,
  	"validation_messages_work_info_invalid_website_url" varchar,
  	"validation_messages_work_info_invalid_social_link_url" varchar,
  	"validation_messages_work_info_social_link_platform_required" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "onboarding_recent_work" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "onboarding_recent_work_locales" (
  	"recent_work_title" varchar,
  	"recent_work_description" varchar,
  	"recent_work_field_hints_work_link_hint" varchar,
  	"recent_work_field_hints_is_ongoing_hint" varchar,
  	"recent_work_field_hints_no_work_description" varchar,
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
  	"validation_messages_recent_work_title_required" varchar,
  	"validation_messages_recent_work_title_too_long" varchar,
  	"validation_messages_recent_work_description_required" varchar,
  	"validation_messages_recent_work_description_too_long" varchar,
  	"validation_messages_recent_work_invalid_url" varchar,
  	"validation_messages_recent_work_start_date_required" varchar,
  	"validation_messages_recent_work_end_date_required" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "onboarding_privacy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "onboarding_privacy_locales" (
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
  
  CREATE TABLE "onboarding_review" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "onboarding_review_locales" (
  	"review_title" varchar,
  	"review_description" varchar,
  	"review_ready_title" varchar,
  	"review_ready_description" varchar,
  	"complete_onboarding_text" varchar,
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
  	"validation_messages_general_please_complete_required" varchar,
  	"validation_messages_general_validation_error" varchar,
  	"validation_messages_general_submission_error" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_hero_welcome_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_hero_welcome_background_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_hero_welcome_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_agendas_module_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_agendas_module_background_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_agendas_module_header_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_regional_communities_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_regional_communities_background_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_regional_communities_header_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_news_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_news_background_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_news_header_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_mental_health_definition_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage_locales" DROP CONSTRAINT "homepage_locales_mental_health_definition_background_image_asset_id_media_id_fk";
  
  DROP INDEX "homepage_hero_welcome_background_hero_welcome_background_idx";
  DROP INDEX "homepage_hero_welcome_background_image_hero_welcome_back_idx";
  DROP INDEX "homepage_hero_welcome_image_hero_welcome_image_asset_idx";
  DROP INDEX "homepage_agendas_module_background_agendas_module_backgr_idx";
  DROP INDEX "homepage_agendas_module_background_image_agendas_module__idx";
  DROP INDEX "homepage_agendas_module_header_image_agendas_module_head_idx";
  DROP INDEX "homepage_regional_communities_background_regional_commun_idx";
  DROP INDEX "homepage_regional_communities_background_image_regional__idx";
  DROP INDEX "homepage_regional_communities_header_image_regional_comm_idx";
  DROP INDEX "homepage_news_background_news_background_svg_pattern_idx";
  DROP INDEX "homepage_news_background_image_news_background_image_ass_idx";
  DROP INDEX "homepage_news_header_image_news_header_image_asset_idx";
  DROP INDEX "homepage_mental_health_definition_background_mental_heal_idx";
  DROP INDEX "homepage_mental_health_definition_background_image_menta_idx";
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_gradient_start_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_gradient_end_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "hero_welcome_image_position" "enum_homepage_hero_welcome_image_position" DEFAULT 'right';
  ALTER TABLE "homepage" ADD COLUMN "global_agenda_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "global_agenda_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "global_agenda_no_gap" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "how_to_use_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "how_to_use_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "how_to_use_no_gap" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_gradient_start_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_gradient_end_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_header_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_grid_columns" "enum_homepage_agendas_module_grid_columns" DEFAULT 'grid-cols-3';
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_card_variant" "enum_homepage_agendas_module_card_variant" DEFAULT 'classic';
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_mode" "enum_homepage_agendas_module_mode" DEFAULT 'manual';
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_max_items" numeric DEFAULT 3;
  ALTER TABLE "homepage" ADD COLUMN "agendas_module_initial_display_count" numeric;
  ALTER TABLE "homepage" ADD COLUMN "lived_experiences_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "lived_experiences_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_gradient_start_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_gradient_end_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_header_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_grid_columns" "enum_homepage_regional_communities_grid_columns" DEFAULT 'grid-cols-3';
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_card_variant" "enum_homepage_regional_communities_card_variant" DEFAULT 'classic';
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_mode" "enum_homepage_regional_communities_mode" DEFAULT 'manual';
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_max_items" numeric DEFAULT 3;
  ALTER TABLE "homepage" ADD COLUMN "regional_communities_initial_display_count" numeric;
  ALTER TABLE "homepage" ADD COLUMN "collaboration_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "collaboration_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "collaboration_no_gap" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "news_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "news_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "news_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage" ADD COLUMN "news_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage" ADD COLUMN "news_background_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "news_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage" ADD COLUMN "news_background_gradient_start_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "news_background_gradient_end_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "news_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "news_background_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "news_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "news_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "news_header_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "news_grid_columns" "enum_homepage_news_grid_columns" DEFAULT 'grid-cols-3';
  ALTER TABLE "homepage" ADD COLUMN "news_card_variant" "enum_homepage_news_card_variant" DEFAULT 'classic';
  ALTER TABLE "homepage" ADD COLUMN "news_mode" "enum_homepage_news_mode" DEFAULT 'manual';
  ALTER TABLE "homepage" ADD COLUMN "news_max_items" numeric DEFAULT 3;
  ALTER TABLE "homepage" ADD COLUMN "news_initial_display_count" numeric;
  ALTER TABLE "homepage" ADD COLUMN "project_info_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "project_info_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "project_info_no_gap" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_gradient_start_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_gradient_end_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_image_asset_id" varchar;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_section_width" "enum_homepage_mental_health_definition_section_width" DEFAULT 'default';
  ALTER TABLE "homepage" ADD COLUMN "mental_health_definition_stack_align" "enum_homepage_mental_health_definition_stack_align" DEFAULT 'left';
  ALTER TABLE "homepage" ADD COLUMN "partner_logos_padding_top" boolean;
  ALTER TABLE "homepage" ADD COLUMN "partner_logos_padding_bottom" boolean;
  ALTER TABLE "homepage" ADD COLUMN "partner_logos_layout" "enum_homepage_partner_logos_layout" DEFAULT 'marquee';
  ALTER TABLE "homepage" ADD COLUMN "partner_logos_motion_speed" "enum_homepage_partner_logos_motion_speed" DEFAULT 'default';
  ALTER TABLE "onboarding_basic_info_locales" ADD CONSTRAINT "onboarding_basic_info_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_basic_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_work_info_locales" ADD CONSTRAINT "onboarding_work_info_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_work_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_recent_work_locales" ADD CONSTRAINT "onboarding_recent_work_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_recent_work"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_privacy_locales" ADD CONSTRAINT "onboarding_privacy_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_privacy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "onboarding_review_locales" ADD CONSTRAINT "onboarding_review_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."onboarding_review"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "onboarding_basic_info_locales_locale_parent_id_unique" ON "onboarding_basic_info_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "onboarding_work_info_locales_locale_parent_id_unique" ON "onboarding_work_info_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "onboarding_recent_work_locales_locale_parent_id_unique" ON "onboarding_recent_work_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "onboarding_privacy_locales_locale_parent_id_unique" ON "onboarding_privacy_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "onboarding_review_locales_locale_parent_id_unique" ON "onboarding_review_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_welcome_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("hero_welcome_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_welcome_background_image_asset_id_media_id_fk" FOREIGN KEY ("hero_welcome_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_welcome_image_asset_id_media_id_fk" FOREIGN KEY ("hero_welcome_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_agendas_module_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("agendas_module_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_agendas_module_background_image_asset_id_media_id_fk" FOREIGN KEY ("agendas_module_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_agendas_module_header_image_asset_id_media_id_fk" FOREIGN KEY ("agendas_module_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_regional_communities_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("regional_communities_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_regional_communities_background_image_asset_id_media_id_fk" FOREIGN KEY ("regional_communities_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_regional_communities_header_image_asset_id_media_id_fk" FOREIGN KEY ("regional_communities_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_news_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("news_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_news_background_image_asset_id_media_id_fk" FOREIGN KEY ("news_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_news_header_image_asset_id_media_id_fk" FOREIGN KEY ("news_header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_mental_health_definition_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("mental_health_definition_background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_mental_health_definition_background_image_asset_id_media_id_fk" FOREIGN KEY ("mental_health_definition_background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "homepage_hero_welcome_background_hero_welcome_background_idx" ON "homepage" USING btree ("hero_welcome_background_svg_pattern_id");
  CREATE INDEX "homepage_hero_welcome_background_image_hero_welcome_back_idx" ON "homepage" USING btree ("hero_welcome_background_image_asset_id");
  CREATE INDEX "homepage_hero_welcome_image_hero_welcome_image_asset_idx" ON "homepage" USING btree ("hero_welcome_image_asset_id");
  CREATE INDEX "homepage_agendas_module_background_agendas_module_backgr_idx" ON "homepage" USING btree ("agendas_module_background_svg_pattern_id");
  CREATE INDEX "homepage_agendas_module_background_image_agendas_module__idx" ON "homepage" USING btree ("agendas_module_background_image_asset_id");
  CREATE INDEX "homepage_agendas_module_header_image_agendas_module_head_idx" ON "homepage" USING btree ("agendas_module_header_image_asset_id");
  CREATE INDEX "homepage_regional_communities_background_regional_commun_idx" ON "homepage" USING btree ("regional_communities_background_svg_pattern_id");
  CREATE INDEX "homepage_regional_communities_background_image_regional__idx" ON "homepage" USING btree ("regional_communities_background_image_asset_id");
  CREATE INDEX "homepage_regional_communities_header_image_regional_comm_idx" ON "homepage" USING btree ("regional_communities_header_image_asset_id");
  CREATE INDEX "homepage_news_background_news_background_svg_pattern_idx" ON "homepage" USING btree ("news_background_svg_pattern_id");
  CREATE INDEX "homepage_news_background_image_news_background_image_ass_idx" ON "homepage" USING btree ("news_background_image_asset_id");
  CREATE INDEX "homepage_news_header_image_news_header_image_asset_idx" ON "homepage" USING btree ("news_header_image_asset_id");
  CREATE INDEX "homepage_mental_health_definition_background_mental_heal_idx" ON "homepage" USING btree ("mental_health_definition_background_svg_pattern_id");
  CREATE INDEX "homepage_mental_health_definition_background_image_menta_idx" ON "homepage" USING btree ("mental_health_definition_background_image_asset_id");
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_type";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_ccm_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_gradient_direction";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_gradient_start_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_gradient_end_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_svg_pattern_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_light_text";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_background_blob_accent";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_welcome_image_position";
  ALTER TABLE "homepage_locales" DROP COLUMN "global_agenda_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "global_agenda_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "global_agenda_no_gap";
  ALTER TABLE "homepage_locales" DROP COLUMN "how_to_use_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "how_to_use_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "how_to_use_no_gap";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_type";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_ccm_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_gradient_direction";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_gradient_start_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_gradient_end_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_svg_pattern_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_light_text";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_background_blob_accent";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_header_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_grid_columns";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_card_variant";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_mode";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_max_items";
  ALTER TABLE "homepage_locales" DROP COLUMN "agendas_module_initial_display_count";
  ALTER TABLE "homepage_locales" DROP COLUMN "lived_experiences_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "lived_experiences_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_type";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_ccm_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_gradient_direction";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_gradient_start_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_gradient_end_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_svg_pattern_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_light_text";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_background_blob_accent";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_header_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_grid_columns";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_card_variant";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_mode";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_max_items";
  ALTER TABLE "homepage_locales" DROP COLUMN "regional_communities_initial_display_count";
  ALTER TABLE "homepage_locales" DROP COLUMN "collaboration_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "collaboration_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "collaboration_no_gap";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_type";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_ccm_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_gradient_direction";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_gradient_start_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_gradient_end_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_svg_pattern_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_light_text";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_background_blob_accent";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_header_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_grid_columns";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_card_variant";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_mode";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_max_items";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_initial_display_count";
  ALTER TABLE "homepage_locales" DROP COLUMN "project_info_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "project_info_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "project_info_no_gap";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_type";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_ccm_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_gradient_direction";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_gradient_start_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_gradient_end_color";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_svg_pattern_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_image_asset_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_light_text";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_background_blob_accent";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_section_width";
  ALTER TABLE "homepage_locales" DROP COLUMN "mental_health_definition_stack_align";
  ALTER TABLE "homepage_locales" DROP COLUMN "partner_logos_padding_top";
  ALTER TABLE "homepage_locales" DROP COLUMN "partner_logos_padding_bottom";
  ALTER TABLE "homepage_locales" DROP COLUMN "partner_logos_layout";
  ALTER TABLE "homepage_locales" DROP COLUMN "partner_logos_motion_speed";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "basic_info_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "basic_info_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "basic_info_field_hints_username_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "basic_info_field_hints_headline_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "basic_info_field_hints_bio_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "basic_info_field_hints_motivation_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "basic_info_field_hints_language_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "work_info_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "work_info_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "work_info_field_hints_work_types_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "work_info_field_hints_expertise_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "work_info_field_hints_work_bio_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "work_info_field_hints_social_links_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "work_info_field_hints_communities_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "community_info_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "community_info_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "community_info_field_hints_communities_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "community_info_field_hints_communities_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "community_info_field_hints_optional_note";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "recent_work_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "recent_work_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "recent_work_field_hints_work_link_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "recent_work_field_hints_is_ongoing_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "recent_work_field_hints_no_work_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "searchability_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "searchability_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "searchability_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_options_public_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_options_public_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_options_members_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_options_members_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_options_private_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_options_private_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "profile_info_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "profile_info_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_hints_email_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_hints_phone_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_hints_work_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_hints_social_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_hints_location_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "review_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "review_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "review_ready_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "review_ready_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "complete_onboarding_text";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_first_name_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_first_name_too_long";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_last_name_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_last_name_too_long";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_username_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_username_too_short";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_username_too_long";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_username_invalid_format";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_bio_too_long";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_country_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_basic_info_city_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_work_info_work_types_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_work_info_expertise_areas_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_work_info_work_bio_too_long";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_work_info_invalid_linked_in_url";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_work_info_invalid_website_url";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_work_info_invalid_social_link_url";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_work_info_social_link_platform_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_recent_work_title_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_recent_work_title_too_long";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_recent_work_description_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_recent_work_description_too_long";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_recent_work_invalid_url";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_recent_work_start_date_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_recent_work_end_date_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_general_please_complete_required";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_general_validation_error";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "validation_messages_general_submission_error";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_first_name";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_last_name";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_username";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_headline";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_headline_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_bio";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_bio_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_motivation";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_motivation_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_age_group";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_select_age";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_under18";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_above18";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_country";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_city";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_preferred_language";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_first_name_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_last_name_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_username_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_country_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_basic_info_city_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_work_types";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_expertise_areas";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_regional_communities";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_regional_communities_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_organization";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_organization_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_position";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_position_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_work_bio";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_work_bio_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_social_links";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_linkedin";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_linkedin_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_other_links";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_other_links_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_website";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_work_info_website_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_your_work";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_add_work";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_edit_work";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_update_work";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_work_title";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_work_title_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_description";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_description_placeholder";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_project_link";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_start_date";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_end_date";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_ongoing_project";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_ongoing";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_view_project";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_cancel";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_no_work_added";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_recent_work_add_work_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_basic_info";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_work_info";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_recent_work";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_privacy_settings";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_name";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_username";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_location";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_language";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_age_group";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_bio";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_work_types";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_expertise_areas";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_regional_communities";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_organization";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_position";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_work_bio";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_social_links";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_profile_visibility";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_searchable";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_show_email";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_show_phone";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_show_work";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_show_social";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_show_location";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_yes";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_no";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_under18";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_above18";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_ready_to_submit";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "field_labels_review_submission_note";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_allow_search";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_search_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_show_email";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_email_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_show_phone";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_phone_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_show_work";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_work_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_show_social";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_social_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_show_location";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "privacy_field_labels_location_hint";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_labels_public";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_labels_members";
  ALTER TABLE "onboarding_content_locales" DROP COLUMN "visibility_labels_private";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "onboarding_basic_info" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_basic_info_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_work_info" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_work_info_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_recent_work" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_recent_work_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_privacy" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_privacy_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_review" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding_review_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "onboarding_basic_info" CASCADE;
  DROP TABLE "onboarding_basic_info_locales" CASCADE;
  DROP TABLE "onboarding_work_info" CASCADE;
  DROP TABLE "onboarding_work_info_locales" CASCADE;
  DROP TABLE "onboarding_recent_work" CASCADE;
  DROP TABLE "onboarding_recent_work_locales" CASCADE;
  DROP TABLE "onboarding_privacy" CASCADE;
  DROP TABLE "onboarding_privacy_locales" CASCADE;
  DROP TABLE "onboarding_review" CASCADE;
  DROP TABLE "onboarding_review_locales" CASCADE;
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_hero_welcome_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_hero_welcome_background_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_hero_welcome_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_agendas_module_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_agendas_module_background_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_agendas_module_header_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_regional_communities_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_regional_communities_background_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_regional_communities_header_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_news_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_news_background_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_news_header_image_asset_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_mental_health_definition_background_svg_pattern_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_mental_health_definition_background_image_asset_id_media_id_fk";
  
  DROP INDEX "homepage_hero_welcome_background_hero_welcome_background_idx";
  DROP INDEX "homepage_hero_welcome_background_image_hero_welcome_back_idx";
  DROP INDEX "homepage_hero_welcome_image_hero_welcome_image_asset_idx";
  DROP INDEX "homepage_agendas_module_background_agendas_module_backgr_idx";
  DROP INDEX "homepage_agendas_module_background_image_agendas_module__idx";
  DROP INDEX "homepage_agendas_module_header_image_agendas_module_head_idx";
  DROP INDEX "homepage_regional_communities_background_regional_commun_idx";
  DROP INDEX "homepage_regional_communities_background_image_regional__idx";
  DROP INDEX "homepage_regional_communities_header_image_regional_comm_idx";
  DROP INDEX "homepage_news_background_news_background_svg_pattern_idx";
  DROP INDEX "homepage_news_background_image_news_background_image_ass_idx";
  DROP INDEX "homepage_news_header_image_news_header_image_asset_idx";
  DROP INDEX "homepage_mental_health_definition_background_mental_heal_idx";
  DROP INDEX "homepage_mental_health_definition_background_image_menta_idx";
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_gradient_start_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_gradient_end_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_welcome_image_position" "enum_homepage_hero_welcome_image_position" DEFAULT 'right';
  ALTER TABLE "homepage_locales" ADD COLUMN "global_agenda_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "global_agenda_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "global_agenda_no_gap" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "how_to_use_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "how_to_use_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "how_to_use_no_gap" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_gradient_start_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_gradient_end_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_header_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_grid_columns" "enum_homepage_agendas_module_grid_columns" DEFAULT 'grid-cols-3';
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_card_variant" "enum_homepage_agendas_module_card_variant" DEFAULT 'classic';
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_mode" "enum_homepage_agendas_module_mode" DEFAULT 'manual';
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_max_items" numeric DEFAULT 3;
  ALTER TABLE "homepage_locales" ADD COLUMN "agendas_module_initial_display_count" numeric;
  ALTER TABLE "homepage_locales" ADD COLUMN "lived_experiences_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "lived_experiences_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_gradient_start_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_gradient_end_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_header_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_grid_columns" "enum_homepage_regional_communities_grid_columns" DEFAULT 'grid-cols-3';
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_card_variant" "enum_homepage_regional_communities_card_variant" DEFAULT 'classic';
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_mode" "enum_homepage_regional_communities_mode" DEFAULT 'manual';
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_max_items" numeric DEFAULT 3;
  ALTER TABLE "homepage_locales" ADD COLUMN "regional_communities_initial_display_count" numeric;
  ALTER TABLE "homepage_locales" ADD COLUMN "collaboration_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "collaboration_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "collaboration_no_gap" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_gradient_start_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_gradient_end_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_header_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_grid_columns" "enum_homepage_news_grid_columns" DEFAULT 'grid-cols-3';
  ALTER TABLE "homepage_locales" ADD COLUMN "news_card_variant" "enum_homepage_news_card_variant" DEFAULT 'classic';
  ALTER TABLE "homepage_locales" ADD COLUMN "news_mode" "enum_homepage_news_mode" DEFAULT 'manual';
  ALTER TABLE "homepage_locales" ADD COLUMN "news_max_items" numeric DEFAULT 3;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_initial_display_count" numeric;
  ALTER TABLE "homepage_locales" ADD COLUMN "project_info_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "project_info_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "project_info_no_gap" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_type" "enum_bg_type" DEFAULT 'none';
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_ccm_color" "enum_bg_ccm_color";
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_gradient_direction" "enum_bg_gradient_direction" DEFAULT 'to-r';
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_gradient_start_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_gradient_end_color" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_svg_pattern_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_image_asset_id" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_light_text" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_background_blob_accent" boolean DEFAULT false;
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_section_width" "enum_homepage_mental_health_definition_section_width" DEFAULT 'default';
  ALTER TABLE "homepage_locales" ADD COLUMN "mental_health_definition_stack_align" "enum_homepage_mental_health_definition_stack_align" DEFAULT 'left';
  ALTER TABLE "homepage_locales" ADD COLUMN "partner_logos_padding_top" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "partner_logos_padding_bottom" boolean;
  ALTER TABLE "homepage_locales" ADD COLUMN "partner_logos_layout" "enum_homepage_partner_logos_layout" DEFAULT 'marquee';
  ALTER TABLE "homepage_locales" ADD COLUMN "partner_logos_motion_speed" "enum_homepage_partner_logos_motion_speed" DEFAULT 'default';
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "basic_info_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "basic_info_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "basic_info_field_hints_username_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "basic_info_field_hints_headline_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "basic_info_field_hints_bio_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "basic_info_field_hints_motivation_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "basic_info_field_hints_language_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "work_info_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "work_info_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "work_info_field_hints_work_types_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "work_info_field_hints_expertise_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "work_info_field_hints_work_bio_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "work_info_field_hints_social_links_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "work_info_field_hints_communities_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "community_info_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "community_info_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "community_info_field_hints_communities_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "community_info_field_hints_communities_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "community_info_field_hints_optional_note" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "recent_work_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "recent_work_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "recent_work_field_hints_work_link_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "recent_work_field_hints_is_ongoing_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "recent_work_field_hints_no_work_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "searchability_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "searchability_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "searchability_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_options_public_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_options_public_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_options_members_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_options_members_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_options_private_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_options_private_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "profile_info_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "profile_info_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_hints_email_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_hints_phone_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_hints_work_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_hints_social_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_hints_location_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "review_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "review_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "review_ready_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "review_ready_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "complete_onboarding_text" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_first_name_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_first_name_too_long" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_last_name_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_last_name_too_long" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_username_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_username_too_short" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_username_too_long" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_username_invalid_format" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_bio_too_long" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_country_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_basic_info_city_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_work_info_work_types_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_work_info_expertise_areas_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_work_info_work_bio_too_long" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_work_info_invalid_linked_in_url" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_work_info_invalid_website_url" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_work_info_invalid_social_link_url" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_work_info_social_link_platform_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_recent_work_title_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_recent_work_title_too_long" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_recent_work_description_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_recent_work_description_too_long" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_recent_work_invalid_url" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_recent_work_start_date_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_recent_work_end_date_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_general_please_complete_required" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_general_validation_error" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "validation_messages_general_submission_error" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_first_name" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_last_name" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_username" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_headline" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_headline_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_bio" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_bio_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_motivation" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_motivation_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_age_group" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_select_age" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_under18" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_above18" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_country" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_city" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_preferred_language" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_first_name_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_last_name_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_username_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_country_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_basic_info_city_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_work_types" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_expertise_areas" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_regional_communities" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_regional_communities_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_organization" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_organization_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_position" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_position_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_work_bio" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_work_bio_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_social_links" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_linkedin" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_linkedin_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_other_links" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_other_links_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_website" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_work_info_website_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_your_work" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_add_work" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_edit_work" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_update_work" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_work_title" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_work_title_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_description" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_description_placeholder" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_project_link" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_start_date" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_end_date" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_ongoing_project" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_ongoing" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_view_project" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_cancel" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_no_work_added" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_recent_work_add_work_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_basic_info" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_work_info" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_recent_work" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_privacy_settings" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_name" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_username" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_location" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_language" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_age_group" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_bio" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_work_types" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_expertise_areas" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_regional_communities" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_organization" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_position" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_work_bio" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_social_links" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_profile_visibility" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_searchable" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_show_email" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_show_phone" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_show_work" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_show_social" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_show_location" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_yes" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_no" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_under18" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_above18" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_ready_to_submit" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "field_labels_review_submission_note" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_allow_search" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_search_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_show_email" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_email_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_show_phone" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_phone_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_show_work" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_work_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_show_social" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_social_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_show_location" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "privacy_field_labels_location_hint" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_labels_public" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_labels_members" varchar;
  ALTER TABLE "onboarding_content_locales" ADD COLUMN "visibility_labels_private" varchar;
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
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_type";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_ccm_color";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_color";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_gradient_direction";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_gradient_start_color";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_gradient_end_color";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_svg_pattern_id";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_light_text";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_background_blob_accent";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "hero_welcome_image_position";
  ALTER TABLE "homepage" DROP COLUMN "global_agenda_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "global_agenda_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "global_agenda_no_gap";
  ALTER TABLE "homepage" DROP COLUMN "how_to_use_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "how_to_use_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "how_to_use_no_gap";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_type";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_ccm_color";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_color";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_gradient_direction";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_gradient_start_color";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_gradient_end_color";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_svg_pattern_id";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_light_text";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_background_blob_accent";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_header_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_grid_columns";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_card_variant";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_mode";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_max_items";
  ALTER TABLE "homepage" DROP COLUMN "agendas_module_initial_display_count";
  ALTER TABLE "homepage" DROP COLUMN "lived_experiences_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "lived_experiences_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_type";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_ccm_color";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_color";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_gradient_direction";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_gradient_start_color";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_gradient_end_color";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_svg_pattern_id";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_light_text";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_background_blob_accent";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_header_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_grid_columns";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_card_variant";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_mode";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_max_items";
  ALTER TABLE "homepage" DROP COLUMN "regional_communities_initial_display_count";
  ALTER TABLE "homepage" DROP COLUMN "collaboration_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "collaboration_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "collaboration_no_gap";
  ALTER TABLE "homepage" DROP COLUMN "news_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "news_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "news_background_type";
  ALTER TABLE "homepage" DROP COLUMN "news_background_ccm_color";
  ALTER TABLE "homepage" DROP COLUMN "news_background_color";
  ALTER TABLE "homepage" DROP COLUMN "news_background_gradient_direction";
  ALTER TABLE "homepage" DROP COLUMN "news_background_gradient_start_color";
  ALTER TABLE "homepage" DROP COLUMN "news_background_gradient_end_color";
  ALTER TABLE "homepage" DROP COLUMN "news_background_svg_pattern_id";
  ALTER TABLE "homepage" DROP COLUMN "news_background_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "news_background_light_text";
  ALTER TABLE "homepage" DROP COLUMN "news_background_blob_accent";
  ALTER TABLE "homepage" DROP COLUMN "news_header_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "news_grid_columns";
  ALTER TABLE "homepage" DROP COLUMN "news_card_variant";
  ALTER TABLE "homepage" DROP COLUMN "news_mode";
  ALTER TABLE "homepage" DROP COLUMN "news_max_items";
  ALTER TABLE "homepage" DROP COLUMN "news_initial_display_count";
  ALTER TABLE "homepage" DROP COLUMN "project_info_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "project_info_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "project_info_no_gap";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_type";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_ccm_color";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_color";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_gradient_direction";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_gradient_start_color";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_gradient_end_color";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_svg_pattern_id";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_image_asset_id";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_light_text";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_background_blob_accent";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_section_width";
  ALTER TABLE "homepage" DROP COLUMN "mental_health_definition_stack_align";
  ALTER TABLE "homepage" DROP COLUMN "partner_logos_padding_top";
  ALTER TABLE "homepage" DROP COLUMN "partner_logos_padding_bottom";
  ALTER TABLE "homepage" DROP COLUMN "partner_logos_layout";
  ALTER TABLE "homepage" DROP COLUMN "partner_logos_motion_speed";`)
}
