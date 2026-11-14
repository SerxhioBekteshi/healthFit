-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "lockerId" TEXT;

-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "cardsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockersEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockersUseCard" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MemberCard" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "MemberCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locker" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Locker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberCard_gymId_clientId_idx" ON "MemberCard"("gymId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCard_gymId_number_key" ON "MemberCard"("gymId", "number");

-- CreateIndex
CREATE INDEX "Locker_gymId_idx" ON "Locker"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "Locker_locationId_number_key" ON "Locker"("locationId", "number");

-- AddForeignKey
ALTER TABLE "MemberCard" ADD CONSTRAINT "MemberCard_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCard" ADD CONSTRAINT "MemberCard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locker" ADD CONSTRAINT "Locker_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locker" ADD CONSTRAINT "Locker_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "GymLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_lockerId_fkey" FOREIGN KEY ("lockerId") REFERENCES "Locker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
