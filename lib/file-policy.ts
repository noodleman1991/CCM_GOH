/**
 * Single source of truth for upload file policy — echoes the env vars the
 * case-study route already consumes (MAX_FILE_SIZE, ALLOWED_FILE_TYPES) so
 * collaboration files and case-study files share one policy.
 */

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 50_000_000);

const ALLOWED_EXTENSIONS = (process.env.ALLOWED_FILE_TYPES || "pdf,doc,docx,xls,xlsx,ppt,pptx")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

export function maxFileSize(): number {
  return MAX_FILE_SIZE;
}

export function isAllowedUpload(contentType: string, size: number): { ok: true } | { ok: false; error: string } {
  if (size <= 0) return { ok: false, error: "Empty file." };
  if (size > MAX_FILE_SIZE) {
    return { ok: false, error: `File exceeds the ${Math.round(MAX_FILE_SIZE / 1_000_000)}MB limit.` };
  }
  const ext = EXT_BY_MIME[contentType];
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: "File type not allowed." };
  }
  return { ok: true };
}
