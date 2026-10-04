/**
 * What the team has opened in Settings → Collaboration, and what that means
 * for one viewer (opening-collaboration spec C1/C7). Pure.
 */
export type WorkspaceAudience = "off" | "team" | "leads" | "members";
export interface CollaborationSettings {
  notifications: boolean;
  people: boolean;
  workspaces: WorkspaceAudience;
  messages: boolean;
  /** Dashboard → My contributions (on unless the team hides it). */
  contributions: boolean;
}
export interface CollaborationAccess {
  notifications: boolean;
  people: boolean;
  workspaces: { see: boolean; create: boolean };
  messages: boolean;
  contributions: boolean;
}

/** The live site's state before anyone changes the setting: every collaboration tool off. */
export const ALL_OFF: CollaborationSettings = { notifications: false, people: false, workspaces: "off", messages: false, contributions: true };
export const ALL_ON: CollaborationSettings = { notifications: true, people: true, workspaces: "members", messages: true, contributions: true };

const AUDIENCES = new Set<WorkspaceAudience>(["off", "team", "leads", "members"]);
const TEAM = new Set(["team_editor", "admin"]);
const LEADS = new Set(["team_editor", "admin", "community_editor"]);

/** A tolerant read of the stored global: anything missing or odd takes its default. */
export function toSettings(row: unknown): CollaborationSettings {
  const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const audience = typeof r.workspaces === "string" && AUDIENCES.has(r.workspaces as WorkspaceAudience) ? (r.workspaces as WorkspaceAudience) : "off";
  return {
    notifications: r.notifications === true,
    people: r.people === true,
    workspaces: audience,
    messages: r.messages === true,
    contributions: r.contributions !== false,
  };
}

/** `NEXT_PUBLIC_FEATURE_ENGAGEMENT=true` (dev) opens everything, as the old switch did. */
export function devOverride(): boolean {
  const v = process.env.NEXT_PUBLIC_FEATURE_ENGAGEMENT;
  return v === "true" || v === "1";
}

export function collaborationAccess(s: CollaborationSettings, role: string | null): CollaborationAccess {
  const signedIn = role !== null;
  const inAudience =
    s.workspaces === "members" ? signedIn
    : s.workspaces === "leads" ? !!role && LEADS.has(role)
    : s.workspaces === "team" ? !!role && TEAM.has(role)
    : false;
  return {
    notifications: s.notifications && signedIn,
    // Badges and the filter are public; asking to connect checks sign-in itself.
    people: s.people,
    workspaces: { see: inAudience, create: inAudience },
    messages: s.messages && signedIn,
    contributions: s.contributions && signedIn,
  };
}
