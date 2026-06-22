-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('NEW', 'SAVED', 'APPLIED', 'REJECTED', 'IGNORED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "careersUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "rawDescription" TEXT,
    "sourceUrl" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT,
    "experienceMin" INTEGER,
    "experienceMax" INTEGER,
    "skills" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'NEW',
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
