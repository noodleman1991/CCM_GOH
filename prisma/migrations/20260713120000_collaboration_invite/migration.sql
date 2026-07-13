-- Outbound workspace invites (inverse of JoinRequest).
CREATE TABLE "CollaborationInvite" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CollaborationInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollaborationInvite_collaborationId_inviteeId_key" ON "CollaborationInvite"("collaborationId", "inviteeId");
CREATE INDEX "CollaborationInvite_inviteeId_status_idx" ON "CollaborationInvite"("inviteeId", "status");

ALTER TABLE "CollaborationInvite" ADD CONSTRAINT "CollaborationInvite_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollaborationInvite" ADD CONSTRAINT "CollaborationInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
