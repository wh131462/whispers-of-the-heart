-- AlterTable
ALTER TABLE "public"."folders" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
