-- CreateTable
CREATE TABLE "PriceOffer" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceOfferItem" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PriceOfferItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceOffer_gymId_startDate_endDate_idx" ON "PriceOffer"("gymId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "PriceOfferItem_gymId_planId_idx" ON "PriceOfferItem"("gymId", "planId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceOfferItem_offerId_planId_key" ON "PriceOfferItem"("offerId", "planId");

-- AddForeignKey
ALTER TABLE "PriceOffer" ADD CONSTRAINT "PriceOffer_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceOfferItem" ADD CONSTRAINT "PriceOfferItem_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceOfferItem" ADD CONSTRAINT "PriceOfferItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "PriceOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceOfferItem" ADD CONSTRAINT "PriceOfferItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
