-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttributeModel" AS ENUM ('CONTACT', 'CONVERSATION', 'COMPANY');

-- CreateEnum
CREATE TYPE "AttributeDisplayType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'CHECKBOX', 'LIST', 'LINK');

-- CreateEnum
CREATE TYPE "BotType" AS ENUM ('WEBHOOK', 'CSML', 'DIALOGFLOW');

-- CreateEnum
CREATE TYPE "MacroVisibility" AS ENUM ('GLOBAL', 'PERSONAL', 'TEAM');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'MICROSOFT', 'FACEBOOK');

-- CreateTable
CREATE TABLE "Portal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1f93ff',
    "headerText" TEXT,
    "homepageLink" TEXT,
    "customDomain" TEXT,
    "logoUrl" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "parentCategoryId" TEXT,
    "associatedCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "position" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "associatedArticleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomAttributeDefinition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "attributeDisplayName" TEXT NOT NULL,
    "attributeDescription" TEXT,
    "attributeModel" "AttributeModel" NOT NULL,
    "attributeDisplayType" "AttributeDisplayType" NOT NULL,
    "attributeValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "regexPattern" TEXT,
    "regexCue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentBot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "outgoingUrl" TEXT,
    "avatarUrl" TEXT,
    "botType" "BotType" NOT NULL DEFAULT 'WEBHOOK',
    "botConfig" JSONB,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Macro" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "actions" JSONB NOT NULL,
    "visibility" "MacroVisibility" NOT NULL DEFAULT 'GLOBAL',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Macro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "selectedEmailFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selectedPushFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "primaryActorType" TEXT,
    "primaryActorId" TEXT,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inboxId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "subscriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingHour" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openHour" INTEGER NOT NULL,
    "openMinutes" INTEGER NOT NULL,
    "closeHour" INTEGER NOT NULL,
    "closeMinutes" INTEGER NOT NULL,
    "closedAllDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardApp" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthIntegration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "providerAccountId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "blobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portal_slug_key" ON "Portal"("slug");

-- CreateIndex
CREATE INDEX "Portal_companyId_idx" ON "Portal"("companyId");

-- CreateIndex
CREATE INDEX "Portal_slug_idx" ON "Portal"("slug");

-- CreateIndex
CREATE INDEX "Category_portalId_idx" ON "Category"("portalId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_portalId_slug_locale_key" ON "Category"("portalId", "slug", "locale");

-- CreateIndex
CREATE INDEX "Article_portalId_idx" ON "Article"("portalId");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Article_portalId_slug_locale_key" ON "Article"("portalId", "slug", "locale");

-- CreateIndex
CREATE INDEX "CustomAttributeDefinition_companyId_idx" ON "CustomAttributeDefinition"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomAttributeDefinition_companyId_attributeKey_attributeM_key" ON "CustomAttributeDefinition"("companyId", "attributeKey", "attributeModel");

-- CreateIndex
CREATE UNIQUE INDEX "AgentBot_accessToken_key" ON "AgentBot"("accessToken");

-- CreateIndex
CREATE INDEX "AgentBot_companyId_idx" ON "AgentBot"("companyId");

-- CreateIndex
CREATE INDEX "Macro_companyId_idx" ON "Macro"("companyId");

-- CreateIndex
CREATE INDEX "NotificationSetting_userId_idx" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE INDEX "NotificationSetting_companyId_idx" ON "NotificationSetting"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_companyId_key" ON "NotificationSetting"("userId", "companyId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "Webhook_companyId_idx" ON "Webhook"("companyId");

-- CreateIndex
CREATE INDEX "WorkingHour_companyId_idx" ON "WorkingHour"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHour_companyId_dayOfWeek_key" ON "WorkingHour"("companyId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "DashboardApp_companyId_idx" ON "DashboardApp"("companyId");

-- CreateIndex
CREATE INDEX "DashboardApp_userId_idx" ON "DashboardApp"("userId");

-- CreateIndex
CREATE INDEX "OAuthIntegration_companyId_idx" ON "OAuthIntegration"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthIntegration_companyId_provider_key" ON "OAuthIntegration"("companyId", "provider");

-- CreateIndex
CREATE INDEX "Upload_companyId_idx" ON "Upload"("companyId");

-- CreateIndex
CREATE INDEX "Upload_userId_idx" ON "Upload"("userId");

-- AddForeignKey
ALTER TABLE "Portal" ADD CONSTRAINT "Portal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomAttributeDefinition" ADD CONSTRAINT "CustomAttributeDefinition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentBot" ADD CONSTRAINT "AgentBot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Macro" ADD CONSTRAINT "Macro_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Macro" ADD CONSTRAINT "Macro_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Macro" ADD CONSTRAINT "Macro_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingHour" ADD CONSTRAINT "WorkingHour_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardApp" ADD CONSTRAINT "DashboardApp_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardApp" ADD CONSTRAINT "DashboardApp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthIntegration" ADD CONSTRAINT "OAuthIntegration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
