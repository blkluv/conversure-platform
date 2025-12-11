# Easy Panel - Admin Dashboard PRD

**Project:** Conversure UAE Real Estate CRM  
**Feature:** Easy Panel (Admin Dashboard)  
**Document Version:** 1.0  
**Date:** 2025-12-11  
**Status:** DRAFT - Ready for PM Review

---

## Executive Summary

The **Easy Panel** is a comprehensive admin dashboard designed for Company Admins and Super Admins to monitor system health, view real-time analytics, manage billing, and perform user administration. This PRD defines the dashboard's structure, features, and technical requirements.

### Goals
✅ Provide company admins real-time visibility into platform metrics  
✅ Streamline user (agent) management with add/remove functionality  
✅ Display billing and subscription status from Stripe  
✅ Enforce role-based access control at middleware level  
✅ Maintain consistency with existing Conversure UI patterns  

---

## Product Definition

### Product Name
**Easy Panel** - Administrative Dashboard for Conversure

### Target Users
- **COMPANY_ADMIN** - Full company management access
- **SUPER_ADMIN** - System-wide administrative access (future enhancement)

### Access URL
`/dashboard/admin` (protected route)

### Route Protection
- Middleware enforces authentication and role validation
- Only COMPANY_ADMIN and SUPER_ADMIN roles can access
- Redirects to `/login` if unauthenticated
- Redirects to `/dashboard/agent` if insufficient permissions

---

## Feature Set

### 1. Analytics Dashboard (Hero Section)

**Purpose:** Provide at-a-glance metrics for company health and activity.

#### Stat Cards (Responsive Grid: 1-2-3 columns)

**Card 1: Total Leads**
- **Metric:** Count of all leads in company (Lead model)
- **SQL:** `SELECT COUNT(*) FROM Lead WHERE companyId = $1`
- **Description:** "All prospects in system"
- **Icon:** Users (lucide-react)
- **Trend:** Month-over-month change (if available)
- **Data Refreshed:** Every 30 seconds (real-time)

**Card 2: Active Campaigns**
- **Metric:** Count of campaigns with status "running" or "scheduled"
- **SQL:** `SELECT COUNT(*) FROM Campaign WHERE companyId = $1 AND status IN ('running', 'scheduled')`
- **Description:** "Campaigns sending messages"
- **Icon:** Send (lucide-react)
- **Trend:** Week-over-week comparison
- **Variant:** Highlight if > 0 (active)

**Card 3: WhatsApp Message Usage**
- **Metric:** Count of messages sent today (24-hour window)
- **SQL:** `SELECT COUNT(*) FROM Message WHERE conversation.companyId = $1 AND sentAt > NOW() - INTERVAL 1 day`
- **Description:** "Messages today"
- **Icon:** MessageSquare (lucide-react)
- **Limit Display:** "45 / 1000" (current / daily limit from WhatsAppNumber)
- **Progress Bar:** Visual quota usage percentage
- **Color:** Green (under 80%), Yellow (80-95%), Red (>95%)

#### Optional: Mini Chart (Chart.js or Recharts)
- **Title:** "Message Activity (7 Days)"
- **Type:** Line chart showing daily message volume
- **X-Axis:** Days (Mon-Sun)
- **Y-Axis:** Message count
- **Color:** Primary brand color

---

### 2. Billing Status Panel

**Purpose:** Provide subscription and payment visibility.

#### Subscription Card
**Layout:** Horizontal card with company information

**Fields:**
- **Company Name** (from Company.name)
- **Current Plan** (from Company.plan)
  - Display badge: STARTER | GROWTH | PRO | ENTERPRISE
  - Color-coded: Blue (STARTER), Green (GROWTH), Orange (PRO), Purple (ENTERPRISE)
- **Subscription Status** (from Company.subscriptionStatus)
  - Badge: "Active" (green), "Trialing" (blue), "Past Due" (red), "Canceled" (gray)
- **Current Period End** (from Company.currentPeriodEnd)
  - Format: "Dec 31, 2025"
  - Show "Renews in X days" calculation
- **Seats Used** (from Company.seats and actual User count)
  - Display: "3 of 5 seats used"
  - Progress bar showing usage
- **Monthly Cost** (calculated from plan)
  - Display: "$99/month" or per-seat pricing
- **Action Button:** "Manage Subscription" → links to `/dashboard/admin/billing` or Stripe portal

#### Payment History (Optional - Phase 2)
- **Table:** Last 5 transactions from PaymentEvent model
- **Columns:** Date, Amount, Status, Invoice Link
- **Status:** Paid (green), Failed (red), Pending (yellow)

---

### 3. Team & Agent Management

**Purpose:** View, add, and remove agents with quota management.

#### Agent Table
**Layout:** Responsive data table with sorting and filtering

**Columns:**
1. **Name** (User.fullName) - Sortable, Searchable
2. **Email** (User.email) - Sortable, Searchable
3. **Role** (User.role) - Display as badge: AGENT, COMPANY_ADMIN
4. **Status** (User.isActive) - Badge: Active (green), Inactive (gray)
5. **Daily Quota** (AgentQuota.dailyLimit) - Display: "20/50 used today"
6. **Messages Sent Today** (AgentQuota.messagesSentToday)
7. **Actions** - Edit | Deactivate | Delete

**Row Actions:**
- **Edit** - Open modal to update agent details (fullName, phone, daily quota)
- **Deactivate** - Soft delete (set User.isActive = false)
- **Delete** - Permanent delete with confirmation modal (cascades to assignments)

#### Add Agent Modal
**Trigger Button:** "Add Agent" (top-right, primary color)

**Form Fields:**
```
┌────────────────────────────┐
│ Add New Agent              │
├────────────────────────────┤
│ Full Name *                │
│ [_____________________]    │
│                            │
│ Email *                    │
│ [_____________________]    │
│ (validation: unique)       │
│                            │
│ Phone (optional)           │
│ [_____________________]    │
│                            │
│ Daily Message Quota *      │
│ [_____________________]    │
│ (default: 50)              │
│                            │
│ Set Password *             │
│ [_____________________]    │
│ (temporary pwd sent via email) │
│                            │
│ [Cancel] [Create Agent]    │
└────────────────────────────┘
```

**Validation:**
- Email: Unique within company, valid format
- Full Name: Required, max 100 chars
- Daily Quota: Number, min 1, max 1000
- Password: Min 8 chars, complexity rules

**On Create:**
- Create User record with AGENT role
- Create AgentQuota record with specified limit
- Send email invitation with temporary password
- Redirect to agent list on success
- Show success toast: "Agent created successfully"

#### Deactivate Agent Modal
**Confirmation:**
```
┌────────────────────────────┐
│ Deactivate Agent?          │
├────────────────────────────┤
│ Are you sure you want to   │
│ deactivate [Name]?         │
│                            │
│ They will lose access to   │
│ the platform immediately.  │
│                            │
│ [Cancel] [Deactivate]      │
└────────────────────────────┘
```

**On Confirm:**
- Set User.isActive = false
- Reassign their conversations to pool (optional: Admin selects reassignment)
- Clear their AgentQuota
- Show success toast: "Agent deactivated"

#### Delete Agent Modal
**Confirmation:**
```
┌────────────────────────────┐
│ Delete Agent Permanently?  │
├────────────────────────────┤
│ WARNING: This action       │
│ cannot be undone.          │
│                            │
│ Associated conversations   │
│ will be unassigned.        │
│ Agent messages remain.     │
│                            │
│ [Cancel] [Delete]          │
└────────────────────────────┘
```

**On Confirm:**
- Delete User record (cascades per Prisma schema)
- Unassign conversations (set agentId = null)
- Delete AgentQuota
- Log deletion event (audit trail)
- Show success toast: "Agent deleted"

---

### 4. WhatsApp Integration Status (Information Panel)

**Purpose:** Display current WhatsApp provider and connectivity status.

**Layout:** Card with integration details

**Fields:**
- **Provider** (CompanySettings.whatsappProvider)
  - Display: "WABA" | "Chatwoot" | "Evolution"
  - Icon: Integration-specific logo
- **Connection Status** (Company.wabaStatus)
  - Badge: CONNECTED (green), PENDING (yellow), ERROR (red)
- **WhatsApp Business Number** (Company.whatsappBusinessNumber)
  - Display: "+971501234567"
  - Show registered numbers count
- **Last Activity** (Max sentAt from Message)
  - Format: "5 minutes ago" (relative time)
- **Warm-up Stage** (Company.warmupStage)
  - Display: "Week 2 of 4 warm-up"
  - Progress bar: ██░░
  - Show daily limit progression
- **Action Button:** "Configure" → `/dashboard/admin/settings` (future)

---

### 5. Quick Actions Bar (Floating or Bottom Toolbar)

**Purpose:** Fast access to common admin tasks.

**Buttons:**
1. **View Reports** → `/dashboard/admin/reports` (phase 2)
2. **Export Data** → Download CSV of leads/contacts (phase 2)
3. **System Logs** → View error/activity logs (phase 2)
4. **Help & Support** → Link to docs or support chat

---

## Page Layout & Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ Conversure / Easy Panel Admin Dashboard       [User] [Logout]│
├──────────────────┬──────────────────────────────────────────┤
│ Dashboard        │                                           │
│ Agents           │  ANALYTICS SECTION                        │
│ Leads            │  ┌─────────────┬─────────────┬─────────┐ │
│ Settings         │  │ Total Leads │ Active Cmps │ Messages │ │
│ Compliance       │  │     142     │      3      │  245/1K  │ │
│                  │  └─────────────┴─────────────┴─────────┘ │
│                  │                                           │
│                  │  BILLING & SUBSCRIPTION                   │
│                  │  ┌─────────────────────────────────────┐ │
│                  │  │ Plan: PRO | Status: Active          │ │
│                  │  │ Renews in 12 days | 5 of 10 seats   │ │
│                  │  │ $399/month | [Manage Subscription]  │ │
│                  │  └─────────────────────────────────────┘ │
│                  │                                           │
│                  │  WHATSAPP INTEGRATION                     │
│                  │  ┌─────────────────────────────────────┐ │
│                  │  │ Provider: WABA | Status: Connected  │ │
│                  │  │ Number: +971501234567               │ │
│                  │  │ Warm-up: Week 2 (██░░)              │ │
│                  │  │ Last Activity: 2 minutes ago         │ │
│                  │  └─────────────────────────────────────┘ │
│                  │                                           │
│                  │  TEAM & AGENTS                            │
│                  │  [+ Add Agent]                            │
│                  │  ┌─────────────────────────────────────┐ │
│                  │  │ Name  │ Email  │ Status │ Actions  │ │
│                  │  ├─────────────────────────────────────┤ │
│                  │  │ Ahmad │ a@... │ Active │ ... Edit  │ │
│                  │  │ Fatima│ f@... │ Active │ ... Edit  │ │
│                  │  │ Omar  │ o@... │ Inact. │ ... Edit  │ │
│                  │  └─────────────────────────────────────┘ │
│                  │                                           │
└──────────────────┴──────────────────────────────────────────┘
```

---

## User Stories & Acceptance Criteria

### Story 1: View Dashboard Analytics
**As a** Company Admin  
**I want** to see real-time metrics for leads, campaigns, and message usage  
**So that** I can monitor system health and activity at a glance

**Acceptance Criteria:**
- [ ] Dashboard loads within 2 seconds
- [ ] Stat cards display correct counts from database
- [ ] WhatsApp message card shows current usage + daily limit
- [ ] Progress bar color changes based on quota percentage
- [ ] Data refreshes every 30 seconds via polling or WebSocket
- [ ] Mobile view shows cards stacked vertically
- [ ] Unauthenticated users are redirected to login

### Story 2: View Subscription Status
**As a** Company Admin  
**I want** to see my current subscription plan and renewal date  
**So that** I don't accidentally run out of seats or miss renewal deadlines

**Acceptance Criteria:**
- [ ] Plan badge displays correct subscription tier
- [ ] Subscription status shows current state (Active/Trialing/Past Due/Canceled)
- [ ] Days until renewal are calculated and displayed
- [ ] Seat usage shows X of Y format with progress bar
- [ ] "Manage Subscription" button links to Stripe portal
- [ ] Monthly cost is visible

### Story 3: Add New Agent
**As a** Company Admin  
**I want** to add a new agent to my team  
**So that** they can start using the platform immediately

**Acceptance Criteria:**
- [ ] Modal form validates all required fields
- [ ] Email must be unique within company
- [ ] Agent is created with AGENT role
- [ ] AgentQuota is created with specified daily limit
- [ ] Invitation email is sent with temporary password
- [ ] Success message is shown
- [ ] New agent appears in table immediately (no page refresh)
- [ ] Form validation shows field-level error messages

### Story 4: Deactivate Agent
**As a** Company Admin  
**I want** to deactivate an agent  
**So that** they cannot access the platform anymore

**Acceptance Criteria:**
- [ ] Confirmation modal is shown before deactivation
- [ ] Agent status changes to "Inactive" in table
- [ ] Agent loses access to platform on next login attempt
- [ ] Conversations remain in system (not deleted)
- [ ] Success message is shown
- [ ] Admin can reactivate agent later (Story 5, Phase 2)

### Story 5: Delete Agent
**As a** Company Admin  
**I want** to permanently remove an agent from the system  
**So that** I can clean up inactive users

**Acceptance Criteria:**
- [ ] Confirmation modal warns about permanent deletion
- [ ] Agent record is deleted from database
- [ ] Associated conversations are unassigned (agentId set to null)
- [ ] Messages by agent remain in audit trail
- [ ] Success message is shown
- [ ] Deleted agent no longer appears in table
- [ ] Cannot be undone

### Story 6: Search & Filter Agents
**As a** Company Admin  
**I want** to search agents by name or email and filter by status  
**So that** I can quickly find agents in large teams

**Acceptance Criteria:**
- [ ] Search box filters agents by name or email in real-time
- [ ] Filter dropdown shows: All, Active, Inactive
- [ ] Search and filters work together (AND logic)
- [ ] No page refresh required (client-side filtering)
- [ ] Results update as user types

### Story 7: View WhatsApp Integration Status
**As a** Company Admin  
**I want** to see my WhatsApp provider and connection status  
**So that** I know if messaging is working properly

**Acceptance Criteria:**
- [ ] Provider name is displayed (WABA, Chatwoot, Evolution)
- [ ] Connection status shows with color-coded badge
- [ ] WhatsApp business number is visible
- [ ] Last activity timestamp is shown
- [ ] Warm-up week and progress are visible
- [ ] If disconnected, action button shows troubleshooting steps

---

## Data Model Requirements

### Required Models (from Prisma schema)

**Company** (parent entity)
```prisma
- id: String @id
- name: String
- plan: Plan (STARTER | GROWTH | PRO | ENTERPRISE)
- subscriptionStatus: String
- currentPeriodEnd: DateTime?
- seats: Int
- whatsappBusinessNumber: String?
- wabaStatus: WabaStatus
- warmupStage: Int
```

**User** (team members)
```prisma
- id: String @id
- fullName: String
- email: String @unique
- phone: String?
- role: UserRole (SUPER_ADMIN | COMPANY_ADMIN | AGENT)
- isActive: Boolean
- companyId: String
- createdAt: DateTime
```

**AgentQuota** (message limits)
```prisma
- id: String @id
- agentId: String @unique
- companyId: String
- dailyLimit: Int
- messagesSentToday: Int
- resetAt: DateTime
```

**Lead** (prospects)
```prisma
- id: String @id
- companyId: String
- name: String
- phone: String
- email: String?
- status: LeadStatus
- createdAt: DateTime
```

**Campaign** (bulk messaging)
```prisma
- id: String @id
- companyId: String
- name: String
- status: String (scheduled | running | completed | paused | failed)
- scheduledAt: DateTime
- createdAt: DateTime
```

**Message** (chat messages)
```prisma
- id: String @id
- conversationId: String
- senderId: String?
- direction: MessageDirection (INBOUND | OUTBOUND)
- sentAt: DateTime
- conversation: Conversation (to get companyId)
```

**CompanySettings** (provider config)
```prisma
- id: String @id
- companyId: String
- whatsappProvider: WhatsappProvider (WABA | CHATWOOT | EVOLUTION)
```

---

## Technical Requirements

### Frontend

**Technology Stack:**
- Framework: Next.js 14 (App Router)
- UI Library: Shadcn/ui (existing components)
- Styling: Tailwind CSS (existing configuration)
- Icons: Lucide React
- State Management: React hooks (useState, useEffect)
- Forms: React Hook Form + Zod validation
- HTTP Client: fetch API (native)

**Component Structure:**
```
app/(dashboard)/admin/
├── page.tsx                          # Main dashboard
├── layout.tsx                        # Admin layout (sidebar)
└── components/
    ├── StatsSection.tsx              # Analytics cards
    ├── BillingPanel.tsx              # Subscription info
    ├── WhatsAppStatus.tsx            # Integration status
    ├── AgentTable.tsx                # Team table
    ├── AddAgentModal.tsx             # Create agent form
    ├── DeactivateAgentModal.tsx      # Deactivate confirmation
    └── DeleteAgentModal.tsx          # Delete confirmation
```

**Responsive Design:**
- Desktop: 3-column grid for stat cards
- Tablet (768px): 2-column grid
- Mobile (640px): 1-column stack
- All modals stack on mobile with full-height form

**Accessibility:**
- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Color contrast meets WCAG AA standard
- Focus indicators on all buttons
- Form error messages linked to inputs

### Backend / API

**Endpoints Required:**

#### GET /api/admin/dashboard/metrics
**Purpose:** Fetch dashboard analytics

**Request:**
```
GET /api/admin/dashboard/metrics
Headers: { Authorization: Bearer $token }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLeads": 142,
    "activeCampaigns": 3,
    "messagesToday": 245,
    "dailyLimit": 1000,
    "trend": {
      "leads": 5,           // +5% vs last month
      "campaigns": -2,      // -2% vs last month
      "messages": 12        // +12% vs yesterday
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Unauthorized or company not found"
}
```

---

#### GET /api/admin/billing/status
**Purpose:** Fetch subscription status

**Request:**
```
GET /api/admin/billing/status
Headers: { Authorization: Bearer $token }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "PRO",
    "status": "active",
    "currentPeriodEnd": "2025-12-31",
    "seatsUsed": 5,
    "seatsTotal": 10,
    "monthlyCost": 399,
    "stripePortalUrl": "https://billing.stripe.com/..."
  }
}
```

---

#### GET /api/admin/agents
**Purpose:** List all agents in company

**Request:**
```
GET /api/admin/agents?search=ahmad&status=active
Headers: { Authorization: Bearer $token }
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_1",
      "fullName": "Ahmad",
      "email": "ahmad@company.com",
      "phone": "+971501234567",
      "role": "AGENT",
      "isActive": true,
      "dailyLimit": 50,
      "messagesSentToday": 45,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pageSize": 10
  }
}
```

---

#### POST /api/admin/agents
**Purpose:** Create new agent

**Request:**
```
POST /api/admin/agents
Content-Type: application/json
Headers: { Authorization: Bearer $token }

{
  "fullName": "Sarah",
  "email": "sarah@company.com",
  "phone": "+971501234567",
  "dailyLimit": 50,
  "password": "SecurePass123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "user_2",
    "fullName": "Sarah",
    "email": "sarah@company.com",
    "role": "AGENT",
    "isActive": true
  },
  "message": "Agent created. Invitation email sent."
}
```

**Errors:**
```json
{
  "success": false,
  "error": "Email already exists",
  "field": "email"
}
```

---

#### PATCH /api/admin/agents/[id]
**Purpose:** Update agent details

**Request:**
```
PATCH /api/admin/agents/user_1
Content-Type: application/json
Headers: { Authorization: Bearer $token }

{
  "fullName": "Ahmad Updated",
  "phone": "+971501234567",
  "dailyLimit": 60,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated agent */ }
}
```

---

#### DELETE /api/admin/agents/[id]?action=deactivate
**Purpose:** Deactivate agent (soft delete)

**Request:**
```
DELETE /api/admin/agents/user_1?action=deactivate
Headers: { Authorization: Bearer $token }
```

**Response:**
```json
{
  "success": true,
  "message": "Agent deactivated"
}
```

---

#### DELETE /api/admin/agents/[id]?action=delete
**Purpose:** Permanently delete agent

**Request:**
```
DELETE /api/admin/agents/user_1?action=delete
Headers: { Authorization: Bearer $token }
```

**Response:**
```json
{
  "success": true,
  "message": "Agent deleted permanently"
}
```

---

#### GET /api/admin/whatsapp/status
**Purpose:** Fetch WhatsApp integration status

**Request:**
```
GET /api/admin/whatsapp/status
Headers: { Authorization: Bearer $token }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": "WABA",
    "status": "CONNECTED",
    "businessNumber": "+971501234567",
    "warmupWeek": 2,
    "warmupLimit": 50,
    "lastActivity": "2025-12-11T14:30:00Z",
    "numbersActive": 1
  }
}
```

---

### Middleware & Security

**Authentication Middleware:** [middleware.ts](../middleware.ts)
```typescript
// Protect /dashboard/admin routes
if (pathname.startsWith("/dashboard/admin")) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  // Allow COMPANY_ADMIN and SUPER_ADMIN only
  if (!["COMPANY_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.redirect(new URL("/dashboard/agent", request.url))
  }
}
```

**Authorization Checks in API Routes:**
```typescript
// All /api/admin/* routes must verify:
1. User is authenticated (session exists)
2. User has COMPANY_ADMIN or SUPER_ADMIN role
3. If COMPANY_ADMIN: can only access own company data
4. If SUPER_ADMIN: can access all companies
```

**Data Isolation:**
```typescript
// Every query must include companyId filter
const agents = await db.user.findMany({
  where: {
    companyId: session.companyId,  // ← CRITICAL
    role: "AGENT"
  }
})
```

---

## UI/UX Patterns

### Color Scheme
- **Primary:** Blue (from existing Conversure brand)
- **Success:** Green (active, connected)
- **Warning:** Amber (trials, warnings)
- **Error:** Red (disconnected, failed)
- **Neutral:** Gray (inactive)

### Typography
- **Headings:** Bold, 24-32px
- **Labels:** Medium weight, 12-14px
- **Body:** Regular, 14-16px
- **Monospace:** For phone numbers, IDs

### Spacing & Layout
- **Card padding:** 24px (6 Tailwind units)
- **Section spacing:** 32px
- **Table row height:** 56px (lg)
- **Modal max-width:** 500px

### Interactions
- **Hover states:** Background slight lighten, cursor pointer
- **Active states:** Border left highlight color
- **Loading states:** Spinner or skeleton loaders
- **Toast notifications:** Top-right corner, auto-dismiss after 5s
- **Confirmations:** Modal with destructive action button (red)

### Icons (Lucide React)
- Users → Agent list
- Send → Active campaigns
- MessageSquare → Message usage
- CreditCard → Billing
- Activity → WhatsApp status
- Plus → Add agent
- MoreVertical → Row actions
- Trash2 → Delete action
- UserX → Deactivate action

---

## Success Metrics

### Adoption
- [ ] 100% of company admins use dashboard within first month
- [ ] Average session duration > 5 minutes
- [ ] Return rate > 80% (weekly active users)

### Performance
- [ ] Dashboard page load < 2 seconds (on 4G)
- [ ] API responses < 500ms
- [ ] Mobile usability score ≥ 90 (Lighthouse)

### Data Accuracy
- [ ] Metrics refresh within 30 seconds of real activity
- [ ] Zero data isolation breaches (audit logs)
- [ ] 100% form validation pass rate

### User Satisfaction
- [ ] Feature rating ≥ 4.5/5 (if surveyed)
- [ ] Support tickets < 5 per 100 users
- [ ] Error rates < 0.1%

---

## Implementation Phases

### Phase 1 (MVP) - Current Sprint
✅ Analytics dashboard (3 stat cards + message usage)  
✅ Billing status panel  
✅ WhatsApp integration status card  
✅ Agent table with search/filter  
✅ Add agent modal  
✅ Deactivate agent  
✅ Route protection middleware  
✅ Mobile responsive design  

### Phase 2 (Enhancement)
- [ ] Agent history & activity log
- [ ] Edit agent daily quota
- [ ] Reactivate deactivated agents
- [ ] Export agents to CSV
- [ ] Message activity chart (7-day)
- [ ] Campaign performance mini-dashboard
- [ ] Real-time notifications (WebSocket)
- [ ] Admin audit logs

### Phase 3 (Advanced)
- [ ] Multi-company dashboard (SUPER_ADMIN)
- [ ] Advanced analytics & custom reports
- [ ] Bulk agent operations (CSV import)
- [ ] Role customization & permissions
- [ ] Team invite system (send bulk invites)
- [ ] Usage trends & forecasting

---

## Dependencies & Integrations

### Frontend Dependencies (Existing)
- ✅ next@latest
- ✅ react@latest
- ✅ @radix-ui/react-* (dialogs, forms)
- ✅ tailwindcss
- ✅ lucide-react
- ✅ react-hook-form
- ✅ zod

### Backend Dependencies (Existing)
- ✅ @prisma/client
- ✅ next/server (middleware)

### External Services
- ✅ Stripe API (subscription data)
- ✅ PostgreSQL (Prisma ORM)

### No New Dependencies Required ✅

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Data leakage across companies | CRITICAL | Middleware + companyId filter in all queries |
| Agent deletion cascades unintended | HIGH | Soft delete first (deactivate), hard delete requires confirmation |
| Rate limiting on API calls | MEDIUM | Add rate limiting to /api/admin/* endpoints |
| Large agent tables (1000+ agents) | MEDIUM | Implement pagination & server-side filtering |
| Concurrent agent creation | LOW | Database unique constraint on email |

---

## Acceptance Checklist

- [ ] All user stories passing acceptance criteria
- [ ] Middleware properly protects /dashboard/admin
- [ ] All data queries include companyId filter
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive on 360px, 768px, 1920px viewports
- [ ] Form validation messages are user-friendly
- [ ] API error responses handled gracefully
- [ ] Loading states shown during async operations
- [ ] Success/error toasts notify user of actions
- [ ] Deleted data logged for audit trail
- [ ] Performance: Dashboard load < 2 seconds
- [ ] Accessibility: Keyboard navigation works
- [ ] Documentation updated (API, components)

---

## Open Questions & Clarifications

1. **Super Admin Access?**
   - Should SUPER_ADMIN see all companies' dashboards?
   - If yes, need company selector in nav

2. **Agent Reassignment on Deletion?**
   - Auto-unassign conversations or prompt admin to select new agent?
   - Should messages remain in audit trail?

3. **Email Notifications?**
   - Send welcome email to new agents with temporary password?
   - Notify admin when agent quotas exceeded?

4. **Real-time Updates?**
   - Use polling (30s refresh) or WebSocket for live data?
   - Impact on server load?

5. **Bulk Operations?**
   - Future: Bulk add agents via CSV upload?
   - Bulk deactivate/delete?

6. **Audit Trail?**
   - Store all admin actions in separate AuditLog table?
   - Show in separate "Activity Log" page?

---

## Glossary

| Term | Definition |
|------|-----------|
| COMPANY_ADMIN | User role with full company management access |
| SUPER_ADMIN | User role with system-wide access (future) |
| AGENT | Standard user role for CRM agents |
| Daily Limit | Max messages an agent can send per day |
| Warm-up | Gradual increase of WhatsApp daily limits (Week 1-4+) |
| WABA | WhatsApp Business API (Meta/360dialog/Twilio) |
| Stripe Portal | Customer-facing subscription management UI |

---

## Reference Documents

- [docs/index.md](../docs/index.md) - System architecture & data models
- [docs/architecture.md](../docs/architecture.md) - WhatsApp provider abstraction
- [prisma/schema.prisma](../prisma/schema.prisma) - Complete data schema
- [lib/auth.ts](../lib/auth.ts) - Authentication functions
- [middleware.ts](../middleware.ts) - Route protection
- [package.json](../package.json) - Dependencies

---

## Approval & Sign-Off

| Role | Name | Date | Sign-Off |
|------|------|------|----------|
| Product Manager | [PM Name] | 2025-12-11 | ⬜ Pending |
| Engineering Lead | [Lead Name] | - | ⬜ Pending |
| Designer | [Designer Name] | - | ⬜ Pending |

---

**Document Status:** DRAFT - Ready for Review  
**Next Step:** PM Review & Architect Design Phase  
**Expected Timeline:** 2-3 weeks (MVP)

---

*PRD Version 1.0 | Generated: 2025-12-11 | Author: PM Agent (BMM Method)*
