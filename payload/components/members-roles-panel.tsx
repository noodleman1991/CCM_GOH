"use client";

import { useEffect, useState, useTransition } from "react";
import { ReactSelect } from "@payloadcms/ui";
import {
  cancelReservation,
  listReservations,
  listStaff,
  reserveRole,
  searchMembers,
  setMemberRole,
  type MemberRow,
  type Reservation,
} from "@/lib/actions/member-roles";
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

type Message = { ok: boolean; text: string } | null;

/**
 * The working part of Members & roles — one search box for a name, a username
 * or an email address. A member who matches can be given a new role in place;
 * an address nobody on the hub uses yet can have a role reserved, applied when
 * that person first signs in. Opens on the current staff and the roles still
 * waiting for someone to join. Members' emails are never shown.
 */
export function MembersRolesPanel() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [heading, setHeading] = useState("Staff now");
  const [unknownEmail, setUnknownEmail] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loadReservations = async () => {
    const res = await listReservations();
    if (res.ok) setReservations(res.reservations);
  };

  useEffect(() => {
    startTransition(async () => {
      const res = await listStaff();
      if (res.ok) setRows(res.members);
      else setError(res.error);
      await loadReservations();
    });
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await searchMembers(q);
      if (!res.ok) return setError(res.error);
      setRows(res.members);
      setUnknownEmail(res.email && res.members.length === 0 ? res.email : null);
      const term = q.trim();
      setHeading(
        res.members.length
          ? res.email
            ? "The member with that address"
            : `Members matching “${term}”`
          : res.email
            ? "Nobody on the hub uses that address yet"
            : `No member matches “${term}”`,
      );
    });
  };

  return (
    <>
      <p style={{ margin: "0 0 1.25rem", color: "var(--theme-elevation-600)" }}>
        Find someone by name, username or email address and set what they can do. For someone who hasn&apos;t joined yet, search their email and reserve a role — they get it when they first sign in. Community leads are set on each regional community, under “Community leads”.
      </p>
      <form onSubmit={search} className="ccm-members__search" role="search">
        <label htmlFor="member-q" className="ccm-members__label">Find a member</label>
        <input id="member-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, username or email address" autoComplete="off" />
        <button className="ccm-button" type="submit" disabled={pending || q.trim().length < 2}>Search</button>
      </form>
      {error && <p className="ccm-members__error" role="alert">{error}</p>}

      <div className="ccm-card">
        <h2>{heading}</h2>
        {(rows.length > 0 || unknownEmail) && (
          <ul className="ccm-members__list">
            {rows.map((m) => (
              <MemberItem key={m.id} member={m} onChanged={(role) => setRows((all) => all.map((r) => (r.id === m.id ? { ...r, role } : r)))} />
            ))}
            {unknownEmail && (
              <ReserveItem
                key={unknownEmail}
                email={unknownEmail}
                current={reservations.find((r) => r.email === unknownEmail)?.role ?? null}
                onReserved={loadReservations}
              />
            )}
          </ul>
        )}
      </div>

      {reservations.length > 0 && (
        <div className="ccm-card">
          <h2>Waiting for their first sign-in</h2>
          <p style={{ margin: "0.4rem 0 0", color: "var(--theme-elevation-600)" }}>
            Seen by admins only. Each address disappears from here once that person joins.
          </p>
          <ul className="ccm-members__list">
            {reservations.map((r) => (
              <WaitingItem key={r.email} reservation={r} onRemoved={() => setReservations((all) => all.filter((x) => x.email !== r.email))} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** The role picker every row uses — the admin's own dropdown. */
function RolePicker({ label, exclude, value, onChange }: { label: string; exclude?: string | null; value: MemberRole | ""; onChange: (role: MemberRole | "") => void }) {
  return (
    <div className="ccm-members__change">
      <ReactSelect
        aria-label={label}
        isClearable={false}
        isSearchable={false}
        placeholder="Change role…"
        value={value ? { label: ROLE_LABEL[value], value } : undefined}
        options={MEMBER_ROLES.filter((r) => r !== exclude).map((r) => ({ label: ROLE_LABEL[r], value: r }))}
        onChange={(opt) => {
          const picked = Array.isArray(opt) ? opt[0] : opt;
          onChange((picked?.value as MemberRole) ?? "");
        }}
      />
    </div>
  );
}

function Confirm({ text, onConfirm, onCancel, pending }: { text: React.ReactNode; onConfirm: () => void; onCancel: () => void; pending: boolean }) {
  return (
    <div className="ccm-members__confirm" role="group" aria-label="Confirm the change">
      <p>{text}</p>
      <button className="ccm-button" type="button" onClick={onConfirm} disabled={pending}>Confirm</button>
      <button className="ccm-button ccm-button--secondary" type="button" onClick={onCancel}>Cancel</button>
    </div>
  );
}

function Feedback({ message }: { message: Message }) {
  if (!message) return null;
  return <p className={message.ok ? "ccm-members__done" : "ccm-members__error"} role="status">{message.text}</p>;
}

function MemberItem({ member, onChanged }: { member: MemberRow; onChanged: (role: MemberRole) => void }) {
  const [choice, setChoice] = useState<MemberRole | "">("");
  const [message, setMessage] = useState<Message>(null);
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
      <RolePicker label={`Change role for ${member.name}`} exclude={member.role} value={choice} onChange={(r) => { setChoice(r); setMessage(null); }} />
      {choice && (
        <Confirm
          pending={pending}
          onConfirm={confirm}
          onCancel={() => setChoice("")}
          text={<>Make <strong>{member.name}</strong> {ROLE_LABEL[choice].toLowerCase()}? {ROLE_HELP[choice]}</>}
        />
      )}
      <Feedback message={message} />
    </li>
  );
}

/** An address nobody on the hub uses yet: reserve a role for it. */
function ReserveItem({ email, current, onReserved }: { email: string; current: string | null; onReserved: () => Promise<void> }) {
  const [choice, setChoice] = useState<MemberRole | "">("");
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();
  const confirm = () =>
    startTransition(async () => {
      if (!choice) return;
      const res = await reserveRole(email, choice);
      if (!res.ok) setMessage({ ok: false, text: res.error });
      else {
        setMessage({
          ok: true,
          text: res.applied
            ? `That address already belongs to a member — they're now ${ROLE_LABEL[choice].toLowerCase()}.`
            : `Reserved: whoever first signs in with ${email} becomes ${ROLE_LABEL[choice].toLowerCase()}.`,
        });
        await onReserved();
      }
      setChoice("");
    });

  return (
    <li className="ccm-members__item">
      <div className="ccm-members__who">
        <span aria-hidden className="ccm-members__avatar">@</span>
        <div>
          <strong className="ccm-members__email">{email}</strong>
          <span className="ccm-members__username">Hasn&apos;t joined yet</span>
        </div>
      </div>
      <span className="ccm-chip">{current ? `Reserved: ${ROLE_LABEL[current] ?? current}` : "No role reserved"}</span>
      <RolePicker label={`Reserve a role for ${email}`} exclude={current} value={choice} onChange={(r) => { setChoice(r); setMessage(null); }} />
      {choice && (
        <Confirm
          pending={pending}
          onConfirm={confirm}
          onCancel={() => setChoice("")}
          text={<>Reserve <strong>{ROLE_LABEL[choice].toLowerCase()}</strong> for {email}? {ROLE_HELP[choice]}</>}
        />
      )}
      <Feedback message={message} />
    </li>
  );
}

function WaitingItem({ reservation, onRemoved }: { reservation: Reservation; onRemoved: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();
  const remove = () =>
    startTransition(async () => {
      const res = await cancelReservation(reservation.email);
      if (res.ok) onRemoved();
      else setMessage({ ok: false, text: res.error });
    });

  return (
    <li className="ccm-members__item">
      <strong className="ccm-members__email">{reservation.email}</strong>
      <span className="ccm-chip">{ROLE_LABEL[reservation.role] ?? reservation.role}</span>
      <button className="ccm-button ccm-button--secondary" type="button" onClick={() => setConfirming(true)} disabled={pending}>
        Remove
      </button>
      {confirming && (
        <Confirm
          pending={pending}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
          text={<>Remove the reserved role for {reservation.email}? If they sign up, they&apos;ll join as a member.</>}
        />
      )}
      <Feedback message={message} />
    </li>
  );
}
