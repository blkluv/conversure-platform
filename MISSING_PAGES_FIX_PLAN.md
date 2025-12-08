# Missing Pages & Logout Fix - Implementation Plan

## Issues Identified:
1. ❌ `/contact` - 404 Not Found
2. ❌ `/compliance` - 404 Not Found  
3. ❌ `/dashboard/admin/leads` - 404 Not Found
4. ❌ `/dashboard/admin/settings` - 404 Not Found
5. ❌ Logout button uses form POST to `/api/auth/logout` - shows JSON response

## Solution Plan:

### Task 1: Create Public Pages
- [x] Identify structure from existing pages
- [ ] Create `app/contact/page.tsx` - Reuse ContactForm component
- [ ] Create `app/compliance/page.tsx` - Legal/compliance page

### Task 2: Create Admin Dashboard Pages
- [ ] Create `app/dashboard/admin/leads/page.tsx` - Lead management
- [ ] Create `app/dashboard/admin/settings/page.tsx` - Company settings

### Task 3: Fix Logout Flow
- [ ] Update `components/dashboard/dashboard-layout.tsx` to use client-side logout
- [ ] Remove form POST, use button with onClick handler
- [ ] Implement proper redirect to /login

### Files to Create:
1. app/contact/page.tsx
2. app/compliance/page.tsx
3. app/dashboard/admin/leads/page.tsx
4. app/dashboard/admin/settings/page.tsx

### Files to Modify:
1. components/dashboard/dashboard-layout.tsx (logout fix)

## Status: Ready to implement
