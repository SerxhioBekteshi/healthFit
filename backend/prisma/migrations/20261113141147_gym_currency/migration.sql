-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ALL', 'EUR', 'GBP');

-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'ALL';

-- Backfill: the currency of a gym follows its country (Albania lek, United Kingdom pound, the rest euro).
UPDATE "Gym" SET "currency" = CASE "country"::text
  WHEN 'AL' THEN 'ALL'::"Currency"
  WHEN 'GB' THEN 'GBP'::"Currency"
  ELSE 'EUR'::"Currency"
END;
