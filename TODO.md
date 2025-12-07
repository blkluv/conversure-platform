# Conversure TypeScript Build Fixes - TODO

## Status: In Progress

### Completed ✅
1. ✅ Fixed syntax error in `app/api/webhooks/chatwoot/route.ts` - Missing closing parenthesis in updateMany call
2. ✅ Fixed Stripe webhook typing issues in `app/api/webhooks/stripe/route.ts` - Used `as any` for subscription.current_period_end
3. ✅ Fixed implicit any error in `app/dashboard/admin/page.tsx` - Added explicit types to topAgents.map callback
4. ✅ Fixed Prisma type imports in `components/agent/conversation-inbox.tsx` - Defined manual types
5. ✅ Fixed Prisma type imports in `components/agent/conversation-panel.tsx` - Defined manual types

### In Progress 🔄
- Running `npm run build` to identify remaining TypeScript errors
- Systematically fixing all implicit any errors

### Pending Tasks 📋

#### TypeScript Errors to Fix
Based on the task description, these files likely have implicit any errors:
- [ ] `app/(dashboard)/campaigns/page.tsx` - Lines 25, 29, 94 (campaign, r parameters)
- [ ] `app/(dashboard)/feedback/page.tsx` - Line 42 (feedback parameter)
- [ ] `app/api/ai/suggest-reply/route.ts` - Line 48 (msg parameter)
- [ ] `app/api/feedback/summary/route.ts` - Lines 47, 73 (feedback, f parameters)
- [ ] `app/api/imports/contacts/confirm/route.ts` - Line 78 (tx parameter)
- [ ] Various API routes with `requireAuth(req)` signature mismatch
- [ ] Other files with implicit any in .map(), .filter(), .forEach() callbacks
- [ ] Any other files that show up during build

#### Auth System Standardization
- [ ] Review all API routes that call `requireAuth(req)` 
- [ ] Ensure consistent signature across all routes
- [ ] Current `requireAuth()` in lib/auth.ts takes no parameters
- [ ] Update all callers to match the signature OR update requireAuth to accept optional req parameter

#### Database/Prisma Consistency
- [x] Ensure all files use `db` from `lib/db.ts` instead of raw `prisma`
- [ ] Remove any invalid Prisma type imports (ongoing)
- [ ] Verify Prisma.TransactionClient typing for $transaction callbacks
- [ ] Run `npx prisma generate` to ensure Prisma client is generated

#### Super Admin User Creation
- [ ] Create `prisma/seed.ts` with super admin user creation
- [ ] Email: abdallah@betaedgetech.com
- [ ] Password: Abdallah@2021 (hashed using hashPassword from lib/auth.ts)
- [ ] Role: Check schema - use "SUPER_ADMIN" or "COMPANY_ADMIN"
- [ ] Ensure idempotent (upsert logic)
- [ ] Create base Company "Conversure" if needed
- [ ] Update package.json with seed script: `"prisma": { "seed": "ts-node prisma/seed.ts" }`

#### Final Verification
- [ ] Run `npx prisma generate` to generate Prisma client
- [ ] Run `npm run lint`
- [ ] Run `npm run build` - must pass with ZERO errors
- [ ] Test super admin login
- [ ] Update README with seed instructions

## Strategy
1. Fix all TypeScript build errors first (current phase)
2. Standardize auth system
3. Create super admin seed
4. Final verification and testing

## Notes
- TypeScript strict mode is enabled and should remain enabled
- Prefer proper typing over `any` where possible
- Use `as any` only as last resort with clear comments
- All password handling must use existing hashPassword utility
- Never log passwords in plain text
- Prisma client types may not be available until `npx prisma generate` is run
