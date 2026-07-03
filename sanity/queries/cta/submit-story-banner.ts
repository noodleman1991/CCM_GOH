import { groq } from "next-sanity";

export const submitStoryBannerQuery = groq`
  _type == "submit-story-banner" => {
    _type,
    _key,
    padding,
    title,
    subtitle,
    ctaLabel,
    illustration{
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions {
            width,
            height
          }
        }
      }
    },
  }
`;
