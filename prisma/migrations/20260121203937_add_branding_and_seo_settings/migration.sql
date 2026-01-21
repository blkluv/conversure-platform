-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'GROWTH', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "WabaStatus" AS ENUM ('PENDING', 'CONNECTED', 'WARMING_UP', 'ACTIVE', 'SUSPENDED', 'ERROR');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('OPENAI', 'GEMINI');

-- CreateEnum
CREATE TYPE "WhatsappProvider" AS ENUM ('WABA', 'CHATWOOT', 'EVOLUTION');

-- CreateEnum
CREATE TYPE "MessageGenerationMode" AS ENUM ('AI_PILOT', 'MANUAL_COPILOT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING_APPROVAL', 'AUTO_SENT', 'APPROVED', 'EDITED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('PRICE_MENTION', 'LEGAL_ADVICE', 'FINANCIAL_ADVICE', 'PERSONAL_DATA_LEAK', 'AGGRESSIVE_LANGUAGE', 'HALLUCINATION', 'OFF_TOPIC', 'SPAM_PATTERN', 'COMPETITOR_MENTION', 'AVAILABILITY_CLAIM');

-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'HOT', 'WARM', 'COLD', 'FOLLOW_UP', 'VIEWING_SCHEDULED', 'OFFER_MADE', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'PENDING', 'ARCHIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "WebhookSource" AS ENUM ('WHATSAPP', 'BITRIX', 'STRIPE', 'CHATWOOT', 'EVOLUTION');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('TO_BITRIX', 'FROM_BITRIX');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "country" TEXT NOT NULL DEFAULT 'UAE',
    "city" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "subscriptionStatus" TEXT,
    "seats" INTEGER NOT NULL DEFAULT 5,
    "currentPeriodEnd" TIMESTAMP(3),
    "whatsappBusinessNumber" TEXT,
    "wabaProvider" TEXT,
    "wabaApiKey" TEXT,
    "wabaWebhookToken" TEXT,
    "wabaStatus" "WabaStatus" NOT NULL DEFAULT 'PENDING',
    "bitrixDomain" TEXT,
    "bitrixWebhookUrl" TEXT,
    "bitrixAccessToken" TEXT,
    "aiProvider" "AiProvider" NOT NULL DEFAULT 'OPENAI',
    "aiTone" TEXT,
    "aiLanguages" TEXT,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "warmupStage" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "whatsappProvider" "WhatsappProvider" NOT NULL DEFAULT 'WABA',
    "messageGenerationMode" "MessageGenerationMode" NOT NULL DEFAULT 'MANUAL_COPILOT',
    "chatwootBaseUrl" TEXT,
    "chatwootApiToken" TEXT,
    "chatwootAccountId" TEXT,
    "chatwootInboxId" TEXT,
    "evolutionBaseUrl" TEXT,
    "evolutionInstanceId" TEXT,
    "evolutionApiToken" TEXT,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiMode" "MessageGenerationMode" NOT NULL DEFAULT 'MANUAL_COPILOT',
    "aiAllowedIntents" TEXT[] DEFAULT ARRAY['INQUIRY', 'VIEWING_REQUEST', 'FOLLOW_UP']::TEXT[],
    "aiAutoSendIntents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiMinConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "aiMaxMessageLength" INTEGER NOT NULL DEFAULT 400,
    "aiMaxRiskScore" INTEGER NOT NULL DEFAULT 30,
    "aiTone" TEXT NOT NULL DEFAULT 'professional',
    "aiLanguages" TEXT[] DEFAULT ARRAY['en', 'ar']::TEXT[],
    "aiMaxMessagesPerDay" INTEGER NOT NULL DEFAULT 100,
    "aiMaxConsecutiveReplies" INTEGER NOT NULL DEFAULT 3,
    "aiRespectOptOut" BOOLEAN NOT NULL DEFAULT true,
    "aiOptOutKeywords" TEXT[] DEFAULT ARRAY['stop', 'unsubscribe', 'opt out', 'لا تتصل', 'توقف']::TEXT[],
    "aiEscalateKeywords" TEXT[] DEFAULT ARRAY['manager', 'complaint', 'مدير', 'شكوى']::TEXT[],
    "aiEscalateNegativeSentiment" BOOLEAN NOT NULL DEFAULT true,
    "aiDailyBudgetUsd" DOUBLE PRECISION,
    "aiMonthlyBudgetUsd" DOUBLE PRECISION,
    "aiCurrentMonthSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiBudgetResetAt" TIMESTAMP(3),
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryBrandColor" TEXT,
    "secondaryBrandColor" TEXT,
    "seoMetaTitle" TEXT,
    "seoMetaDescription" TEXT,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoOgImageUrl" TEXT,
    "googleAnalyticsId" TEXT,
    "googleSearchConsoleCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentQuota" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 20,
    "messagesSentToday" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarmupPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "maxMessagesPerDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarmupPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agentId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bitrixLeadId" TEXT,
    "bitrixDealId" TEXT,
    "budget" TEXT,
    "propertyType" TEXT,
    "location" TEXT,
    "bedrooms" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "agentId" TEXT,
    "whatsappNumber" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDirection" "MessageDirection" NOT NULL DEFAULT 'INBOUND',
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "chatwootConversationId" TEXT,
    "evolutionChatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "contentType" "ContentType" NOT NULL DEFAULT 'TEXT',
    "body" TEXT NOT NULL,
    "wabaMessageId" TEXT,
    "templateName" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "externalMessageId" TEXT,
    "errorMessage" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "MessageDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderWebhookEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "WebhookProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "metaTemplateName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" "TemplateCategory" NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'PENDING',
    "bodyPreview" TEXT NOT NULL,
    "headerType" TEXT,
    "footerText" TEXT,
    "buttons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppNumber" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Main',
    "provider" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 20,
    "messagesSentToday" INTEGER NOT NULL DEFAULT 0,
    "warmupWeek" INTEGER NOT NULL DEFAULT 1,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "whatsappNumberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotaLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "source" "WebhookSource" NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BitrixSyncLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leadId" TEXT,
    "direction" "SyncDirection" NOT NULL,
    "action" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BitrixSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leadId" TEXT,
    "agentId" TEXT,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "FeedbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "source" TEXT NOT NULL DEFAULT 'whatsapp',
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "language" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "language" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobQueue" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "idempotencyKey" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPrompt" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPromptTemplate" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4-turbo',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 500,
    "createdBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessageGeneration" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "promptId" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCostUsd" DOUBLE PRECISION,
    "detectedIntent" TEXT,
    "intentConfidence" DOUBLE PRECISION,
    "entities" JSONB,
    "sentiment" TEXT,
    "urgency" TEXT,
    "draftMessage" TEXT NOT NULL,
    "safetyPassed" BOOLEAN NOT NULL,
    "riskScore" INTEGER,
    "violations" JSONB,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "wasApproved" BOOLEAN,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "editedMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessageGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSafetyViolation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "generationId" TEXT,
    "messageId" TEXT,
    "violationType" "ViolationType" NOT NULL,
    "severity" "ViolationSeverity" NOT NULL,
    "detectedText" TEXT NOT NULL,
    "context" TEXT,
    "ruleMatched" TEXT,
    "wasBlocked" BOOLEAN NOT NULL,
    "explanation" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewDecision" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSafetyViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptOutList" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "reason" TEXT,
    "source" TEXT,
    "keyword" TEXT,
    "optedOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optedOutBy" TEXT,
    "notes" TEXT,
    "optedInAt" TIMESTAMP(3),
    "optedInBy" TEXT,

    CONSTRAINT "OptOutList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_stripeCustomerId_key" ON "Company"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Company_whatsappBusinessNumber_idx" ON "Company"("whatsappBusinessNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE INDEX "CompanySettings_companyId_idx" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentQuota_agentId_key" ON "AgentQuota"("agentId");

-- CreateIndex
CREATE INDEX "AgentQuota_agentId_idx" ON "AgentQuota"("agentId");

-- CreateIndex
CREATE INDEX "WarmupPlan_companyId_weekNumber_idx" ON "WarmupPlan"("companyId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_bitrixLeadId_key" ON "Lead"("bitrixLeadId");

-- CreateIndex
CREATE INDEX "Lead_companyId_idx" ON "Lead"("companyId");

-- CreateIndex
CREATE INDEX "Lead_agentId_idx" ON "Lead"("agentId");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_bitrixLeadId_idx" ON "Lead"("bitrixLeadId");

-- CreateIndex
CREATE INDEX "Conversation_companyId_idx" ON "Conversation"("companyId");

-- CreateIndex
CREATE INDEX "Conversation_leadId_idx" ON "Conversation"("leadId");

-- CreateIndex
CREATE INDEX "Conversation_agentId_idx" ON "Conversation"("agentId");

-- CreateIndex
CREATE INDEX "Conversation_whatsappNumber_idx" ON "Conversation"("whatsappNumber");

-- CreateIndex
CREATE INDEX "Conversation_chatwootConversationId_idx" ON "Conversation"("chatwootConversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_wabaMessageId_key" ON "Message"("wabaMessageId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_wabaMessageId_idx" ON "Message"("wabaMessageId");

-- CreateIndex
CREATE INDEX "MessageDeliveryAttempt_messageId_idx" ON "MessageDeliveryAttempt"("messageId");

-- CreateIndex
CREATE INDEX "MessageDeliveryAttempt_status_idx" ON "MessageDeliveryAttempt"("status");

-- CreateIndex
CREATE INDEX "MessageDeliveryAttempt_provider_idx" ON "MessageDeliveryAttempt"("provider");

-- CreateIndex
CREATE INDEX "ProviderWebhookEvent_provider_status_idx" ON "ProviderWebhookEvent"("provider", "status");

-- CreateIndex
CREATE INDEX "ProviderWebhookEvent_receivedAt_idx" ON "ProviderWebhookEvent"("receivedAt");

-- CreateIndex
CREATE INDEX "ProviderWebhookEvent_companyId_idx" ON "ProviderWebhookEvent"("companyId");

-- CreateIndex
CREATE INDEX "Template_companyId_idx" ON "Template"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_companyId_metaTemplateName_key" ON "Template"("companyId", "metaTemplateName");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppNumber_number_key" ON "WhatsAppNumber"("number");

-- CreateIndex
CREATE INDEX "WhatsAppNumber_companyId_idx" ON "WhatsAppNumber"("companyId");

-- CreateIndex
CREATE INDEX "WhatsAppNumber_number_idx" ON "WhatsAppNumber"("number");

-- CreateIndex
CREATE INDEX "QuotaLog_companyId_idx" ON "QuotaLog"("companyId");

-- CreateIndex
CREATE INDEX "QuotaLog_date_idx" ON "QuotaLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "QuotaLog_whatsappNumberId_date_key" ON "QuotaLog"("whatsappNumberId", "date");

-- CreateIndex
CREATE INDEX "WebhookEvent_companyId_idx" ON "WebhookEvent"("companyId");

-- CreateIndex
CREATE INDEX "WebhookEvent_source_idx" ON "WebhookEvent"("source");

-- CreateIndex
CREATE INDEX "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "BitrixSyncLog_companyId_idx" ON "BitrixSyncLog"("companyId");

-- CreateIndex
CREATE INDEX "BitrixSyncLog_leadId_idx" ON "BitrixSyncLog"("leadId");

-- CreateIndex
CREATE INDEX "BitrixSyncLog_status_idx" ON "BitrixSyncLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_stripeEventId_key" ON "PaymentEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "PaymentEvent_companyId_idx" ON "PaymentEvent"("companyId");

-- CreateIndex
CREATE INDEX "PaymentEvent_type_idx" ON "PaymentEvent"("type");

-- CreateIndex
CREATE INDEX "FeedbackTemplate_companyId_idx" ON "FeedbackTemplate"("companyId");

-- CreateIndex
CREATE INDEX "FeedbackTemplate_language_idx" ON "FeedbackTemplate"("language");

-- CreateIndex
CREATE INDEX "FeedbackRequest_companyId_idx" ON "FeedbackRequest"("companyId");

-- CreateIndex
CREATE INDEX "FeedbackRequest_leadId_idx" ON "FeedbackRequest"("leadId");

-- CreateIndex
CREATE INDEX "FeedbackRequest_phone_idx" ON "FeedbackRequest"("phone");

-- CreateIndex
CREATE INDEX "FeedbackRequest_status_idx" ON "FeedbackRequest"("status");

-- CreateIndex
CREATE INDEX "Feedback_companyId_idx" ON "Feedback"("companyId");

-- CreateIndex
CREATE INDEX "Feedback_agentId_idx" ON "Feedback"("agentId");

-- CreateIndex
CREATE INDEX "Feedback_leadId_idx" ON "Feedback"("leadId");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "Campaign_companyId_idx" ON "Campaign"("companyId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_scheduledAt_idx" ON "Campaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignRecipient_status_idx" ON "CampaignRecipient"("status");

-- CreateIndex
CREATE INDEX "CampaignRecipient_phone_idx" ON "CampaignRecipient"("phone");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_companyId_phone_key" ON "Contact"("companyId", "phone");

-- CreateIndex
CREATE INDEX "ImportBatch_companyId_idx" ON "ImportBatch"("companyId");

-- CreateIndex
CREATE INDEX "ImportBatch_type_idx" ON "ImportBatch"("type");

-- CreateIndex
CREATE UNIQUE INDEX "JobQueue_idempotencyKey_key" ON "JobQueue"("idempotencyKey");

-- CreateIndex
CREATE INDEX "JobQueue_status_scheduledFor_priority_idx" ON "JobQueue"("status", "scheduledFor", "priority");

-- CreateIndex
CREATE INDEX "JobQueue_type_status_idx" ON "JobQueue"("type", "status");

-- CreateIndex
CREATE INDEX "JobQueue_createdAt_idx" ON "JobQueue"("createdAt");

-- CreateIndex
CREATE INDEX "AiPrompt_companyId_name_isActive_idx" ON "AiPrompt"("companyId", "name", "isActive");

-- CreateIndex
CREATE INDEX "AiPrompt_isActive_idx" ON "AiPrompt"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AiPrompt_companyId_name_version_key" ON "AiPrompt"("companyId", "name", "version");

-- CreateIndex
CREATE INDEX "AiMessageGeneration_conversationId_idx" ON "AiMessageGeneration"("conversationId");

-- CreateIndex
CREATE INDEX "AiMessageGeneration_status_idx" ON "AiMessageGeneration"("status");

-- CreateIndex
CREATE INDEX "AiMessageGeneration_detectedIntent_idx" ON "AiMessageGeneration"("detectedIntent");

-- CreateIndex
CREATE INDEX "AiMessageGeneration_provider_model_idx" ON "AiMessageGeneration"("provider", "model");

-- CreateIndex
CREATE INDEX "AiMessageGeneration_createdAt_idx" ON "AiMessageGeneration"("createdAt");

-- CreateIndex
CREATE INDEX "AiSafetyViolation_companyId_idx" ON "AiSafetyViolation"("companyId");

-- CreateIndex
CREATE INDEX "AiSafetyViolation_violationType_idx" ON "AiSafetyViolation"("violationType");

-- CreateIndex
CREATE INDEX "AiSafetyViolation_severity_idx" ON "AiSafetyViolation"("severity");

-- CreateIndex
CREATE INDEX "AiSafetyViolation_wasBlocked_idx" ON "AiSafetyViolation"("wasBlocked");

-- CreateIndex
CREATE INDEX "AiSafetyViolation_createdAt_idx" ON "AiSafetyViolation"("createdAt");

-- CreateIndex
CREATE INDEX "OptOutList_phone_idx" ON "OptOutList"("phone");

-- CreateIndex
CREATE INDEX "OptOutList_companyId_idx" ON "OptOutList"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "OptOutList_companyId_phone_key" ON "OptOutList"("companyId", "phone");

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentQuota" ADD CONSTRAINT "AgentQuota_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentQuota" ADD CONSTRAINT "AgentQuota_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarmupPlan" ADD CONSTRAINT "WarmupPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDeliveryAttempt" ADD CONSTRAINT "MessageDeliveryAttempt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderWebhookEvent" ADD CONSTRAINT "ProviderWebhookEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppNumber" ADD CONSTRAINT "WhatsAppNumber_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotaLog" ADD CONSTRAINT "QuotaLog_whatsappNumberId_fkey" FOREIGN KEY ("whatsappNumberId") REFERENCES "WhatsAppNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackTemplate" ADD CONSTRAINT "FeedbackTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPrompt" ADD CONSTRAINT "AiPrompt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessageGeneration" ADD CONSTRAINT "AiMessageGeneration_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessageGeneration" ADD CONSTRAINT "AiMessageGeneration_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessageGeneration" ADD CONSTRAINT "AiMessageGeneration_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "AiPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSafetyViolation" ADD CONSTRAINT "AiSafetyViolation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSafetyViolation" ADD CONSTRAINT "AiSafetyViolation_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "AiMessageGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptOutList" ADD CONSTRAINT "OptOutList_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
