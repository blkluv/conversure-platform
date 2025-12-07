# Conversure Platform

**Conversure** is a production-ready, communication-first CRM platform for UAE real estate agencies.

It combines WhatsApp Business automation, AI-assisted lead engagement, advanced analytics, and multi-tenant control into one modern SaaS product built with **Next.js**, **TypeScript**, **Prisma**, and **PostgreSQL**.

---

## Core Features

- 💬 **WhatsApp Automation**
  - Template-based campaigns
  - Warm-up limits & quotas
  - Conversation logging & status tracking

- 🏡 **Real Estate Workflows**
  - Leads, inquiries, and property matching
  - Agent routing and performance tracking
  - UAE-focused fields and processes

- 📊 **Dashboards & Analytics**
  - Admin KPIs (leads, conversations, conversions)
  - Agent leaderboard & campaign performance
  - Conversation health and satisfaction metrics

- 🧩 **Multi-Tenant SaaS Architecture**
  - Company-level isolation
  - Role-based access (SUPER_ADMIN, COMPANY_ADMIN, AGENT)
  - Ready for white-label / multi-agency deployment

- 🔐 **Security & Compliance**
  - Hashed passwords (bcrypt)
  - Role-based permissions
  - Environment-based configuration for third-party services

---

## Tech Stack

- **Frontend / App:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js App Router API routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth & Security:** Session cookies, role-based access control
- **Integrations:** Stripe (billing), WhatsApp providers, Bitrix24 (CRM), AI providers

---

## Getting Started (Local)

### 1. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
