-- CreateTable
CREATE TABLE "GymPhoto" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListNote" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PriceListNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymPhoto_gymId_idx" ON "GymPhoto"("gymId");

-- CreateIndex
CREATE INDEX "PriceListNote_gymId_position_idx" ON "PriceListNote"("gymId", "position");

-- AddForeignKey
ALTER TABLE "GymPhoto" ADD CONSTRAINT "GymPhoto_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListNote" ADD CONSTRAINT "PriceListNote_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
