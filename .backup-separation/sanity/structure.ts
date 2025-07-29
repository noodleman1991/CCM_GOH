// sanity/structure.ts
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
    MapPinned
} from "lucide-react";

export const structure = (S: any, context: any) =>
    S.list()
        .title("Content")
        .items([
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

            // Case Studies
            S.divider(),
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
                                        .filter('_type == "caseStudy" && status == "pending"')
                                ),
                            S.listItem()
                                .title("Approved")
                                .schemaType("caseStudy")
                                .child(
                                    S.documentTypeList("caseStudy")
                                        .title("Approved Case Studies")
                                        .filter('_type == "caseStudy" && status == "approved"')
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

            // Blog (Legacy)
            S.divider(),
            S.listItem()
                .title("Blog (Legacy)")
                .child(
                    S.list()
                        .title("Blog")
                        .items([
                            S.listItem()
                                .title("Posts")
                                .schemaType("post")
                                .child(
                                    S.documentTypeList("post")
                                        .title("Post")
                                        .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                                ),
                            orderableDocumentListDeskItem({
                                type: "author",
                                title: "Authors",
                                icon: User,
                                S,
                                context,
                            }),
                        ])
                ),

            // Support Content
            S.divider(),
            orderableDocumentListDeskItem({
                type: "faq",
                title: "FAQs",
                icon: ListCollapse,
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
        ]);
