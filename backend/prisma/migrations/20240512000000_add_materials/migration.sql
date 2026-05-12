-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(191) NOT NULL,
    "title" VARCHAR(191) NOT NULL,
    "content" TEXT NOT NULL,
    "tags" VARCHAR(191) NOT NULL DEFAULT '[]',
    "source" VARCHAR(191),
    "isBookmark" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "materials_category_idx" ON "materials"("category");
