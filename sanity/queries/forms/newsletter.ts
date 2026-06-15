import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const formNewsletterQuery = groq`
  _type == "form-newsletter" => {
    _type,
    _key,
    padding,
    stackAlign,
    consentText,
    buttonText,
    successMessage,
  }
`;
