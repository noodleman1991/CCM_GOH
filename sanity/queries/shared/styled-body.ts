import { groq } from "next-sanity";

/**
 * Shared projection for `styled-block-content` bodies. Dereferences what the
 * PortableTextRenderer needs but a raw `body` fetch leaves unresolved:
 *  - image blocks → asset url + metadata (lqip, dimensions) so figures get
 *    crisp dimensions + blur placeholders,
 *  - internalLink marks → the target's _type + slug so links get real hrefs.
 * Inline into any query as `body[]{ ${styledBodyProjection} }`.
 */
export const styledBodyProjection = groq`
  ...,
  _type == "image" => {
    ...,
    asset->{
      _id,
      url,
      mimeType,
      metadata { lqip, dimensions { width, height } }
    }
  },
  markDefs[]{
    ...,
    _type == "internalLink" => {
      ...,
      reference->{ _type, "slug": slug.current }
    }
  }
`;
