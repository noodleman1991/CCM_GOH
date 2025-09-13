import { defineQuery } from "next-sanity";

export const GRID_LIVED_EXPERIENCE_QUERY = defineQuery(`
    *[_type == "grid-lived-experience" && _id == $id][0] {
        _type,
        _id,
        showTags,
        showMetadata,
        showCommunity,
        showOrganizations,
        customExcerpt,
        livedExperience-> {
            _id,
            _type,
            title,
            excerpt,
            slug,
            thumbnail {
                asset-> {
                    _id,
                    url,
                    metadata {
                        lqip,
                        dimensions {
                            width,
                            height
                        }
                    }
                },
                alt
            },
            videoUrl,
            duration,
            publishedAt,
            relatedCommunity-> {
                _id,
                name
            },
            organizations[]-> {
                _id,
                name
            },
            tags[]-> {
                _id,
                label,
                color
            },
            featured
        }
    }
`);

export const GRID_LIVED_EXPERIENCE_LIST_QUERY = defineQuery(`
    *[_type == "grid-lived-experience"] {
        _type,
        _id,
        showTags,
        showMetadata,
        showCommunity,
        showOrganizations,
        customExcerpt,
        livedExperience-> {
            _id,
            _type,
            title,
            excerpt,
            slug,
            thumbnail {
                asset-> {
                    _id,
                    url,
                    metadata {
                        lqip,
                        dimensions {
                            width,
                            height
                        }
                    }
                },
                alt
            },
            videoUrl,
            duration,
            publishedAt,
            relatedCommunity-> {
                _id,
                name
            },
            organizations[]-> {
                _id,
                name
            },
            tags[]-> {
                _id,
                label,
                color
            },
            featured
        }
    }
`);