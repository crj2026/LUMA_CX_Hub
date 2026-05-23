-- CreateTable: Cancellation (replaces Cancellations sheet)
CREATE TABLE "Cancellation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ticketId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "country" TEXT,
    "cancellationType" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'subscription',
    "notes" TEXT,
    "agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cancellation_orderId_idx" ON "Cancellation"("orderId");
CREATE INDEX "Cancellation_cancellationType_idx" ON "Cancellation"("cancellationType");
CREATE INDEX "Cancellation_scope_idx" ON "Cancellation"("scope");
CREATE INDEX "Cancellation_createdAt_idx" ON "Cancellation"("createdAt");

-- CreateTable: Feedback (replaces Feedback sheet)
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "ticketId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "country" TEXT,
    "theme" TEXT NOT NULL,
    "relatedTeam" TEXT,
    "details" TEXT NOT NULL,
    "suggestion" TEXT,
    "agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_theme_idx" ON "Feedback"("theme");
CREATE INDEX "Feedback_relatedTeam_idx" ON "Feedback"("relatedTeam");
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");
