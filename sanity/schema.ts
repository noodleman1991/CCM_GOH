import { type SchemaTypeDefinition } from "sanity";

// documents
import homepage from "./schemas/documents/homepage";
import siteAnnouncement from "./schemas/documents/site-announcement";
import profilePrompt from "./schemas/documents/profile-prompt";
import page from "./schemas/documents/page";
import regionalCommunityPage from "./schemas/documents/regional-community-page"; //hub
import post from "./schemas/documents/post";
import report from "./schemas/documents/report";
import agenda from "./schemas/documents/agenda";
import author from "./schemas/documents/author";
import category from "./schemas/documents/category";
import faq from "./schemas/documents/faq";
import testimonial from "./schemas/documents/testimonial";

import tag from "./schemas/documents/tag";
import regionalCommunity from "./schemas/documents/regional-community";
import organization from "./schemas/documents/organization";
import project from "./schemas/documents/project";
import newsPost from "./schemas/documents/news-post";
import externalSource from "./schemas/documents/external-source";
import caseStudy from "./schemas/documents/case-study";
import caseStudyDraft from "./schemas/documents/case-study-draft";
import livedExperience from "./schemas/documents/lived-experience";
import onboardingContent from "./schemas/documents/onboarding-content";
import workType from "./schemas/documents/work-type";
import expertiseArea from "./schemas/documents/expertise-area";


// Schema UI shared objects
import blockContent from "./schemas/blocks/shared/block-content";
import styledBlockContent from "./schemas/blocks/shared/styled-block-content";
import link from "./schemas/blocks/shared/link";
// New block types for portable text
import breakBlock from "./schemas/blocks/break";
import infoBox from "./schemas/blocks/info-box";
import { buttonVariant } from "./schemas/blocks/shared/button-variant";
import sectionPadding from "./schemas/blocks/shared/section-padding";
import { backgroundOption } from "./schemas/blocks/shared/background-option";

// Internationalized objects
import internationalizedArrayString from "./schemas/objects/internationalized-array-string";
import internationalizedArrayText from "./schemas/objects/internationalized-array-text";

// Schema UI objects (existing blocks)
import hero1 from "./schemas/blocks/hero/hero-1";
import hero2 from "./schemas/blocks/hero/hero-2";
import sectionHeader from "./schemas/blocks/section-header";
import splitRow from "./schemas/blocks/split/split-row";
import splitContent from "./schemas/blocks/split/split-content";
import splitCardsList from "./schemas/blocks/split/split-cards-list";
import splitCard from "./schemas/blocks/split/split-card";
import splitImage from "./schemas/blocks/split/split-image";
import splitInfoList from "./schemas/blocks/split/split-info-list";
import splitInfo from "./schemas/blocks/split/split-info";
import gridCard from "./schemas/blocks/grid/grid-card";
import gridPost from "./schemas/blocks/grid/grid-post";
import gridRow from "./schemas/blocks/grid/grid-row";
import gridReport from "./schemas/blocks/grid/grid-report";
import gridAgenda from "./schemas/blocks/grid/grid-agenda";
import gridCaseStudy from "./schemas/blocks/grid/grid-case-study";
import gridNews from "./schemas/blocks/grid/grid-news";
import gridLivedExperience from "./schemas/blocks/grid/grid-lived-experience";
import teamGrid from "./schemas/blocks/team-grid";
import carousel1 from "./schemas/blocks/carousel/carousel-1";
import carousel2 from "./schemas/blocks/carousel/carousel-2";
import livedExperiencesCarousel from "./schemas/blocks/carousel/lived-experiences-carousel";
import timelineRow from "./schemas/blocks/timeline/timeline-row";
import timelinesOne from "./schemas/blocks/timeline/timelines-1";
import cta1 from "./schemas/blocks/cta/cta-1";
import logoCloud1 from "./schemas/blocks/logo-cloud/logo-cloud-1";
import faqs from "./schemas/blocks/faqs";
import newsletter from "./schemas/blocks/forms/newsletter";
import allPosts from "./schemas/blocks/all-posts";
import regionMap from "./schemas/blocks/maps/region-map";

// Insert blocks for structured content pattern
import manualContentInsert from "./schemas/blocks/inserts/manual-content-insert";
import dynamicContentInsert from "./schemas/blocks/inserts/dynamic-content-insert";
import separatorBlock from "./schemas/blocks/inserts/separator-block";

// Reference-based blocks (Option 3: Dynamic References)
import regionalCommunityList from "./schemas/blocks/regional-community-list";
import documentReferenceList from "./schemas/blocks/document-reference-list";

// Code input is now provided by @sanity/code-input plugin


export const schema: { types: SchemaTypeDefinition[] } = {
    types: [
        // documents
        homepage,
        siteAnnouncement,
        profilePrompt,
        page,
        post,
        author,
        category,
        faq,
        testimonial,
        tag,
        organization,
        project,
        newsPost,
        externalSource,
        caseStudy,
        caseStudyDraft,
        livedExperience,
        regionalCommunity,
        report,
        agenda,
        // onboarding & user management
        onboardingContent,
        workType,
        expertiseArea,
        // hub
        regionalCommunityPage,
        // shared objects
        blockContent,
        styledBlockContent,
        link,
        // portable text block types
        breakBlock,
        infoBox,
        buttonVariant,
        sectionPadding,
        backgroundOption,
        // internationalized objects
        internationalizedArrayString,
        internationalizedArrayText,
        // blocks
        hero1,
        hero2,
        sectionHeader,
        splitRow,
        splitContent,
        splitCardsList,
        splitCard,
        splitImage,
        splitInfoList,
        splitInfo,
        gridCard,
        gridPost,
        gridRow,
        gridReport,
        gridAgenda,
        gridCaseStudy,
        gridNews,
        gridLivedExperience,
        teamGrid,
        carousel1,
        carousel2,
        livedExperiencesCarousel,
        timelineRow,
        timelinesOne,
        cta1,
        logoCloud1,
        faqs,
        newsletter,
        allPosts,
        regionMap,
        // insert blocks
        manualContentInsert,
        dynamicContentInsert,
        separatorBlock,
        // reference-based blocks
        regionalCommunityList,
        documentReferenceList,
    ],
};
