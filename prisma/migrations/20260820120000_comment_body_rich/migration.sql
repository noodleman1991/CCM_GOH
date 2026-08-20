-- Rich comment bodies: sanitized Portable Text alongside the plain-text
-- source of truth (moderation/@mentions/snippets keep reading "body").
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "bodyRich" JSONB;
