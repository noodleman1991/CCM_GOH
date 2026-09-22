-- A staff role reserved for an email before that person's first sign-in.
CREATE TABLE "StaffRoleInvite" (
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "StaffRoleInvite_pkey" PRIMARY KEY ("email")
);
