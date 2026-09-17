/**
 * The event taxonomy (Slice 11, design §6). Every event is declared once, in
 * TypeScript; `track()` and `captureServer()` accept nothing else.
 *
 * Naming: object_verb, snake_case, past tense. Properties are snake_case and
 * carry ids (Payload/Sanity doc id, Prisma cuid, Algolia objectID) — never
 * titles, never free text, never an email. What people type into the search
 * box is deliberately reduced to `query_length` + `zero_results`: members of
 * this community disclose mental-health context, and a person-linked event
 * stream is the wrong place for their words.
 */
export type ContentKind =
  | "case_study"
  | "lived_experience"
  | "research_output"
  | "event"
  | "news"
  | "agenda"
  | "report"
  | "page";

export type SubmissionKind = "case_study" | "event" | "lived_experience" | "research_output";

export type AnalyticsEvents = {
  // content engagement
  content_viewed: { kind: ContentKind; content_id: string; backend: "sanity" | "payload" };
  reader_opened: { kind: "report" | "agenda"; content_id: string; file_language: string };
  reader_progress: { content_id: string; percent_bucket: 25 | 50 | 75 | 100 };
  report_downloaded: { kind: "report" | "agenda"; content_id: string; file_language: string };
  external_link_clicked: { host: string; from_kind: ContentKind }; // host only, never the full URL
  video_unlocked: { provider: "youtube" | "vimeo" };
  // search & discovery
  search_performed: {
    scope: "all" | "case_studies" | "users" | "news" | "agendas";
    query_length: number;
    results_count: number;
    zero_results: boolean;
    filters_count: number;
  };
  search_result_clicked: { scope: string; position: number; object_id: string };
  atlas_filter_applied: { facet: "region" | "type" | "when" | "topic"; values_count: number };
  // submissions
  submission_started: { kind: SubmissionKind };
  submission_draft_saved: { kind: "case_study"; step: number };
  submission_submitted: { kind: SubmissionKind; is_resubmission: boolean; has_image: boolean }; // server
  submission_moderated: {
    kind: string;
    from: string | null;
    to: string;
    action: "approve" | "revision" | "reject" | "other";
    doc_id: string;
    submitter_id: string | null;
  }; // server
  // community / collaboration
  community_joined: { community_id: string; community_kind: "regional" | "special" };
  rsvp_set: { event_id: string; status: "GOING" | "INTERESTED" | "NOT_GOING"; previous_status: string | null }; // server
  comment_posted: { target_kind: string; anonymous: boolean; has_mentions: boolean; is_reply: boolean }; // no text
  reaction_added: { target_kind: "comment" | "content"; reaction: string };
  collaboration_created: { visibility: "MEMBERS" | "PUBLIC" };
  // onboarding funnel
  sign_up_completed: Record<string, never>; // server (Clerk webhook)
  onboarding_step_viewed: {
    step_index: number;
    step_name: "welcome" | "basic_info" | "work_info" | "recent_work" | "privacy" | "review";
  };
  onboarding_completed: { waived: boolean }; // server
  newsletter_subscribed: { source: "footer" | "inline" }; // server, anonymous
  weekly_digest_sent: { recipients: number; failed: number }; // server, anonymous
};

export type AnalyticsEventName = keyof AnalyticsEvents;

/**
 * Property names that can only mean free text or identity. Outside production
 * a call with one of these throws, so the mistake is caught by the developer
 * or by the test suite rather than by a data-protection review.
 */
const FORBIDDEN_KEYS =
  /^(email|name|first_name|last_name|username|phone|query|text|body|content|message|title|bio|notes|review_notes|url|headline|address)$/i;

export function assertAllowedProperties(event: string, props: Record<string, unknown>): void {
  const bad = Object.keys(props).find((k) => FORBIDDEN_KEYS.test(k));
  if (bad) throw new Error(`analytics: forbidden property "${bad}" on ${event}`);
}

/**
 * Browser-side capture. A no-op on the server and before consent (the client
 * module returns null until loaded). Returns the completion so tests can
 * await it; callers fire and forget.
 */
export async function track<E extends AnalyticsEventName>(event: E, props: AnalyticsEvents[E]): Promise<void> {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") assertAllowedProperties(event, props as Record<string, unknown>);
  const { getPostHog } = await import("@/lib/analytics/client");
  getPostHog()?.capture(event, props as Record<string, unknown>);
}
