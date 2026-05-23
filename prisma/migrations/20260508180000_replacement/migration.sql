-- CreateTable: Replacement (replaces ReplacementFree Gift + Replacement V2 Cup tabs)
CREATE TABLE "Replacement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ticketId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "country" TEXT,
    "warehouse" TEXT,
    "type" TEXT NOT NULL DEFAULT 'replacement',
    "reason" TEXT NOT NULL,
    "originalOrder" TEXT,
    "itemsToShip" TEXT[],
    "details" TEXT,
    "courier" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "solution" TEXT,
    "agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Replacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Replacement_orderId_idx" ON "Replacement"("orderId");
CREATE INDEX "Replacement_reason_idx" ON "Replacement"("reason");
CREATE INDEX "Replacement_status_idx" ON "Replacement"("status");
CREATE INDEX "Replacement_warehouse_idx" ON "Replacement"("warehouse");
CREATE INDEX "Replacement_createdAt_idx" ON "Replacement"("createdAt");
