-- CreateEnum
CREATE TYPE "Country" AS ENUM ('AL', 'GB', 'IT', 'DE', 'GR');

-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "country" "Country" NOT NULL DEFAULT 'AL';
