ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "verification_codes" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ai_usage_windows" (
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "usedTokens" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_usage_windows_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX "ai_usage_windows_windowStart_idx" ON "ai_usage_windows"("windowStart");

ALTER TABLE "ai_usage_windows"
ADD CONSTRAINT "ai_usage_windows_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
