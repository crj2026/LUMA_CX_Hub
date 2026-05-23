-- CreateTable: free-text notes attached to a specific report window.
-- One note per (weekFrom, weekTo) pair via the unique index — UI
-- uses an upsert. Body field carries arbitrary text including newlines.
CREATE TABLE "ReportNote" (
    "id"           TEXT NOT NULL,
    "weekFrom"     TEXT NOT NULL,
    "weekTo"       TEXT NOT NULL,
    "body"         TEXT NOT NULL,
    "editedById"   TEXT,
    "editedByName" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportNote_pkey" PRIMARY KEY ("id")
);

-- One note per window
CREATE UNIQUE INDEX "ReportNote_weekFrom_weekTo_key" ON "ReportNote"("weekFrom", "weekTo");
