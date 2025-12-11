# Easy Panel - Epics & Stories Backlog

**Project:** Conversure UAE Real Estate CRM  
**Feature:** Easy Panel (Admin Dashboard)  
**Document Version:** 1.0  
**Date:** 2025-12-11  
**Status:** READY FOR SPRINT PLANNING

---

## Overview

This document breaks down the Easy Panel PRD into **4 Epics** and **20 Stories**, structured for sprint delivery. Each story is sized for a single developer to complete in one pass, with clear acceptance criteria including multi-tenant isolation verification.

**Epic Distribution:**
- **Epic 1: Analytics Dashboard** (5 stories)
- **Epic 2: Billing Management** (4 stories)
- **Epic 3: Agent Lifecycle** (8 stories)
- **Epic 4: WhatsApp Integration Status** (3 stories)

---

## Epic 1: Analytics Dashboard

**Epic Goal:** Provide real-time visibility into company health with three stat cards (Total Leads, Active Campaigns, WhatsApp Message Usage).

**Epic Scope:**
- Implement getDashboardMetrics Server Action
- Create StatsSection component with 3 stat cards
- Implement 30-second auto-refresh
- Handle loading and error states
- Display quota usage progress bar with color coding

**Dependencies:** None (core feature)

**Risk:** None identified

---

### Story 1.1: Create getDashboardMetrics Server Action

**Objective:** Build server-side data fetching function for dashboard analytics

**Description:**
Create a Server Action in `lib/actions/admin.ts` that queries lead, campaign, and message data for the authenticated company. The function must enforce role-based access control, apply company-scoped filtering, and calculate month-over-month/week-over-week trends.

**Acceptance Criteria:**
- [ ] Server Action exports `getDashboardMetrics()` from `lib/actions/admin.ts`
- [ ] Function calls `requireAuth()` to verify session
- [ ] Function calls `requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])` for authorization
- [ ] Queries `Lead` table with `companyId` filter → totalLeads count
- [ ] Queries `Campaign` table with `companyId` AND status IN ('running', 'scheduled') → activeCampaigns count
- [ ] Queries `Message` table with companyId filter AND sentAt > NOW() - INTERVAL 1 day → messagesToday count
- [ ] Queries `WhatsAppNumber` table with companyId filter → sums dailyLimit to get dailyLimit value
- [ ] Calculates trend percentages:
  - Leads: (current - last 30 days count) / last 30 days count * 100
  - Campaigns: (current - last 7 days count) / last 7 days count * 100
  - Messages: (today - yesterday count) / yesterday count * 100
- [ ] Returns Zod-validated response schema with success/data/error fields
- [ ] **Verify multi-tenant isolation:** Server Action only returns data for user's company (companyId must be in every query)
- [ ] **Verify multi-tenant isolation:** Create test with two companies to ensure no data leakage
- [ ] Handles missing companyId or invalid session gracefully
- [ ] No new npm dependencies required

**Technical Details:**
- **File:** `lib/actions/admin.ts`
- **Dependencies:** Prisma ORM, lib/auth.ts utilities, Zod
- **Return Schema:**
  ```typescript
  {
    success: boolean
    data?: {
      totalLeads: number
      activeCampaigns: number
      messagesToday: number
      dailyLimit: number
      trend: {
        leads: number
        campaigns: number
        messages: number
      }
    }
    error?: string
  }
  ```
- **Auth Layer:** requireAuth() + requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])
- **DB Layer:** companyId filter on all queries

**Story Points:** 5

---

### Story 1.2: Create StatsSection Component with 3 Stat Cards

**Objective:** Build responsive UI component displaying three analytics cards

**Description:**
Create a React component in `app/(dashboard)/admin/components/StatsSection.tsx` that renders three stat cards in a responsive grid. Each card displays a metric, trend percentage, icon, and (for WhatsApp usage) a progress bar. Component will call `getDashboardMetrics()` and handle loading/error states.

**Acceptance Criteria:**
- [ ] Component exports `StatsSection` from `app/(dashboard)/admin/components/StatsSection.tsx`
- [ ] Component uses `useState` for loading/error states
- [ ] Component uses `useEffect` to call `getDashboardMetrics()` on mount
- [ ] Card 1 displays: Total Leads count, icon (Users from lucide), trend percentage, "All prospects in system" description
- [ ] Card 2 displays: Active Campaigns count, icon (Send from lucide), trend percentage, "Campaigns sending messages" description
- [ ] Card 3 displays: Messages today count, icon (MessageSquare from lucide), progress bar showing usage/limit
- [ ] Progress bar color-codes: Green (<80%), Yellow (80-95%), Red (>95%)
- [ ] Progress bar displays "45 / 1000" formatted text
- [ ] Grid is responsive: 3 columns on desktop (lg), 2 columns on tablet (md), 1 column on mobile (sm)
- [ ] Shows skeleton loader while fetching
- [ ] Shows error toast if query fails
- [ ] Uses existing Shadcn/ui components (Card, Badge, Button)
- [ ] Uses Tailwind CSS for styling (no inline styles)
- [ ] No new npm dependencies required

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/StatsSection.tsx`
- **Dependencies:** React hooks, getDashboardMetrics Server Action, lucide-react, shadcn/ui, tailwind
- **Props:** `None` (uses session context from Server Component)
- **State:** `{ loading, error, metrics }`
- **Import Reference:**
  ```typescript
  import { getDashboardMetrics } from '@/lib/actions/admin'
  import { Card, CardContent, CardDescription } from '@/components/ui/card'
  import { Users, Send, MessageSquare } from 'lucide-react'
  ```

**Story Points:** 5

---

### Story 1.3: Implement 30-Second Auto-Refresh for Metrics

**Objective:** Update stat cards automatically every 30 seconds for real-time data

**Description:**
Enhance StatsSection component to re-fetch metrics every 30 seconds using setInterval. Include logic to prevent stale updates and handle concurrent fetches gracefully.

**Acceptance Criteria:**
- [ ] Component sets up setInterval in useEffect with 30-second delay
- [ ] Each interval calls `getDashboardMetrics()` to refresh data
- [ ] Cleanup function clears interval on component unmount
- [ ] Prevents multiple concurrent requests (uses ref to track in-flight requests)
- [ ] New data updates smoothly without UI flicker
- [ ] Loading state shows only on initial mount, not on refresh intervals
- [ ] If refresh fails, error is logged but UI remains responsive (doesn't break)
- [ ] User can manually refresh by clicking a "Refresh" button (optional enhancement)
- [ ] Performance: No memory leaks from uncleaned intervals

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/StatsSection.tsx`
- **Key Patterns:**
  ```typescript
  useEffect(() => {
    const interval = setInterval(async () => {
      // Only refresh if not already loading
      if (!loadingRef.current) {
        await refreshMetrics()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  ```

**Story Points:** 3

---

### Story 1.4: Add Loading Skeleton for Stat Cards

**Objective:** Display skeleton loaders while metrics are being fetched

**Description:**
Add skeleton/placeholder states to StatsSection to show loading indicators for each stat card while data is being fetched.

**Acceptance Criteria:**
- [ ] While loading=true, display 3 skeleton cards in same grid layout
- [ ] Each skeleton shows placeholder for: number value, trend percentage, icon area, description
- [ ] Skeleton uses Shadcn/ui Skeleton component or simple CSS animation
- [ ] Skeleton animates smoothly (pulse or shimmer effect)
- [ ] Skeleton disappears immediately once data loads
- [ ] On refresh intervals, skeleton does NOT show (only show on initial mount)
- [ ] Accessible: aria-label explains what's loading

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/StatsSection.tsx`
- **Dependencies:** Shadcn/ui Skeleton component
- **Pattern:** Conditional rendering based on loading state

**Story Points:** 2

---

### Story 1.5: Handle Errors and Edge Cases in Metrics Display

**Objective:** Gracefully handle missing data, API errors, and edge cases

**Description:**
Add error handling to StatsSection to handle API failures, invalid responses, zero values, and other edge cases. Display helpful error messages and fallback values.

**Acceptance Criteria:**
- [ ] If `getDashboardMetrics()` returns error, display error toast with message
- [ ] If metrics are null/undefined, show "No data available" state
- [ ] If trend calculation results in Infinity/NaN, display "—" instead
- [ ] If dailyLimit is 0, show quota bar at 0% (not crash)
- [ ] If messagesToday > dailyLimit, show 100% usage (cap at 100%)
- [ ] Display helpful text: "Failed to load metrics. Please try again later."
- [ ] Error doesn't prevent page from rendering (partial failure is acceptable)
- [ ] Log error to console for debugging
- [ ] No error toast flashing during 30-second refreshes (only on initial fetch fail)

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/StatsSection.tsx`
- **Dependencies:** toast/notification component from shadcn/ui

**Story Points:** 3

---

## Epic 2: Billing Management

**Epic Goal:** Display subscription and payment information with plan details, renewal dates, seat usage, and Stripe portal link.

**Epic Scope:**
- Implement getBillingStatus Server Action
- Create BillingPanel component showing plan, status, seats, renewal date
- Link to Stripe customer portal
- Format dates and currency properly

**Dependencies:** None (core feature)

**Risk:** None identified

---

### Story 2.1: Create getBillingStatus Server Action

**Objective:** Fetch subscription and billing data from Company and Stripe

**Description:**
Create a Server Action in `lib/actions/admin.ts` that queries Company subscription data and returns plan details, seat usage, renewal dates, and Stripe portal URL.

**Acceptance Criteria:**
- [ ] Server Action exports `getBillingStatus()` from `lib/actions/admin.ts`
- [ ] Function calls `requireAuth()` to verify session
- [ ] Function calls `requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])` for authorization
- [ ] Queries Company record with companyId filter → extracts plan, subscriptionStatus, currentPeriodEnd, seats
- [ ] Counts active users: `SELECT COUNT(*) FROM User WHERE companyId = $1 AND isActive = true` → seatsUsed
- [ ] Retrieves Stripe price data (from Company.stripeCustomerId if available) → monthlyCost
- [ ] Generates Stripe Customer Portal URL via Stripe API (using lib/stripe.ts existing client)
- [ ] Returns Zod-validated response schema
- [ ] **Verify multi-tenant isolation:** companyId filter on all queries, no cross-company data
- [ ] **Verify multi-tenant isolation:** Stripe portal URL scoped to user's company only
- [ ] Handles missing Stripe customer gracefully (returns null for portal URL if not linked)
- [ ] Formats dates as ISO strings for client consumption

**Technical Details:**
- **File:** `lib/actions/admin.ts`
- **Dependencies:** Prisma ORM, lib/stripe.ts, lib/auth.ts, Zod
- **Return Schema:**
  ```typescript
  {
    success: boolean
    data?: {
      plan: "STARTER" | "GROWTH" | "PRO" | "ENTERPRISE"
      status: "active" | "trialing" | "past_due" | "canceled"
      currentPeriodEnd: string (ISO date)
      seatsUsed: number
      seatsTotal: number
      monthlyCost: number (cents, e.g., 39900 for $399)
      stripePortalUrl: string | null
    }
    error?: string
  }
  ```
- **Auth Layer:** requireAuth() + requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])
- **DB Layer:** companyId filter

**Story Points:** 5

---

### Story 2.2: Create BillingPanel Component

**Objective:** Build UI component displaying subscription and billing information

**Description:**
Create a React component in `app/(dashboard)/admin/components/BillingPanel.tsx` that renders billing information in a card layout. Shows plan badge, status badge, seat usage, renewal date, monthly cost, and Stripe portal link.

**Acceptance Criteria:**
- [ ] Component exports `BillingPanel` from `app/(dashboard)/admin/components/BillingPanel.tsx`
- [ ] Component uses `useState` for loading/error states
- [ ] Component uses `useEffect` to call `getBillingStatus()` on mount
- [ ] Displays Company Name at top of card
- [ ] Displays Plan badge with color-coding: Blue (STARTER), Green (GROWTH), Orange (PRO), Purple (ENTERPRISE)
- [ ] Displays Status badge: "Active" (green), "Trialing" (blue), "Past Due" (red), "Canceled" (gray)
- [ ] Displays "Current Period End" with date formatted as "Dec 31, 2025"
- [ ] Displays "Seats Used" as "5 / 10" (used / total)
- [ ] Displays "Monthly Cost" as "$399.00" (formatted currency from cents)
- [ ] Displays "Manage Subscription" button that links to `stripePortalUrl` (opens in new tab)
- [ ] Shows skeleton loader while fetching
- [ ] Shows error message if query fails
- [ ] Uses existing Shadcn/ui components (Card, Badge, Button)
- [ ] Responsive layout: full-width card on mobile, constrained width on desktop
- [ ] No new npm dependencies required

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/BillingPanel.tsx`
- **Dependencies:** React hooks, getBillingStatus Server Action, shadcn/ui, tailwind
- **Props:** `None`
- **State:** `{ loading, error, billing }`
- **Helper:** Format cents to USD: `$${(monthlyCost / 100).toFixed(2)}`

**Story Points:** 4

---

### Story 2.3: Format Dates and Currency Properly

**Objective:** Ensure consistent date/currency formatting across BillingPanel

**Description:**
Implement date and currency formatting utilities to consistently format dates (ISO → "MMM DD, YYYY") and currency (cents → "$X.XX") throughout the billing panel.

**Acceptance Criteria:**
- [ ] Create `lib/format.ts` with `formatDate(isoString): string` function
- [ ] formatDate returns format like "Dec 31, 2025"
- [ ] Create `formatCurrency(cents): string` function returning "$X.XX"
- [ ] formatCurrency handles edge cases: 0 → "$0.00", 39900 → "$399.00", 1 → "$0.01"
- [ ] Both functions use native JavaScript Date and Intl APIs (no new deps)
- [ ] Use functions in BillingPanel for all date/currency displays
- [ ] Also use in other components that display dates/currency (future-proofing)
- [ ] Functions have TypeScript types

**Technical Details:**
- **File:** `lib/format.ts` (new file)
- **Export:** `export function formatDate(isoString: string): string`
- **Export:** `export function formatCurrency(cents: number): string`
- **Dependencies:** None (native APIs)

**Story Points:** 2

---

### Story 2.4: Add Stripe Portal Link and "Manage Subscription" Button

**Objective:** Enable admins to manage subscription in Stripe portal

**Description:**
Enhance BillingPanel to include a prominent "Manage Subscription" button that redirects to Stripe Customer Portal. Handle cases where Stripe portal URL is not available.

**Acceptance Criteria:**
- [ ] Button labeled "Manage Subscription" or "Manage" (depending on space)
- [ ] Button link opens `stripePortalUrl` in new tab (`target="_blank"`)
- [ ] Button is styled as primary action (uses Shadcn/ui Button with primary variant)
- [ ] Button disabled if `stripePortalUrl` is null (with tooltip: "Not connected to Stripe")
- [ ] Button includes icon (e.g., ExternalLink from lucide)
- [ ] Clicking button opens portal without page reload
- [ ] Portal URL is safe to use (no XSS injection risk)
- [ ] **Verify multi-tenant isolation:** Portal URL is generated per-company, not shared across companies
- [ ] Button accessible: proper ARIA labels and keyboard navigation

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/BillingPanel.tsx`
- **Pattern:**
  ```typescript
  <a href={stripePortalUrl} target="_blank" rel="noopener noreferrer">
    <Button disabled={!stripePortalUrl}>
      Manage Subscription
    </Button>
  </a>
  ```

**Story Points:** 2

---

## Epic 3: Agent Lifecycle

**Epic Goal:** Enable company admins to create, view, deactivate, and delete agents with full CRUD functionality and proper validations.

**Epic Scope:**
- Implement Server Actions: getAgents, createAgent, deactivateAgent, deleteAgent
- Create AgentTable component with search/filter/pagination
- Create modals for adding, deactivating, deleting agents
- Handle atomic transactions for agent creation and deletion
- Validate email uniqueness and password complexity

**Dependencies:** None (core feature, but builds on auth patterns)

**Risk:** Atomic transaction handling for agent deletion (must not lose data)

---

### Story 3.1: Create getAgents Server Action with Search & Pagination

**Objective:** Fetch list of agents with filtering, search, and pagination support

**Description:**
Create a Server Action in `lib/actions/agents.ts` that queries agents for the authenticated company with optional search (name/email), status filter, and pagination. Returns paginated results with total count.

**Acceptance Criteria:**
- [ ] Server Action exports `getAgents()` from `lib/actions/agents.ts` (new file)
- [ ] Function accepts parameters: `{ search?: string, status?: 'active'|'inactive', page?: number, pageSize?: number }`
- [ ] Function calls `requireAuth()` and `requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])`
- [ ] Queries User table with filters:
  - `companyId = $1` AND `role = 'AGENT'`
  - Optional: `fullName ILIKE %search% OR email ILIKE %search%`
  - Optional: `isActive = true/false` based on status filter
- [ ] Orders results by `createdAt DESC` (newest first)
- [ ] Implements pagination: `OFFSET (page-1)*pageSize LIMIT pageSize`
- [ ] Returns separate count query for total results (for pagination info)
- [ ] **Verify multi-tenant isolation:** companyId filter on all queries
- [ ] **Verify multi-tenant isolation:** Test with two companies to ensure no cross-company agent leakage
- [ ] Returns Zod-validated response with data + pagination metadata
- [ ] Default values: page=1, pageSize=10

**Technical Details:**
- **File:** `lib/actions/agents.ts` (new file)
- **Dependencies:** Prisma ORM, lib/auth.ts, Zod
- **Return Schema:**
  ```typescript
  {
    success: boolean
    data?: {
      id: string
      fullName: string
      email: string
      phone: string | null
      role: "AGENT"
      isActive: boolean
      dailyLimit: number
      messagesSentToday: number
      createdAt: string (ISO)
    }[]
    pagination?: {
      total: number
      page: number
      pageSize: number
    }
    error?: string
  }
  ```
- **Auth Layer:** requireAuth() + requireRole()
- **DB Layer:** companyId + role filter

**Story Points:** 5

---

### Story 3.2: Create AgentTable Component with Search and Sorting

**Objective:** Build UI table displaying agents with search box, sorting, and row actions

**Description:**
Create a React component in `app/(dashboard)/admin/components/AgentTable.tsx` that renders a table of agents. Include search input to filter agents, sortable columns (name, email, status), and action buttons for edit/deactivate/delete.

**Acceptance Criteria:**
- [ ] Component exports `AgentTable` from `app/(dashboard)/admin/components/AgentTable.tsx`
- [ ] Component uses `useState` for search, sort, and pagination state
- [ ] Component uses `useEffect` to call `getAgents()` on mount and when filters change
- [ ] Displays search input box (placeholder: "Search by name or email...")
- [ ] Search input debounced (300ms) to reduce API calls
- [ ] Table columns: Name, Email, Phone, Daily Limit, Status, Actions
- [ ] Status badge: "Active" (green), "Inactive" (gray)
- [ ] Name column sortable (ascending/descending toggle)
- [ ] Email column sortable
- [ ] CreatedAt column sortable
- [ ] Action buttons per row: "Edit" (disabled for MVP), "Deactivate" (if active), "Delete"
- [ ] Pagination controls: Previous/Next buttons, page info ("Page 1 of 5")
- [ ] Shows skeleton loader for rows while fetching
- [ ] Shows empty state: "No agents found" if results are empty
- [ ] Shows error message if query fails
- [ ] Uses existing Shadcn/ui components (Table, Input, Button, Badge)
- [ ] Responsive on mobile: scrollable table or card layout
- [ ] No new npm dependencies required

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/AgentTable.tsx`
- **Dependencies:** React hooks, getAgents Server Action, shadcn/ui, lucide-react, tailwind
- **State:** `{ agents, search, page, pageSize, loading, error, totalPages }`
- **Helper:** Debounce function for search input
- **Import:**
  ```typescript
  import { getAgents } from '@/lib/actions/agents'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
  import { Badge, Button, Input } from '@/components/ui'
  ```

**Story Points:** 6

---

### Story 3.3: Create createAgent Server Action with Validation and Atomic Transaction

**Objective:** Implement server-side agent creation with email uniqueness checks and atomic transaction

**Description:**
Create a Server Action in `lib/actions/agents.ts` that creates a new agent with password hashing, AgentQuota creation, and email uniqueness validation. Uses Prisma transaction to ensure atomicity.

**Acceptance Criteria:**
- [ ] Server Action exports `createAgent()` from `lib/actions/agents.ts`
- [ ] Function accepts: `{ fullName, email, phone?, dailyLimit, password }`
- [ ] Function calls `requireAuth()` and `requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])`
- [ ] Validates input with Zod schema:
  - fullName: string, 1-100 chars, required
  - email: valid email format, required
  - phone: optional string
  - dailyLimit: number between 1-1000
  - password: string 8+ chars with complexity (1 uppercase, 1 number, 1 special char)
- [ ] Checks email uniqueness: `SELECT * FROM User WHERE email = $1 AND companyId = $2`
  - If exists, returns: `{ success: false, error: "Email already exists", field: "email" }`
- [ ] Executes atomic transaction (Prisma $transaction):
  1. Hash password using bcryptjs (10 salt rounds)
  2. Create User record with role='AGENT', isActive=true
  3. Create AgentQuota record with dailyLimit and resetAt=now()
  4. Return user (without password hash)
- [ ] **Verify multi-tenant isolation:** User created with companyId of authenticated user
- [ ] **Verify multi-tenant isolation:** AgentQuota scoped to same companyId
- [ ] If transaction fails, rolls back (no partial user creation)
- [ ] Returns Zod-validated response with created user data (no password)
- [ ] Success response includes message: "Agent created successfully"
- [ ] No password hash returned in response

**Technical Details:**
- **File:** `lib/actions/agents.ts`
- **Dependencies:** Prisma ORM, bcryptjs, lib/auth.ts, Zod
- **Zod Schema:**
  ```typescript
  const createAgentSchema = z.object({
    fullName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().optional(),
    dailyLimit: z.number().min(1).max(1000),
    password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, "...")
  })
  ```
- **Transaction Pattern:**
  ```typescript
  await prisma.$transaction(async (tx) => {
    const hashedPassword = await hashPassword(password)
    const user = await tx.user.create({ /* ... */ })
    const quota = await tx.agentQuota.create({ /* ... */ })
    return { user, quota }
  })
  ```

**Story Points:** 6

---

### Story 3.4: Create AddAgentModal Component

**Objective:** Build modal form for creating new agents with validation feedback

**Description:**
Create a React component in `app/(dashboard)/admin/components/modals/AddAgentModal.tsx` that displays a form for adding new agents. Integrates with `createAgent` Server Action and handles validation errors with inline feedback.

**Acceptance Criteria:**
- [ ] Component exports `AddAgentModal` from `app/(dashboard)/admin/components/modals/AddAgentModal.tsx`
- [ ] Component accepts props: `{ isOpen: boolean, onClose: () => void, onSuccess: () => void }`
- [ ] Uses React Hook Form for form state management
- [ ] Uses Zod for client-side validation (matches server schema)
- [ ] Form fields: fullName, email, phone, dailyLimit, password, passwordConfirm
- [ ] fullName input: text, required, placeholder "John Doe"
- [ ] email input: email type, required, shows validation icon
- [ ] phone input: text, optional, placeholder "+971501234567"
- [ ] dailyLimit input: number, required, range 1-1000, default 50
- [ ] password input: password type, required, shows strength indicator
- [ ] passwordConfirm input: password type, required, validates match with password
- [ ] Shows inline validation errors below each field (red text)
- [ ] Shows password strength meter (weak/medium/strong)
- [ ] "Create Agent" button disabled while loading or if form invalid
- [ ] On submit, calls `createAgent()` Server Action
- [ ] If createAgent returns error with field, sets React Hook Form error on that field
- [ ] On success, shows toast: "Agent created successfully"
- [ ] Clears form and closes modal on success
- [ ] Calls `onSuccess()` callback to refresh parent agent list
- [ ] "Cancel" button closes modal without submitting
- [ ] Escape key closes modal
- [ ] Modal responsive on mobile (full-width on small screens)
- [ ] Uses existing Shadcn/ui Dialog, Input, Button, Form components
- [ ] No new npm dependencies required

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/modals/AddAgentModal.tsx`
- **Dependencies:** React Hook Form, Zod, shadcn/ui, createAgent Server Action
- **Props:** `AddAgentModalProps { isOpen: boolean, onClose: (), onSuccess: () }`
- **State:** Form state managed by React Hook Form (useForm hook)
- **Import:**
  ```typescript
  import { useForm } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { createAgent } from '@/lib/actions/agents'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  ```

**Story Points:** 5

---

### Story 3.5: Create deactivateAgent Server Action

**Objective:** Implement soft delete (set isActive=false) for agents

**Description:**
Create a Server Action in `lib/actions/agents.ts` that deactivates an agent by setting `isActive=false`. Verifies agent belongs to user's company before updating.

**Acceptance Criteria:**
- [ ] Server Action exports `deactivateAgent()` from `lib/actions/agents.ts`
- [ ] Function accepts: `{ agentId: string }`
- [ ] Function calls `requireAuth()` and `requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])`
- [ ] Verifies agent exists and belongs to company:
  - Query: `SELECT * FROM User WHERE id = $1 AND companyId = $2 AND role = 'AGENT'`
  - If not found, returns: `{ success: false, error: "Agent not found" }`
- [ ] **Verify multi-tenant isolation:** companyId check prevents deactivating agents from other companies
- [ ] Updates user: `UPDATE User SET isActive = false WHERE id = $1`
- [ ] Side effects:
  - Conversations remain assigned (not reassigned)
  - AgentQuota NOT cleared (audit trail)
  - Agent loses access on next login
- [ ] Returns Zod-validated response with success message
- [ ] Error message is generic: "Agent not found" (not "User not found")

**Technical Details:**
- **File:** `lib/actions/agents.ts`
- **Dependencies:** Prisma ORM, lib/auth.ts, Zod
- **Return Schema:**
  ```typescript
  {
    success: boolean
    message?: string
    error?: string
  }
  ```

**Story Points:** 3

---

### Story 3.6: Create DeactivateAgentModal Component

**Objective:** Build confirmation modal for deactivating agents

**Description:**
Create a React component in `app/(dashboard)/admin/components/modals/DeactivateAgentModal.tsx` that confirms agent deactivation with a clear warning message.

**Acceptance Criteria:**
- [ ] Component exports `DeactivateAgentModal` from `app/(dashboard)/admin/components/modals/DeactivateAgentModal.tsx`
- [ ] Component accepts props: `{ isOpen: boolean, agent: Agent, onClose: () => void, onSuccess: () => void }`
- [ ] Modal title: "Deactivate Agent"
- [ ] Modal body includes:
  - Agent name and email displayed
  - Warning text: "This agent will lose access to the system on next login."
  - "Conversations assigned to this agent will remain unchanged."
- [ ] "Cancel" button closes modal without action
- [ ] "Deactivate" button calls `deactivateAgent(agentId)` Server Action
- [ ] Button shows loading spinner while deactivating
- [ ] On success, shows toast: "Agent deactivated"
- [ ] Calls `onSuccess()` to refresh agent list
- [ ] Closes modal automatically on success
- [ ] If error, shows error toast with message
- [ ] Escape key closes modal (cancel only)
- [ ] Uses existing Shadcn/ui Dialog, Button, AlertCircle icon

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/modals/DeactivateAgentModal.tsx`
- **Dependencies:** deactivateAgent Server Action, shadcn/ui, lucide-react
- **Props:** `{ isOpen: boolean, agent: Agent, onClose: (), onSuccess: () }`

**Story Points:** 3

---

### Story 3.7: Create deleteAgent Server Action with Atomic Transaction

**Objective:** Implement hard delete for agents with atomic transaction and conversation reassignment

**Description:**
Create a Server Action in `lib/actions/agents.ts` that permanently deletes an agent. Uses atomic transaction to ensure: conversations are unassigned, AgentQuota deleted, and User deleted (cascade per schema).

**Acceptance Criteria:**
- [ ] Server Action exports `deleteAgent()` from `lib/actions/agents.ts`
- [ ] Function accepts: `{ agentId: string }`
- [ ] Function calls `requireAuth()` and `requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])`
- [ ] Verifies agent exists and belongs to company (same check as deactivateAgent)
- [ ] Executes atomic transaction (Prisma $transaction):
  1. Unassign conversations: `UPDATE Conversation SET agentId = null WHERE agentId = $1`
  2. Delete AgentQuota: `DELETE FROM AgentQuota WHERE agentId = $1`
  3. Delete User: `DELETE FROM User WHERE id = $1` (cascades per schema)
  4. Return confirmation
- [ ] **Verify multi-tenant isolation:** companyId check before deletion
- [ ] **Verify multi-tenant isolation:** Conversation update includes companyId verification
- [ ] If transaction fails, rolls back (no partial deletion)
- [ ] Side effects:
  - Conversations reassigned to pool (agentId = null)
  - Messages preserved (not deleted, audit trail)
  - User fully removed (cannot be undone)
- [ ] Returns Zod-validated response with success message
- [ ] Error messages generic: "Agent not found", not revealing user structure

**Technical Details:**
- **File:** `lib/actions/agents.ts`
- **Dependencies:** Prisma ORM, lib/auth.ts, Zod
- **Transaction Pattern:** Same as createAgent but for deletion
- **Critical:** Must use $transaction to ensure atomicity

**Story Points:** 6

---

### Story 3.8: Create DeleteAgentModal Component

**Objective:** Build confirmation modal for permanently deleting agents

**Description:**
Create a React component in `app/(dashboard)/admin/components/modals/DeleteAgentModal.tsx` that confirms permanent agent deletion with prominent warning.

**Acceptance Criteria:**
- [ ] Component exports `DeleteAgentModal` from `app/(dashboard)/admin/components/modals/DeleteAgentModal.tsx`
- [ ] Component accepts props: `{ isOpen: boolean, agent: Agent, onClose: () => void, onSuccess: () => void }`
- [ ] Modal title: "Delete Agent Permanently?"
- [ ] Modal body includes:
  - Large warning icon (AlertTriangle from lucide)
  - "WARNING: This action cannot be undone." (bold, red)
  - Agent name and email
  - Bullet points:
    - "Associated conversations will be unassigned"
    - "Agent messages remain (audit trail preserved)"
    - "User cannot be restored"
- [ ] "Cancel" button closes modal without action
- [ ] "Delete" button (red/destructive variant) calls `deleteAgent(agentId)` Server Action
- [ ] Button shows loading spinner while deleting
- [ ] On success, shows toast: "Agent deleted permanently"
- [ ] Calls `onSuccess()` to refresh agent list
- [ ] Closes modal automatically on success
- [ ] If error, shows error toast
- [ ] Escape key closes modal (cancel only)
- [ ] Uses existing Shadcn/ui components with destructive variant for Delete button

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/modals/DeleteAgentModal.tsx`
- **Dependencies:** deleteAgent Server Action, shadcn/ui, lucide-react
- **Props:** `{ isOpen: boolean, agent: Agent, onClose: (), onSuccess: () }`
- **Styling:** Red/destructive color for Delete button to emphasize permanence

**Story Points:** 3

---

## Epic 4: WhatsApp Integration Status

**Epic Goal:** Display WhatsApp provider configuration, connection status, warm-up progress, and recent activity.

**Epic Scope:**
- Implement getWhatsAppStatus Server Action
- Create WhatsAppStatus component showing provider, connection, warm-up stage
- Display connection status badge (connected/pending/error)
- Show warm-up progress bar with weeks remaining

**Dependencies:** None (data already in Company + CompanySettings models)

**Risk:** None identified

---

### Story 4.1: Create getWhatsAppStatus Server Action

**Objective:** Fetch WhatsApp provider and connection status

**Description:**
Create a Server Action in `lib/actions/admin.ts` that queries Company and CompanySettings to return WhatsApp provider type, connection status, business number, warm-up stage, and last activity timestamp.

**Acceptance Criteria:**
- [ ] Server Action exports `getWhatsAppStatus()` from `lib/actions/admin.ts`
- [ ] Function calls `requireAuth()` and `requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])`
- [ ] Queries Company record with companyId filter → extracts: wabaStatus, whatsappBusinessNumber, warmupStage
- [ ] Queries CompanySettings with companyId filter → extracts: whatsappProvider
- [ ] Counts active WhatsAppNumbers: `SELECT COUNT(*) FROM WhatsAppNumber WHERE companyId = $1 AND isActive = true`
- [ ] Queries latest message: `SELECT MAX(sentAt) FROM Message WHERE conversation.companyId = $1`
  - If null, lastActivity = null
  - If exists, lastActivity = ISO date string
- [ ] Maps warmupStage (1-4) to dailyLimit (20/50/100/1000)
- [ ] **Verify multi-tenant isolation:** companyId filter on all queries
- [ ] Returns Zod-validated response schema
- [ ] Handles missing warmupStage gracefully (default to 1)
- [ ] No new npm dependencies required

**Technical Details:**
- **File:** `lib/actions/admin.ts`
- **Dependencies:** Prisma ORM, lib/auth.ts, Zod
- **Return Schema:**
  ```typescript
  {
    success: boolean
    data?: {
      provider: "WABA" | "CHATWOOT" | "EVOLUTION"
      status: "PENDING" | "CONNECTED" | "WARMING_UP" | "ACTIVE" | "SUSPENDED" | "ERROR"
      businessNumber: string (e.g., "+971501234567")
      warmupWeek: number (1-4+)
      warmupLimit: number (20/50/100/1000)
      lastActivity: string (ISO date) | null
      numbersActive: number
    }
    error?: string
  }
  ```
- **Warm-up Mapping:**
  - Stage 1 → 20 messages/day
  - Stage 2 → 50 messages/day
  - Stage 3 → 100 messages/day
  - Stage 4+ → 1000 messages/day

**Story Points:** 4

---

### Story 4.2: Create WhatsAppStatus Component

**Objective:** Build UI component displaying WhatsApp integration status

**Description:**
Create a React component in `app/(dashboard)/admin/components/WhatsAppStatus.tsx` that renders WhatsApp provider information, connection status badge, business number, warm-up progress, and last activity.

**Acceptance Criteria:**
- [ ] Component exports `WhatsAppStatus` from `app/(dashboard)/admin/components/WhatsAppStatus.tsx`
- [ ] Component uses `useState` for loading/error states
- [ ] Component uses `useEffect` to call `getWhatsAppStatus()` on mount
- [ ] Displays provider badge: "WABA" | "Chatwoot" | "Evolution" (with provider-specific icon if available)
- [ ] Displays status badge with color-coding:
  - "PENDING" → yellow
  - "CONNECTED" → green
  - "WARMING_UP" → yellow
  - "ACTIVE" → green
  - "SUSPENDED" → red
  - "ERROR" → red
- [ ] Displays WhatsApp business number: "+971501234567" (formatted)
- [ ] Displays warm-up progress:
  - Text: "Week 2 of 4 warm-up" (or "Active" if stage 4+)
  - Progress bar: filled 50% for week 2 of 4 (warmupWeek / 4 * 100)
  - Daily limit display: "50 messages/day"
- [ ] Displays last activity: "5 minutes ago" (relative time using date-fns or similar)
  - If never, display: "Never"
- [ ] Displays active numbers count: "2 active numbers"
- [ ] Optional action button: "Configure" → links to `/dashboard/admin/settings` (disabled for MVP, future phase 2)
- [ ] Shows skeleton loader while fetching
- [ ] Shows error message if query fails
- [ ] Uses existing Shadcn/ui components (Card, Badge, Button)
- [ ] Responsive layout
- [ ] No new npm dependencies required (use native Date for relative time, or leverage existing utils)

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/WhatsAppStatus.tsx`
- **Dependencies:** React hooks, getWhatsAppStatus Server Action, shadcn/ui, lucide-react
- **Props:** `None`
- **State:** `{ loading, error, whatsapp }`
- **Helper:** Relative time function (e.g., "5 minutes ago")
  ```typescript
  const getRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    // ... (hours, days, etc.)
  }
  ```

**Story Points:** 4

---

### Story 4.3: Display Warm-up Progress Bar with Color Coding

**Objective:** Create visual progress indicator for WhatsApp warm-up stage

**Description:**
Enhance WhatsAppStatus component to display a visual progress bar showing warm-up stage with appropriate color coding and messaging.

**Acceptance Criteria:**
- [ ] Progress bar shows current week out of 4 total weeks
- [ ] Bar width: (warmupWeek / 4) * 100%
- [ ] Bar color:
  - Blue/primary while warming up (stage 1-3)
  - Green when fully warmed up (stage 4+)
- [ ] Progress bar has rounded corners and shadow (Tailwind styling)
- [ ] Text label: "Week 2 of 4" displayed above or inside bar
- [ ] If stage 4+, display "Warm-up Complete" instead of "Week X of 4"
- [ ] Shows daily message limit alongside: "50 messages/day"
- [ ] Smooth visual design matching Conversure UI patterns
- [ ] Accessible: aria-label explains progress (e.g., "Warm-up progress: week 2 of 4")
- [ ] Responsive: bar scales on mobile without breaking layout
- [ ] No new npm dependencies (use Tailwind CSS primitives)

**Technical Details:**
- **File:** `app/(dashboard)/admin/components/WhatsAppStatus.tsx`
- **Pattern:** Simple Tailwind progress bar
  ```typescript
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div 
      className="bg-blue-500 h-2 rounded-full transition-all"
      style={{ width: `${(warmupWeek / 4) * 100}%` }}
    />
  </div>
  ```

**Story Points:** 2

---

## Implementation Notes

### File Structure Summary
```
app/(dashboard)/admin/
├── page.tsx                                    # Main dashboard page (NEW)
├── layout.tsx                                  # Admin layout (existing, may update)
└── components/
    ├── StatsSection.tsx                        # Epic 1
    ├── BillingPanel.tsx                        # Epic 2
    ├── WhatsAppStatus.tsx                      # Epic 4
    ├── AgentTable.tsx                          # Epic 3
    ├── modals/
    │   ├── AddAgentModal.tsx                   # Epic 3
    │   ├── DeactivateAgentModal.tsx            # Epic 3
    │   └── DeleteAgentModal.tsx                # Epic 3
    └── hooks/
        └── useAgentActions.ts                  # Shared mutation logic (optional)

lib/
├── actions/
│   ├── admin.ts                                # Epic 1, 2, 4 Server Actions (NEW)
│   └── agents.ts                               # Epic 3 Server Actions (NEW)
├── format.ts                                   # Date/currency formatting (NEW from Story 2.3)
├── auth.ts                                     # (existing, already has requireAuth/requireRole)
└── stripe.ts                                   # (existing, used by Story 2.1)

app/api/admin/ (optional, if using Route Handlers instead of Server Actions)
├── dashboard/metrics/route.ts
├── billing/status/route.ts
├── agents/route.ts
└── whatsapp/status/route.ts
```

### Security Enforcement Pattern

Every Server Action MUST follow this 3-layer pattern:

```typescript
// Layer 1: Route middleware (in middleware.ts)
if (pathname.startsWith("/dashboard/admin")) {
  // Check auth + role
}

// Layer 2: Server Action top-level
export async function getDashboardMetrics() {
  await requireAuth()
  await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])
  const { companyId } = session
  // ...
}

// Layer 3: Every database query
const leads = await prisma.lead.findMany({
  where: {
    companyId: session.companyId,  // MANDATORY
    // ...
  }
})
```

### Multi-Tenant Isolation Checklist

Every story with "Verify multi-tenant isolation" acceptance criterion must:
- ✅ Include `companyId` filter on all database queries
- ✅ Use `findFirst` with companyId check for unique lookups (not just findUnique)
- ✅ Create test case with two companies to verify no cross-company data leakage
- ✅ Ensure Server Action extracts companyId from authenticated session only
- ✅ Never accept companyId as a parameter (derive from session)

---

## Sprint Planning Guide

### Sprint 1 (2-week sprint)
Focus on core analytics and billing functionality.

**Stories:**
- 1.1: getDashboardMetrics Server Action (5 pts) ← Start here
- 1.2: StatsSection Component (5 pts)
- 2.1: getBillingStatus Server Action (5 pts)
- 2.2: BillingPanel Component (4 pts)
- 2.3: Date/Currency Formatting (2 pts)
- 1.4: Loading Skeleton (2 pts) ← Quick win

**Total: 23 story points** (reasonable 2-week sprint)

### Sprint 2 (2-week sprint)
Focus on agent management CRUD.

**Stories:**
- 3.1: getAgents Server Action (5 pts) ← Start here
- 3.2: AgentTable Component (6 pts)
- 3.3: createAgent Server Action (6 pts)
- 3.4: AddAgentModal Component (5 pts)

**Total: 22 story points** (reasonable 2-week sprint)

### Sprint 3 (1-week sprint)
Focus on agent deactivation/deletion and WhatsApp status.

**Stories:**
- 3.5: deactivateAgent Server Action (3 pts)
- 3.6: DeactivateAgentModal Component (3 pts)
- 3.7: deleteAgent Server Action (6 pts)
- 3.8: DeleteAgentModal Component (3 pts)
- 4.1: getWhatsAppStatus Server Action (4 pts)
- 4.2: WhatsAppStatus Component (4 pts)

**Total: 23 story points** (reasonable 1.5-week sprint)

### Post-MVP Enhancements
- 1.3: 30-second auto-refresh (3 pts)
- 1.5: Error handling (3 pts)
- 2.4: Stripe portal link (2 pts)
- 4.3: Warm-up progress bar (2 pts)

---

## Metrics & Definition of Done

### Story Definition of Done
- [ ] Code reviewed and approved
- [ ] Tests written and passing (unit + integration)
- [ ] Multi-tenant isolation verified (for data-fetching stories)
- [ ] No console errors or warnings
- [ ] TypeScript strict mode passed (no `any` types)
- [ ] Component responsive tested on mobile/tablet/desktop
- [ ] Accessibility (WCAG AA) verified
- [ ] Documentation updated (README, API docs)
- [ ] Merged to develop branch
- [ ] Deployed to staging environment

### Epic Definition of Done
- [ ] All stories marked complete
- [ ] Integration tests between stories passing
- [ ] E2E tests for full workflow passing
- [ ] Security audit complete
- [ ] Performance benchmarks met
- [ ] User acceptance testing passed
- [ ] Merged to main branch
- [ ] Deployed to production

---

## Risk & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Multi-tenant data leakage | HIGH | Test all stories with 2-company setup, add companyId check reminder |
| Atomic transaction failure (agent deletion) | MEDIUM | Use Prisma $transaction, test with connection failures |
| Password validation/hashing | MEDIUM | Use bcryptjs 10 rounds, test password strength |
| Stripe API integration | MEDIUM | Mock Stripe in tests, handle missing Stripe gracefully |
| Performance (pagination) | LOW | Add database indexes on companyId, email, createdAt |
| Responsive design | LOW | Test on real devices, use TailwindCSS breakpoints |

---

## Success Criteria

**MVP Release (all epics complete):**
- ✅ All 20 stories marked complete
- ✅ >95% code coverage on Server Actions
- ✅ Multi-tenant isolation verified
- ✅ Zero security vulnerabilities (no hardcoded secrets, no XSS, no SQL injection)
- ✅ Page load time <2 seconds on 3G network
- ✅ Accessibility score >90 on Lighthouse
- ✅ User acceptance testing passed with 3+ real users
- ✅ Rollout plan documented

**Post-MVP:**
- [ ] Analytics dashboard refresh optimized to <5 seconds
- [ ] Reports module (phase 2)
- [ ] Bulk agent import (CSV upload)
- [ ] Activity audit logs

