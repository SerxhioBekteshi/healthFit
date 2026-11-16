/*
  Warnings:

  - You are about to drop the column `lockersEnabled` on the `Gym` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[locationId,gender,number]` on the table `Locker` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Locker_locationId_number_key";

-- AlterTable
ALTER TABLE "Gym" DROP COLUMN "lockersEnabled",
ADD COLUMN     "sameGenderConfig" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Locker" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'male';

-- CreateIndex
CREATE UNIQUE INDEX "Locker_locationId_gender_number_key" ON "Locker"("locationId", "gender", "number");
