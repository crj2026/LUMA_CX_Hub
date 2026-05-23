-- CreateTable: Macro
CREATE TABLE "Macro" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tag" TEXT,
    "intent" TEXT,
    "question" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "whenToUse" TEXT,
    "notes" TEXT,
    "escalationRule" TEXT,
    "sourceDoc" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Macro_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Article
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "tags" TEXT[],
    "ownerId" TEXT,
    "ownerName" TEXT,
    "sourceDoc" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Decision
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "customerBehaviour" TEXT[],
    "escalate" TEXT,
    "replacement" TEXT,
    "refund" TEXT,
    "saveAttempt" BOOLEAN NOT NULL DEFAULT false,
    "recommendedPlay" TEXT,
    "cancelImmediately" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Policy
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "scope" TEXT,
    "procedure" TEXT,
    "nonNegotiableRules" TEXT[],
    "relatedArticleIds" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Macro_slug_key" ON "Macro"("slug");
CREATE INDEX "Macro_category_idx" ON "Macro"("category");
CREATE INDEX "Macro_tag_idx" ON "Macro"("tag");
CREATE INDEX "Macro_active_idx" ON "Macro"("active");

CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_category_idx" ON "Article"("category");
CREATE INDEX "Article_active_idx" ON "Article"("active");

CREATE UNIQUE INDEX "Decision_segment_tag_key" ON "Decision"("segment", "tag");
CREATE INDEX "Decision_segment_idx" ON "Decision"("segment");

CREATE UNIQUE INDEX "Policy_name_key" ON "Policy"("name");
CREATE INDEX "Policy_active_idx" ON "Policy"("active");
