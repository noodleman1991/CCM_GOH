/**
 * How a profile save reconciles the person's recent-work rows.
 *
 * The service used `recentWork: { deleteMany: {}, create: [...] }` on every
 * save: new rows, new ids, and the owner's `pinned`/`hidden` curation reset
 * whenever any other field was saved. The form now sends each row's id back;
 * rows that come back with an id the person owns are updated in place, rows
 * without one are created, and rows the person removed are deleted — and
 * only those. `pinned`/`hidden` are never part of this write.
 */
export interface RecentWorkExisting {
  id: string;
  pinned: boolean;
  hidden: boolean;
}

export interface RecentWorkIncoming {
  id?: string;
  title: string;
  description: string;
  link?: string | null;
  startDate: string;
  endDate?: string | null;
  isOngoing?: boolean;
  role?: string | null;
  collaborators?: string | null;
  outcome?: string | null;
  imageUrl?: string | null;
}

export interface RecentWorkPlan {
  updates: (RecentWorkIncoming & { id: string })[];
  creates: RecentWorkIncoming[];
  deleteIds: string[];
}

export function planRecentWorkSync(existing: RecentWorkExisting[], incoming: RecentWorkIncoming[]): RecentWorkPlan {
  const owned = new Set(existing.map((row) => row.id));
  const updates: (RecentWorkIncoming & { id: string })[] = [];
  const creates: RecentWorkIncoming[] = [];
  const kept = new Set<string>();
  for (const item of incoming) {
    // An id the person does not own is treated as a new row: never an update
    // of somebody else's, and never a reason to delete anything of theirs.
    if (item.id && owned.has(item.id) && !kept.has(item.id)) {
      kept.add(item.id);
      updates.push({ ...item, id: item.id });
    } else {
      const { id: _ignored, ...rest } = item;
      void _ignored;
      creates.push(rest);
    }
  }
  const deleteIds = existing.map((row) => row.id).filter((id) => !kept.has(id));
  return { updates, creates, deleteIds };
}

function rowData(item: RecentWorkIncoming) {
  return {
    title: item.title,
    description: item.description,
    link: item.link || null,
    startDate: new Date(item.startDate),
    endDate: item.endDate ? new Date(item.endDate) : null,
    isOngoing: item.isOngoing || false,
    role: item.role || null,
    collaborators: item.collaborators || null,
    outcome: item.outcome || null,
    imageUrl: item.imageUrl || null,
  };
}

/** The Prisma nested write for `user.update({ data: { recentWork } })`. */
export function recentWorkNestedWrite(plan: RecentWorkPlan) {
  return {
    ...(plan.deleteIds.length > 0 ? { deleteMany: { id: { in: plan.deleteIds } } } : {}),
    update: plan.updates.map((item) => ({ where: { id: item.id }, data: rowData(item) })),
    create: plan.creates.map(rowData),
  };
}
