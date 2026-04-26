-- Drop existing tables (if any)
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "scrape_tasks" CASCADE;
DROP TABLE IF EXISTS "saved_intelligences" CASCADE;
DROP TABLE IF EXISTS "saved_cases" CASCADE;
DROP TABLE IF EXISTS "saved_titles" CASCADE;
DROP TABLE IF EXISTS "insurance_products" CASCADE;
DROP TABLE IF EXISTS "viral_cases" CASCADE;
DROP TABLE IF EXISTS "intelligence" CASCADE;
DROP TABLE IF EXISTS "team_invites" CASCADE;
DROP TABLE IF EXISTS "teams" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "teamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "team_invites" (
    "id" SERIAL PRIMARY KEY,
    "teamId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "intelligence" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "hotScore" INTEGER NOT NULL DEFAULT 0,
    "publishTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedProductId" INTEGER,
    "isProductNews" BOOLEAN NOT NULL DEFAULT false,
    "productNewsType" TEXT
);

-- CreateTable
CREATE TABLE "viral_cases" (
    "id" SERIAL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "author" TEXT,
    "authorUrl" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "favoritesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "coverImage" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "insuranceType" TEXT,
    "viralScore" DOUBLE PRECISION,
    "analysis" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedProductId" INTEGER
);

-- CreateTable
CREATE TABLE "insurance_products" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "insuranceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priceAdult30" DECIMAL(10,2),
    "priceChild0" DECIMAL(10,2),
    "launchDate" TIMESTAMP(3),
    "offlineDate" TIMESTAMP(3),
    "estimatedOffline" TIMESTAMP(3),
    "highlightsSevere" TEXT NOT NULL DEFAULT '[]',
    "highlightsMild" TEXT NOT NULL DEFAULT '[]',
    "highlightsWaiver" TEXT NOT NULL DEFAULT '[]',
    "highlightsSpecial" TEXT NOT NULL DEFAULT '[]',
    "highlightsValue" TEXT NOT NULL DEFAULT '[]',
    "advantagesPrice" TEXT NOT NULL DEFAULT '[]',
    "advantagesCoverage" TEXT NOT NULL DEFAULT '[]',
    "advantagesUW" TEXT NOT NULL DEFAULT '[]',
    "advantagesService" TEXT NOT NULL DEFAULT '[]',
    "competitors" TEXT NOT NULL DEFAULT '[]',
    "competitorComparison" TEXT,
    "drawbacks" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "saved_titles" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "generatedTitles" TEXT NOT NULL,
    "finalTitle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "teamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "saved_cases" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "caseId" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "saved_intelligences" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "intelligenceId" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "scrape_tasks" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" INTEGER,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "teams_code_key" ON "teams"("code");
CREATE UNIQUE INDEX "team_invites_token_key" ON "team_invites"("token");
CREATE INDEX "intelligence_category_idx" ON "intelligence"("category");
CREATE INDEX "intelligence_publishTime_idx" ON "intelligence"("publishTime");
CREATE INDEX "intelligence_hotScore_idx" ON "intelligence"("hotScore");
CREATE INDEX "intelligence_linkedProductId_idx" ON "intelligence"("linkedProductId");
CREATE INDEX "viral_cases_platform_idx" ON "viral_cases"("platform");
CREATE INDEX "viral_cases_viralScore_idx" ON "viral_cases"("viralScore");
CREATE INDEX "viral_cases_publishedAt_idx" ON "viral_cases"("publishedAt");
CREATE INDEX "viral_cases_linkedProductId_idx" ON "viral_cases"("linkedProductId");
CREATE INDEX "insurance_products_status_idx" ON "insurance_products"("status");
CREATE INDEX "insurance_products_insuranceType_idx" ON "insurance_products"("insuranceType");
CREATE INDEX "insurance_products_company_idx" ON "insurance_products"("company");
CREATE INDEX "insurance_products_launchDate_idx" ON "insurance_products"("launchDate");
CREATE UNIQUE INDEX "saved_cases_userId_caseId_key" ON "saved_cases"("userId", "caseId");
CREATE UNIQUE INDEX "saved_intelligences_userId_intelligenceId_key" ON "saved_intelligences"("userId", "intelligenceId");
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "team_invites" ADD FOREIGN KEY "TeamInvite_teamId_fkey" REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_invites" ADD FOREIGN KEY "TeamInvite_createdBy_fkey" REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "intelligence" ADD FOREIGN KEY "Intelligence_linkedProductId_fkey" REFERENCES "insurance_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "viral_cases" ADD FOREIGN KEY "ViralCase_linkedProductId_fkey" REFERENCES "insurance_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "saved_titles" ADD FOREIGN KEY "SavedTitle_userId_fkey" REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_titles" ADD FOREIGN KEY "SavedTitle_teamId_fkey" REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "saved_cases" ADD FOREIGN KEY "SavedCase_userId_fkey" REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_cases" ADD FOREIGN KEY "SavedCase_caseId_fkey" REFERENCES "viral_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_intelligences" ADD FOREIGN KEY "SavedIntelligence_userId_fkey" REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_intelligences" ADD FOREIGN KEY "SavedIntelligence_intelligenceId_fkey" REFERENCES "intelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD FOREIGN KEY "ActivityLog_userId_fkey" REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
