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
- **Queue System:** BullMQ + Redis (async job processing)
- **Auth & Security:** Session cookies, role-based access control (RBAC)
- **Integrations:** Stripe (billing), WhatsApp providers, Bitrix24 (CRM), AI providers

---

## Getting Started (Local)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Redis (for async job processing)

```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 3. Configure environment

```bash
# Copy example
cp .env.example .env.local

# Required variables:
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
QUEUE_DRIVER="bullmq"  # or "prisma" for database queue
```

### 4. Run database migrations

```bash
npx prisma db push
```

### 5. Start the application

```bash
# Terminal 1: Web server
npm run dev

# Terminal 2: Workers (for async processing)
npm run worker:dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🚀 BullMQ Queue System

This platform uses **BullMQ + Redis** for high-performance async job processing:

- **10-20x faster** webhook processing (50ms vs 500ms)
- **Automatic retries** with exponential backoff
- **Horizontally scalable** workers
- **Job prioritization** and scheduling

### Quick Start

```bash
# Health check
npx tsx scripts/queue-health.ts

# Monitor queue stats
const stats = await queue.getStats('whatsapp:webhook');
```

### Available Workers

- WhatsApp Webhook Worker (5 concurrent)
- Email Worker (10 emails/sec)
- More workers can be added easily

For detailed documentation, see [docs/BULLMQ_ARCHITECTURE.md](./docs/BULLMQ_ARCHITECTURE.md)

---

## 📚 Documentation

- [BullMQ Architecture](./docs/BULLMQ_ARCHITECTURE.md) - Queue system documentation
- [Backend Implementation](./BACKEND_IMPLEMENTATION.md) - Backend overview
- [API Documentation](#) - Coming soon

---

## 🔧 Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run worker:dev       # Start workers with auto-reload

# Production  
npm run build            # Build application
npm run start            # Start production server
npm run worker           # Start workers

# Database
npx prisma db push       # Sync schema without migration
npx prisma studio        # Database GUI

# Health
npx tsx scripts/queue-health.ts  # Check Redis/queue health
```

---

## 🏗️ Architecture

```
Web Server → Enqueue Jobs → Redis/BullMQ → Workers → Database
```

- **Async Processing**: Non-blocking webhook handling
- **Scalability**: Workers scale independently
- **Reliability**: Automatic retries, dead letter queues
- **Monitoring**: Real-time queue statistics


