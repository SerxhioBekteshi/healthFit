-- AlterTable
ALTER TABLE "Gym" ADD COLUMN "joinCode" TEXT;

-- Existing gyms get a random code so their join link works right away.
UPDATE "Gym" SET "joinCode" = gen_random_uuid()::text;

ALTER TABLE "Gym" ALTER COLUMN "joinCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "gender" "Gender",
ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Gym_joinCode_key" ON "Gym"("joinCode");
