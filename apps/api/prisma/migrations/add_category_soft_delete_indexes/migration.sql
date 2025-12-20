-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "posts" DROP COLUMN "category";
ALTER TABLE "tags" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "comments" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "folders" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "files" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_slug_idx" ON "categories"("slug");
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_username_idx" ON "users"("username");
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "posts_slug_idx" ON "posts"("slug");
CREATE INDEX "posts_status_idx" ON "posts"("status");
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");
CREATE INDEX "posts_categoryId_idx" ON "posts"("categoryId");
CREATE INDEX "posts_publishedAt_idx" ON "posts"("publishedAt");
CREATE INDEX "posts_deletedAt_idx" ON "posts"("deletedAt");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "tags"("slug");
CREATE INDEX "tags_deletedAt_idx" ON "tags"("deletedAt");

-- CreateIndex
CREATE INDEX "post_tags_postId_idx" ON "post_tags"("postId");
CREATE INDEX "post_tags_tagId_idx" ON "post_tags"("tagId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");
CREATE INDEX "comments_isApproved_idx" ON "comments"("isApproved");
CREATE INDEX "comments_deletedAt_idx" ON "comments"("deletedAt");

-- CreateIndex
CREATE INDEX "likes_postId_idx" ON "likes"("postId");
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");
CREATE INDEX "comment_likes_userId_idx" ON "comment_likes"("userId");

-- CreateIndex
CREATE INDEX "favorites_postId_idx" ON "favorites"("postId");
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "folders_path_idx" ON "folders"("path");
CREATE INDEX "folders_ownerId_idx" ON "folders"("ownerId");
CREATE INDEX "folders_parentId_idx" ON "folders"("parentId");
CREATE INDEX "folders_isPublic_idx" ON "folders"("isPublic");
CREATE INDEX "folders_deletedAt_idx" ON "folders"("deletedAt");

-- CreateIndex
CREATE INDEX "files_folderId_idx" ON "files"("folderId");
CREATE INDEX "files_uploaderId_idx" ON "files"("uploaderId");
CREATE INDEX "files_mimeType_idx" ON "files"("mimeType");
CREATE INDEX "files_isPublic_idx" ON "files"("isPublic");
CREATE INDEX "files_deletedAt_idx" ON "files"("deletedAt");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

