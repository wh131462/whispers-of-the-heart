/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `alt` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `site_config` table. All the data in the column will be lost.
  - You are about to drop the column `ossConfig` on the `site_config` table. All the data in the column will be lost.
  - You are about to drop the column `seoSettings` on the `site_config` table. All the data in the column will be lost.
  - You are about to drop the column `siteIcon` on the `site_config` table. All the data in the column will be lost.
  - You are about to drop the column `siteLogo` on the `site_config` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `folders` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `uploaderId` to the `media` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."files" DROP CONSTRAINT "files_folderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."files" DROP CONSTRAINT "files_uploaderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."folders" DROP CONSTRAINT "folders_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."folders" DROP CONSTRAINT "folders_parentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."posts" DROP CONSTRAINT "posts_categoryId_fkey";

-- DropIndex
DROP INDEX "public"."comments_deletedAt_idx";

-- DropIndex
DROP INDEX "public"."posts_categoryId_idx";

-- DropIndex
DROP INDEX "public"."posts_deletedAt_idx";

-- DropIndex
DROP INDEX "public"."posts_status_idx";

-- DropIndex
DROP INDEX "public"."tags_deletedAt_idx";

-- DropIndex
DROP INDEX "public"."users_deletedAt_idx";

-- AlterTable
ALTER TABLE "public"."comments" DROP COLUMN "deletedAt",
DROP COLUMN "likes";

-- AlterTable
ALTER TABLE "public"."media" DROP COLUMN "alt",
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "uploaderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."posts" DROP COLUMN "categoryId",
DROP COLUMN "comments",
DROP COLUMN "deletedAt",
DROP COLUMN "likes",
DROP COLUMN "status",
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."site_config" DROP COLUMN "contactEmail",
DROP COLUMN "ossConfig",
DROP COLUMN "seoSettings",
DROP COLUMN "siteIcon",
DROP COLUMN "siteLogo",
ADD COLUMN     "avatar" TEXT,
ALTER COLUMN "id" SET DEFAULT 'default',
ALTER COLUMN "siteName" SET DEFAULT 'Whispers of the Heart';

-- AlterTable
ALTER TABLE "public"."tags" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "deletedAt",
DROP COLUMN "isActive",
DROP COLUMN "role",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme" TEXT DEFAULT 'system';

-- DropTable
DROP TABLE "public"."categories";

-- DropTable
DROP TABLE "public"."files";

-- DropTable
DROP TABLE "public"."folders";

-- DropEnum
DROP TYPE "public"."PostStatus";

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "public"."media_usages" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_usages_entityType_entityId_idx" ON "public"."media_usages"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "media_usages_mediaId_idx" ON "public"."media_usages"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "media_usages_mediaId_entityType_entityId_fieldName_key" ON "public"."media_usages"("mediaId", "entityType", "entityId", "fieldName");

-- CreateIndex
CREATE INDEX "media_mimeType_idx" ON "public"."media"("mimeType");

-- CreateIndex
CREATE INDEX "media_uploaderId_idx" ON "public"."media"("uploaderId");

-- CreateIndex
CREATE INDEX "media_createdAt_idx" ON "public"."media"("createdAt");

-- CreateIndex
CREATE INDEX "media_url_idx" ON "public"."media"("url");

-- CreateIndex
CREATE INDEX "posts_published_idx" ON "public"."posts"("published");

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_usages" ADD CONSTRAINT "media_usages_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
