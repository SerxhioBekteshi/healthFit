-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "acceptBalance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptCard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptCash" BOOLEAN NOT NULL DEFAULT true;
