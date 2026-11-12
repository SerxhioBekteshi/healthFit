-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'male',
ADD COLUMN     "weeklyVisits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "weeklyVisits" INTEGER NOT NULL DEFAULT 0;
