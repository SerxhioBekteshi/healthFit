-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "GymLocation" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymLocation_gymId_idx" ON "GymLocation"("gymId");

-- AddForeignKey
ALTER TABLE "GymLocation" ADD CONSTRAINT "GymLocation_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "GymLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every existing gym gets a main location and its check-ins point to it.
INSERT INTO "GymLocation" ("id", "gymId", "name", "address", "phone", "updatedAt")
SELECT 'loc_' || "id", "id", 'Main', COALESCE(NULLIF("address", ''), "location"), "contactPhone", CURRENT_TIMESTAMP
FROM "Gym";

UPDATE "Attendance" SET "locationId" = 'loc_' || "gymId";
