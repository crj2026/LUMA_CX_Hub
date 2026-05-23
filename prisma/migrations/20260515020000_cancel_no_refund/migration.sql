-- CreateTable: Cancel — No Refund log. Tracks orders we cancelled
-- where the customer didn't get a cash refund (replacement order was
-- shipped instead, store credit issued, etc.). All four content fields
-- are required at the API/UI layer; the DB enforces non-null too.
CREATE TABLE "CancelNoRefund" (
    "id"                 TEXT NOT NULL,
    "cancelledOrderId"   TEXT NOT NULL,
    "ticketId"           TEXT NOT NULL,
    "replacementOrderId" TEXT NOT NULL,
    "reasonNotRefunded"  TEXT NOT NULL,
    "notes"              TEXT,
    "agent"              TEXT,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancelNoRefund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CancelNoRefund_cancelledOrderId_idx"   ON "CancelNoRefund"("cancelledOrderId");
CREATE INDEX "CancelNoRefund_ticketId_idx"           ON "CancelNoRefund"("ticketId");
CREATE INDEX "CancelNoRefund_replacementOrderId_idx" ON "CancelNoRefund"("replacementOrderId");
CREATE INDEX "CancelNoRefund_createdAt_idx"          ON "CancelNoRefund"("createdAt");
