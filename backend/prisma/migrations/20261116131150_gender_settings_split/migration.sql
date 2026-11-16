/*
  Warnings:

  - You are about to drop the column `sameGenderConfig` on the `Gym` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gym" DROP COLUMN "sameGenderConfig",
ADD COLUMN     "sameLockersForGenders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "samePricesForGenders" BOOLEAN NOT NULL DEFAULT false;
