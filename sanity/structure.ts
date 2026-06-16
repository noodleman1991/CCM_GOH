import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import {
    Files,
    BookA,
    User,
    ListCollapse,
    Quote,
    Tag,
    Building,
    FolderOpen,
    FileText,
    ExternalLink,
    FileSearch,
    MapPinned,
    Home,
    Megaphone,
    Heart,
    Globe,
    UserCog,
    Briefcase,
    GraduationCap,
} from "lucide-react";

export const structure = (S: any, context: any) =>
    S.list()
        .title("Content")
        .items([
            // Homepage - Special section at the top
            S.listItem()
                .title("Homepage")
                .icon(Home)
                .child(
                    S.documentTypeList("homepage")
                        .title("Homepage")
                        .child((documentId: string) =>
                            S.document()
                                .documentId(documentId)
                                .schemaType("homepage")
                        )
                ),

            // Site Announcement - singleton (one fixed document)
            S.listItem()
                .title("Site Announcement")
                .icon(Megaphone)
                .child(
                    S.document()
                        .schemaType("siteAnnouncement")
                        .documentId("siteAnnouncement")
                ),

            // Website Pages
            S.divider(),
            S.listItem()
                .title("Website")
                .child(
                    S.list()
                        .title("Website")
                        .items([
                            orderableDocumentListDeskItem({
                                type: "page",
                                title: "Pages",
                                icon: Files,
                                S,
                                context,
                            }),
                            orderableDocumentListDeskItem({
                                type: "regionalCommunityPage",
                                title: "Regional Community Pages",
                                icon: MapPinned,
                                S,
                                context,
                            }),
                        ])
                ),

            // Research & Content
            S.divider(),
            S.listItem()
                .title("Research & Content")
                .child(
                    S.list()
                        .title("Research & Content")
                        .items([
                            S.listItem()
                                .title("Case Studies")
                                .icon(FileSearch)
                                .child(
                                    S.list()
                                        .title("Case Studies")
                                        .items([
                                            S.listItem()
                                                .title("All Case Studies")
                                                .schemaType("caseStudy")
                                                .child(
                                                    S.documentTypeList("caseStudy")
                                                        .title("All Case Studies")
                                                        .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                                                ),
                                            S.listItem()
                                                .title("Pending Review")
                                                .schemaType("caseStudy")
                                                .child(
                                                    S.documentTypeList("caseStudy")
                                                        .title("Pending Review")
                                                        .apiVersion('2024-10-31')
                                                        .filter('_type == "caseStudy" && status == "pending"')
                                                ),
                                            S.listItem()
                                                .title("Approved")
                                                .schemaType("caseStudy")
                                                .child(
                                                    S.documentTypeList("caseStudy")
                                                        .title("Approved Case Studies")
                                                        .apiVersion('2024-10-31')
                                                        .filter('_type == "caseStudy" && status == "approved"')
                                                ),
                                        ])
                                ),
                            S.listItem()
                                .title("Agendas")
                                .icon(FileText)
                                .child(
                                    S.documentTypeList("agenda")
                                        .title("Agendas")
                                        .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                        ),
                            S.listItem()
                                .title("Lived Experiences")
                                .icon(Heart)
                                .child(
                                    S.documentTypeList("livedExperience")
                                        .title("Lived Experiences")
                                        .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                                ),
                        ])
                ),

            // News & External Sources
            S.divider(),
            S.listItem()
                .title("News & Sources")
                .child(
                    S.list()
                        .title("News & Sources")
                        .items([
                            S.listItem()
                                .title("News Posts")
                                .icon(FileText)
                                .schemaType("newsPost")
                                .child(
                                    S.documentTypeList("newsPost")
                                        .title("News Posts")
                                        .apiVersion('2024-10-31')
                                        .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
                                        .filter('_type == "newsPost"')
                                ),
                            S.listItem()
                                .title("External Sources")
                                .icon(ExternalLink)
                                .schemaType("externalSource")
                                .child(
                                    S.documentTypeList("externalSource")
                                        .title("External Sources")
                                        .defaultOrdering([{ field: "addedAt", direction: "desc" }])
                                ),
                        ])
                ),


            // Affiliations
            S.divider(),
            S.listItem()
                .title("Affiliations")
                .child(
                    S.list()
                        .title("Affiliations")
                        .items([
                            orderableDocumentListDeskItem({
                                type: "organization",
                                title: "Organizations",
                                icon: Building,
                                S,
                                context,
                            }),
                            orderableDocumentListDeskItem({
                                type: "project",
                                title: "Projects",
                                icon: FolderOpen,
                                S,
                                context,
                            }),
                        ])
                ),

            // User Management & Onboarding
            S.divider(),
            S.listItem()
                .title("User Management")
                .child(
                    S.list()
                        .title("User Management")
                        .items([
                            S.listItem()
                                .title("Onboarding Content")
                                .icon(UserCog)
                                .child(
                                    S.list()
                                        .title("Onboarding Content")
                                        .items([
                                            S.listItem()
                                                .title("English")
                                                .schemaType("onboardingContent")
                                                .child(
                                                    S.documentTypeList("onboardingContent")
                                                        .title("English Onboarding")
                                                        .apiVersion('2024-10-31')
                                                        .filter('_type == "onboardingContent" && language == "en"')
                                                ),
                                            S.listItem()
                                                .title("Español")
                                                .schemaType("onboardingContent")
                                                .child(
                                                    S.documentTypeList("onboardingContent")
                                                        .title("Spanish Onboarding")
                                                        .apiVersion('2024-10-31')
                                                        .filter('_type == "onboardingContent" && language == "es"')
                                                ),
                                            S.listItem()
                                                .title("Français")
                                                .schemaType("onboardingContent")
                                                .child(
                                                    S.documentTypeList("onboardingContent")
                                                        .title("French Onboarding")
                                                        .apiVersion('2024-10-31')
                                                        .filter('_type == "onboardingContent" && language == "fr"')
                                                ),
                                            S.listItem()
                                                .title("العربية")
                                                .schemaType("onboardingContent")
                                                .child(
                                                    S.documentTypeList("onboardingContent")
                                                        .title("Arabic Onboarding")
                                                        .apiVersion('2024-10-31')
                                                        .filter('_type == "onboardingContent" && language == "ar"')
                                                ),
                                            S.listItem()
                                                .title("All Languages")
                                                .schemaType("onboardingContent")
                                                .child(
                                                    S.documentTypeList("onboardingContent")
                                                        .title("All Onboarding Content")
                                                        .defaultOrdering([{ field: "language", direction: "asc" }])
                                                ),
                                        ])
                                ),
                            S.listItem()
                                .title("Work Types")
                                .icon(Briefcase)
                                .child(
                                    S.documentTypeList("workType")
                                        .title("Work Types")
                                        .defaultOrdering([{ field: "order", direction: "asc" }])
                                ),
                            S.listItem()
                                .title("Expertise Areas")
                                .icon(GraduationCap)
                                .child(
                                    S.documentTypeList("expertiseArea")
                                        .title("Expertise Areas")
                                        .defaultOrdering([{ field: "order", direction: "asc" }])
                                ),
                        ])
                ),

            // Communities & Users
            S.divider(),
            S.listItem()
                .title("Communities & Users")
                .child(
                    S.list()
                        .title("Communities & Users")
                        .items([
                            orderableDocumentListDeskItem({
                                type: "regionalCommunity",
                                title: "Regional Communities",
                                icon: Globe,
                                S,
                                context,
                            }),
                            orderableDocumentListDeskItem({
                                type: "author",
                                title: "Authors",
                                icon: User,
                                S,
                                context,
                            }),
                            orderableDocumentListDeskItem({
                                type: "testimonial",
                                title: "Testimonials",
                                icon: Quote,
                                S,
                                context,
                            }),
                        ])
                ),

            // Taxonomies
            S.divider(),
            S.listItem()
                .title("Taxonomies")
                .child(
                    S.list()
                        .title("Taxonomies")
                        .items([
                            orderableDocumentListDeskItem({
                                type: "tag",
                                title: "Tags",
                                icon: Tag,
                                S,
                                context,
                            }),
                            orderableDocumentListDeskItem({
                                type: "category",
                                title: "Categories",
                                icon: BookA,
                                S,
                                context,
                            }),
                        ])
                ),

            // Support & Engagement
            S.divider(),
            S.listItem()
                .title("Support & Engagement")
                .child(
                    S.list()
                        .title("Support & Engagement")
                        .items([
                            orderableDocumentListDeskItem({
                                type: "faq",
                                title: "FAQs",
                                icon: ListCollapse,
                                S,
                                context,
                            }),
                        ])
                ),
        ]);
