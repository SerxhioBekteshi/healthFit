-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('supplement', 'snack', 'drink', 'merchandise', 'shake', 'smoothie');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" "ProductCategory" NOT NULL DEFAULT 'supplement',
ADD COLUMN     "imageUrl" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "imageUrl" TEXT NOT NULL DEFAULT '';

-- Existing shakes and smoothies are made to order, so they no longer track stock.
UPDATE "Product" SET "category" = 'shake', "stock" = 0 WHERE lower("name") LIKE '%shake%';
UPDATE "Product" SET "category" = 'smoothie', "stock" = 0 WHERE lower("name") LIKE '%smoothie%';
