/**
 * The one character-limit map (Slice 13a, audit P2).
 *
 * Every text field a member can type into reads its cap from here — the
 * server zod, the client zod, the input's `maxLength` and the counter under
 * it — so the four can never disagree. `lib/__tests__/limits-parity.test.ts`
 * checks the server schemas against these numbers and that no listed file
 * keeps a private numeric `.max(` on a string field.
 *
 * Numbers that already existed on the server were kept; the four fields that
 * were unbounded on both ends (case-study title/excerpt/author/organisation)
 * got caps sized to their longest real values with headroom.
 */
export const LIMITS = {
  caseStudy: {
    title: 160,
    excerpt: 500,
    authorName: 100,
    organizationName: 200,
    /** The free-text label of a picked place (`place.text`). */
    placeText: 200,
    /** The country or city name carried alongside a picked place. */
    placeName: 120,
  },
  livedExperience: {
    title: 160,
    description: 800,
    issue: 400,
    personContext: 400,
  },
  researchOutput: {
    title: 200,
    excerpt: 600,
  },
  event: {
    title: 160,
    description: 2000,
    locationName: 200,
    placeText: 200,
    organiserName: 160,
  },
  profile: {
    firstName: 50,
    lastName: 50,
    username: 30,
    headline: 120,
    bio: 500,
    motivation: 600,
    country: 100,
    city: 100,
    organization: 200,
    position: 200,
    workBio: 1000,
    linkedinProfile: 100,
    pronouns: 40,
    language: 40,
    focusTopic: 60,
    lookingFor: 40,
    collaborationInterests: 600,
    livedExperienceStatement: 1000,
    orcidId: 40,
    socialPlatform: 40,
  },
  recentWork: {
    title: 100,
    description: 500,
  },
  tags: {
    /** One free-text tag suggestion on a submission. */
    suggestion: 40,
    /** How many a submission may carry. */
    suggestions: 3,
  },
  collaboration: {
    title: 200,
    description: 2000,
    stage: 200,
    task: 300,
    taskDescription: 2000,
    doc: 200,
    thread: 160,
  },
} as const;

export type Limits = typeof LIMITS;
