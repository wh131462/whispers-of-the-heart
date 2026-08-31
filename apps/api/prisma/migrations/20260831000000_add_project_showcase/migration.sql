-- CreateEnum
CREATE TYPE "ShowcaseProjectType" AS ENUM ('OPEN_SOURCE', 'APP', 'WEBSITE', 'SITE_TOOL');

-- CreateEnum
CREATE TYPE "ShowcaseProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "showcase_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ShowcaseProjectType" NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "coverImage" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "platforms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "repositoryUrl" TEXT,
    "websiteUrl" TEXT,
    "downloadUrl" TEXT,
    "status" "ShowcaseProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "distributedAppId" TEXT,

    CONSTRAINT "showcase_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "showcase_projects_slug_key" ON "showcase_projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "showcase_projects_distributedAppId_key" ON "showcase_projects"("distributedAppId");

-- CreateIndex
CREATE INDEX "showcase_projects_status_featured_sortOrder_idx" ON "showcase_projects"("status", "featured", "sortOrder");

-- CreateIndex
CREATE INDEX "showcase_projects_type_status_idx" ON "showcase_projects"("type", "status");

-- AddForeignKey
ALTER TABLE "showcase_projects" ADD CONSTRAINT "showcase_projects_distributedAppId_fkey" FOREIGN KEY ("distributedAppId") REFERENCES "distributed_apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
