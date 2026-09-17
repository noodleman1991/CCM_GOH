import type { Agenda, AgendaFile } from "@/types/agenda";
import type { Report, ReportFile } from "@/types/report";
import * as agendaUtils from "@/lib/agenda-utils";
import * as reportUtils from "@/lib/report-utils";

/**
 * Which tracker a download button talks to.
 *
 * `hooks/use-download-tracking.ts` used to be hard-wired to `report-utils`, so
 * every agenda button posted an agenda id to `/api/reports/download/track` and
 * no agenda counter ever moved (audit finding M4). The hook now asks for an
 * adapter by kind; `agenda` is the default because it is the only live one.
 *
 * `report` survives only for `grid-report-download.tsx`, which Slice 3a deletes
 * together with `report-utils`; remove that arm with it.
 */
export type DownloadKind = "agenda" | "report";

export type DownloadableFile = AgendaFile | ReportFile;
export type DownloadableContent = Agenda | Report;

export interface DownloadAdapter {
  /** Structural check of the document a click arrived with (id, slug, a usable file). */
  validate: (content: unknown) => boolean;
  /** Fires the tracker (fire-and-forget) and starts the browser download. */
  downloadFile: (file: DownloadableFile, contentId: string, userId?: string) => Promise<void>;
}

const ADAPTERS: Record<DownloadKind, DownloadAdapter> = {
  agenda: {
    validate: agendaUtils.validateAgenda,
    downloadFile: agendaUtils.downloadFile as DownloadAdapter["downloadFile"],
  },
  report: {
    validate: reportUtils.validateReport,
    downloadFile: reportUtils.downloadFile as DownloadAdapter["downloadFile"],
  },
};

export function getDownloadAdapter(kind: DownloadKind = "agenda"): DownloadAdapter {
  return ADAPTERS[kind];
}

/**
 * The client-side half of the server's "does this language exist on the
 * document" check: a button can only ask to track a file the document it
 * rendered from actually carries.
 */
export function fileBelongsToContent(file: DownloadableFile, content: DownloadableContent): boolean {
  const files = (content.files ?? []) as DownloadableFile[];
  return files.some((candidate) => candidate.language === file.language);
}
