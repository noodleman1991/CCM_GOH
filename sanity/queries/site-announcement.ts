import { groq } from "next-sanity";

/**
 * The singleton site announcement. Lives at the fixed id `siteAnnouncement`.
 * Message/link.label are Lane-B localized objects; resolved per-locale at render.
 */
export const SITE_ANNOUNCEMENT_QUERY = groq`
  *[_type == "siteAnnouncement"][0]{
    enabled,
    variant,
    message,
    dismissible,
    startsAt,
    endsAt,
    link{
      url,
      label
    }
  }
`;
