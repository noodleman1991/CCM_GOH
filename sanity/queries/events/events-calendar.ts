import { groq } from "next-sanity";

export const eventsCalendarQuery = groq`
  _type == "events-calendar" => {
    _type,
    _key,
    padding,
    title,
    description,
    upcomingLimit,
  }
`;
