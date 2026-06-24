-- Allow comments on researchOutput (additive enum value; Postgres 10+).
ALTER TYPE "CommentTargetType" ADD VALUE IF NOT EXISTS 'researchOutput';
