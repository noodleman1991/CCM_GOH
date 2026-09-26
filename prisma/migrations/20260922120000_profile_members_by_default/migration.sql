-- Profiles are members-only unless the owner chooses otherwise (2026-09-22).
--
-- The column defaulted to PUBLIC since launch, so the store cannot tell a
-- deliberate "public" from an untouched default. Every PUBLIC row is moved to
-- MEMBERS; an owner who wants a public profile switches it back in the
-- privacy tab (the profile header now says which it is). PRIVATE rows are
-- untouched. Signed-out visitors can no longer open or search any profile
-- whose owner has not explicitly opted in.
ALTER TABLE "User" ALTER COLUMN "profileVisibility" SET DEFAULT 'MEMBERS';
UPDATE "User" SET "profileVisibility" = 'MEMBERS' WHERE "profileVisibility" = 'PUBLIC';
