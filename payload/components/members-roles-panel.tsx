"use client";

import { useEffect, useState, useTransition } from "react";
import { listStaff, searchMembers, setMemberRole, type MemberRow } from "@/lib/actions/member-roles";
import { MEMBER_ROLES, type MemberRole } from "@/lib/members/roles";

const ROLE_LABEL: Record<string, string> = {
  community_member: "Member",
  community_editor: "Community editor",
  team_editor: "Team editor",
  admin: "Admin",
};
const ROLE_HELP: Record<MemberRole, string> = {
  community_member: "Uses the hub. No access to this admin.",
  team_editor: "Edits content here, reviews submissions, sees “Report a problem”.",
  admin: "Everything a team editor can, plus settings and roles.",
};

/**
 * The working part of Members & roles: search, then pick a role and confirm.
 * Opens on the current staff so an admin sees who has access at a glance.
 * Results never include an email or a phone.
 */
export function MembersRolesPanel() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [heading, setHeading] = useState("Staff now");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await listStaff();
      if (res.ok) setRows(res.members);
      else setError(res.error);
    });
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await searchMembers(q);
      if (!res.ok) return setError(res.error);
      setRows(res.members);
      setHeading(res.members.length ? `Members matching “${q.trim()}”` : `No member matches “${q.trim()}”`);
    });
  };

  return (
    <>
      <p style={{ margin: "0 0 1.25rem", color: "var(--theme-elevation-600)" }}>
        Find a member by name or username and change what they can do. Community leads are set on each regional community, under “Community leads”.
      </p>
      <form onSubmit={search} className="ccm-members__search" role="search">
        <label htmlFor="member-q" className="ccm-members__label">Find a member</label>
        <input id="member-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or username" minLength={2} autoComplete="off" />
        <button className="ccm-button" type="submit" disabled={pending || q.trim().length < 2}>Search</button>
      </form>
      {error && <p className="ccm-members__error" role="alert">{error}</p>}
      <div className="ccm-card">
        <h2>{heading}</h2>
        {rows.length > 0 && (
          <ul className="ccm-members__list">
            {rows.map((m) => (
              <MemberItem key={m.id} member={m} onChanged={(role) => setRows((all) => all.map((r) => (r.id === m.id ? { ...r, role } : r)))} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function MemberItem({ member, onChanged }: { member: MemberRow; onChanged: (role: MemberRole) => void }) {
  const [choice, setChoice] = useState<MemberRole | "">("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const confirm = () =>
    startTransition(async () => {
      if (!choice) return;
      const res = await setMemberRole(member.id, choice);
      if (res.ok) {
        onChanged(res.role);
        setMessage({ ok: true, text: `${member.name} is now ${ROLE_LABEL[res.role].toLowerCase()}. It applies on their next page load.` });
      } else setMessage({ ok: false, text: res.error });
      setChoice("");
    });

  return (
    <li className="ccm-members__item">
      <div className="ccm-members__who">
        {member.image ? <img src={member.image} alt="" width={36} height={36} /> : <span aria-hidden className="ccm-members__avatar">{member.name.slice(0, 1)}</span>}
        <div>
          <strong>{member.name}</strong>
          {member.username && <span className="ccm-members__username">@{member.username}</span>}
        </div>
      </div>
      <span className="ccm-chip">{ROLE_LABEL[member.role] ?? member.role}</span>
      <div className="ccm-members__change">
        <label className="ccm-members__label" htmlFor={`role-${member.id}`}>Change role for {member.name}</label>
        <select id={`role-${member.id}`} value={choice} onChange={(e) => { setChoice(e.target.value as MemberRole); setMessage(null); }}>
          <option value="">Change role…</option>
          {MEMBER_ROLES.filter((r) => r !== member.role).map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>
      {choice && (
        <div className="ccm-members__confirm" role="group" aria-label="Confirm the change">
          <p>
            Make <strong>{member.name}</strong> {ROLE_LABEL[choice].toLowerCase()}? {ROLE_HELP[choice]}
          </p>
          <button className="ccm-button" type="button" onClick={confirm} disabled={pending}>Confirm</button>
          <button className="ccm-button ccm-button--secondary" type="button" onClick={() => setChoice("")}>Cancel</button>
        </div>
      )}
      {message && <p className={message.ok ? "ccm-members__done" : "ccm-members__error"} role="status">{message.text}</p>}
    </li>
  );
}
