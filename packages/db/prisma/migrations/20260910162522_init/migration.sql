-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'MONTHLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MomentKind" AS ENUM ('MOMENT', 'PRINCIPLE');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('DOCUMENTED', 'ATTESTED', 'TRADITIONAL', 'DISPUTED');

-- CreateEnum
CREATE TYPE "Pressure" AS ENUM ('GENTLE', 'FIRM', 'UNBREAKABLE');

-- CreateEnum
CREATE TYPE "Act" AS ENUM ('FACE_IT', 'CONTROL_IT', 'ENDURE_IT', 'BECOME_IT');

-- CreateEnum
CREATE TYPE "SupportTopic" AS ENUM ('BILLING', 'BUG', 'MY_DATA', 'REPORT_CONTENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('PENDING_VERIFICATION', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "adversity_category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "adversity_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adversity_story" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "lesson" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "readSeconds" INTEGER NOT NULL DEFAULT 30,
    "proOnly" BOOLEAN NOT NULL DEFAULT false,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adversity_story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "revenueCatUserId" TEXT,
    "entitlementActive" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "willRenew" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "store" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "bonusQuestions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mastraThreadId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "title" TEXT,
    "originStoryId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT,
    "masterId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "dueOn" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 5,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "domains" TEXT[],
    "tone" TEXT NOT NULL,
    "manner" TEXT NOT NULL,
    "register" TEXT NOT NULL,
    "syntax" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "characteristicMove" TEXT NOT NULL,
    "cadenceSample" TEXT NOT NULL,
    "neverDo" TEXT[],
    "accentColor" TEXT NOT NULL,
    "unlockDay" INTEGER,
    "proOnly" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rightsNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment" (
    "id" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "kind" "MomentKind" NOT NULL DEFAULT 'MOMENT',
    "confidence" "Confidence" NOT NULL DEFAULT 'ATTESTED',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "lesson" TEXT NOT NULL,
    "themes" TEXT[],
    "sourceCitation" TEXT,
    "sourceNote" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation" (
    "id" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceWork" TEXT NOT NULL,
    "sourceLocus" TEXT,
    "translationNote" TEXT,
    "confidence" "Confidence" NOT NULL DEFAULT 'DOCUMENTED',
    "themes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wound" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "themes" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seedProblem" TEXT,
    "pressure" "Pressure" NOT NULL DEFAULT 'FIRM',
    "firstMasterId" TEXT,
    "morningReminder" TEXT DEFAULT '06:00',
    "eveningReminder" TEXT DEFAULT '21:00',
    "remindersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_profile_wound" (
    "profileId" TEXT NOT NULL,
    "woundId" TEXT NOT NULL,

    CONSTRAINT "onboarding_profile_wound_pkey" PRIMARY KEY ("profileId","woundId")
);

-- CreateTable
CREATE TABLE "path_day" (
    "id" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "act" "Act" NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,

    CONSTRAINT "path_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_trial" (
    "id" TEXT NOT NULL,
    "pathDayId" TEXT NOT NULL,
    "pressure" "Pressure" NOT NULL,
    "body" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "path_trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "bushidoScore" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedOn" TEXT,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "path_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathDayId" TEXT NOT NULL,
    "completedOn" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trial_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_code" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lines" TEXT[],
    "writtenOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_message" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "topic" "SupportTopic" NOT NULL,
    "details" TEXT NOT NULL,
    "userId" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_request" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "status" "DeletionStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adversity_category_slug_key" ON "adversity_category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "adversity_story_slug_key" ON "adversity_story"("slug");

-- CreateIndex
CREATE INDEX "adversity_story_categoryId_idx" ON "adversity_story"("categoryId");

-- CreateIndex
CREATE INDEX "adversity_story_masterId_idx" ON "adversity_story"("masterId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account"("issuer", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_userId_key" ON "subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_revenueCatUserId_key" ON "subscription"("revenueCatUserId");

-- CreateIndex
CREATE INDEX "daily_usage_userId_idx" ON "daily_usage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_usage_userId_localDate_key" ON "daily_usage"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "thread_mastraThreadId_key" ON "thread"("mastraThreadId");

-- CreateIndex
CREATE INDEX "thread_userId_lastMessageAt_idx" ON "thread"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "thread_masterId_idx" ON "thread"("masterId");

-- CreateIndex
CREATE INDEX "charge_userId_dueOn_idx" ON "charge"("userId", "dueOn");

-- CreateIndex
CREATE INDEX "charge_threadId_idx" ON "charge"("threadId");

-- CreateIndex
CREATE INDEX "charge_masterId_idx" ON "charge"("masterId");

-- CreateIndex
CREATE UNIQUE INDEX "master_slug_key" ON "master"("slug");

-- CreateIndex
CREATE INDEX "master_active_sortOrder_idx" ON "master"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "moment_masterId_kind_idx" ON "moment"("masterId", "kind");

-- CreateIndex
CREATE INDEX "quotation_masterId_idx" ON "quotation"("masterId");

-- CreateIndex
CREATE UNIQUE INDEX "wound_slug_key" ON "wound"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profile_userId_key" ON "onboarding_profile"("userId");

-- CreateIndex
CREATE INDEX "onboarding_profile_firstMasterId_idx" ON "onboarding_profile"("firstMasterId");

-- CreateIndex
CREATE INDEX "onboarding_profile_wound_woundId_idx" ON "onboarding_profile_wound"("woundId");

-- CreateIndex
CREATE UNIQUE INDEX "path_day_dayNumber_key" ON "path_day"("dayNumber");

-- CreateIndex
CREATE INDEX "path_day_act_idx" ON "path_day"("act");

-- CreateIndex
CREATE UNIQUE INDEX "path_trial_pathDayId_pressure_key" ON "path_trial"("pathDayId", "pressure");

-- CreateIndex
CREATE UNIQUE INDEX "path_progress_userId_key" ON "path_progress"("userId");

-- CreateIndex
CREATE INDEX "trial_completion_userId_completedOn_idx" ON "trial_completion"("userId", "completedOn");

-- CreateIndex
CREATE UNIQUE INDEX "trial_completion_userId_pathDayId_key" ON "trial_completion"("userId", "pathDayId");

-- CreateIndex
CREATE UNIQUE INDEX "personal_code_userId_key" ON "personal_code"("userId");

-- CreateIndex
CREATE INDEX "support_message_handledAt_createdAt_idx" ON "support_message"("handledAt", "createdAt");

-- CreateIndex
CREATE INDEX "support_message_email_idx" ON "support_message"("email");

-- CreateIndex
CREATE UNIQUE INDEX "deletion_request_token_key" ON "deletion_request"("token");

-- CreateIndex
CREATE INDEX "deletion_request_email_idx" ON "deletion_request"("email");

-- CreateIndex
CREATE INDEX "deletion_request_status_idx" ON "deletion_request"("status");

-- AddForeignKey
ALTER TABLE "adversity_story" ADD CONSTRAINT "adversity_story_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "adversity_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adversity_story" ADD CONSTRAINT "adversity_story_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread" ADD CONSTRAINT "thread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread" ADD CONSTRAINT "thread_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge" ADD CONSTRAINT "charge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge" ADD CONSTRAINT "charge_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "thread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge" ADD CONSTRAINT "charge_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_profile" ADD CONSTRAINT "onboarding_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_profile" ADD CONSTRAINT "onboarding_profile_firstMasterId_fkey" FOREIGN KEY ("firstMasterId") REFERENCES "master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_profile_wound" ADD CONSTRAINT "onboarding_profile_wound_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "onboarding_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_profile_wound" ADD CONSTRAINT "onboarding_profile_wound_woundId_fkey" FOREIGN KEY ("woundId") REFERENCES "wound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_trial" ADD CONSTRAINT "path_trial_pathDayId_fkey" FOREIGN KEY ("pathDayId") REFERENCES "path_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_progress" ADD CONSTRAINT "path_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_completion" ADD CONSTRAINT "trial_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_completion" ADD CONSTRAINT "trial_completion_pathDayId_fkey" FOREIGN KEY ("pathDayId") REFERENCES "path_day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_code" ADD CONSTRAINT "personal_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
