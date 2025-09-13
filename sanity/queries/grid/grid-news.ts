import { defineQuery } from "next-sanity";

export const GRID_NEWS_QUERY = defineQuery(`
    *[_type == "grid-news" && _id == $id][0] {
        _type,
        _id,
        showTags,
        showAuthor,
        showMetadata,
        showLocation,
        customExcerpt,
        newsPost-> {
            _id,
            _type,
            title,
            subtitle,
            excerpt,
            slug,
            image {
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
            author-> {
                _id,
                name,
                image {
                    asset-> {
                        _id,
                        url
                    }
                }
            },
            publishedAt,
            organizations[]-> {
                _id,
                name
            },
            locationDetails {
                city,
                country,
                region
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

export const GRID_NEWS_LIST_QUERY = defineQuery(`
    *[_type == "grid-news"] {
        _type,
        _id,
        showTags,
        showAuthor,
        showMetadata,
        showLocation,
        customExcerpt,
        newsPost-> {
            _id,
            _type,
            title,
            subtitle,
            excerpt,
            slug,
            image {
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
            author-> {
                _id,
                name,
                image {
                    asset-> {
                        _id,
                        url
                    }
                }
            },
            publishedAt,
            organizations[]-> {
                _id,
                name
            },
            locationDetails {
                city,
                country,
                region
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