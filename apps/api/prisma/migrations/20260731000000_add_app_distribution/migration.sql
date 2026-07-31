-- CreateTable
CREATE TABLE "distributed_apps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributed_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_releases" (
    "id" TEXT NOT NULL,
    "versionCode" INTEGER NOT NULL,
    "versionName" TEXT NOT NULL,
    "apkUrl" TEXT NOT NULL,
    "releaseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appId" TEXT NOT NULL,

    CONSTRAINT "app_releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "distributed_apps_slug_key" ON "distributed_apps"("slug");

-- CreateIndex
CREATE INDEX "distributed_apps_createdAt_idx" ON "distributed_apps"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_releases_appId_versionCode_key" ON "app_releases"("appId", "versionCode");

-- AddForeignKey
ALTER TABLE "app_releases" ADD CONSTRAINT "app_releases_appId_fkey" FOREIGN KEY ("appId") REFERENCES "distributed_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
