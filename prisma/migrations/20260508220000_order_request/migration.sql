-- CreateTable: OrderRequest
CREATE TABLE "OrderRequest" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "requestedBy" TEXT,
    "agent" TEXT,
    "ticketId" TEXT,
    "orderRef" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "d365SalesOrderNumber" TEXT,
    "d365SKUs" TEXT[],
    "dispatchWarehouse" TEXT,
    "shipCarrier" TEXT,
    "awb" TEXT,
    "shipDate" TIMESTAMP(3),
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "recipientName" TEXT NOT NULL,
    "shipToAddress1" TEXT,
    "shipToAddress2" TEXT,
    "shipToCity" TEXT,
    "shipToState" TEXT,
    "shipToZip" TEXT,
    "shipToCountry" TEXT,
    "shipToPhone" TEXT,
    "shipToEmail" TEXT,
    "itemsDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderRequest_region_idx" ON "OrderRequest"("region");
CREATE INDEX "OrderRequest_sent_idx" ON "OrderRequest"("sent");
CREATE INDEX "OrderRequest_status_idx" ON "OrderRequest"("status");
CREATE INDEX "OrderRequest_orderRef_idx" ON "OrderRequest"("orderRef");
CREATE INDEX "OrderRequest_createdAt_idx" ON "OrderRequest"("createdAt");
