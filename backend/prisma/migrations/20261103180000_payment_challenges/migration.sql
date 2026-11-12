-- CreateEnum
CREATE TYPE "PaymentChallengeKind" AS ENUM ('deposit', 'membership');

-- CreateTable
CREATE TABLE "PaymentChallenge" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "PaymentChallengeKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentChallenge_gymId_clientId_idx" ON "PaymentChallenge"("gymId", "clientId");

-- AddForeignKey
ALTER TABLE "PaymentChallenge" ADD CONSTRAINT "PaymentChallenge_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
