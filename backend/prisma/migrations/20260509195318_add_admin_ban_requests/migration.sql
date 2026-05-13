-- CreateEnum
CREATE TYPE "BanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AdminBanRequest" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "BanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "organizationId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "decidedById" INTEGER,

    CONSTRAINT "AdminBanRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminBanRequest_organizationId_status_idx" ON "AdminBanRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AdminBanRequest_targetUserId_status_idx" ON "AdminBanRequest"("targetUserId", "status");

-- AddForeignKey
ALTER TABLE "AdminBanRequest" ADD CONSTRAINT "AdminBanRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminBanRequest" ADD CONSTRAINT "AdminBanRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminBanRequest" ADD CONSTRAINT "AdminBanRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminBanRequest" ADD CONSTRAINT "AdminBanRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
