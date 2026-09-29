import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_regional_communities_blocks_community_header__gfrato" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_hero1_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_regional_communities_blocks_hero1_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_hero2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_section_header_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_regional_communities_blocks_section_header_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_regional_communities_blocks_section_header_ch_bd3iha" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_split_row_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_carousel1_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum_regional_communities_blocks_carousel1_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum_regional_communities_blocks_carousel1_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_timeline_row_chap_1eegxe5" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_faqs_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_filt_20h7da" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_chap_1rge6pj" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_events_calendar_c_13ygnl9" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_people_widget_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_regional_communities_blocks_people_widget_cha_1659sat" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_grid_row_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_regional_communities_blocks_grid_row_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_regional_communities_blocks_grid_row_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_regional_communities_blocks_grid_row_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_region_map_chapte_1yk15pm" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_atlas_embed_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_regional_communities_blocks_atlas_embed_chapt_25dfli" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_cta1_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_regional_communities_blocks_cta1_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_regional_communities_blocks_cta1_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_submit_story_bann_1ykpwzu" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_form_newsletter_c_14z7pw5" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_logo_cloud1_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_regional_communities_blocks_logo_cloud1_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_regional_communities_blocks_logo_cloud1_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum_regional_communities_blocks_logo_cloud1_chapt_no9yx1" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_carousel2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_community_members_t33wpu" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_community_header__1y3gsh7" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_hero1_2_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_regional_communities_blocks_hero1_2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_hero2_2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_section_header_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_regional_communities_blocks_section_header_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_regional_communities_blocks_section_header_2__gedkgd" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_split_row_2_chapt_1scenwj" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_carousel1_2_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum_regional_communities_blocks_carousel1_2_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum_regional_communities_blocks_carousel1_2_chapt_cauxwd" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_timeline_row_2_ch_l9so6y" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_faqs_2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_2_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_2_fi_1w4eu6f" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_2_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_2_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_2_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum_regional_communities_blocks_content_feed_2_ch_yh1ub8" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_events_calendar_2_1yhfz4q" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_people_widget_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_regional_communities_blocks_people_widget_2_c_11urcg2" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_grid_row_2_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum_regional_communities_blocks_grid_row_2_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum_regional_communities_blocks_grid_row_2_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum_regional_communities_blocks_grid_row_2_chapte_b6t8tv" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_region_map_2_chap_1khqxi9" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_atlas_embed_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum_regional_communities_blocks_atlas_embed_2_cha_1qp5bad" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_cta1_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_regional_communities_blocks_cta1_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_regional_communities_blocks_cta1_2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_submit_story_bann_k0twxt" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_form_newsletter_2_11nvtoy" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_logo_cloud1_2_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum_regional_communities_blocks_logo_cloud1_2_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum_regional_communities_blocks_logo_cloud1_2_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum_regional_communities_blocks_logo_cloud1_2_cha_1v49s1u" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_carousel2_2_chapt_hii4za" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_blocks_community_members_1owqk15" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum_regional_communities_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_community_head_z9koa" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_hero1_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_hero1_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_hero2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_section_header_wzwr86" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_section_header_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_section_header_12xzwqo" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_split_row_chap_1ykuzke" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_carousel1_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_carousel1_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_carousel1_chap_14nx26c" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_timeline_row_c_pvpskr" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_faqs_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_f_zeltmw" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_c_wbxj9d" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_events_calenda_9o9sg7" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_people_widget_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_people_widget__baoh03" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_grid_row_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_grid_row_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_grid_row_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_grid_row_chapt_1t88e8u" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_region_map_cha_xvdpkw" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_atlas_embed_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_atlas_embed_ch_17s1ah4" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_cta1_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_cta1_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_cta1_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_submit_story_b_zwdst0" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_form_newslette_s3biab" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_images_org_type" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_ch_jtm3wj" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_carousel2_chap_1jh0a0j" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_community_memb_1v441c4" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_community_head_5st7xd" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_hero1_2_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_hero1_2_chapte_1t5ygvh" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_hero2_2_chapte_k3pmiu" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_section_header_1qci2uf" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_section_header_11dk2fd" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_section_header_unitpz" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_split_row_2_ch_1cab6h9" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_carousel1_2_size" AS ENUM('one', 'two', 'three');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_carousel1_2_indicators" AS ENUM('none', 'dots', 'count');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_carousel1_2_ch_hbqyvn" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_timeline_row_2_urw8y8" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_faqs_2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_kinds" AS ENUM('caseStudies', 'newsPosts', 'events', 'livedExperiences', 'researchOutputs', 'agendas');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_llwf8x" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_fill" AS ENUM('automatic', 'automaticWithPicks', 'picksOnly');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_sort" AS ENUM('newest', 'featuredFirst', 'upcomingSoonest', 'myOrder');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_layout" AS ENUM('grid', 'carousel', 'list');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_1gu2ali" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_events_calenda_bavpvo" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_people_widget_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_people_widget__1ucyr60" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_grid_row_2_mode" AS ENUM('manual', 'dynamic-recent', 'dynamic-featured');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_grid_row_2_grid_columns" AS ENUM('grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_grid_row_2_card_variant" AS ENUM('classic', 'wide');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_grid_row_2_cha_1lo9grh" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_region_map_2_c_1als5o7" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_atlas_embed_2_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_atlas_embed_2__13fttjj" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_cta1_2_section_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_cta1_2_stack_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_cta1_2_chapter_chapter_kind" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_submit_story_b_1kwp65f" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_form_newslette_on6v9k" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_2__9jfx1e" AS ENUM('ngo', 'research', 'university', 'government', 'international', 'company', 'community', 'foundation', 'other');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_2_layout" AS ENUM('grid', 'marquee');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_2_motion_speed" AS ENUM('default', 'slow');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_2__1g5s77c" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_carousel2_2_ch_18ei82w" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_blocks_community_memb_16accr7" AS ENUM('none', 'overview', 'agendas', 'caseStudies', 'news', 'voices', 'members', 'partners', 'custom');
  CREATE TYPE "public"."enum__regional_communities_v_version_region" AS ENUM('ssa', 'nawa', 'csa', 'esea', 'lac', 'oce', 'enam');
  CREATE TYPE "public"."enum__regional_communities_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__regional_communities_v_published_locale" AS ENUM('en', 'es', 'fr', 'ar');
  CREATE TABLE "regional_communities_blocks_community_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_community_header__gfrato" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_community_header_locales" (
  	"intro" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_hero1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "regional_communities_blocks_hero1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_hero1" (
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
  	"image_position" "enum_regional_communities_blocks_hero1_image_position" DEFAULT 'right',
  	"chapter_kind" "enum_regional_communities_blocks_hero1_chapter_chapter_kind" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_hero1_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_alt" varchar,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_hero2_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "regional_communities_blocks_hero2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_hero2" (
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
  	"chapter_kind" "enum_regional_communities_blocks_hero2_chapter_chapter_kind" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_hero2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_section_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum_regional_communities_blocks_section_header_section_width" DEFAULT 'default',
  	"stack_align" "enum_regional_communities_blocks_section_header_stack_align" DEFAULT 'left',
  	"chapter_kind" "enum_regional_communities_blocks_section_header_ch_bd3iha" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_section_header_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_split_content" (
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
  
  CREATE TABLE "regional_communities_blocks_split_content_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_split_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_split_image_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_split_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"chapter_kind" "enum_regional_communities_blocks_split_row_chapter_chapter_kind" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_split_row_locales" (
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_carousel1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_carousel1_images_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_carousel1" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_regional_communities_blocks_carousel1_size" DEFAULT 'one',
  	"indicators" "enum_regional_communities_blocks_carousel1_indicators" DEFAULT 'dots',
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
  	"chapter_kind" "enum_regional_communities_blocks_carousel1_chapter_chapter_kind" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_carousel1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_timeline_row_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_timeline_row_timelines_locales" (
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_timeline_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_timeline_row_chap_1eegxe5" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_timeline_row_locales" (
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_faqs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_faqs_faqs_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_faqs_chapter_chapter_kind" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_faqs_locales" (
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_content_feed_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_regional_communities_blocks_content_feed_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_content_feed_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_regional_communities_blocks_content_feed_filt_20h7da",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_content_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"fill" "enum_regional_communities_blocks_content_feed_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum_regional_communities_blocks_content_feed_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum_regional_communities_blocks_content_feed_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"chapter_kind" "enum_regional_communities_blocks_content_feed_chap_1rge6pj" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_content_feed_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_events_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"upcoming_limit" numeric DEFAULT 6,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_events_calendar_c_13ygnl9" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_events_calendar_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_people_widget" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 12,
  	"region" "enum_regional_communities_blocks_people_widget_region",
  	"chapter_kind" "enum_regional_communities_blocks_people_widget_cha_1659sat" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_people_widget_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_grid_card" (
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
  
  CREATE TABLE "regional_communities_blocks_grid_card_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_grid_agenda" (
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
  
  CREATE TABLE "regional_communities_blocks_grid_news" (
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
  
  CREATE TABLE "regional_communities_blocks_grid_news_locales" (
  	"custom_excerpt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_grid_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header_image_asset_id" varchar,
  	"mode" "enum_regional_communities_blocks_grid_row_mode" DEFAULT 'manual',
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
  	"grid_columns" "enum_regional_communities_blocks_grid_row_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum_regional_communities_blocks_grid_row_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"chapter_kind" "enum_regional_communities_blocks_grid_row_chapter_chapter_kind" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_grid_row_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_alt" varchar,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_region_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chapter_kind" "enum_regional_communities_blocks_region_map_chapte_1yk15pm" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_region_map_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_atlas_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" "enum_regional_communities_blocks_atlas_embed_region",
  	"show_breakdown" boolean DEFAULT true,
  	"chapter_kind" "enum_regional_communities_blocks_atlas_embed_chapt_25dfli" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_atlas_embed_locales" (
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_cta1_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"target" boolean,
  	"button_variant_variant" "enum_btn_variant" DEFAULT 'default',
  	"button_variant_size" "enum_btn_size" DEFAULT 'default',
  	"button_variant_stroke" "enum_btn_stroke" DEFAULT 'none'
  );
  
  CREATE TABLE "regional_communities_blocks_cta1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_cta1" (
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
  	"section_width" "enum_regional_communities_blocks_cta1_section_width" DEFAULT 'default',
  	"stack_align" "enum_regional_communities_blocks_cta1_stack_align" DEFAULT 'left',
  	"chapter_kind" "enum_regional_communities_blocks_cta1_chapter_chapter_kind" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_cta1_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_submit_story_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"illustration_asset_id" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_submit_story_bann_1ykpwzu" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_submit_story_banner_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_form_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_form_newsletter_c_14z7pw5" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_form_newsletter_locales" (
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_logo_cloud1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"org_type" "enum_regional_communities_blocks_logo_cloud1_images_org_type"
  );
  
  CREATE TABLE "regional_communities_blocks_logo_cloud1_images_locales" (
  	"alt" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_logo_cloud1" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_regional_communities_blocks_logo_cloud1_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum_regional_communities_blocks_logo_cloud1_motion_speed" DEFAULT 'default',
  	"chapter_kind" "enum_regional_communities_blocks_logo_cloud1_chapt_no9yx1" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_logo_cloud1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_carousel2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_carousel2_chapter_chapter_kind" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_carousel2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_community_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_community_members_t33wpu" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_community_members_locales" (
  	"title" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_community_header_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"intro" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_community_header__1y3gsh7" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_hero1_2_links" (
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
  
  CREATE TABLE "regional_communities_blocks_hero1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
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
  	"image_position" "enum_regional_communities_blocks_hero1_2_image_position" DEFAULT 'right',
  	"chapter_kind" "enum_regional_communities_blocks_hero1_2_chapter_chapter_kind" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_hero2_2_links" (
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
  
  CREATE TABLE "regional_communities_blocks_hero2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
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
  	"chapter_kind" "enum_regional_communities_blocks_hero2_2_chapter_chapter_kind" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_section_header_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum_regional_communities_blocks_section_header_2_section_width" DEFAULT 'default',
  	"stack_align" "enum_regional_communities_blocks_section_header_2_stack_align" DEFAULT 'left',
  	"chapter_kind" "enum_regional_communities_blocks_section_header_2__gedkgd" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_split_content_2" (
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
  
  CREATE TABLE "regional_communities_blocks_split_image_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"image_alt" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_split_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"chapter_kind" "enum_regional_communities_blocks_split_row_2_chapt_1scenwj" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_carousel1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_carousel1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"size" "enum_regional_communities_blocks_carousel1_2_size" DEFAULT 'one',
  	"indicators" "enum_regional_communities_blocks_carousel1_2_indicators" DEFAULT 'dots',
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
  	"chapter_kind" "enum_regional_communities_blocks_carousel1_2_chapt_cauxwd" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_timeline_row_2_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "regional_communities_blocks_timeline_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_timeline_row_2_ch_l9so6y" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_faqs_2_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "regional_communities_blocks_faqs_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_faqs_2_chapter_chapter_kind" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_content_feed_2_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_regional_communities_blocks_content_feed_2_kinds",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_content_feed_2_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_regional_communities_blocks_content_feed_2_fi_1w4eu6f",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "regional_communities_blocks_content_feed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"fill" "enum_regional_communities_blocks_content_feed_2_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum_regional_communities_blocks_content_feed_2_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum_regional_communities_blocks_content_feed_2_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"view_all_label" varchar,
  	"chapter_kind" "enum_regional_communities_blocks_content_feed_2_ch_yh1ub8" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_events_calendar_2" (
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
  	"chapter_kind" "enum_regional_communities_blocks_events_calendar_2_1yhfz4q" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_people_widget_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 12,
  	"region" "enum_regional_communities_blocks_people_widget_2_region",
  	"chapter_kind" "enum_regional_communities_blocks_people_widget_2_c_11urcg2" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_grid_card_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
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
  
  CREATE TABLE "regional_communities_blocks_grid_agenda_2" (
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
  
  CREATE TABLE "regional_communities_blocks_grid_news_2" (
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
  
  CREATE TABLE "regional_communities_blocks_grid_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_asset_id" varchar,
  	"header_image_alt" varchar,
  	"mode" "enum_regional_communities_blocks_grid_row_2_mode" DEFAULT 'manual',
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
  	"grid_columns" "enum_regional_communities_blocks_grid_row_2_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum_regional_communities_blocks_grid_row_2_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"chapter_kind" "enum_regional_communities_blocks_grid_row_2_chapte_b6t8tv" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_region_map_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"chapter_kind" "enum_regional_communities_blocks_region_map_2_chap_1khqxi9" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_atlas_embed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" "enum_regional_communities_blocks_atlas_embed_2_region",
  	"show_breakdown" boolean DEFAULT true,
  	"chapter_kind" "enum_regional_communities_blocks_atlas_embed_2_cha_1qp5bad" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_cta1_2_links" (
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
  
  CREATE TABLE "regional_communities_blocks_cta1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
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
  	"section_width" "enum_regional_communities_blocks_cta1_2_section_width" DEFAULT 'default',
  	"stack_align" "enum_regional_communities_blocks_cta1_2_stack_align" DEFAULT 'left',
  	"chapter_kind" "enum_regional_communities_blocks_cta1_2_chapter_chapter_kind" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_submit_story_banner_2" (
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
  	"chapter_kind" "enum_regional_communities_blocks_submit_story_bann_k0twxt" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_form_newsletter_2" (
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
  	"chapter_kind" "enum_regional_communities_blocks_form_newsletter_2_11nvtoy" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_logo_cloud1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum_regional_communities_blocks_logo_cloud1_2_images_org_type"
  );
  
  CREATE TABLE "regional_communities_blocks_logo_cloud1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum_regional_communities_blocks_logo_cloud1_2_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum_regional_communities_blocks_logo_cloud1_2_motion_speed" DEFAULT 'default',
  	"chapter_kind" "enum_regional_communities_blocks_logo_cloud1_2_cha_1v49s1u" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_carousel2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_carousel2_2_chapt_hii4za" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_blocks_community_members_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum_regional_communities_blocks_community_members_1owqk15" DEFAULT 'none',
  	"chapter_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "regional_communities_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"case_studies_id" varchar,
  	"news_posts_id" varchar,
  	"events_id" varchar,
  	"lived_experiences_id" varchar,
  	"research_outputs_id" varchar,
  	"agendas_id" varchar,
  	"regional_communities_id" varchar,
  	"tags_id" varchar,
  	"organizations_id" varchar,
  	"testimonials_id" varchar
  );
  
  CREATE TABLE "_regional_communities_v_version_boundaries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"point" geometry(Point),
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_version_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"person_id" varchar,
  	"role" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_community_head_z9koa" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_header_locales" (
  	"intro" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_hero1_links" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_hero1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_hero1" (
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
  	"image_position" "enum__regional_communities_v_blocks_hero1_image_position" DEFAULT 'right',
  	"chapter_kind" "enum__regional_communities_v_blocks_hero1_chapter_chapter_kind" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_hero1_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"image_alt" varchar,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_hero2_links" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_hero2_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_hero2" (
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
  	"chapter_kind" "enum__regional_communities_v_blocks_hero2_chapter_chapter_kind" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_hero2_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_section_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"section_width" "enum__regional_communities_v_blocks_section_header_wzwr86" DEFAULT 'default',
  	"stack_align" "enum__regional_communities_v_blocks_section_header_stack_align" DEFAULT 'left',
  	"chapter_kind" "enum__regional_communities_v_blocks_section_header_12xzwqo" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_section_header_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_split_content" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_split_content_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_split_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_asset_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_split_image_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_split_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"chapter_kind" "enum__regional_communities_v_blocks_split_row_chap_1ykuzke" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_split_row_locales" (
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel1_images_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "enum__regional_communities_v_blocks_carousel1_size" DEFAULT 'one',
  	"indicators" "enum__regional_communities_v_blocks_carousel1_indicators" DEFAULT 'dots',
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
  	"chapter_kind" "enum__regional_communities_v_blocks_carousel1_chap_14nx26c" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_timeline_row_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_timeline_row_timelines_locales" (
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_timeline_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_timeline_row_c_pvpskr" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_timeline_row_locales" (
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_faqs_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_faqs_faqs_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_faqs_chapter_chapter_kind" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_faqs_locales" (
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_content_feed_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__regional_communities_v_blocks_content_feed_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_content_feed_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__regional_communities_v_blocks_content_feed_f_zeltmw",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_content_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"fill" "enum__regional_communities_v_blocks_content_feed_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum__regional_communities_v_blocks_content_feed_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum__regional_communities_v_blocks_content_feed_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"chapter_kind" "enum__regional_communities_v_blocks_content_feed_c_wbxj9d" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_content_feed_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_events_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"upcoming_limit" numeric DEFAULT 6,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_events_calenda_9o9sg7" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_events_calendar_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_people_widget" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 12,
  	"region" "enum__regional_communities_v_blocks_people_widget_region",
  	"chapter_kind" "enum__regional_communities_v_blocks_people_widget__baoh03" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_people_widget_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_grid_card" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_grid_card_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"image_alt" varchar,
  	"link_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_grid_agenda" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_grid_news" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_grid_news_locales" (
  	"custom_excerpt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_grid_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_image_asset_id" varchar,
  	"mode" "enum__regional_communities_v_blocks_grid_row_mode" DEFAULT 'manual',
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
  	"grid_columns" "enum__regional_communities_v_blocks_grid_row_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum__regional_communities_v_blocks_grid_row_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"chapter_kind" "enum__regional_communities_v_blocks_grid_row_chapt_1t88e8u" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_grid_row_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"description" jsonb,
  	"header_image_alt" varchar,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_region_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"chapter_kind" "enum__regional_communities_v_blocks_region_map_cha_xvdpkw" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_region_map_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_atlas_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum__regional_communities_v_blocks_atlas_embed_region",
  	"show_breakdown" boolean DEFAULT true,
  	"chapter_kind" "enum__regional_communities_v_blocks_atlas_embed_ch_17s1ah4" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_atlas_embed_locales" (
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_cta1_links" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_cta1_links_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_cta1" (
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
  	"section_width" "enum__regional_communities_v_blocks_cta1_section_width" DEFAULT 'default',
  	"stack_align" "enum__regional_communities_v_blocks_cta1_stack_align" DEFAULT 'left',
  	"chapter_kind" "enum__regional_communities_v_blocks_cta1_chapter_chapter_kind" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_cta1_locales" (
  	"tag_line" varchar,
  	"title" varchar,
  	"body" jsonb,
  	"background_image_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_submit_story_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"illustration_asset_id" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_submit_story_b_zwdst0" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_submit_story_banner_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"illustration_alt" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_form_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_form_newslette_s3biab" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_form_newsletter_locales" (
  	"consent_text" varchar,
  	"button_text" varchar,
  	"success_message" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_logo_cloud1_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"org_type" "enum__regional_communities_v_blocks_logo_cloud1_images_org_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_logo_cloud1_images_locales" (
  	"alt" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_logo_cloud1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum__regional_communities_v_blocks_logo_cloud1_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum__regional_communities_v_blocks_logo_cloud1_motion_speed" DEFAULT 'default',
  	"chapter_kind" "enum__regional_communities_v_blocks_logo_cloud1_ch_jtm3wj" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_logo_cloud1_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_carousel2_chap_1jh0a0j" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel2_locales" (
  	"title" varchar,
  	"description" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_community_memb_1v441c4" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_members_locales" (
  	"title" varchar,
  	"chapter_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_header_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_community_head_5st7xd" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_hero1_2_links" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_hero1_2" (
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
  	"image_position" "enum__regional_communities_v_blocks_hero1_2_image_position" DEFAULT 'right',
  	"chapter_kind" "enum__regional_communities_v_blocks_hero1_2_chapte_1t5ygvh" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_hero2_2_links" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_hero2_2" (
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
  	"chapter_kind" "enum__regional_communities_v_blocks_hero2_2_chapte_k3pmiu" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_section_header_2" (
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
  	"section_width" "enum__regional_communities_v_blocks_section_header_1qci2uf" DEFAULT 'default',
  	"stack_align" "enum__regional_communities_v_blocks_section_header_11dk2fd" DEFAULT 'left',
  	"chapter_kind" "enum__regional_communities_v_blocks_section_header_unitpz" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_split_content_2" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_split_image_2" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_split_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"no_gap" boolean DEFAULT false,
  	"chapter_kind" "enum__regional_communities_v_blocks_split_row_2_ch_1cab6h9" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"size" "enum__regional_communities_v_blocks_carousel1_2_size" DEFAULT 'one',
  	"indicators" "enum__regional_communities_v_blocks_carousel1_2_indicators" DEFAULT 'dots',
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
  	"chapter_kind" "enum__regional_communities_v_blocks_carousel1_2_ch_hbqyvn" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_timeline_row_2_timelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag_line" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_timeline_row_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_timeline_row_2_urw8y8" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_faqs_2_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_faqs_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_faqs_2_chapter_chapter_kind" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_content_feed_2_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__regional_communities_v_blocks_content_feed_2_kinds",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_content_feed_2_filters_regions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__regional_communities_v_blocks_content_feed_2_llwf8x",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_blocks_content_feed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"fill" "enum__regional_communities_v_blocks_content_feed_2_fill" DEFAULT 'automatic',
  	"filters_featured_only" boolean,
  	"filters_upcoming_only" boolean,
  	"sort" "enum__regional_communities_v_blocks_content_feed_2_sort" DEFAULT 'newest',
  	"count" numeric DEFAULT 6,
  	"layout" "enum__regional_communities_v_blocks_content_feed_2_layout" DEFAULT 'grid',
  	"view_all_show" boolean DEFAULT true,
  	"view_all_href" varchar,
  	"view_all_label" varchar,
  	"chapter_kind" "enum__regional_communities_v_blocks_content_feed_2_1gu2ali" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_events_calendar_2" (
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
  	"chapter_kind" "enum__regional_communities_v_blocks_events_calenda_bavpvo" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_people_widget_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 12,
  	"region" "enum__regional_communities_v_blocks_people_widget_2_region",
  	"chapter_kind" "enum__regional_communities_v_blocks_people_widget__1ucyr60" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_grid_card_2" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_grid_agenda_2" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_grid_news_2" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_grid_row_2" (
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
  	"mode" "enum__regional_communities_v_blocks_grid_row_2_mode" DEFAULT 'manual',
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
  	"grid_columns" "enum__regional_communities_v_blocks_grid_row_2_grid_columns" DEFAULT 'grid-cols-3',
  	"card_variant" "enum__regional_communities_v_blocks_grid_row_2_card_variant" DEFAULT 'classic',
  	"initial_display_count" numeric,
  	"chapter_kind" "enum__regional_communities_v_blocks_grid_row_2_cha_1lo9grh" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_region_map_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"chapter_kind" "enum__regional_communities_v_blocks_region_map_2_c_1als5o7" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_atlas_embed_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum__regional_communities_v_blocks_atlas_embed_2_region",
  	"show_breakdown" boolean DEFAULT true,
  	"chapter_kind" "enum__regional_communities_v_blocks_atlas_embed_2__13fttjj" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_cta1_2_links" (
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
  
  CREATE TABLE "_regional_communities_v_blocks_cta1_2" (
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
  	"section_width" "enum__regional_communities_v_blocks_cta1_2_section_width" DEFAULT 'default',
  	"stack_align" "enum__regional_communities_v_blocks_cta1_2_stack_align" DEFAULT 'left',
  	"chapter_kind" "enum__regional_communities_v_blocks_cta1_2_chapter_chapter_kind" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_submit_story_banner_2" (
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
  	"chapter_kind" "enum__regional_communities_v_blocks_submit_story_b_1kwp65f" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_form_newsletter_2" (
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
  	"chapter_kind" "enum__regional_communities_v_blocks_form_newslette_on6v9k" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_logo_cloud1_2_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" varchar,
  	"alt" varchar,
  	"label" varchar,
  	"org_type" "enum__regional_communities_v_blocks_logo_cloud1_2__9jfx1e",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_logo_cloud1_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum__regional_communities_v_blocks_logo_cloud1_2_layout" DEFAULT 'marquee',
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"motion_speed" "enum__regional_communities_v_blocks_logo_cloud1_2_motion_speed" DEFAULT 'default',
  	"chapter_kind" "enum__regional_communities_v_blocks_logo_cloud1_2__1g5s77c" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_carousel2_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_carousel2_2_ch_18ei82w" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v_blocks_community_members_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"padding_top" boolean,
  	"padding_bottom" boolean,
  	"chapter_kind" "enum__regional_communities_v_blocks_community_memb_16accr7" DEFAULT 'none',
  	"chapter_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_regional_communities_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_sanity_updated_at" timestamp(3) with time zone,
  	"version_slug" varchar,
  	"version_region" "enum__regional_communities_v_version_region",
  	"version_cover_image_asset_id" varchar,
  	"version_contact_name" varchar,
  	"version_contact_email" varchar,
  	"version_contact_phone" varchar,
  	"version_contact_organization_id" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_active" boolean DEFAULT true,
  	"version_order_rank" varchar,
  	"version_layout_per_language" boolean DEFAULT false,
  	"version_noindex" boolean DEFAULT false,
  	"version_og_image_asset_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__regional_communities_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__regional_communities_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_regional_communities_v_locales" (
  	"version_name" varchar,
  	"version_cover_image_alt" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_og_image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regional_communities_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"case_studies_id" varchar,
  	"news_posts_id" varchar,
  	"events_id" varchar,
  	"lived_experiences_id" varchar,
  	"research_outputs_id" varchar,
  	"agendas_id" varchar,
  	"regional_communities_id" varchar,
  	"tags_id" varchar,
  	"organizations_id" varchar,
  	"testimonials_id" varchar
  );
  
  ALTER TABLE "regional_communities_members" ALTER COLUMN "person_id" DROP NOT NULL;
  ALTER TABLE "regional_communities" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "regional_communities_locales" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "regional_communities" ADD COLUMN "layout_per_language" boolean DEFAULT false;
  ALTER TABLE "regional_communities" ADD COLUMN "noindex" boolean DEFAULT false;
  ALTER TABLE "regional_communities" ADD COLUMN "og_image_asset_id" varchar;
  ALTER TABLE "regional_communities" ADD COLUMN "_status" "enum_regional_communities_status" DEFAULT 'draft';
  ALTER TABLE "regional_communities_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "regional_communities_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "regional_communities_locales" ADD COLUMN "og_image_alt" varchar;
  ALTER TABLE "regional_communities_blocks_community_header" ADD CONSTRAINT "regional_communities_blocks_community_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_community_header_locales" ADD CONSTRAINT "regional_communities_blocks_community_header_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_community_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1_links" ADD CONSTRAINT "regional_communities_blocks_hero1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1_links_locales" ADD CONSTRAINT "regional_communities_blocks_hero1_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_hero1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1" ADD CONSTRAINT "regional_communities_blocks_hero1_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1" ADD CONSTRAINT "regional_communities_blocks_hero1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1" ADD CONSTRAINT "regional_communities_blocks_hero1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1" ADD CONSTRAINT "regional_communities_blocks_hero1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1_locales" ADD CONSTRAINT "regional_communities_blocks_hero1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2_links" ADD CONSTRAINT "regional_communities_blocks_hero2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2_links_locales" ADD CONSTRAINT "regional_communities_blocks_hero2_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_hero2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2" ADD CONSTRAINT "regional_communities_blocks_hero2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2" ADD CONSTRAINT "regional_communities_blocks_hero2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2" ADD CONSTRAINT "regional_communities_blocks_hero2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2_locales" ADD CONSTRAINT "regional_communities_blocks_hero2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_section_header" ADD CONSTRAINT "regional_communities_blocks_section_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_section_header_locales" ADD CONSTRAINT "regional_communities_blocks_section_header_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_section_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_content" ADD CONSTRAINT "regional_communities_blocks_split_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_content_locales" ADD CONSTRAINT "regional_communities_blocks_split_content_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_split_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_image" ADD CONSTRAINT "regional_communities_blocks_split_image_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_image" ADD CONSTRAINT "regional_communities_blocks_split_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_image_locales" ADD CONSTRAINT "regional_communities_blocks_split_image_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_split_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_row" ADD CONSTRAINT "regional_communities_blocks_split_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_row_locales" ADD CONSTRAINT "regional_communities_blocks_split_row_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_split_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_images" ADD CONSTRAINT "regional_communities_blocks_carousel1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_images" ADD CONSTRAINT "regional_communities_blocks_carousel1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_images_locales" ADD CONSTRAINT "regional_communities_blocks_carousel1_images_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_carousel1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1" ADD CONSTRAINT "regional_communities_blocks_carousel1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1" ADD CONSTRAINT "regional_communities_blocks_carousel1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1" ADD CONSTRAINT "regional_communities_blocks_carousel1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_locales" ADD CONSTRAINT "regional_communities_blocks_carousel1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_timeline_row_timelines" ADD CONSTRAINT "regional_communities_blocks_timeline_row_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_timeline_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_timeline_row_timelines_locales" ADD CONSTRAINT "regional_communities_blocks_timeline_row_timelines_locale_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_timeline_row_timelines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_timeline_row" ADD CONSTRAINT "regional_communities_blocks_timeline_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_timeline_row_locales" ADD CONSTRAINT "regional_communities_blocks_timeline_row_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_timeline_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_faqs_faqs" ADD CONSTRAINT "regional_communities_blocks_faqs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_faqs_faqs_locales" ADD CONSTRAINT "regional_communities_blocks_faqs_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_faqs_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_faqs" ADD CONSTRAINT "regional_communities_blocks_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_faqs_locales" ADD CONSTRAINT "regional_communities_blocks_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_content_feed_kinds" ADD CONSTRAINT "regional_communities_blocks_content_feed_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_communities_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_content_feed_filters_regions" ADD CONSTRAINT "regional_communities_blocks_content_feed_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_communities_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_content_feed" ADD CONSTRAINT "regional_communities_blocks_content_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_content_feed_locales" ADD CONSTRAINT "regional_communities_blocks_content_feed_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_events_calendar" ADD CONSTRAINT "regional_communities_blocks_events_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_events_calendar_locales" ADD CONSTRAINT "regional_communities_blocks_events_calendar_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_events_calendar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_people_widget" ADD CONSTRAINT "regional_communities_blocks_people_widget_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_people_widget_locales" ADD CONSTRAINT "regional_communities_blocks_people_widget_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_people_widget"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_card" ADD CONSTRAINT "regional_communities_blocks_grid_card_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_card" ADD CONSTRAINT "regional_communities_blocks_grid_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_card_locales" ADD CONSTRAINT "regional_communities_blocks_grid_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_grid_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_agenda" ADD CONSTRAINT "regional_communities_blocks_grid_agenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_agenda" ADD CONSTRAINT "regional_communities_blocks_grid_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_news" ADD CONSTRAINT "regional_communities_blocks_grid_news_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_news" ADD CONSTRAINT "regional_communities_blocks_grid_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_news_locales" ADD CONSTRAINT "regional_communities_blocks_grid_news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_grid_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row" ADD CONSTRAINT "regional_communities_blocks_grid_row_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row" ADD CONSTRAINT "regional_communities_blocks_grid_row_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row" ADD CONSTRAINT "regional_communities_blocks_grid_row_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row" ADD CONSTRAINT "regional_communities_blocks_grid_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row_locales" ADD CONSTRAINT "regional_communities_blocks_grid_row_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_grid_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_region_map" ADD CONSTRAINT "regional_communities_blocks_region_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_region_map_locales" ADD CONSTRAINT "regional_communities_blocks_region_map_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_region_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_atlas_embed" ADD CONSTRAINT "regional_communities_blocks_atlas_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_atlas_embed_locales" ADD CONSTRAINT "regional_communities_blocks_atlas_embed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_atlas_embed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1_links" ADD CONSTRAINT "regional_communities_blocks_cta1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1_links_locales" ADD CONSTRAINT "regional_communities_blocks_cta1_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_cta1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1" ADD CONSTRAINT "regional_communities_blocks_cta1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1" ADD CONSTRAINT "regional_communities_blocks_cta1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1" ADD CONSTRAINT "regional_communities_blocks_cta1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1_locales" ADD CONSTRAINT "regional_communities_blocks_cta1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_submit_story_banner" ADD CONSTRAINT "regional_communities_blocks_submit_story_banner_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_submit_story_banner" ADD CONSTRAINT "regional_communities_blocks_submit_story_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_submit_story_banner_locales" ADD CONSTRAINT "regional_communities_blocks_submit_story_banner_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_submit_story_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_form_newsletter" ADD CONSTRAINT "regional_communities_blocks_form_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_form_newsletter_locales" ADD CONSTRAINT "regional_communities_blocks_form_newsletter_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_form_newsletter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_images" ADD CONSTRAINT "regional_communities_blocks_logo_cloud1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_images" ADD CONSTRAINT "regional_communities_blocks_logo_cloud1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_images_locales" ADD CONSTRAINT "regional_communities_blocks_logo_cloud1_images_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_logo_cloud1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_logo_cloud1" ADD CONSTRAINT "regional_communities_blocks_logo_cloud1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_locales" ADD CONSTRAINT "regional_communities_blocks_logo_cloud1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel2" ADD CONSTRAINT "regional_communities_blocks_carousel2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel2_locales" ADD CONSTRAINT "regional_communities_blocks_carousel2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_carousel2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_community_members" ADD CONSTRAINT "regional_communities_blocks_community_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_community_members_locales" ADD CONSTRAINT "regional_communities_blocks_community_members_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_community_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_community_header_2" ADD CONSTRAINT "regional_communities_blocks_community_header_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1_2_links" ADD CONSTRAINT "regional_communities_blocks_hero1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_hero1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1_2" ADD CONSTRAINT "regional_communities_blocks_hero1_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1_2" ADD CONSTRAINT "regional_communities_blocks_hero1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1_2" ADD CONSTRAINT "regional_communities_blocks_hero1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero1_2" ADD CONSTRAINT "regional_communities_blocks_hero1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2_2_links" ADD CONSTRAINT "regional_communities_blocks_hero2_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_hero2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2_2" ADD CONSTRAINT "regional_communities_blocks_hero2_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2_2" ADD CONSTRAINT "regional_communities_blocks_hero2_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_hero2_2" ADD CONSTRAINT "regional_communities_blocks_hero2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_section_header_2" ADD CONSTRAINT "regional_communities_blocks_section_header_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_content_2" ADD CONSTRAINT "regional_communities_blocks_split_content_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_image_2" ADD CONSTRAINT "regional_communities_blocks_split_image_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_image_2" ADD CONSTRAINT "regional_communities_blocks_split_image_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_split_row_2" ADD CONSTRAINT "regional_communities_blocks_split_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_2_images" ADD CONSTRAINT "regional_communities_blocks_carousel1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_2_images" ADD CONSTRAINT "regional_communities_blocks_carousel1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_carousel1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_2" ADD CONSTRAINT "regional_communities_blocks_carousel1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_2" ADD CONSTRAINT "regional_communities_blocks_carousel1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel1_2" ADD CONSTRAINT "regional_communities_blocks_carousel1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_timeline_row_2_timelines" ADD CONSTRAINT "regional_communities_blocks_timeline_row_2_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_timeline_row_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_timeline_row_2" ADD CONSTRAINT "regional_communities_blocks_timeline_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_faqs_2_faqs" ADD CONSTRAINT "regional_communities_blocks_faqs_2_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_faqs_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_faqs_2" ADD CONSTRAINT "regional_communities_blocks_faqs_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_content_feed_2_kinds" ADD CONSTRAINT "regional_communities_blocks_content_feed_2_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_communities_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_content_feed_2_filters_regions" ADD CONSTRAINT "regional_communities_blocks_content_feed_2_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_communities_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_content_feed_2" ADD CONSTRAINT "regional_communities_blocks_content_feed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_events_calendar_2" ADD CONSTRAINT "regional_communities_blocks_events_calendar_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_people_widget_2" ADD CONSTRAINT "regional_communities_blocks_people_widget_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_card_2" ADD CONSTRAINT "regional_communities_blocks_grid_card_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_card_2" ADD CONSTRAINT "regional_communities_blocks_grid_card_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_agenda_2" ADD CONSTRAINT "regional_communities_blocks_grid_agenda_2_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_agenda_2" ADD CONSTRAINT "regional_communities_blocks_grid_agenda_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_news_2" ADD CONSTRAINT "regional_communities_blocks_grid_news_2_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_news_2" ADD CONSTRAINT "regional_communities_blocks_grid_news_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row_2" ADD CONSTRAINT "regional_communities_blocks_grid_row_2_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row_2" ADD CONSTRAINT "regional_communities_blocks_grid_row_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row_2" ADD CONSTRAINT "regional_communities_blocks_grid_row_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_grid_row_2" ADD CONSTRAINT "regional_communities_blocks_grid_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_region_map_2" ADD CONSTRAINT "regional_communities_blocks_region_map_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_atlas_embed_2" ADD CONSTRAINT "regional_communities_blocks_atlas_embed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1_2_links" ADD CONSTRAINT "regional_communities_blocks_cta1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_cta1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1_2" ADD CONSTRAINT "regional_communities_blocks_cta1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1_2" ADD CONSTRAINT "regional_communities_blocks_cta1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_cta1_2" ADD CONSTRAINT "regional_communities_blocks_cta1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_submit_story_banner_2" ADD CONSTRAINT "regional_communities_blocks_submit_story_banner_2_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_submit_story_banner_2" ADD CONSTRAINT "regional_communities_blocks_submit_story_banner_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_form_newsletter_2" ADD CONSTRAINT "regional_communities_blocks_form_newsletter_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_2_images" ADD CONSTRAINT "regional_communities_blocks_logo_cloud1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_2_images" ADD CONSTRAINT "regional_communities_blocks_logo_cloud1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities_blocks_logo_cloud1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_2" ADD CONSTRAINT "regional_communities_blocks_logo_cloud1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_carousel2_2" ADD CONSTRAINT "regional_communities_blocks_carousel2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_blocks_community_members_2" ADD CONSTRAINT "regional_communities_blocks_community_members_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regional_communities_rels" ADD CONSTRAINT "regional_communities_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_version_boundaries" ADD CONSTRAINT "_regional_communities_v_version_boundaries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_version_members" ADD CONSTRAINT "_regional_communities_v_version_members_person_id_authors_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_version_members" ADD CONSTRAINT "_regional_communities_v_version_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_header" ADD CONSTRAINT "_regional_communities_v_blocks_community_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_header_locales" ADD CONSTRAINT "_regional_communities_v_blocks_community_header_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_community_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1_links" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1_links_locales" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_links_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_hero1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1_locales" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_hero1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2_links" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2_links_locales" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_links_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_hero2_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2_locales" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_hero2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_section_header" ADD CONSTRAINT "_regional_communities_v_blocks_section_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_section_header_locales" ADD CONSTRAINT "_regional_communities_v_blocks_section_header_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_section_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_content" ADD CONSTRAINT "_regional_communities_v_blocks_split_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_content_locales" ADD CONSTRAINT "_regional_communities_v_blocks_split_content_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_split_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_image" ADD CONSTRAINT "_regional_communities_v_blocks_split_image_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_image" ADD CONSTRAINT "_regional_communities_v_blocks_split_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_image_locales" ADD CONSTRAINT "_regional_communities_v_blocks_split_image_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_split_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_row" ADD CONSTRAINT "_regional_communities_v_blocks_split_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_row_locales" ADD CONSTRAINT "_regional_communities_v_blocks_split_row_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_split_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_images" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_images" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_images_locales" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_images_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_carousel1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_locales" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_carousel1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_timelines" ADD CONSTRAINT "_regional_communities_v_blocks_timeline_row_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_timeline_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_timelines_locales" ADD CONSTRAINT "_regional_communities_v_blocks_timeline_row_timelines_loc_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_timeline_row_timelines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row" ADD CONSTRAINT "_regional_communities_v_blocks_timeline_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_locales" ADD CONSTRAINT "_regional_communities_v_blocks_timeline_row_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_timeline_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_faqs_faqs" ADD CONSTRAINT "_regional_communities_v_blocks_faqs_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_faqs_faqs_locales" ADD CONSTRAINT "_regional_communities_v_blocks_faqs_faqs_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_faqs_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_faqs" ADD CONSTRAINT "_regional_communities_v_blocks_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_faqs_locales" ADD CONSTRAINT "_regional_communities_v_blocks_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_kinds" ADD CONSTRAINT "_regional_communities_v_blocks_content_feed_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_regional_communities_v_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_filters_regions" ADD CONSTRAINT "_regional_communities_v_blocks_content_feed_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_regional_communities_v_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_content_feed" ADD CONSTRAINT "_regional_communities_v_blocks_content_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_locales" ADD CONSTRAINT "_regional_communities_v_blocks_content_feed_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_content_feed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_events_calendar" ADD CONSTRAINT "_regional_communities_v_blocks_events_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_events_calendar_locales" ADD CONSTRAINT "_regional_communities_v_blocks_events_calendar_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_events_calendar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_people_widget" ADD CONSTRAINT "_regional_communities_v_blocks_people_widget_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_people_widget_locales" ADD CONSTRAINT "_regional_communities_v_blocks_people_widget_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_people_widget"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_card" ADD CONSTRAINT "_regional_communities_v_blocks_grid_card_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_card" ADD CONSTRAINT "_regional_communities_v_blocks_grid_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_card_locales" ADD CONSTRAINT "_regional_communities_v_blocks_grid_card_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_grid_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_agenda" ADD CONSTRAINT "_regional_communities_v_blocks_grid_agenda_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_agenda" ADD CONSTRAINT "_regional_communities_v_blocks_grid_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_news" ADD CONSTRAINT "_regional_communities_v_blocks_grid_news_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_news" ADD CONSTRAINT "_regional_communities_v_blocks_grid_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_news_locales" ADD CONSTRAINT "_regional_communities_v_blocks_grid_news_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_grid_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row_locales" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_grid_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_region_map" ADD CONSTRAINT "_regional_communities_v_blocks_region_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_region_map_locales" ADD CONSTRAINT "_regional_communities_v_blocks_region_map_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_region_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_atlas_embed" ADD CONSTRAINT "_regional_communities_v_blocks_atlas_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_atlas_embed_locales" ADD CONSTRAINT "_regional_communities_v_blocks_atlas_embed_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_atlas_embed"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1_links" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1_links_locales" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_links_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_cta1_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1_locales" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_cta1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_submit_story_banner" ADD CONSTRAINT "_regional_communities_v_blocks_submit_story_banner_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_submit_story_banner" ADD CONSTRAINT "_regional_communities_v_blocks_submit_story_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_submit_story_banner_locales" ADD CONSTRAINT "_regional_communities_v_blocks_submit_story_banner_locale_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_submit_story_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_form_newsletter" ADD CONSTRAINT "_regional_communities_v_blocks_form_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_form_newsletter_locales" ADD CONSTRAINT "_regional_communities_v_blocks_form_newsletter_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_form_newsletter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_images" ADD CONSTRAINT "_regional_communities_v_blocks_logo_cloud1_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_images" ADD CONSTRAINT "_regional_communities_v_blocks_logo_cloud1_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_images_locales" ADD CONSTRAINT "_regional_communities_v_blocks_logo_cloud1_images_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_logo_cloud1_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1" ADD CONSTRAINT "_regional_communities_v_blocks_logo_cloud1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_locales" ADD CONSTRAINT "_regional_communities_v_blocks_logo_cloud1_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_logo_cloud1"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel2" ADD CONSTRAINT "_regional_communities_v_blocks_carousel2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel2_locales" ADD CONSTRAINT "_regional_communities_v_blocks_carousel2_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_carousel2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_members" ADD CONSTRAINT "_regional_communities_v_blocks_community_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_members_locales" ADD CONSTRAINT "_regional_communities_v_blocks_community_members_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_community_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_header_2" ADD CONSTRAINT "_regional_communities_v_blocks_community_header_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1_2_links" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_hero1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1_2" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1_2" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1_2" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero1_2" ADD CONSTRAINT "_regional_communities_v_blocks_hero1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2_2_links" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_hero2_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2_2" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2_2" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_hero2_2" ADD CONSTRAINT "_regional_communities_v_blocks_hero2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_section_header_2" ADD CONSTRAINT "_regional_communities_v_blocks_section_header_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_content_2" ADD CONSTRAINT "_regional_communities_v_blocks_split_content_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_image_2" ADD CONSTRAINT "_regional_communities_v_blocks_split_image_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_image_2" ADD CONSTRAINT "_regional_communities_v_blocks_split_image_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_split_row_2" ADD CONSTRAINT "_regional_communities_v_blocks_split_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_2_images" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_2_images" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_carousel1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_2" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_2" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_2" ADD CONSTRAINT "_regional_communities_v_blocks_carousel1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_2_timelines" ADD CONSTRAINT "_regional_communities_v_blocks_timeline_row_2_timelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_timeline_row_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_2" ADD CONSTRAINT "_regional_communities_v_blocks_timeline_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_faqs_2_faqs" ADD CONSTRAINT "_regional_communities_v_blocks_faqs_2_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_faqs_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_faqs_2" ADD CONSTRAINT "_regional_communities_v_blocks_faqs_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_2_kinds" ADD CONSTRAINT "_regional_communities_v_blocks_content_feed_2_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_regional_communities_v_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_2_filters_regions" ADD CONSTRAINT "_regional_communities_v_blocks_content_feed_2_filters_regions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_regional_communities_v_blocks_content_feed_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_2" ADD CONSTRAINT "_regional_communities_v_blocks_content_feed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_events_calendar_2" ADD CONSTRAINT "_regional_communities_v_blocks_events_calendar_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_people_widget_2" ADD CONSTRAINT "_regional_communities_v_blocks_people_widget_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_card_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_card_2_image_asset_id_media_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_card_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_card_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_agenda_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_agenda_2_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_agenda_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_agenda_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_news_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_news_2_news_post_id_news_posts_id_fk" FOREIGN KEY ("news_post_id") REFERENCES "public"."news_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_news_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_news_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_2_header_image_asset_id_media_id_fk" FOREIGN KEY ("header_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_grid_row_2" ADD CONSTRAINT "_regional_communities_v_blocks_grid_row_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_region_map_2" ADD CONSTRAINT "_regional_communities_v_blocks_region_map_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_atlas_embed_2" ADD CONSTRAINT "_regional_communities_v_blocks_atlas_embed_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1_2_links" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_2_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_cta1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1_2" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_2_background_svg_pattern_id_media_id_fk" FOREIGN KEY ("background_svg_pattern_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1_2" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_2_background_image_asset_id_media_id_fk" FOREIGN KEY ("background_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_cta1_2" ADD CONSTRAINT "_regional_communities_v_blocks_cta1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_submit_story_banner_2" ADD CONSTRAINT "_regional_communities_v_blocks_submit_story_banner_2_illustration_asset_id_media_id_fk" FOREIGN KEY ("illustration_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_submit_story_banner_2" ADD CONSTRAINT "_regional_communities_v_blocks_submit_story_banner_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_form_newsletter_2" ADD CONSTRAINT "_regional_communities_v_blocks_form_newsletter_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_2_images" ADD CONSTRAINT "_regional_communities_v_blocks_logo_cloud1_2_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_2_images" ADD CONSTRAINT "_regional_communities_v_blocks_logo_cloud1_2_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v_blocks_logo_cloud1_2"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_2" ADD CONSTRAINT "_regional_communities_v_blocks_logo_cloud1_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_carousel2_2" ADD CONSTRAINT "_regional_communities_v_blocks_carousel2_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_blocks_community_members_2" ADD CONSTRAINT "_regional_communities_v_blocks_community_members_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v" ADD CONSTRAINT "_regional_communities_v_parent_id_regional_communities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regional_communities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v" ADD CONSTRAINT "_regional_communities_v_version_cover_image_asset_id_media_id_fk" FOREIGN KEY ("version_cover_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v" ADD CONSTRAINT "_regional_communities_v_version_contact_organization_id_organizations_id_fk" FOREIGN KEY ("version_contact_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v" ADD CONSTRAINT "_regional_communities_v_version_og_image_asset_id_media_id_fk" FOREIGN KEY ("version_og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_locales" ADD CONSTRAINT "_regional_communities_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_regional_communities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_news_posts_fk" FOREIGN KEY ("news_posts_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_lived_experiences_fk" FOREIGN KEY ("lived_experiences_id") REFERENCES "public"."lived_experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_research_outputs_fk" FOREIGN KEY ("research_outputs_id") REFERENCES "public"."research_outputs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_agendas_fk" FOREIGN KEY ("agendas_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_regional_communities_fk" FOREIGN KEY ("regional_communities_id") REFERENCES "public"."regional_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regional_communities_v_rels" ADD CONSTRAINT "_regional_communities_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "regional_communities_blocks_community_header_order_idx" ON "regional_communities_blocks_community_header" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_community_header_parent_id_idx" ON "regional_communities_blocks_community_header" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_community_header_path_idx" ON "regional_communities_blocks_community_header" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_community_header_locales_locale_" ON "regional_communities_blocks_community_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_hero1_links_order_idx" ON "regional_communities_blocks_hero1_links" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_hero1_links_parent_id_idx" ON "regional_communities_blocks_hero1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_hero1_links_locales_locale_paren" ON "regional_communities_blocks_hero1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_hero1_order_idx" ON "regional_communities_blocks_hero1" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_hero1_parent_id_idx" ON "regional_communities_blocks_hero1" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_hero1_path_idx" ON "regional_communities_blocks_hero1" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_hero1_image_image_asset_idx" ON "regional_communities_blocks_hero1" USING btree ("image_asset_id");
  CREATE INDEX "regional_communities_blocks_hero1_background_background__idx" ON "regional_communities_blocks_hero1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_hero1_background_image_backg_idx" ON "regional_communities_blocks_hero1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_hero1_locales_locale_parent_id_u" ON "regional_communities_blocks_hero1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_hero2_links_order_idx" ON "regional_communities_blocks_hero2_links" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_hero2_links_parent_id_idx" ON "regional_communities_blocks_hero2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_hero2_links_locales_locale_paren" ON "regional_communities_blocks_hero2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_hero2_order_idx" ON "regional_communities_blocks_hero2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_hero2_parent_id_idx" ON "regional_communities_blocks_hero2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_hero2_path_idx" ON "regional_communities_blocks_hero2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_hero2_background_background__idx" ON "regional_communities_blocks_hero2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_hero2_background_image_backg_idx" ON "regional_communities_blocks_hero2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_hero2_locales_locale_parent_id_u" ON "regional_communities_blocks_hero2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_section_header_order_idx" ON "regional_communities_blocks_section_header" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_section_header_parent_id_idx" ON "regional_communities_blocks_section_header" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_section_header_path_idx" ON "regional_communities_blocks_section_header" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_section_header_locales_locale_pa" ON "regional_communities_blocks_section_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_split_content_order_idx" ON "regional_communities_blocks_split_content" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_split_content_parent_id_idx" ON "regional_communities_blocks_split_content" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_split_content_path_idx" ON "regional_communities_blocks_split_content" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_split_content_locales_locale_par" ON "regional_communities_blocks_split_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_split_image_order_idx" ON "regional_communities_blocks_split_image" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_split_image_parent_id_idx" ON "regional_communities_blocks_split_image" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_split_image_path_idx" ON "regional_communities_blocks_split_image" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_split_image_image_image_asse_idx" ON "regional_communities_blocks_split_image" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_split_image_locales_locale_paren" ON "regional_communities_blocks_split_image_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_split_row_order_idx" ON "regional_communities_blocks_split_row" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_split_row_parent_id_idx" ON "regional_communities_blocks_split_row" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_split_row_path_idx" ON "regional_communities_blocks_split_row" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_split_row_locales_locale_parent_" ON "regional_communities_blocks_split_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel1_images_order_idx" ON "regional_communities_blocks_carousel1_images" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_carousel1_images_parent_id_idx" ON "regional_communities_blocks_carousel1_images" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel1_images_asset_idx" ON "regional_communities_blocks_carousel1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_carousel1_images_locales_locale_" ON "regional_communities_blocks_carousel1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel1_order_idx" ON "regional_communities_blocks_carousel1" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_carousel1_parent_id_idx" ON "regional_communities_blocks_carousel1" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel1_path_idx" ON "regional_communities_blocks_carousel1" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_carousel1_background_backgro_idx" ON "regional_communities_blocks_carousel1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_carousel1_background_image_b_idx" ON "regional_communities_blocks_carousel1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_carousel1_locales_locale_parent_" ON "regional_communities_blocks_carousel1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_timeline_row_timelines_order_idx" ON "regional_communities_blocks_timeline_row_timelines" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_timeline_row_timelines_parent_id_idx" ON "regional_communities_blocks_timeline_row_timelines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_timeline_row_timelines_locales_l" ON "regional_communities_blocks_timeline_row_timelines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_timeline_row_order_idx" ON "regional_communities_blocks_timeline_row" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_timeline_row_parent_id_idx" ON "regional_communities_blocks_timeline_row" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_timeline_row_path_idx" ON "regional_communities_blocks_timeline_row" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_timeline_row_locales_locale_pare" ON "regional_communities_blocks_timeline_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_faqs_faqs_order_idx" ON "regional_communities_blocks_faqs_faqs" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_faqs_faqs_parent_id_idx" ON "regional_communities_blocks_faqs_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_faqs_faqs_locales_locale_parent_" ON "regional_communities_blocks_faqs_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_faqs_order_idx" ON "regional_communities_blocks_faqs" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_faqs_parent_id_idx" ON "regional_communities_blocks_faqs" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_faqs_path_idx" ON "regional_communities_blocks_faqs" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_faqs_locales_locale_parent_id_un" ON "regional_communities_blocks_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_content_feed_kinds_order_idx" ON "regional_communities_blocks_content_feed_kinds" USING btree ("order");
  CREATE INDEX "regional_communities_blocks_content_feed_kinds_parent_idx" ON "regional_communities_blocks_content_feed_kinds" USING btree ("parent_id");
  CREATE INDEX "regional_communities_blocks_content_feed_filters_regions_order_idx" ON "regional_communities_blocks_content_feed_filters_regions" USING btree ("order");
  CREATE INDEX "regional_communities_blocks_content_feed_filters_regions_parent_idx" ON "regional_communities_blocks_content_feed_filters_regions" USING btree ("parent_id");
  CREATE INDEX "regional_communities_blocks_content_feed_order_idx" ON "regional_communities_blocks_content_feed" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_content_feed_parent_id_idx" ON "regional_communities_blocks_content_feed" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_content_feed_path_idx" ON "regional_communities_blocks_content_feed" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_content_feed_locales_locale_pare" ON "regional_communities_blocks_content_feed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_events_calendar_order_idx" ON "regional_communities_blocks_events_calendar" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_events_calendar_parent_id_idx" ON "regional_communities_blocks_events_calendar" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_events_calendar_path_idx" ON "regional_communities_blocks_events_calendar" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_events_calendar_locales_locale_p" ON "regional_communities_blocks_events_calendar_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_people_widget_order_idx" ON "regional_communities_blocks_people_widget" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_people_widget_parent_id_idx" ON "regional_communities_blocks_people_widget" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_people_widget_path_idx" ON "regional_communities_blocks_people_widget" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_people_widget_locales_locale_par" ON "regional_communities_blocks_people_widget_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_card_order_idx" ON "regional_communities_blocks_grid_card" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_grid_card_parent_id_idx" ON "regional_communities_blocks_grid_card" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_card_path_idx" ON "regional_communities_blocks_grid_card" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_grid_card_image_image_asset_idx" ON "regional_communities_blocks_grid_card" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_grid_card_locales_locale_parent_" ON "regional_communities_blocks_grid_card_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_agenda_order_idx" ON "regional_communities_blocks_grid_agenda" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_grid_agenda_parent_id_idx" ON "regional_communities_blocks_grid_agenda" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_agenda_path_idx" ON "regional_communities_blocks_grid_agenda" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_grid_agenda_agenda_idx" ON "regional_communities_blocks_grid_agenda" USING btree ("agenda_id");
  CREATE INDEX "regional_communities_blocks_grid_news_order_idx" ON "regional_communities_blocks_grid_news" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_grid_news_parent_id_idx" ON "regional_communities_blocks_grid_news" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_news_path_idx" ON "regional_communities_blocks_grid_news" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_grid_news_news_post_idx" ON "regional_communities_blocks_grid_news" USING btree ("news_post_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_grid_news_locales_locale_parent_" ON "regional_communities_blocks_grid_news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_row_order_idx" ON "regional_communities_blocks_grid_row" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_grid_row_parent_id_idx" ON "regional_communities_blocks_grid_row" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_row_path_idx" ON "regional_communities_blocks_grid_row" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_grid_row_header_image_header_idx" ON "regional_communities_blocks_grid_row" USING btree ("header_image_asset_id");
  CREATE INDEX "regional_communities_blocks_grid_row_background_backgrou_idx" ON "regional_communities_blocks_grid_row" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_grid_row_background_image_ba_idx" ON "regional_communities_blocks_grid_row" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_grid_row_locales_locale_parent_i" ON "regional_communities_blocks_grid_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_region_map_order_idx" ON "regional_communities_blocks_region_map" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_region_map_parent_id_idx" ON "regional_communities_blocks_region_map" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_region_map_path_idx" ON "regional_communities_blocks_region_map" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_region_map_locales_locale_parent" ON "regional_communities_blocks_region_map_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_atlas_embed_order_idx" ON "regional_communities_blocks_atlas_embed" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_atlas_embed_parent_id_idx" ON "regional_communities_blocks_atlas_embed" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_atlas_embed_path_idx" ON "regional_communities_blocks_atlas_embed" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_atlas_embed_locales_locale_paren" ON "regional_communities_blocks_atlas_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_cta1_links_order_idx" ON "regional_communities_blocks_cta1_links" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_cta1_links_parent_id_idx" ON "regional_communities_blocks_cta1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_cta1_links_locales_locale_parent" ON "regional_communities_blocks_cta1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_cta1_order_idx" ON "regional_communities_blocks_cta1" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_cta1_parent_id_idx" ON "regional_communities_blocks_cta1" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_cta1_path_idx" ON "regional_communities_blocks_cta1" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_cta1_background_background_s_idx" ON "regional_communities_blocks_cta1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_cta1_background_image_backgr_idx" ON "regional_communities_blocks_cta1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_cta1_locales_locale_parent_id_un" ON "regional_communities_blocks_cta1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_order_idx" ON "regional_communities_blocks_submit_story_banner" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_parent_id_idx" ON "regional_communities_blocks_submit_story_banner" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_path_idx" ON "regional_communities_blocks_submit_story_banner" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_illustra_idx" ON "regional_communities_blocks_submit_story_banner" USING btree ("illustration_asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_submit_story_banner_locales_loca" ON "regional_communities_blocks_submit_story_banner_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_form_newsletter_order_idx" ON "regional_communities_blocks_form_newsletter" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_form_newsletter_parent_id_idx" ON "regional_communities_blocks_form_newsletter" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_form_newsletter_path_idx" ON "regional_communities_blocks_form_newsletter" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_form_newsletter_locales_locale_p" ON "regional_communities_blocks_form_newsletter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_images_order_idx" ON "regional_communities_blocks_logo_cloud1_images" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_images_parent_id_idx" ON "regional_communities_blocks_logo_cloud1_images" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_images_asset_idx" ON "regional_communities_blocks_logo_cloud1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "regional_communities_blocks_logo_cloud1_images_locales_local" ON "regional_communities_blocks_logo_cloud1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_order_idx" ON "regional_communities_blocks_logo_cloud1" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_parent_id_idx" ON "regional_communities_blocks_logo_cloud1" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_path_idx" ON "regional_communities_blocks_logo_cloud1" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_logo_cloud1_locales_locale_paren" ON "regional_communities_blocks_logo_cloud1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel2_order_idx" ON "regional_communities_blocks_carousel2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_carousel2_parent_id_idx" ON "regional_communities_blocks_carousel2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel2_path_idx" ON "regional_communities_blocks_carousel2" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_carousel2_locales_locale_parent_" ON "regional_communities_blocks_carousel2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_community_members_order_idx" ON "regional_communities_blocks_community_members" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_community_members_parent_id_idx" ON "regional_communities_blocks_community_members" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_community_members_path_idx" ON "regional_communities_blocks_community_members" USING btree ("_path");
  CREATE UNIQUE INDEX "regional_communities_blocks_community_members_locales_locale" ON "regional_communities_blocks_community_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regional_communities_blocks_community_header_2_order_idx" ON "regional_communities_blocks_community_header_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_community_header_2_parent_id_idx" ON "regional_communities_blocks_community_header_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_community_header_2_path_idx" ON "regional_communities_blocks_community_header_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_community_header_2_locale_idx" ON "regional_communities_blocks_community_header_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_hero1_2_links_order_idx" ON "regional_communities_blocks_hero1_2_links" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_hero1_2_links_parent_id_idx" ON "regional_communities_blocks_hero1_2_links" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_hero1_2_links_locale_idx" ON "regional_communities_blocks_hero1_2_links" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_hero1_2_order_idx" ON "regional_communities_blocks_hero1_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_hero1_2_parent_id_idx" ON "regional_communities_blocks_hero1_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_hero1_2_path_idx" ON "regional_communities_blocks_hero1_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_hero1_2_locale_idx" ON "regional_communities_blocks_hero1_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_hero1_2_image_image_asset_idx" ON "regional_communities_blocks_hero1_2" USING btree ("image_asset_id");
  CREATE INDEX "regional_communities_blocks_hero1_2_background_backgroun_idx" ON "regional_communities_blocks_hero1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_hero1_2_background_image_bac_idx" ON "regional_communities_blocks_hero1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "regional_communities_blocks_hero2_2_links_order_idx" ON "regional_communities_blocks_hero2_2_links" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_hero2_2_links_parent_id_idx" ON "regional_communities_blocks_hero2_2_links" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_hero2_2_links_locale_idx" ON "regional_communities_blocks_hero2_2_links" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_hero2_2_order_idx" ON "regional_communities_blocks_hero2_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_hero2_2_parent_id_idx" ON "regional_communities_blocks_hero2_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_hero2_2_path_idx" ON "regional_communities_blocks_hero2_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_hero2_2_locale_idx" ON "regional_communities_blocks_hero2_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_hero2_2_background_backgroun_idx" ON "regional_communities_blocks_hero2_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_hero2_2_background_image_bac_idx" ON "regional_communities_blocks_hero2_2" USING btree ("background_image_asset_id");
  CREATE INDEX "regional_communities_blocks_section_header_2_order_idx" ON "regional_communities_blocks_section_header_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_section_header_2_parent_id_idx" ON "regional_communities_blocks_section_header_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_section_header_2_path_idx" ON "regional_communities_blocks_section_header_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_section_header_2_locale_idx" ON "regional_communities_blocks_section_header_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_split_content_2_order_idx" ON "regional_communities_blocks_split_content_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_split_content_2_parent_id_idx" ON "regional_communities_blocks_split_content_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_split_content_2_path_idx" ON "regional_communities_blocks_split_content_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_split_content_2_locale_idx" ON "regional_communities_blocks_split_content_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_split_image_2_order_idx" ON "regional_communities_blocks_split_image_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_split_image_2_parent_id_idx" ON "regional_communities_blocks_split_image_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_split_image_2_path_idx" ON "regional_communities_blocks_split_image_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_split_image_2_locale_idx" ON "regional_communities_blocks_split_image_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_split_image_2_image_image_as_idx" ON "regional_communities_blocks_split_image_2" USING btree ("image_asset_id");
  CREATE INDEX "regional_communities_blocks_split_row_2_order_idx" ON "regional_communities_blocks_split_row_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_split_row_2_parent_id_idx" ON "regional_communities_blocks_split_row_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_split_row_2_path_idx" ON "regional_communities_blocks_split_row_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_split_row_2_locale_idx" ON "regional_communities_blocks_split_row_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_carousel1_2_images_order_idx" ON "regional_communities_blocks_carousel1_2_images" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_carousel1_2_images_parent_id_idx" ON "regional_communities_blocks_carousel1_2_images" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel1_2_images_locale_idx" ON "regional_communities_blocks_carousel1_2_images" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_carousel1_2_images_asset_idx" ON "regional_communities_blocks_carousel1_2_images" USING btree ("asset_id");
  CREATE INDEX "regional_communities_blocks_carousel1_2_order_idx" ON "regional_communities_blocks_carousel1_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_carousel1_2_parent_id_idx" ON "regional_communities_blocks_carousel1_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel1_2_path_idx" ON "regional_communities_blocks_carousel1_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_carousel1_2_locale_idx" ON "regional_communities_blocks_carousel1_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_carousel1_2_background_backg_idx" ON "regional_communities_blocks_carousel1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_carousel1_2_background_image_idx" ON "regional_communities_blocks_carousel1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "regional_communities_blocks_timeline_row_2_timelines_order_idx" ON "regional_communities_blocks_timeline_row_2_timelines" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_timeline_row_2_timelines_parent_id_idx" ON "regional_communities_blocks_timeline_row_2_timelines" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_timeline_row_2_timelines_locale_idx" ON "regional_communities_blocks_timeline_row_2_timelines" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_timeline_row_2_order_idx" ON "regional_communities_blocks_timeline_row_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_timeline_row_2_parent_id_idx" ON "regional_communities_blocks_timeline_row_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_timeline_row_2_path_idx" ON "regional_communities_blocks_timeline_row_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_timeline_row_2_locale_idx" ON "regional_communities_blocks_timeline_row_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_faqs_2_faqs_order_idx" ON "regional_communities_blocks_faqs_2_faqs" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_faqs_2_faqs_parent_id_idx" ON "regional_communities_blocks_faqs_2_faqs" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_faqs_2_faqs_locale_idx" ON "regional_communities_blocks_faqs_2_faqs" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_faqs_2_order_idx" ON "regional_communities_blocks_faqs_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_faqs_2_parent_id_idx" ON "regional_communities_blocks_faqs_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_faqs_2_path_idx" ON "regional_communities_blocks_faqs_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_faqs_2_locale_idx" ON "regional_communities_blocks_faqs_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_content_feed_2_kinds_order_idx" ON "regional_communities_blocks_content_feed_2_kinds" USING btree ("order");
  CREATE INDEX "regional_communities_blocks_content_feed_2_kinds_parent_idx" ON "regional_communities_blocks_content_feed_2_kinds" USING btree ("parent_id");
  CREATE INDEX "regional_communities_blocks_content_feed_2_kinds_locale_idx" ON "regional_communities_blocks_content_feed_2_kinds" USING btree ("locale");
  CREATE INDEX "regional_communities_blocks_content_feed_2_filters_regions_order_idx" ON "regional_communities_blocks_content_feed_2_filters_regions" USING btree ("order");
  CREATE INDEX "regional_communities_blocks_content_feed_2_filters_regions_parent_idx" ON "regional_communities_blocks_content_feed_2_filters_regions" USING btree ("parent_id");
  CREATE INDEX "regional_communities_blocks_content_feed_2_filters_regions_locale_idx" ON "regional_communities_blocks_content_feed_2_filters_regions" USING btree ("locale");
  CREATE INDEX "regional_communities_blocks_content_feed_2_order_idx" ON "regional_communities_blocks_content_feed_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_content_feed_2_parent_id_idx" ON "regional_communities_blocks_content_feed_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_content_feed_2_path_idx" ON "regional_communities_blocks_content_feed_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_content_feed_2_locale_idx" ON "regional_communities_blocks_content_feed_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_events_calendar_2_order_idx" ON "regional_communities_blocks_events_calendar_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_events_calendar_2_parent_id_idx" ON "regional_communities_blocks_events_calendar_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_events_calendar_2_path_idx" ON "regional_communities_blocks_events_calendar_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_events_calendar_2_locale_idx" ON "regional_communities_blocks_events_calendar_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_people_widget_2_order_idx" ON "regional_communities_blocks_people_widget_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_people_widget_2_parent_id_idx" ON "regional_communities_blocks_people_widget_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_people_widget_2_path_idx" ON "regional_communities_blocks_people_widget_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_people_widget_2_locale_idx" ON "regional_communities_blocks_people_widget_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_grid_card_2_order_idx" ON "regional_communities_blocks_grid_card_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_grid_card_2_parent_id_idx" ON "regional_communities_blocks_grid_card_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_card_2_path_idx" ON "regional_communities_blocks_grid_card_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_grid_card_2_locale_idx" ON "regional_communities_blocks_grid_card_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_grid_card_2_image_image_asse_idx" ON "regional_communities_blocks_grid_card_2" USING btree ("image_asset_id");
  CREATE INDEX "regional_communities_blocks_grid_agenda_2_order_idx" ON "regional_communities_blocks_grid_agenda_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_grid_agenda_2_parent_id_idx" ON "regional_communities_blocks_grid_agenda_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_agenda_2_path_idx" ON "regional_communities_blocks_grid_agenda_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_grid_agenda_2_locale_idx" ON "regional_communities_blocks_grid_agenda_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_grid_agenda_2_agenda_idx" ON "regional_communities_blocks_grid_agenda_2" USING btree ("agenda_id");
  CREATE INDEX "regional_communities_blocks_grid_news_2_order_idx" ON "regional_communities_blocks_grid_news_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_grid_news_2_parent_id_idx" ON "regional_communities_blocks_grid_news_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_news_2_path_idx" ON "regional_communities_blocks_grid_news_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_grid_news_2_locale_idx" ON "regional_communities_blocks_grid_news_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_grid_news_2_news_post_idx" ON "regional_communities_blocks_grid_news_2" USING btree ("news_post_id");
  CREATE INDEX "regional_communities_blocks_grid_row_2_order_idx" ON "regional_communities_blocks_grid_row_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_grid_row_2_parent_id_idx" ON "regional_communities_blocks_grid_row_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_grid_row_2_path_idx" ON "regional_communities_blocks_grid_row_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_grid_row_2_locale_idx" ON "regional_communities_blocks_grid_row_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_grid_row_2_header_image_head_idx" ON "regional_communities_blocks_grid_row_2" USING btree ("header_image_asset_id");
  CREATE INDEX "regional_communities_blocks_grid_row_2_background_backgr_idx" ON "regional_communities_blocks_grid_row_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_grid_row_2_background_image__idx" ON "regional_communities_blocks_grid_row_2" USING btree ("background_image_asset_id");
  CREATE INDEX "regional_communities_blocks_region_map_2_order_idx" ON "regional_communities_blocks_region_map_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_region_map_2_parent_id_idx" ON "regional_communities_blocks_region_map_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_region_map_2_path_idx" ON "regional_communities_blocks_region_map_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_region_map_2_locale_idx" ON "regional_communities_blocks_region_map_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_atlas_embed_2_order_idx" ON "regional_communities_blocks_atlas_embed_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_atlas_embed_2_parent_id_idx" ON "regional_communities_blocks_atlas_embed_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_atlas_embed_2_path_idx" ON "regional_communities_blocks_atlas_embed_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_atlas_embed_2_locale_idx" ON "regional_communities_blocks_atlas_embed_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_cta1_2_links_order_idx" ON "regional_communities_blocks_cta1_2_links" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_cta1_2_links_parent_id_idx" ON "regional_communities_blocks_cta1_2_links" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_cta1_2_links_locale_idx" ON "regional_communities_blocks_cta1_2_links" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_cta1_2_order_idx" ON "regional_communities_blocks_cta1_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_cta1_2_parent_id_idx" ON "regional_communities_blocks_cta1_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_cta1_2_path_idx" ON "regional_communities_blocks_cta1_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_cta1_2_locale_idx" ON "regional_communities_blocks_cta1_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_cta1_2_background_background_idx" ON "regional_communities_blocks_cta1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "regional_communities_blocks_cta1_2_background_image_back_idx" ON "regional_communities_blocks_cta1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_2_order_idx" ON "regional_communities_blocks_submit_story_banner_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_2_parent_id_idx" ON "regional_communities_blocks_submit_story_banner_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_2_path_idx" ON "regional_communities_blocks_submit_story_banner_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_2_locale_idx" ON "regional_communities_blocks_submit_story_banner_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_submit_story_banner_2_illust_idx" ON "regional_communities_blocks_submit_story_banner_2" USING btree ("illustration_asset_id");
  CREATE INDEX "regional_communities_blocks_form_newsletter_2_order_idx" ON "regional_communities_blocks_form_newsletter_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_form_newsletter_2_parent_id_idx" ON "regional_communities_blocks_form_newsletter_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_form_newsletter_2_path_idx" ON "regional_communities_blocks_form_newsletter_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_form_newsletter_2_locale_idx" ON "regional_communities_blocks_form_newsletter_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_2_images_order_idx" ON "regional_communities_blocks_logo_cloud1_2_images" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_2_images_parent_id_idx" ON "regional_communities_blocks_logo_cloud1_2_images" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_2_images_locale_idx" ON "regional_communities_blocks_logo_cloud1_2_images" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_2_images_asset_idx" ON "regional_communities_blocks_logo_cloud1_2_images" USING btree ("asset_id");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_2_order_idx" ON "regional_communities_blocks_logo_cloud1_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_2_parent_id_idx" ON "regional_communities_blocks_logo_cloud1_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_2_path_idx" ON "regional_communities_blocks_logo_cloud1_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_logo_cloud1_2_locale_idx" ON "regional_communities_blocks_logo_cloud1_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_carousel2_2_order_idx" ON "regional_communities_blocks_carousel2_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_carousel2_2_parent_id_idx" ON "regional_communities_blocks_carousel2_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_carousel2_2_path_idx" ON "regional_communities_blocks_carousel2_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_carousel2_2_locale_idx" ON "regional_communities_blocks_carousel2_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_blocks_community_members_2_order_idx" ON "regional_communities_blocks_community_members_2" USING btree ("_order");
  CREATE INDEX "regional_communities_blocks_community_members_2_parent_id_idx" ON "regional_communities_blocks_community_members_2" USING btree ("_parent_id");
  CREATE INDEX "regional_communities_blocks_community_members_2_path_idx" ON "regional_communities_blocks_community_members_2" USING btree ("_path");
  CREATE INDEX "regional_communities_blocks_community_members_2_locale_idx" ON "regional_communities_blocks_community_members_2" USING btree ("_locale");
  CREATE INDEX "regional_communities_rels_order_idx" ON "regional_communities_rels" USING btree ("order");
  CREATE INDEX "regional_communities_rels_parent_idx" ON "regional_communities_rels" USING btree ("parent_id");
  CREATE INDEX "regional_communities_rels_path_idx" ON "regional_communities_rels" USING btree ("path");
  CREATE INDEX "regional_communities_rels_locale_idx" ON "regional_communities_rels" USING btree ("locale");
  CREATE INDEX "regional_communities_rels_case_studies_id_idx" ON "regional_communities_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "regional_communities_rels_news_posts_id_idx" ON "regional_communities_rels" USING btree ("news_posts_id","locale");
  CREATE INDEX "regional_communities_rels_events_id_idx" ON "regional_communities_rels" USING btree ("events_id","locale");
  CREATE INDEX "regional_communities_rels_lived_experiences_id_idx" ON "regional_communities_rels" USING btree ("lived_experiences_id","locale");
  CREATE INDEX "regional_communities_rels_research_outputs_id_idx" ON "regional_communities_rels" USING btree ("research_outputs_id","locale");
  CREATE INDEX "regional_communities_rels_agendas_id_idx" ON "regional_communities_rels" USING btree ("agendas_id","locale");
  CREATE INDEX "regional_communities_rels_regional_communities_id_idx" ON "regional_communities_rels" USING btree ("regional_communities_id","locale");
  CREATE INDEX "regional_communities_rels_tags_id_idx" ON "regional_communities_rels" USING btree ("tags_id","locale");
  CREATE INDEX "regional_communities_rels_organizations_id_idx" ON "regional_communities_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "regional_communities_rels_testimonials_id_idx" ON "regional_communities_rels" USING btree ("testimonials_id","locale");
  CREATE INDEX "_regional_communities_v_version_boundaries_order_idx" ON "_regional_communities_v_version_boundaries" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_version_boundaries_parent_id_idx" ON "_regional_communities_v_version_boundaries" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_version_members_order_idx" ON "_regional_communities_v_version_members" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_version_members_parent_id_idx" ON "_regional_communities_v_version_members" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_version_members_person_idx" ON "_regional_communities_v_version_members" USING btree ("person_id");
  CREATE INDEX "_regional_communities_v_blocks_community_header_order_idx" ON "_regional_communities_v_blocks_community_header" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_community_header_parent_id_idx" ON "_regional_communities_v_blocks_community_header" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_header_path_idx" ON "_regional_communities_v_blocks_community_header" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_community_header_locales_loca" ON "_regional_communities_v_blocks_community_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_links_order_idx" ON "_regional_communities_v_blocks_hero1_links" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_hero1_links_parent_id_idx" ON "_regional_communities_v_blocks_hero1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_hero1_links_locales_locale_pa" ON "_regional_communities_v_blocks_hero1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_order_idx" ON "_regional_communities_v_blocks_hero1" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_hero1_parent_id_idx" ON "_regional_communities_v_blocks_hero1" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_path_idx" ON "_regional_communities_v_blocks_hero1" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_hero1_image_image_asset_idx" ON "_regional_communities_v_blocks_hero1" USING btree ("image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_background_backgrou_idx" ON "_regional_communities_v_blocks_hero1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_background_image_ba_idx" ON "_regional_communities_v_blocks_hero1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_hero1_locales_locale_parent_i" ON "_regional_communities_v_blocks_hero1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero2_links_order_idx" ON "_regional_communities_v_blocks_hero2_links" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_hero2_links_parent_id_idx" ON "_regional_communities_v_blocks_hero2_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_hero2_links_locales_locale_pa" ON "_regional_communities_v_blocks_hero2_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero2_order_idx" ON "_regional_communities_v_blocks_hero2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_hero2_parent_id_idx" ON "_regional_communities_v_blocks_hero2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero2_path_idx" ON "_regional_communities_v_blocks_hero2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_hero2_background_backgrou_idx" ON "_regional_communities_v_blocks_hero2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_hero2_background_image_ba_idx" ON "_regional_communities_v_blocks_hero2" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_hero2_locales_locale_parent_i" ON "_regional_communities_v_blocks_hero2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_section_header_order_idx" ON "_regional_communities_v_blocks_section_header" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_section_header_parent_id_idx" ON "_regional_communities_v_blocks_section_header" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_section_header_path_idx" ON "_regional_communities_v_blocks_section_header" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_section_header_locales_locale" ON "_regional_communities_v_blocks_section_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_content_order_idx" ON "_regional_communities_v_blocks_split_content" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_split_content_parent_id_idx" ON "_regional_communities_v_blocks_split_content" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_content_path_idx" ON "_regional_communities_v_blocks_split_content" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_split_content_locales_locale_" ON "_regional_communities_v_blocks_split_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_image_order_idx" ON "_regional_communities_v_blocks_split_image" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_split_image_parent_id_idx" ON "_regional_communities_v_blocks_split_image" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_image_path_idx" ON "_regional_communities_v_blocks_split_image" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_split_image_image_image_a_idx" ON "_regional_communities_v_blocks_split_image" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_split_image_locales_locale_pa" ON "_regional_communities_v_blocks_split_image_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_row_order_idx" ON "_regional_communities_v_blocks_split_row" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_split_row_parent_id_idx" ON "_regional_communities_v_blocks_split_row" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_row_path_idx" ON "_regional_communities_v_blocks_split_row" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_split_row_locales_locale_pare" ON "_regional_communities_v_blocks_split_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_images_order_idx" ON "_regional_communities_v_blocks_carousel1_images" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_images_parent_id_idx" ON "_regional_communities_v_blocks_carousel1_images" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_images_asset_idx" ON "_regional_communities_v_blocks_carousel1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_carousel1_images_locales_loca" ON "_regional_communities_v_blocks_carousel1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_order_idx" ON "_regional_communities_v_blocks_carousel1" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_parent_id_idx" ON "_regional_communities_v_blocks_carousel1" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_path_idx" ON "_regional_communities_v_blocks_carousel1" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_background_back_idx" ON "_regional_communities_v_blocks_carousel1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_background_imag_idx" ON "_regional_communities_v_blocks_carousel1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_carousel1_locales_locale_pare" ON "_regional_communities_v_blocks_carousel1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_timelines_order_idx" ON "_regional_communities_v_blocks_timeline_row_timelines" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_timelines_parent_id_idx" ON "_regional_communities_v_blocks_timeline_row_timelines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_timeline_row_timelines_locale" ON "_regional_communities_v_blocks_timeline_row_timelines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_order_idx" ON "_regional_communities_v_blocks_timeline_row" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_parent_id_idx" ON "_regional_communities_v_blocks_timeline_row" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_path_idx" ON "_regional_communities_v_blocks_timeline_row" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_timeline_row_locales_locale_p" ON "_regional_communities_v_blocks_timeline_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_faqs_faqs_order_idx" ON "_regional_communities_v_blocks_faqs_faqs" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_faqs_faqs_parent_id_idx" ON "_regional_communities_v_blocks_faqs_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_faqs_faqs_locales_locale_pare" ON "_regional_communities_v_blocks_faqs_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_faqs_order_idx" ON "_regional_communities_v_blocks_faqs" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_faqs_parent_id_idx" ON "_regional_communities_v_blocks_faqs" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_faqs_path_idx" ON "_regional_communities_v_blocks_faqs" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_faqs_locales_locale_parent_id" ON "_regional_communities_v_blocks_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_kinds_order_idx" ON "_regional_communities_v_blocks_content_feed_kinds" USING btree ("order");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_kinds_parent_idx" ON "_regional_communities_v_blocks_content_feed_kinds" USING btree ("parent_id");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_filters_regions_order_idx" ON "_regional_communities_v_blocks_content_feed_filters_regions" USING btree ("order");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_filters_regions_parent_idx" ON "_regional_communities_v_blocks_content_feed_filters_regions" USING btree ("parent_id");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_order_idx" ON "_regional_communities_v_blocks_content_feed" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_parent_id_idx" ON "_regional_communities_v_blocks_content_feed" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_path_idx" ON "_regional_communities_v_blocks_content_feed" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_content_feed_locales_locale_p" ON "_regional_communities_v_blocks_content_feed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_events_calendar_order_idx" ON "_regional_communities_v_blocks_events_calendar" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_events_calendar_parent_id_idx" ON "_regional_communities_v_blocks_events_calendar" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_events_calendar_path_idx" ON "_regional_communities_v_blocks_events_calendar" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_events_calendar_locales_local" ON "_regional_communities_v_blocks_events_calendar_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_people_widget_order_idx" ON "_regional_communities_v_blocks_people_widget" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_people_widget_parent_id_idx" ON "_regional_communities_v_blocks_people_widget" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_people_widget_path_idx" ON "_regional_communities_v_blocks_people_widget" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_people_widget_locales_locale_" ON "_regional_communities_v_blocks_people_widget_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_order_idx" ON "_regional_communities_v_blocks_grid_card" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_parent_id_idx" ON "_regional_communities_v_blocks_grid_card" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_path_idx" ON "_regional_communities_v_blocks_grid_card" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_image_image_ass_idx" ON "_regional_communities_v_blocks_grid_card" USING btree ("image_asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_grid_card_locales_locale_pare" ON "_regional_communities_v_blocks_grid_card_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_order_idx" ON "_regional_communities_v_blocks_grid_agenda" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_parent_id_idx" ON "_regional_communities_v_blocks_grid_agenda" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_path_idx" ON "_regional_communities_v_blocks_grid_agenda" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_agenda_idx" ON "_regional_communities_v_blocks_grid_agenda" USING btree ("agenda_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_order_idx" ON "_regional_communities_v_blocks_grid_news" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_parent_id_idx" ON "_regional_communities_v_blocks_grid_news" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_path_idx" ON "_regional_communities_v_blocks_grid_news" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_news_post_idx" ON "_regional_communities_v_blocks_grid_news" USING btree ("news_post_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_grid_news_locales_locale_pare" ON "_regional_communities_v_blocks_grid_news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_order_idx" ON "_regional_communities_v_blocks_grid_row" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_parent_id_idx" ON "_regional_communities_v_blocks_grid_row" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_path_idx" ON "_regional_communities_v_blocks_grid_row" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_header_image_hea_idx" ON "_regional_communities_v_blocks_grid_row" USING btree ("header_image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_background_backg_idx" ON "_regional_communities_v_blocks_grid_row" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_background_image_idx" ON "_regional_communities_v_blocks_grid_row" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_grid_row_locales_locale_paren" ON "_regional_communities_v_blocks_grid_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_region_map_order_idx" ON "_regional_communities_v_blocks_region_map" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_region_map_parent_id_idx" ON "_regional_communities_v_blocks_region_map" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_region_map_path_idx" ON "_regional_communities_v_blocks_region_map" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_region_map_locales_locale_par" ON "_regional_communities_v_blocks_region_map_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_atlas_embed_order_idx" ON "_regional_communities_v_blocks_atlas_embed" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_atlas_embed_parent_id_idx" ON "_regional_communities_v_blocks_atlas_embed" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_atlas_embed_path_idx" ON "_regional_communities_v_blocks_atlas_embed" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_atlas_embed_locales_locale_pa" ON "_regional_communities_v_blocks_atlas_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_cta1_links_order_idx" ON "_regional_communities_v_blocks_cta1_links" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_cta1_links_parent_id_idx" ON "_regional_communities_v_blocks_cta1_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_cta1_links_locales_locale_par" ON "_regional_communities_v_blocks_cta1_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_cta1_order_idx" ON "_regional_communities_v_blocks_cta1" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_cta1_parent_id_idx" ON "_regional_communities_v_blocks_cta1" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_cta1_path_idx" ON "_regional_communities_v_blocks_cta1" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_cta1_background_backgroun_idx" ON "_regional_communities_v_blocks_cta1" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_cta1_background_image_bac_idx" ON "_regional_communities_v_blocks_cta1" USING btree ("background_image_asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_cta1_locales_locale_parent_id" ON "_regional_communities_v_blocks_cta1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_order_idx" ON "_regional_communities_v_blocks_submit_story_banner" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_parent_id_idx" ON "_regional_communities_v_blocks_submit_story_banner" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_path_idx" ON "_regional_communities_v_blocks_submit_story_banner" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_illus_idx" ON "_regional_communities_v_blocks_submit_story_banner" USING btree ("illustration_asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_submit_story_banner_locales_l" ON "_regional_communities_v_blocks_submit_story_banner_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_form_newsletter_order_idx" ON "_regional_communities_v_blocks_form_newsletter" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_form_newsletter_parent_id_idx" ON "_regional_communities_v_blocks_form_newsletter" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_form_newsletter_path_idx" ON "_regional_communities_v_blocks_form_newsletter" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_form_newsletter_locales_local" ON "_regional_communities_v_blocks_form_newsletter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_images_order_idx" ON "_regional_communities_v_blocks_logo_cloud1_images" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_images_parent_id_idx" ON "_regional_communities_v_blocks_logo_cloud1_images" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_images_asset_idx" ON "_regional_communities_v_blocks_logo_cloud1_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_logo_cloud1_images_locales_lo" ON "_regional_communities_v_blocks_logo_cloud1_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_order_idx" ON "_regional_communities_v_blocks_logo_cloud1" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_parent_id_idx" ON "_regional_communities_v_blocks_logo_cloud1" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_path_idx" ON "_regional_communities_v_blocks_logo_cloud1" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_logo_cloud1_locales_locale_pa" ON "_regional_communities_v_blocks_logo_cloud1_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel2_order_idx" ON "_regional_communities_v_blocks_carousel2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_carousel2_parent_id_idx" ON "_regional_communities_v_blocks_carousel2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel2_path_idx" ON "_regional_communities_v_blocks_carousel2" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_carousel2_locales_locale_pare" ON "_regional_communities_v_blocks_carousel2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_members_order_idx" ON "_regional_communities_v_blocks_community_members" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_community_members_parent_id_idx" ON "_regional_communities_v_blocks_community_members" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_members_path_idx" ON "_regional_communities_v_blocks_community_members" USING btree ("_path");
  CREATE UNIQUE INDEX "_regional_communities_v_blocks_community_members_locales_loc" ON "_regional_communities_v_blocks_community_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_header_2_order_idx" ON "_regional_communities_v_blocks_community_header_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_community_header_2_parent_id_idx" ON "_regional_communities_v_blocks_community_header_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_header_2_path_idx" ON "_regional_communities_v_blocks_community_header_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_community_header_2_locale_idx" ON "_regional_communities_v_blocks_community_header_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_links_order_idx" ON "_regional_communities_v_blocks_hero1_2_links" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_links_parent_id_idx" ON "_regional_communities_v_blocks_hero1_2_links" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_links_locale_idx" ON "_regional_communities_v_blocks_hero1_2_links" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_order_idx" ON "_regional_communities_v_blocks_hero1_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_parent_id_idx" ON "_regional_communities_v_blocks_hero1_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_path_idx" ON "_regional_communities_v_blocks_hero1_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_locale_idx" ON "_regional_communities_v_blocks_hero1_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_image_image_asset_idx" ON "_regional_communities_v_blocks_hero1_2" USING btree ("image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_background_backgr_idx" ON "_regional_communities_v_blocks_hero1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_hero1_2_background_image__idx" ON "_regional_communities_v_blocks_hero1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_links_order_idx" ON "_regional_communities_v_blocks_hero2_2_links" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_links_parent_id_idx" ON "_regional_communities_v_blocks_hero2_2_links" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_links_locale_idx" ON "_regional_communities_v_blocks_hero2_2_links" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_order_idx" ON "_regional_communities_v_blocks_hero2_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_parent_id_idx" ON "_regional_communities_v_blocks_hero2_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_path_idx" ON "_regional_communities_v_blocks_hero2_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_locale_idx" ON "_regional_communities_v_blocks_hero2_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_background_backgr_idx" ON "_regional_communities_v_blocks_hero2_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_hero2_2_background_image__idx" ON "_regional_communities_v_blocks_hero2_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_section_header_2_order_idx" ON "_regional_communities_v_blocks_section_header_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_section_header_2_parent_id_idx" ON "_regional_communities_v_blocks_section_header_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_section_header_2_path_idx" ON "_regional_communities_v_blocks_section_header_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_section_header_2_locale_idx" ON "_regional_communities_v_blocks_section_header_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_split_content_2_order_idx" ON "_regional_communities_v_blocks_split_content_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_split_content_2_parent_id_idx" ON "_regional_communities_v_blocks_split_content_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_content_2_path_idx" ON "_regional_communities_v_blocks_split_content_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_split_content_2_locale_idx" ON "_regional_communities_v_blocks_split_content_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_split_image_2_order_idx" ON "_regional_communities_v_blocks_split_image_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_split_image_2_parent_id_idx" ON "_regional_communities_v_blocks_split_image_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_image_2_path_idx" ON "_regional_communities_v_blocks_split_image_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_split_image_2_locale_idx" ON "_regional_communities_v_blocks_split_image_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_split_image_2_image_image_idx" ON "_regional_communities_v_blocks_split_image_2" USING btree ("image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_split_row_2_order_idx" ON "_regional_communities_v_blocks_split_row_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_split_row_2_parent_id_idx" ON "_regional_communities_v_blocks_split_row_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_split_row_2_path_idx" ON "_regional_communities_v_blocks_split_row_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_split_row_2_locale_idx" ON "_regional_communities_v_blocks_split_row_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_images_order_idx" ON "_regional_communities_v_blocks_carousel1_2_images" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_images_parent_id_idx" ON "_regional_communities_v_blocks_carousel1_2_images" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_images_locale_idx" ON "_regional_communities_v_blocks_carousel1_2_images" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_images_asset_idx" ON "_regional_communities_v_blocks_carousel1_2_images" USING btree ("asset_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_order_idx" ON "_regional_communities_v_blocks_carousel1_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_parent_id_idx" ON "_regional_communities_v_blocks_carousel1_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_path_idx" ON "_regional_communities_v_blocks_carousel1_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_locale_idx" ON "_regional_communities_v_blocks_carousel1_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_background_ba_idx" ON "_regional_communities_v_blocks_carousel1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel1_2_background_im_idx" ON "_regional_communities_v_blocks_carousel1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_2_timelines_order_idx" ON "_regional_communities_v_blocks_timeline_row_2_timelines" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_2_timelines_parent_id_idx" ON "_regional_communities_v_blocks_timeline_row_2_timelines" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_2_timelines_locale_idx" ON "_regional_communities_v_blocks_timeline_row_2_timelines" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_2_order_idx" ON "_regional_communities_v_blocks_timeline_row_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_2_parent_id_idx" ON "_regional_communities_v_blocks_timeline_row_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_2_path_idx" ON "_regional_communities_v_blocks_timeline_row_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_timeline_row_2_locale_idx" ON "_regional_communities_v_blocks_timeline_row_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_faqs_2_faqs_order_idx" ON "_regional_communities_v_blocks_faqs_2_faqs" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_faqs_2_faqs_parent_id_idx" ON "_regional_communities_v_blocks_faqs_2_faqs" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_faqs_2_faqs_locale_idx" ON "_regional_communities_v_blocks_faqs_2_faqs" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_faqs_2_order_idx" ON "_regional_communities_v_blocks_faqs_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_faqs_2_parent_id_idx" ON "_regional_communities_v_blocks_faqs_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_faqs_2_path_idx" ON "_regional_communities_v_blocks_faqs_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_faqs_2_locale_idx" ON "_regional_communities_v_blocks_faqs_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_kinds_order_idx" ON "_regional_communities_v_blocks_content_feed_2_kinds" USING btree ("order");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_kinds_parent_idx" ON "_regional_communities_v_blocks_content_feed_2_kinds" USING btree ("parent_id");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_kinds_locale_idx" ON "_regional_communities_v_blocks_content_feed_2_kinds" USING btree ("locale");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_filters_regions_order_idx" ON "_regional_communities_v_blocks_content_feed_2_filters_regions" USING btree ("order");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_filters_regions_parent_idx" ON "_regional_communities_v_blocks_content_feed_2_filters_regions" USING btree ("parent_id");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_filters_regions_locale_idx" ON "_regional_communities_v_blocks_content_feed_2_filters_regions" USING btree ("locale");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_order_idx" ON "_regional_communities_v_blocks_content_feed_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_parent_id_idx" ON "_regional_communities_v_blocks_content_feed_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_path_idx" ON "_regional_communities_v_blocks_content_feed_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_content_feed_2_locale_idx" ON "_regional_communities_v_blocks_content_feed_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_events_calendar_2_order_idx" ON "_regional_communities_v_blocks_events_calendar_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_events_calendar_2_parent_id_idx" ON "_regional_communities_v_blocks_events_calendar_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_events_calendar_2_path_idx" ON "_regional_communities_v_blocks_events_calendar_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_events_calendar_2_locale_idx" ON "_regional_communities_v_blocks_events_calendar_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_people_widget_2_order_idx" ON "_regional_communities_v_blocks_people_widget_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_people_widget_2_parent_id_idx" ON "_regional_communities_v_blocks_people_widget_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_people_widget_2_path_idx" ON "_regional_communities_v_blocks_people_widget_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_people_widget_2_locale_idx" ON "_regional_communities_v_blocks_people_widget_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_2_order_idx" ON "_regional_communities_v_blocks_grid_card_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_2_parent_id_idx" ON "_regional_communities_v_blocks_grid_card_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_2_path_idx" ON "_regional_communities_v_blocks_grid_card_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_2_locale_idx" ON "_regional_communities_v_blocks_grid_card_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_grid_card_2_image_image_a_idx" ON "_regional_communities_v_blocks_grid_card_2" USING btree ("image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_2_order_idx" ON "_regional_communities_v_blocks_grid_agenda_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_2_parent_id_idx" ON "_regional_communities_v_blocks_grid_agenda_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_2_path_idx" ON "_regional_communities_v_blocks_grid_agenda_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_2_locale_idx" ON "_regional_communities_v_blocks_grid_agenda_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_grid_agenda_2_agenda_idx" ON "_regional_communities_v_blocks_grid_agenda_2" USING btree ("agenda_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_2_order_idx" ON "_regional_communities_v_blocks_grid_news_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_2_parent_id_idx" ON "_regional_communities_v_blocks_grid_news_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_2_path_idx" ON "_regional_communities_v_blocks_grid_news_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_2_locale_idx" ON "_regional_communities_v_blocks_grid_news_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_grid_news_2_news_post_idx" ON "_regional_communities_v_blocks_grid_news_2" USING btree ("news_post_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_2_order_idx" ON "_regional_communities_v_blocks_grid_row_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_2_parent_id_idx" ON "_regional_communities_v_blocks_grid_row_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_2_path_idx" ON "_regional_communities_v_blocks_grid_row_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_2_locale_idx" ON "_regional_communities_v_blocks_grid_row_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_2_header_image_h_idx" ON "_regional_communities_v_blocks_grid_row_2" USING btree ("header_image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_2_background_bac_idx" ON "_regional_communities_v_blocks_grid_row_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_grid_row_2_background_ima_idx" ON "_regional_communities_v_blocks_grid_row_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_region_map_2_order_idx" ON "_regional_communities_v_blocks_region_map_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_region_map_2_parent_id_idx" ON "_regional_communities_v_blocks_region_map_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_region_map_2_path_idx" ON "_regional_communities_v_blocks_region_map_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_region_map_2_locale_idx" ON "_regional_communities_v_blocks_region_map_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_atlas_embed_2_order_idx" ON "_regional_communities_v_blocks_atlas_embed_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_atlas_embed_2_parent_id_idx" ON "_regional_communities_v_blocks_atlas_embed_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_atlas_embed_2_path_idx" ON "_regional_communities_v_blocks_atlas_embed_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_atlas_embed_2_locale_idx" ON "_regional_communities_v_blocks_atlas_embed_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_links_order_idx" ON "_regional_communities_v_blocks_cta1_2_links" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_links_parent_id_idx" ON "_regional_communities_v_blocks_cta1_2_links" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_links_locale_idx" ON "_regional_communities_v_blocks_cta1_2_links" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_order_idx" ON "_regional_communities_v_blocks_cta1_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_parent_id_idx" ON "_regional_communities_v_blocks_cta1_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_path_idx" ON "_regional_communities_v_blocks_cta1_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_locale_idx" ON "_regional_communities_v_blocks_cta1_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_background_backgro_idx" ON "_regional_communities_v_blocks_cta1_2" USING btree ("background_svg_pattern_id");
  CREATE INDEX "_regional_communities_v_blocks_cta1_2_background_image_b_idx" ON "_regional_communities_v_blocks_cta1_2" USING btree ("background_image_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_2_order_idx" ON "_regional_communities_v_blocks_submit_story_banner_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_2_parent_id_idx" ON "_regional_communities_v_blocks_submit_story_banner_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_2_path_idx" ON "_regional_communities_v_blocks_submit_story_banner_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_2_locale_idx" ON "_regional_communities_v_blocks_submit_story_banner_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_submit_story_banner_2_ill_idx" ON "_regional_communities_v_blocks_submit_story_banner_2" USING btree ("illustration_asset_id");
  CREATE INDEX "_regional_communities_v_blocks_form_newsletter_2_order_idx" ON "_regional_communities_v_blocks_form_newsletter_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_form_newsletter_2_parent_id_idx" ON "_regional_communities_v_blocks_form_newsletter_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_form_newsletter_2_path_idx" ON "_regional_communities_v_blocks_form_newsletter_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_form_newsletter_2_locale_idx" ON "_regional_communities_v_blocks_form_newsletter_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_2_images_order_idx" ON "_regional_communities_v_blocks_logo_cloud1_2_images" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_2_images_parent_id_idx" ON "_regional_communities_v_blocks_logo_cloud1_2_images" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_2_images_locale_idx" ON "_regional_communities_v_blocks_logo_cloud1_2_images" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_2_images_asse_idx" ON "_regional_communities_v_blocks_logo_cloud1_2_images" USING btree ("asset_id");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_2_order_idx" ON "_regional_communities_v_blocks_logo_cloud1_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_2_parent_id_idx" ON "_regional_communities_v_blocks_logo_cloud1_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_2_path_idx" ON "_regional_communities_v_blocks_logo_cloud1_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_logo_cloud1_2_locale_idx" ON "_regional_communities_v_blocks_logo_cloud1_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_carousel2_2_order_idx" ON "_regional_communities_v_blocks_carousel2_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_carousel2_2_parent_id_idx" ON "_regional_communities_v_blocks_carousel2_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_carousel2_2_path_idx" ON "_regional_communities_v_blocks_carousel2_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_carousel2_2_locale_idx" ON "_regional_communities_v_blocks_carousel2_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_blocks_community_members_2_order_idx" ON "_regional_communities_v_blocks_community_members_2" USING btree ("_order");
  CREATE INDEX "_regional_communities_v_blocks_community_members_2_parent_id_idx" ON "_regional_communities_v_blocks_community_members_2" USING btree ("_parent_id");
  CREATE INDEX "_regional_communities_v_blocks_community_members_2_path_idx" ON "_regional_communities_v_blocks_community_members_2" USING btree ("_path");
  CREATE INDEX "_regional_communities_v_blocks_community_members_2_locale_idx" ON "_regional_communities_v_blocks_community_members_2" USING btree ("_locale");
  CREATE INDEX "_regional_communities_v_parent_idx" ON "_regional_communities_v" USING btree ("parent_id");
  CREATE INDEX "_regional_communities_v_version_version_sanity_updated_a_idx" ON "_regional_communities_v" USING btree ("version_sanity_updated_at");
  CREATE INDEX "_regional_communities_v_version_version_slug_idx" ON "_regional_communities_v" USING btree ("version_slug");
  CREATE INDEX "_regional_communities_v_version_cover_image_version_cove_idx" ON "_regional_communities_v" USING btree ("version_cover_image_asset_id");
  CREATE INDEX "_regional_communities_v_version_contact_version_contact__idx" ON "_regional_communities_v" USING btree ("version_contact_organization_id");
  CREATE INDEX "_regional_communities_v_version_og_image_version_og_imag_idx" ON "_regional_communities_v" USING btree ("version_og_image_asset_id");
  CREATE INDEX "_regional_communities_v_version_version_updated_at_idx" ON "_regional_communities_v" USING btree ("version_updated_at");
  CREATE INDEX "_regional_communities_v_version_version_created_at_idx" ON "_regional_communities_v" USING btree ("version_created_at");
  CREATE INDEX "_regional_communities_v_version_version__status_idx" ON "_regional_communities_v" USING btree ("version__status");
  CREATE INDEX "_regional_communities_v_created_at_idx" ON "_regional_communities_v" USING btree ("created_at");
  CREATE INDEX "_regional_communities_v_updated_at_idx" ON "_regional_communities_v" USING btree ("updated_at");
  CREATE INDEX "_regional_communities_v_snapshot_idx" ON "_regional_communities_v" USING btree ("snapshot");
  CREATE INDEX "_regional_communities_v_published_locale_idx" ON "_regional_communities_v" USING btree ("published_locale");
  CREATE INDEX "_regional_communities_v_latest_idx" ON "_regional_communities_v" USING btree ("latest");
  CREATE INDEX "_regional_communities_v_autosave_idx" ON "_regional_communities_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_regional_communities_v_locales_locale_parent_id_unique" ON "_regional_communities_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regional_communities_v_rels_order_idx" ON "_regional_communities_v_rels" USING btree ("order");
  CREATE INDEX "_regional_communities_v_rels_parent_idx" ON "_regional_communities_v_rels" USING btree ("parent_id");
  CREATE INDEX "_regional_communities_v_rels_path_idx" ON "_regional_communities_v_rels" USING btree ("path");
  CREATE INDEX "_regional_communities_v_rels_locale_idx" ON "_regional_communities_v_rels" USING btree ("locale");
  CREATE INDEX "_regional_communities_v_rels_case_studies_id_idx" ON "_regional_communities_v_rels" USING btree ("case_studies_id","locale");
  CREATE INDEX "_regional_communities_v_rels_news_posts_id_idx" ON "_regional_communities_v_rels" USING btree ("news_posts_id","locale");
  CREATE INDEX "_regional_communities_v_rels_events_id_idx" ON "_regional_communities_v_rels" USING btree ("events_id","locale");
  CREATE INDEX "_regional_communities_v_rels_lived_experiences_id_idx" ON "_regional_communities_v_rels" USING btree ("lived_experiences_id","locale");
  CREATE INDEX "_regional_communities_v_rels_research_outputs_id_idx" ON "_regional_communities_v_rels" USING btree ("research_outputs_id","locale");
  CREATE INDEX "_regional_communities_v_rels_agendas_id_idx" ON "_regional_communities_v_rels" USING btree ("agendas_id","locale");
  CREATE INDEX "_regional_communities_v_rels_regional_communities_id_idx" ON "_regional_communities_v_rels" USING btree ("regional_communities_id","locale");
  CREATE INDEX "_regional_communities_v_rels_tags_id_idx" ON "_regional_communities_v_rels" USING btree ("tags_id","locale");
  CREATE INDEX "_regional_communities_v_rels_organizations_id_idx" ON "_regional_communities_v_rels" USING btree ("organizations_id","locale");
  CREATE INDEX "_regional_communities_v_rels_testimonials_id_idx" ON "_regional_communities_v_rels" USING btree ("testimonials_id","locale");
  ALTER TABLE "regional_communities" ADD CONSTRAINT "regional_communities_og_image_asset_id_media_id_fk" FOREIGN KEY ("og_image_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "regional_communities_og_image_og_image_asset_idx" ON "regional_communities" USING btree ("og_image_asset_id");
  CREATE INDEX "regional_communities__status_idx" ON "regional_communities" USING btree ("_status");

  -- Every community was live before drafts existed: keep them published, or
  -- every published read (case study cards, the atlas, the regions menu) loses them.
  UPDATE "regional_communities" SET "_status" = 'published' WHERE "_status" IS NULL OR "_status" = 'draft';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "regional_communities_blocks_community_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_community_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero2_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_section_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_section_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_image_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_row_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_timeline_row_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_timeline_row_timelines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_timeline_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_timeline_row_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_faqs_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_faqs_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_content_feed_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_content_feed_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_content_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_content_feed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_events_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_events_calendar_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_people_widget" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_people_widget_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_card_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_agenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_news_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_row_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_region_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_region_map_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_atlas_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_atlas_embed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_cta1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_cta1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_cta1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_cta1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_submit_story_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_submit_story_banner_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_form_newsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_form_newsletter_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_logo_cloud1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_community_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_community_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_community_header_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero1_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero2_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_hero2_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_section_header_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_content_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_image_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_split_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel1_2_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_timeline_row_2_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_timeline_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_faqs_2_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_faqs_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_content_feed_2_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_content_feed_2_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_content_feed_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_events_calendar_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_people_widget_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_card_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_agenda_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_news_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_grid_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_region_map_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_atlas_embed_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_cta1_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_cta1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_submit_story_banner_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_form_newsletter_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_2_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_logo_cloud1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_carousel2_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_blocks_community_members_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regional_communities_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_version_boundaries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_version_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_community_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_community_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero2_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_section_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_section_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_image_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_row_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_timelines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_faqs_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_faqs_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_content_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_events_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_events_calendar_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_people_widget" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_people_widget_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_card_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_agenda" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_news_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_row_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_region_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_region_map_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_atlas_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_atlas_embed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_cta1_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_cta1_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_cta1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_cta1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_submit_story_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_submit_story_banner_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_form_newsletter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_form_newsletter_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel2_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_community_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_community_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_community_header_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero1_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero2_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_hero2_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_section_header_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_content_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_image_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_split_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_2_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_2_timelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_timeline_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_faqs_2_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_faqs_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_2_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_2_filters_regions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_content_feed_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_events_calendar_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_people_widget_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_card_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_agenda_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_news_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_grid_row_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_region_map_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_atlas_embed_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_cta1_2_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_cta1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_submit_story_banner_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_form_newsletter_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_2_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_logo_cloud1_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_carousel2_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_blocks_community_members_2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regional_communities_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "regional_communities_blocks_community_header" CASCADE;
  DROP TABLE "regional_communities_blocks_community_header_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_hero1_links" CASCADE;
  DROP TABLE "regional_communities_blocks_hero1_links_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_hero1" CASCADE;
  DROP TABLE "regional_communities_blocks_hero1_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_hero2_links" CASCADE;
  DROP TABLE "regional_communities_blocks_hero2_links_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_hero2" CASCADE;
  DROP TABLE "regional_communities_blocks_hero2_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_section_header" CASCADE;
  DROP TABLE "regional_communities_blocks_section_header_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_split_content" CASCADE;
  DROP TABLE "regional_communities_blocks_split_content_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_split_image" CASCADE;
  DROP TABLE "regional_communities_blocks_split_image_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_split_row" CASCADE;
  DROP TABLE "regional_communities_blocks_split_row_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel1_images" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel1_images_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel1" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel1_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_timeline_row_timelines" CASCADE;
  DROP TABLE "regional_communities_blocks_timeline_row_timelines_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_timeline_row" CASCADE;
  DROP TABLE "regional_communities_blocks_timeline_row_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_faqs_faqs" CASCADE;
  DROP TABLE "regional_communities_blocks_faqs_faqs_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_faqs" CASCADE;
  DROP TABLE "regional_communities_blocks_faqs_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_content_feed_kinds" CASCADE;
  DROP TABLE "regional_communities_blocks_content_feed_filters_regions" CASCADE;
  DROP TABLE "regional_communities_blocks_content_feed" CASCADE;
  DROP TABLE "regional_communities_blocks_content_feed_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_events_calendar" CASCADE;
  DROP TABLE "regional_communities_blocks_events_calendar_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_people_widget" CASCADE;
  DROP TABLE "regional_communities_blocks_people_widget_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_card" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_card_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_agenda" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_news" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_news_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_row" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_row_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_region_map" CASCADE;
  DROP TABLE "regional_communities_blocks_region_map_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_atlas_embed" CASCADE;
  DROP TABLE "regional_communities_blocks_atlas_embed_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_cta1_links" CASCADE;
  DROP TABLE "regional_communities_blocks_cta1_links_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_cta1" CASCADE;
  DROP TABLE "regional_communities_blocks_cta1_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_submit_story_banner" CASCADE;
  DROP TABLE "regional_communities_blocks_submit_story_banner_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_form_newsletter" CASCADE;
  DROP TABLE "regional_communities_blocks_form_newsletter_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_logo_cloud1_images" CASCADE;
  DROP TABLE "regional_communities_blocks_logo_cloud1_images_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_logo_cloud1" CASCADE;
  DROP TABLE "regional_communities_blocks_logo_cloud1_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel2" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel2_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_community_members" CASCADE;
  DROP TABLE "regional_communities_blocks_community_members_locales" CASCADE;
  DROP TABLE "regional_communities_blocks_community_header_2" CASCADE;
  DROP TABLE "regional_communities_blocks_hero1_2_links" CASCADE;
  DROP TABLE "regional_communities_blocks_hero1_2" CASCADE;
  DROP TABLE "regional_communities_blocks_hero2_2_links" CASCADE;
  DROP TABLE "regional_communities_blocks_hero2_2" CASCADE;
  DROP TABLE "regional_communities_blocks_section_header_2" CASCADE;
  DROP TABLE "regional_communities_blocks_split_content_2" CASCADE;
  DROP TABLE "regional_communities_blocks_split_image_2" CASCADE;
  DROP TABLE "regional_communities_blocks_split_row_2" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel1_2_images" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel1_2" CASCADE;
  DROP TABLE "regional_communities_blocks_timeline_row_2_timelines" CASCADE;
  DROP TABLE "regional_communities_blocks_timeline_row_2" CASCADE;
  DROP TABLE "regional_communities_blocks_faqs_2_faqs" CASCADE;
  DROP TABLE "regional_communities_blocks_faqs_2" CASCADE;
  DROP TABLE "regional_communities_blocks_content_feed_2_kinds" CASCADE;
  DROP TABLE "regional_communities_blocks_content_feed_2_filters_regions" CASCADE;
  DROP TABLE "regional_communities_blocks_content_feed_2" CASCADE;
  DROP TABLE "regional_communities_blocks_events_calendar_2" CASCADE;
  DROP TABLE "regional_communities_blocks_people_widget_2" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_card_2" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_agenda_2" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_news_2" CASCADE;
  DROP TABLE "regional_communities_blocks_grid_row_2" CASCADE;
  DROP TABLE "regional_communities_blocks_region_map_2" CASCADE;
  DROP TABLE "regional_communities_blocks_atlas_embed_2" CASCADE;
  DROP TABLE "regional_communities_blocks_cta1_2_links" CASCADE;
  DROP TABLE "regional_communities_blocks_cta1_2" CASCADE;
  DROP TABLE "regional_communities_blocks_submit_story_banner_2" CASCADE;
  DROP TABLE "regional_communities_blocks_form_newsletter_2" CASCADE;
  DROP TABLE "regional_communities_blocks_logo_cloud1_2_images" CASCADE;
  DROP TABLE "regional_communities_blocks_logo_cloud1_2" CASCADE;
  DROP TABLE "regional_communities_blocks_carousel2_2" CASCADE;
  DROP TABLE "regional_communities_blocks_community_members_2" CASCADE;
  DROP TABLE "regional_communities_rels" CASCADE;
  DROP TABLE "_regional_communities_v_version_boundaries" CASCADE;
  DROP TABLE "_regional_communities_v_version_members" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_header" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_header_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero1_links" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero1_links_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero1" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero1_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero2_links" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero2_links_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero2_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_section_header" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_section_header_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_content" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_content_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_image" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_image_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_row" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_row_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel1_images" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel1_images_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel1" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel1_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_timeline_row_timelines" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_timeline_row_timelines_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_timeline_row" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_timeline_row_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_faqs_faqs" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_faqs_faqs_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_faqs" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_faqs_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_content_feed_kinds" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_content_feed_filters_regions" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_content_feed" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_content_feed_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_events_calendar" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_events_calendar_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_people_widget" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_people_widget_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_card" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_card_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_agenda" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_news" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_news_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_row" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_row_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_region_map" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_region_map_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_atlas_embed" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_atlas_embed_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_cta1_links" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_cta1_links_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_cta1" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_cta1_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_submit_story_banner" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_submit_story_banner_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_form_newsletter" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_form_newsletter_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_logo_cloud1_images" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_logo_cloud1_images_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_logo_cloud1" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_logo_cloud1_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel2_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_members" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_members_locales" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_header_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero1_2_links" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero1_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero2_2_links" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_hero2_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_section_header_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_content_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_image_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_split_row_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel1_2_images" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel1_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_timeline_row_2_timelines" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_timeline_row_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_faqs_2_faqs" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_faqs_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_content_feed_2_kinds" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_content_feed_2_filters_regions" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_content_feed_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_events_calendar_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_people_widget_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_card_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_agenda_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_news_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_grid_row_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_region_map_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_atlas_embed_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_cta1_2_links" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_cta1_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_submit_story_banner_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_form_newsletter_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_logo_cloud1_2_images" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_logo_cloud1_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_carousel2_2" CASCADE;
  DROP TABLE "_regional_communities_v_blocks_community_members_2" CASCADE;
  DROP TABLE "_regional_communities_v" CASCADE;
  DROP TABLE "_regional_communities_v_locales" CASCADE;
  DROP TABLE "_regional_communities_v_rels" CASCADE;
  ALTER TABLE "regional_communities" DROP CONSTRAINT "regional_communities_og_image_asset_id_media_id_fk";
  
  DROP INDEX "regional_communities_og_image_og_image_asset_idx";
  DROP INDEX "regional_communities__status_idx";
  ALTER TABLE "regional_communities_members" ALTER COLUMN "person_id" SET NOT NULL;
  ALTER TABLE "regional_communities" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "regional_communities_locales" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "regional_communities" DROP COLUMN "layout_per_language";
  ALTER TABLE "regional_communities" DROP COLUMN "noindex";
  ALTER TABLE "regional_communities" DROP COLUMN "og_image_asset_id";
  ALTER TABLE "regional_communities" DROP COLUMN "_status";
  ALTER TABLE "regional_communities_locales" DROP COLUMN "meta_title";
  ALTER TABLE "regional_communities_locales" DROP COLUMN "meta_description";
  ALTER TABLE "regional_communities_locales" DROP COLUMN "og_image_alt";
  DROP TYPE "public"."enum_regional_communities_blocks_community_header__gfrato";
  DROP TYPE "public"."enum_regional_communities_blocks_hero1_image_position";
  DROP TYPE "public"."enum_regional_communities_blocks_hero1_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_hero2_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_section_header_section_width";
  DROP TYPE "public"."enum_regional_communities_blocks_section_header_stack_align";
  DROP TYPE "public"."enum_regional_communities_blocks_section_header_ch_bd3iha";
  DROP TYPE "public"."enum_regional_communities_blocks_split_row_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_carousel1_size";
  DROP TYPE "public"."enum_regional_communities_blocks_carousel1_indicators";
  DROP TYPE "public"."enum_regional_communities_blocks_carousel1_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_timeline_row_chap_1eegxe5";
  DROP TYPE "public"."enum_regional_communities_blocks_faqs_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_kinds";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_filt_20h7da";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_fill";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_sort";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_layout";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_chap_1rge6pj";
  DROP TYPE "public"."enum_regional_communities_blocks_events_calendar_c_13ygnl9";
  DROP TYPE "public"."enum_regional_communities_blocks_people_widget_region";
  DROP TYPE "public"."enum_regional_communities_blocks_people_widget_cha_1659sat";
  DROP TYPE "public"."enum_regional_communities_blocks_grid_row_mode";
  DROP TYPE "public"."enum_regional_communities_blocks_grid_row_grid_columns";
  DROP TYPE "public"."enum_regional_communities_blocks_grid_row_card_variant";
  DROP TYPE "public"."enum_regional_communities_blocks_grid_row_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_region_map_chapte_1yk15pm";
  DROP TYPE "public"."enum_regional_communities_blocks_atlas_embed_region";
  DROP TYPE "public"."enum_regional_communities_blocks_atlas_embed_chapt_25dfli";
  DROP TYPE "public"."enum_regional_communities_blocks_cta1_section_width";
  DROP TYPE "public"."enum_regional_communities_blocks_cta1_stack_align";
  DROP TYPE "public"."enum_regional_communities_blocks_cta1_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_submit_story_bann_1ykpwzu";
  DROP TYPE "public"."enum_regional_communities_blocks_form_newsletter_c_14z7pw5";
  DROP TYPE "public"."enum_regional_communities_blocks_logo_cloud1_images_org_type";
  DROP TYPE "public"."enum_regional_communities_blocks_logo_cloud1_layout";
  DROP TYPE "public"."enum_regional_communities_blocks_logo_cloud1_motion_speed";
  DROP TYPE "public"."enum_regional_communities_blocks_logo_cloud1_chapt_no9yx1";
  DROP TYPE "public"."enum_regional_communities_blocks_carousel2_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_community_members_t33wpu";
  DROP TYPE "public"."enum_regional_communities_blocks_community_header__1y3gsh7";
  DROP TYPE "public"."enum_regional_communities_blocks_hero1_2_image_position";
  DROP TYPE "public"."enum_regional_communities_blocks_hero1_2_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_hero2_2_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_section_header_2_section_width";
  DROP TYPE "public"."enum_regional_communities_blocks_section_header_2_stack_align";
  DROP TYPE "public"."enum_regional_communities_blocks_section_header_2__gedkgd";
  DROP TYPE "public"."enum_regional_communities_blocks_split_row_2_chapt_1scenwj";
  DROP TYPE "public"."enum_regional_communities_blocks_carousel1_2_size";
  DROP TYPE "public"."enum_regional_communities_blocks_carousel1_2_indicators";
  DROP TYPE "public"."enum_regional_communities_blocks_carousel1_2_chapt_cauxwd";
  DROP TYPE "public"."enum_regional_communities_blocks_timeline_row_2_ch_l9so6y";
  DROP TYPE "public"."enum_regional_communities_blocks_faqs_2_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_2_kinds";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_2_fi_1w4eu6f";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_2_fill";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_2_sort";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_2_layout";
  DROP TYPE "public"."enum_regional_communities_blocks_content_feed_2_ch_yh1ub8";
  DROP TYPE "public"."enum_regional_communities_blocks_events_calendar_2_1yhfz4q";
  DROP TYPE "public"."enum_regional_communities_blocks_people_widget_2_region";
  DROP TYPE "public"."enum_regional_communities_blocks_people_widget_2_c_11urcg2";
  DROP TYPE "public"."enum_regional_communities_blocks_grid_row_2_mode";
  DROP TYPE "public"."enum_regional_communities_blocks_grid_row_2_grid_columns";
  DROP TYPE "public"."enum_regional_communities_blocks_grid_row_2_card_variant";
  DROP TYPE "public"."enum_regional_communities_blocks_grid_row_2_chapte_b6t8tv";
  DROP TYPE "public"."enum_regional_communities_blocks_region_map_2_chap_1khqxi9";
  DROP TYPE "public"."enum_regional_communities_blocks_atlas_embed_2_region";
  DROP TYPE "public"."enum_regional_communities_blocks_atlas_embed_2_cha_1qp5bad";
  DROP TYPE "public"."enum_regional_communities_blocks_cta1_2_section_width";
  DROP TYPE "public"."enum_regional_communities_blocks_cta1_2_stack_align";
  DROP TYPE "public"."enum_regional_communities_blocks_cta1_2_chapter_chapter_kind";
  DROP TYPE "public"."enum_regional_communities_blocks_submit_story_bann_k0twxt";
  DROP TYPE "public"."enum_regional_communities_blocks_form_newsletter_2_11nvtoy";
  DROP TYPE "public"."enum_regional_communities_blocks_logo_cloud1_2_images_org_type";
  DROP TYPE "public"."enum_regional_communities_blocks_logo_cloud1_2_layout";
  DROP TYPE "public"."enum_regional_communities_blocks_logo_cloud1_2_motion_speed";
  DROP TYPE "public"."enum_regional_communities_blocks_logo_cloud1_2_cha_1v49s1u";
  DROP TYPE "public"."enum_regional_communities_blocks_carousel2_2_chapt_hii4za";
  DROP TYPE "public"."enum_regional_communities_blocks_community_members_1owqk15";
  DROP TYPE "public"."enum_regional_communities_status";
  DROP TYPE "public"."enum__regional_communities_v_blocks_community_head_z9koa";
  DROP TYPE "public"."enum__regional_communities_v_blocks_hero1_image_position";
  DROP TYPE "public"."enum__regional_communities_v_blocks_hero1_chapter_chapter_kind";
  DROP TYPE "public"."enum__regional_communities_v_blocks_hero2_chapter_chapter_kind";
  DROP TYPE "public"."enum__regional_communities_v_blocks_section_header_wzwr86";
  DROP TYPE "public"."enum__regional_communities_v_blocks_section_header_stack_align";
  DROP TYPE "public"."enum__regional_communities_v_blocks_section_header_12xzwqo";
  DROP TYPE "public"."enum__regional_communities_v_blocks_split_row_chap_1ykuzke";
  DROP TYPE "public"."enum__regional_communities_v_blocks_carousel1_size";
  DROP TYPE "public"."enum__regional_communities_v_blocks_carousel1_indicators";
  DROP TYPE "public"."enum__regional_communities_v_blocks_carousel1_chap_14nx26c";
  DROP TYPE "public"."enum__regional_communities_v_blocks_timeline_row_c_pvpskr";
  DROP TYPE "public"."enum__regional_communities_v_blocks_faqs_chapter_chapter_kind";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_kinds";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_f_zeltmw";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_fill";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_sort";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_layout";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_c_wbxj9d";
  DROP TYPE "public"."enum__regional_communities_v_blocks_events_calenda_9o9sg7";
  DROP TYPE "public"."enum__regional_communities_v_blocks_people_widget_region";
  DROP TYPE "public"."enum__regional_communities_v_blocks_people_widget__baoh03";
  DROP TYPE "public"."enum__regional_communities_v_blocks_grid_row_mode";
  DROP TYPE "public"."enum__regional_communities_v_blocks_grid_row_grid_columns";
  DROP TYPE "public"."enum__regional_communities_v_blocks_grid_row_card_variant";
  DROP TYPE "public"."enum__regional_communities_v_blocks_grid_row_chapt_1t88e8u";
  DROP TYPE "public"."enum__regional_communities_v_blocks_region_map_cha_xvdpkw";
  DROP TYPE "public"."enum__regional_communities_v_blocks_atlas_embed_region";
  DROP TYPE "public"."enum__regional_communities_v_blocks_atlas_embed_ch_17s1ah4";
  DROP TYPE "public"."enum__regional_communities_v_blocks_cta1_section_width";
  DROP TYPE "public"."enum__regional_communities_v_blocks_cta1_stack_align";
  DROP TYPE "public"."enum__regional_communities_v_blocks_cta1_chapter_chapter_kind";
  DROP TYPE "public"."enum__regional_communities_v_blocks_submit_story_b_zwdst0";
  DROP TYPE "public"."enum__regional_communities_v_blocks_form_newslette_s3biab";
  DROP TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_images_org_type";
  DROP TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_layout";
  DROP TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_motion_speed";
  DROP TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_ch_jtm3wj";
  DROP TYPE "public"."enum__regional_communities_v_blocks_carousel2_chap_1jh0a0j";
  DROP TYPE "public"."enum__regional_communities_v_blocks_community_memb_1v441c4";
  DROP TYPE "public"."enum__regional_communities_v_blocks_community_head_5st7xd";
  DROP TYPE "public"."enum__regional_communities_v_blocks_hero1_2_image_position";
  DROP TYPE "public"."enum__regional_communities_v_blocks_hero1_2_chapte_1t5ygvh";
  DROP TYPE "public"."enum__regional_communities_v_blocks_hero2_2_chapte_k3pmiu";
  DROP TYPE "public"."enum__regional_communities_v_blocks_section_header_1qci2uf";
  DROP TYPE "public"."enum__regional_communities_v_blocks_section_header_11dk2fd";
  DROP TYPE "public"."enum__regional_communities_v_blocks_section_header_unitpz";
  DROP TYPE "public"."enum__regional_communities_v_blocks_split_row_2_ch_1cab6h9";
  DROP TYPE "public"."enum__regional_communities_v_blocks_carousel1_2_size";
  DROP TYPE "public"."enum__regional_communities_v_blocks_carousel1_2_indicators";
  DROP TYPE "public"."enum__regional_communities_v_blocks_carousel1_2_ch_hbqyvn";
  DROP TYPE "public"."enum__regional_communities_v_blocks_timeline_row_2_urw8y8";
  DROP TYPE "public"."enum__regional_communities_v_blocks_faqs_2_chapter_chapter_kind";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_kinds";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_llwf8x";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_fill";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_sort";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_layout";
  DROP TYPE "public"."enum__regional_communities_v_blocks_content_feed_2_1gu2ali";
  DROP TYPE "public"."enum__regional_communities_v_blocks_events_calenda_bavpvo";
  DROP TYPE "public"."enum__regional_communities_v_blocks_people_widget_2_region";
  DROP TYPE "public"."enum__regional_communities_v_blocks_people_widget__1ucyr60";
  DROP TYPE "public"."enum__regional_communities_v_blocks_grid_row_2_mode";
  DROP TYPE "public"."enum__regional_communities_v_blocks_grid_row_2_grid_columns";
  DROP TYPE "public"."enum__regional_communities_v_blocks_grid_row_2_card_variant";
  DROP TYPE "public"."enum__regional_communities_v_blocks_grid_row_2_cha_1lo9grh";
  DROP TYPE "public"."enum__regional_communities_v_blocks_region_map_2_c_1als5o7";
  DROP TYPE "public"."enum__regional_communities_v_blocks_atlas_embed_2_region";
  DROP TYPE "public"."enum__regional_communities_v_blocks_atlas_embed_2__13fttjj";
  DROP TYPE "public"."enum__regional_communities_v_blocks_cta1_2_section_width";
  DROP TYPE "public"."enum__regional_communities_v_blocks_cta1_2_stack_align";
  DROP TYPE "public"."enum__regional_communities_v_blocks_cta1_2_chapter_chapter_kind";
  DROP TYPE "public"."enum__regional_communities_v_blocks_submit_story_b_1kwp65f";
  DROP TYPE "public"."enum__regional_communities_v_blocks_form_newslette_on6v9k";
  DROP TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_2__9jfx1e";
  DROP TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_2_layout";
  DROP TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_2_motion_speed";
  DROP TYPE "public"."enum__regional_communities_v_blocks_logo_cloud1_2__1g5s77c";
  DROP TYPE "public"."enum__regional_communities_v_blocks_carousel2_2_ch_18ei82w";
  DROP TYPE "public"."enum__regional_communities_v_blocks_community_memb_16accr7";
  DROP TYPE "public"."enum__regional_communities_v_version_region";
  DROP TYPE "public"."enum__regional_communities_v_version_status";
  DROP TYPE "public"."enum__regional_communities_v_published_locale";`)
}
