import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const faqsQuery = groq`
  _type == "faqs" => {
    _type,
    _key,
    padding,
    faqs[]->{
      _id,
      // Localized question (Lane B), with legacy single-language fallback.
      "question": coalesce(question, { "en": title }),
      "title": coalesce(question.en, title),
      // Localized rich answer; fall back to legacy single-language body.
      "answer": coalesce(answer, { "en": body }),
      "body": coalesce(answer.en, body)[]{
        ...,
        _type == "image" => {
          ...,
          asset->{
            _id,
            url,
            mimeType,
            metadata {
              lqip,
              dimensions {
                width,
                height
              }
            }
          }
        }
      },
    },
  }
`;
