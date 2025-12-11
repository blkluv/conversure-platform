# Conversure CRM - System Architecture & Codebase Map

**Project:** Conversure UAE Real Estate CRM  
**Tech Stack:** Next.js 14 (App Router), Prisma ORM, PostgreSQL, NextAuth  
**Generated:** 2025-12-11  
**Document Level:** Deep Scan (Comprehensive)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Data Models](#core-data-models)
3. [Authentication & Authorization](#authentication--authorization)
4. [System Architecture](#system-architecture)
5. [API Structure](#api-structure)
6. [Integration Ecosystem](#integration-ecosystem)
7. [Data Security & Relationships](#data-security--relationships)
8. [Key Features](#key-features)

---

## Project Overview

Conversure is a multi-tenant SaaS CRM platform designed for UAE real estate professionals. It integrates WhatsApp messaging, Bitrix24 CRM, and Stripe billing into a unified agent workspace with AI-powered conversation assistance.

### Key Capabilities
- **Multi-tenant architecture** with company-based data isolation
- **WhatsApp Business API integration** (WABA) with warm-up scheduling
- **Bitrix24 sync** for lead management and deal tracking
- **AI message generation** with manual-copilot mode
- **Stripe billing** with per-seat subscriptions
- **Role-based access control** (SUPER_ADMIN, COMPANY_ADMIN, AGENT)
- **Campaign management** with bulk message scheduling
- **Real estate specific fields** (budget, property type, bedrooms, location)
- **Multi-language support** (English & Arabic)

---

## Core Data Models

### 1. **Company** (Multi-Tenant Root)
The central entity representing a real estate company using the platform.

**Key Fields:**
- `id` (CUID) - Unique company identifier
- `name`, `domain`, `country`, `city` - Company information
- `plan` (STARTER | GROWTH | PRO | ENTERPRISE) - Subscription tier
- `seats` - Number of user seats (default: 5)
- `subscriptionStatus` - active | trialing | past_due | canceled
- `stripeCustomerId`, `stripeSubscriptionId` - Stripe integration
- `whatsappBusinessNumber`, `wabaStatus` - WhatsApp connection status
- `bitrixDomain`, `bitrixAccessToken` - Bitrix24 credentials
- `aiProvider` (OPENAI | GEMINI), `aiTone`, `aiLanguages` - AI settings
- `warmupStage` - Scheduled message warm-up week (1-4+)

**Relations:**
- `users[]` - All users in the company
- `conversations[]` - All company conversations
- `leads[]` - All company leads
- `templates[]` - WhatsApp templates
- `campaigns[]` - Bulk messaging campaigns
- `companySettings` - Provider-specific configuration

**Data Isolation:** All queries should filter by `companyId` to ensure multi-tenant isolation.

---

### 2. **User** (Agent & Admin)
Represents individuals with access to the platform.

**Key Fields:**
- `id` (CUID) - User identifier
- `email` (unique) - Login identifier
- `fullName`, `phone` - User information
- `role` (SUPER_ADMIN | COMPANY_ADMIN | AGENT) - Permission level
- `passwordHash` - Bcrypt hash (10 rounds)
- `isActive` - Soft delete flag
- `companyId` - Company assignment

**Relations:**
- `company` - Parent company (required)
- `agentQuota?` - Message quota tracking (optional)
- `assignedLeads[]` - Leads assigned to this agent
- `conversations[]` - Conversations the user participates in
- `messages[]` - Messages sent by this user
- `feedbacks[]` - Feedback given about this agent
- `feedbackRequests[]` - Feedback requests for this agent

**Role Permissions:**
| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | Full system access, manage all companies, user management, billing |
| COMPANY_ADMIN | Full company access, manage users, integrations, settings, billing |
| AGENT | Conversations, leads, templates, own quota limits |

---

### 3. **Conversation** (WhatsApp Thread)
Represents an ongoing conversation between an agent and a lead via WhatsApp.

**Key Fields:**
- `id` (CUID) - Conversation identifier
- `companyId` - Company owner
- `leadId` - Associated lead
- `agentId?` - Assigned agent (optional, can be unassigned)
- `whatsappNumber` - The WhatsApp number (e.g., +971501234567)
- `lastMessageAt` - Timestamp of last activity
- `lastDirection` (INBOUND | OUTBOUND) - Last message direction
- `status` (ACTIVE | PENDING | ARCHIVED | CLOSED) - Conversation state
- `chatwootConversationId?` - Chatwoot sync reference
- `evolutionChatId?` - Evolution API sync reference

**Relations:**
- `company` - Parent company
- `lead` - Associated lead (required)
- `agent?` - Assigned agent (optional)
- `messages[]` - All messages in conversation

**Important for Data Queries:**
```sql
-- Secure agent view (only their conversations)
SELECT * FROM Conversation 
WHERE companyId = $1 AND agentId = $2;

-- Secure company admin view (all conversations)
SELECT * FROM Conversation 
WHERE companyId = $1 ORDER BY lastMessageAt DESC;
```

---

### 4. **Lead** (Contact/Prospect)
Represents a real estate prospect in the CRM.

**Key Fields:**
- `id` (CUID) - Lead identifier
- `companyId` - Company owner
- `agentId?` - Assigned agent (can be unassigned)
- `name`, `phone`, `email` - Contact information
- `source` - Origin (WhatsApp, Bitrix24, Web Form, etc.)
- `status` (NEW | HOT | WARM | COLD | FOLLOW_UP | VIEWING_SCHEDULED | OFFER_MADE | CLOSED_WON | CLOSED_LOST)
- `tags[]` - Custom categorization
- `bitrixLeadId?` - Bitrix24 sync reference
- `bitrixDealId?` - Bitrix24 deal reference

**Real Estate Specific:**
- `budget` - Price range
- `propertyType` - Villa | Apartment | Townhouse | etc.
- `location` - Area/community
- `bedrooms` - Number of rooms

**Relations:**
- `company` - Parent company
- `agent?` - Assigned agent
- `conversations[]` - Conversations with this lead
- `feedbacks[]` - Feedback from/about this lead
- `campaignRecipients[]` - Campaign participation

---

### 5. **Message** (Chat Message)
Individual messages within a conversation.

**Key Fields:**
- `id` (CUID) - Message identifier
- `conversationId` - Parent conversation
- `senderId?` - User who sent (null for inbound)
- `direction` (INBOUND | OUTBOUND) - Message flow
- `contentType` (TEXT | IMAGE | AUDIO | VIDEO | DOCUMENT | LOCATION | TEMPLATE)
- `body` - Message text/content
- `wabaMessageId?` - WABA webhook reference
- `templateName?` - If sent via WhatsApp template
- `sentAt`, `deliveredAt`, `readAt`, `failedAt` - Status tracking
- `errorMessage?` - Failure reason

**Relations:**
- `conversation` - Parent conversation
- `sender?` - User who sent (optional)

---

### 6. **CompanySettings** (Provider Configuration)
Per-company WhatsApp provider selection and credentials.

**Key Fields:**
- `id`, `companyId` (unique) - Company reference
- `whatsappProvider` (WABA | CHATWOOT | EVOLUTION) - Selected provider
- **WABA:** Meta Cloud API, Twilio, 360dialog
- **CHATWOOT:** Open-source customer platform
- **EVOLUTION:** WhatsApp Web gateway

**Provider-Specific Credentials:**
```
WABA (default):
  - Sourced from env: WHATSAPP_PROVIDER_API_URL, WHATSAPP_PROVIDER_API_KEY
  
CHATWOOT:
  - chatwootBaseUrl (e.g., https://chatwoot.mycompany.com)
  - chatwootApiToken (encrypted)
  - chatwootAccountId
  - chatwootInboxId
  
EVOLUTION:
  - evolutionBaseUrl (e.g., https://evolution.mycompany.com)
  - evolutionInstanceId
  - evolutionApiToken (encrypted)
```

---

### 7. **Template** (WhatsApp Message Template)
Pre-approved WhatsApp templates registered with Meta.

**Key Fields:**
- `id`, `companyId` - Template owner
- `metaTemplateName` - Name in Meta's system
- `displayName` - User-friendly name
- `language` - ISO code (en, ar)
- `category` (MARKETING | UTILITY | AUTHENTICATION)
- `status` (PENDING | APPROVED | REJECTED | DISABLED)
- `bodyPreview` - Template text
- `headerType?` - TEXT | IMAGE | VIDEO | DOCUMENT
- `buttons?` - JSON array of button objects

---

### 8. **WhatsAppNumber** (Virtual Number)
A WhatsApp business number with daily message quota.

**Key Fields:**
- `id`, `companyId` - Owner
- `number` (unique) - E.164 format (e.g., +971501234567)
- `label` - Main | Leasing | Sales | etc.
- `provider` - meta | twilio | 360dialog | chatwoot | evolution
- `dailyLimit`, `messagesSentToday` - Quota tracking
- `warmupWeek` - Warm-up stage (1-4+)
- `lastResetAt` - Last daily reset timestamp
- `isActive` - Enable/disable flag

**Warm-up Schedule:**
| Week | Daily Limit |
|------|-------------|
| 1 | 20 messages |
| 2 | 50 messages |
| 3 | 100 messages |
| 4+ | 1,000 messages |

---

### 9. **Conversation Relationships** (Critical for Security)

```
Company (root)
├── User (roles: SUPER_ADMIN | COMPANY_ADMIN | AGENT)
├── Lead (real estate prospect)
│   └── Conversation
│       ├── Agent (assigned to conversation)
│       └── Message[]
├── Template (WhatsApp templates)
├── Campaign (bulk messaging)
│   └── CampaignRecipient[] (lead + message status)
└── WhatsAppNumber (virtual numbers with quotas)
```

**Security Rules for Querying:**
1. **Agents**: Can only see/modify conversations assigned to them + company conversations
2. **Company Admins**: Can see all conversations in their company
3. **Super Admins**: Can see all conversations across all companies
4. **Always filter**: `WHERE companyId = $userCompanyId` (except Super Admins)

---

## Authentication & Authorization

### Session Management
Located in: [lib/auth.ts](../lib/auth.ts)

**Mechanism:** HTTP-only cookies with JSON serialization
- Session data stored as JSON string in cookie
- Expires after 7 days
- Secure flag enabled in production
- SameSite: Lax

**Key Functions:**
```typescript
createSession(user) - Create session after login
getSession() - Retrieve current session from cookie
getCurrentUser() - Get logged-in user details
requireAuth() - Middleware to enforce authentication
requireRole(roles[]) - Enforce role-based access
destroySession() - Clear session on logout
```

### Password Management
- **Hashing:** bcryptjs with 10 salt rounds
- **Verification:** Constant-time comparison
- **Storage:** Never store plain passwords

### User Roles

| Role | Description | Scope |
|------|-------------|-------|
| **SUPER_ADMIN** | Full system access | All companies |
| **COMPANY_ADMIN** | Manage single company | Assigned company only |
| **AGENT** | Use CRM for messaging | Limited to assigned leads/conversations |

---

## System Architecture

### Directory Structure

```
conversure-uae-real-estate/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected routes
│   │   ├── admin/                # Admin console
│   │   ├── billing/              # Stripe & subscription
│   │   ├── campaigns/            # Bulk messaging
│   │   ├── contacts/             # Contact management
│   │   └── feedback/             # Feedback requests
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication
│   │   ├── agents/               # Agent management
│   │   ├── conversations/        # Conversation API
│   │   ├── messages/             # Message API
│   │   ├── campaigns/            # Campaign scheduling
│   │   ├── webhooks/             # Inbound webhooks
│   │   ├── billing/              # Stripe webhooks
│   │   ├── imports/              # CSV imports
│   │   └── onboarding/           # Setup wizards
│   ├── login/                    # Auth pages
│   ├── signup/                   # Registration
│   ├── onboarding/               # Initial setup
│   ├── compliance/               # Legal pages
│   ├── contact/                  # Public contact form
│   ├── dashboard/                # Dashboard redirects
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── auth/                     # Login/signup forms
│   ├── dashboard/                # Dashboard UI
│   ├── agent/                    # Agent interface
│   ├── forms/                    # Form components
│   ├── onboarding/               # Setup wizards
│   └── ui/                       # Base components
├── lib/                          # Utilities
│   ├── auth.ts                   # Session management
│   ├── db.ts                     # Prisma client
│   ├── whatsapp-provider.ts      # Provider abstraction
│   ├── whatsapp.ts               # WhatsApp utilities
│   ├── bitrix.ts                 # Bitrix24 sync
│   ├── stripe.ts                 # Stripe integration
│   ├── ai.ts                     # AI message generation
│   └── utils.ts                  # Helpers
├── prisma/
│   ├── schema.prisma             # Data schema
│   └── seed.ts                   # Database seeding
└── docs/                         # Documentation
    ├── index.md                  # THIS FILE (System map)
    ├── architecture.md           # WhatsApp abstraction layer
    └── bmm-workflow-status.yaml  # Project workflow tracking
```

---

## API Structure

### Core API Routes

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - Company/user registration
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/session` - Get current session

#### Conversations
- `GET /api/conversations` - List company conversations (filtered by agent if AGENT role)
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/[id]` - Get conversation details + messages
- `PATCH /api/conversations/[id]` - Update conversation (assign agent, status)

#### Messages
- `POST /api/messages` - Send message (via selected provider)
- `GET /api/messages?conversationId=[id]` - List messages in conversation
- `PATCH /api/messages/[id]` - Mark as read/update status

#### Webhooks (Inbound)
- `POST /api/webhooks/whatsapp` - Meta Cloud API webhooks
- `POST /api/webhooks/chatwoot` - Chatwoot inbound messages
- `POST /api/webhooks/evolution` - Evolution API webhooks
- `POST /api/webhooks/bitrix` - Bitrix24 CRM sync
- `POST /api/webhooks/stripe` - Stripe payment events

#### Agents
- `GET /api/agents` - List company agents
- `POST /api/agents` - Create agent
- `PATCH /api/agents/[id]` - Update agent

#### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/[id]/execute` - Start campaign
- `GET /api/campaigns/[id]/recipients` - Campaign recipient status

#### Imports
- `POST /api/imports` - Upload CSV (contacts or campaign recipients)
- `GET /api/imports/[batchId]` - Import progress

#### Billing
- `POST /api/billing/create-checkout` - Stripe checkout
- `GET /api/billing/portal` - Stripe customer portal
- `POST /api/webhooks/stripe` - Webhook handler

#### Onboarding
- `POST /api/onboarding/whatsapp-setup` - Configure WhatsApp
- `POST /api/onboarding/bitrix-setup` - Configure Bitrix24
- `POST /api/onboarding/warmup-setup` - Configure warm-up schedule

#### Feedback
- `POST /api/feedback/request` - Send feedback request
- `POST /api/feedback/submit` - Receive feedback response

---

## Integration Ecosystem

### 1. WhatsApp Integration (Multi-Provider)

**Supported Providers:**
1. **WABA (Meta Cloud API)** - Official Meta WhatsApp Business API
2. **CHATWOOT** - Open-source customer engagement platform
3. **EVOLUTION** - WhatsApp Web gateway (unofficial but popular)

**Provider Abstraction** (See: [docs/architecture.md](./architecture.md))
- Unified interface in [lib/whatsapp-provider.ts](../lib/whatsapp-provider.ts)
- Provider selected per company in `CompanySettings.whatsappProvider`
- Credentials encrypted in database
- All outbound messages routed through selected provider

**Message Flow:**
```
Agent sends message
  → Validates quota (WhatsAppNumber.dailyLimit)
  → getWhatsappClientForCompany(companyId)
  → Provider-specific client (WABA | CHATWOOT | EVOLUTION)
  → API call to provider
  → Store message in Message table
  → Webhook listener updates delivery status
```

### 2. Bitrix24 CRM Sync

**Two-Way Sync:**
- Leads created in Conversure → Synced to Bitrix24 as Leads
- Leads created in Bitrix24 → Imported to Conversure
- Conversations logged to Bitrix24 Deals
- Deal updates reflected in Conversure Lead status

**Mapping:**
| Conversure | Bitrix24 |
|-----------|----------|
| Lead | Lead entity |
| Lead.status | Deal stage |
| Conversation | Deal activity (comment) |
| Message | Activity timestamp |

**Sync Logs:** BitrixSyncLog table tracks all sync operations

### 3. Stripe Billing

**Subscription Model:**
- Per-company subscription
- Per-seat pricing (number of Agent users)
- Monthly billing cycle
- Plans: STARTER (5 seats) | GROWTH (25 seats) | PRO (100 seats) | ENTERPRISE (unlimited)

**Webhook Events Tracked:**
- `checkout.session.completed` - New subscription
- `invoice.paid` - Payment successful
- `invoice.payment_failed` - Payment failure
- `customer.subscription.updated` - Plan/seat changes
- `customer.subscription.deleted` - Subscription canceled

### 4. AI Message Generation

**Providers:** OpenAI (ChatGPT) or Google Gemini
- Configured per company in `Company.aiProvider`
- Tone customizable: formal, friendly, luxury
- Language support: English, Arabic
- Mode: AI_PILOT (auto-send) or MANUAL_COPILOT (agent approves)

---

## Data Security & Relationships

### Multi-Tenant Isolation

**Golden Rule:** Every query must filter by `companyId`

```typescript
// ❌ DANGEROUS - crosses company boundaries
const conversations = await db.conversation.findMany({
  where: { leadId: leadId }
})

// ✅ SECURE - isolated by company
const conversations = await db.conversation.findMany({
  where: { 
    leadId: leadId,
    companyId: userCompanyId  // Always include this
  }
})
```

### Role-Based Query Scoping

**AGENT Access Pattern:**
```typescript
// Agents can only see their own conversations
const myConversations = await db.conversation.findMany({
  where: {
    companyId: userCompanyId,
    agentId: userId  // AGENT-specific filter
  },
  include: {
    lead: true,
    messages: true,
    agent: true
  }
})
```

**COMPANY_ADMIN Access Pattern:**
```typescript
// Admins can see all company conversations
const companyConversations = await db.conversation.findMany({
  where: {
    companyId: userCompanyId
  },
  include: {
    lead: true,
    agent: true
  }
})
```

**SUPER_ADMIN Access Pattern:**
```typescript
// Super admins can see everything (audit/support)
const allConversations = await db.conversation.findMany({
  include: {
    company: true,
    lead: true,
    agent: true,
    messages: true
  }
})
```

### Cascade Delete Strategy

When a Company is deleted:
- All Users deleted
- All Leads deleted
- All Conversations deleted
- All Messages deleted
- All Templates deleted
- All Campaigns deleted
- All subscription records deleted

**Important:** Foreign key constraints use `onDelete: Cascade`

---

## Key Features

### 1. **Warm-up Scheduling**
Gradually increase WhatsApp daily limits over 4 weeks to avoid provider restrictions.

**Stage Progression:**
- Week 1: 20 messages/day
- Week 2: 50 messages/day
- Week 3: 100 messages/day
- Week 4+: 1,000 messages/day

**Implemented in:** [lib/whatsapp.ts](../lib/whatsapp.ts) - `getWarmupLimit()`, `canSendMessage()`

### 2. **Agent Quota Management**
Per-agent daily message limits with automatic reset.

**Tracking:** AgentQuota table
- `dailyLimit` - Max messages per day
- `messagesSentToday` - Current count
- `resetAt` - Auto-reset at midnight

### 3. **Campaign Broadcasting**
Send bulk messages to multiple leads with template substitution.

**Process:**
1. Create Campaign with Template
2. Define Recipients (manually or CSV import)
3. Schedule execution
4. Track delivery per CampaignRecipient

### 4. **Real Estate Specific**
- Budget ranges
- Property types (Villa, Apartment, etc.)
- Location/community tracking
- Bedroom/room counts
- Lead status workflow (viewing scheduled, offer made, closed)

### 5. **Feedback Collection**
Automated feedback requests sent after conversations to collect ratings and comments.

### 6. **CSV Import**
Bulk import contacts or campaign recipients via CSV upload.

---

## Database Access Patterns

### Finding a Conversation
```typescript
// By ID (must verify company access)
const conversation = await db.conversation.findUnique({
  where: { id: conversationId },
  include: { 
    lead: true, 
    messages: true, 
    agent: true 
  }
})

if (conversation?.companyId !== userCompanyId) {
  throw new Error("Unauthorized")
}
```

### Finding User's Leads
```typescript
const myLeads = await db.lead.findMany({
  where: {
    companyId: userCompanyId,
    agentId: userId  // Only my assigned leads
  },
  include: {
    conversations: {
      include: { messages: true }
    }
  }
})
```

### Finding Unread Messages
```typescript
const unreadMessages = await db.message.findMany({
  where: {
    conversation: {
      companyId: userCompanyId,
      agentId: userId
    },
    readAt: null,
    direction: "INBOUND"
  },
  orderBy: { sentAt: "desc" }
})
```

### Checking Message Quota
```typescript
const canSend = await canSendMessage(whatsappNumberId)

if (!canSend.allowed) {
  return {
    error: `Cannot send: ${canSend.reason}`,
    current: canSend.current,
    limit: canSend.limit
  }
}
```

---

## Testing Data Model Integrity

Before deployment, verify:
1. ✅ No queries missing `companyId` filters
2. ✅ Role checks before accessing user resources
3. ✅ All encryption/decryption for API credentials
4. ✅ Webhook handlers validate company ownership
5. ✅ Message quota enforced before sending
6. ✅ Conversations assigned to correct agent only
7. ✅ Leads accessible only by assigned agent or admin
8. ✅ Templates unique per company
9. ✅ Campaigns scoped to company

---

## Related Documentation

- **[architecture.md](./architecture.md)** - WhatsApp Provider Abstraction Layer deep dive
- **[bmm-workflow-status.yaml](./bmm-workflow-status.yaml)** - Project workflow & status tracking
- **[IMPLEMENTATION_COMPLETE.md](../IMPLEMENTATION_COMPLETE.md)** - Feature implementation summary

---

## Quick Reference: Critical Files

| File | Purpose |
|------|---------|
| [prisma/schema.prisma](../prisma/schema.prisma) | Complete data model |
| [lib/auth.ts](../lib/auth.ts) | Authentication & session |
| [lib/whatsapp-provider.ts](../lib/whatsapp-provider.ts) | Provider abstraction |
| [lib/whatsapp.ts](../lib/whatsapp.ts) | WhatsApp utilities |
| [lib/bitrix.ts](../lib/bitrix.ts) | Bitrix24 integration |
| [lib/stripe.ts](../lib/stripe.ts) | Stripe billing |
| [middleware.ts](../middleware.ts) | Auth middleware |
| [app/api/webhooks/](../app/api/webhooks/) | Webhook handlers |
| [app/(dashboard)/](../app/(dashboard)/) | Protected UI routes |

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-11  
**Author:** Analyst Agent (BMM Method)
