# Super Admin Setup Guide

## Overview
This guide explains how to create and use the super admin account for the Conversure UAE Real Estate CRM.

## Super Admin Credentials

**Email:** `abdallah@betaedgetech.com`  
**Password:** `Abdallah@2021`  
**Role:** `SUPER_ADMIN`  
**Company:** Conversure (auto-created)

⚠️ **Security Note:** The password is hashed using bcrypt with 10 salt rounds. It is never stored or logged in plain text.

## Setup Instructions

### Prerequisites
1. PostgreSQL database running and accessible
2. Environment variables configured (especially `DATABASE_URL`)
3. Node.js 20.19.0 or higher installed
4. Dependencies installed (`npm install`)

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

This creates the Prisma client types needed for the application.

### Step 2: Push Database Schema
```bash
npx prisma db push
```

This creates all the necessary tables in your PostgreSQL database based on the schema defined in `prisma/schema.prisma`.

### Step 3: Seed the Database
```bash
npx prisma db seed
```

This will:
- Create the "Conversure" company
- Create the super admin user with the credentials above
- Create a demo company "Elite Properties UAE"
- Create demo users, leads, conversations, and messages for testing

**Expected Output:**
```
🌱 Seeding database...
✅ Created Conversure company: Conversure
✅ Created SUPER ADMIN: abdallah@betaedgetech.com
   Password: Abdallah@2021
   Role: ADMIN
✅ Created demo company: Elite Properties UAE
✅ Created demo admin: admin@eliteproperties.ae / Password: Admin@123
✅ Created agent: sarah@eliteproperties.ae / Password: Agent@123
✅ Created agent quota
✅ Created warm-up plans
✅ Created demo lead: Mohammed Hassan
✅ Created demo conversation with messages
✅ Created demo templates
🎉 Seeding completed successfully!
```

### Step 4: Verify Super Admin Creation
You can verify the super admin was created by checking the database:

```sql
SELECT id, email, "fullName", role, "isActive", "companyId" 
FROM "User" 
WHERE email = 'abdallah@betaedgetech.com';
```

You should see:
- Email: `abdallah@betaedgetech.com`
- Role: `SUPER_ADMIN`
- isActive: `true`
- A valid companyId (the Conversure company)

## Using the Super Admin Account

### 1. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm run start
```

### 2. Access the Login Page
Navigate to: `http://localhost:3000/login`

### 3. Log In
- Enter email: `abdallah@betaedgetech.com`
- Enter password: `Abdallah@2021`
- Click "Sign In"

### 4. Access Admin Dashboard
After successful login, you'll be redirected to the admin dashboard where you can:
- View company statistics
- Manage agents
- Monitor campaigns
- Access billing information
- Configure system settings

## Seed Script Details

### Location
`prisma/seed.ts`

### What It Creates

#### 1. Conversure Company (Super Admin's Company)
- ID: `conversure-main`
- Name: Conversure
- Plan: ENTERPRISE
- Seats: 100
- Full WhatsApp and CRM integration enabled

#### 2. Super Admin User
- Email: `abdallah@betaedgetech.com`
- Password: `Abdallah@2021` (hashed)
- Role: SUPER_ADMIN
- Active: true

#### 3. Demo Company (For Testing)
- Name: Elite Properties UAE
- Demo admin: `admin@eliteproperties.ae` / `Admin@123`
- Demo agent: `sarah@eliteproperties.ae` / `Agent@123`
- Sample leads, conversations, and messages

### Idempotency
The seed script is idempotent, meaning you can run it multiple times safely:
- Uses `upsert` operations
- Won't create duplicates
- Updates existing records if they exist

## Troubleshooting

### Issue: "Prisma Client not generated"
**Solution:**
```bash
npx prisma generate
```

### Issue: "Database connection failed"
**Solution:**
1. Check your `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running
3. Verify database credentials

### Issue: "Seed script fails"
**Solution:**
1. Ensure schema is pushed: `npx prisma db push`
2. Check for any database constraints or conflicts
3. Review error messages for specific issues

### Issue: "Cannot log in with super admin"
**Solution:**
1. Verify user exists in database
2. Check `isActive` is `true`
3. Ensure password is correct: `Abdallah@2021`
4. Clear browser cookies and try again

### Issue: "Role is not SUPER_ADMIN"
**Solution:**
Re-run the seed script:
```bash
npx prisma db seed
```

The upsert will update the role to SUPER_ADMIN.

## Security Best Practices

### Production Deployment
1. **Change the default password immediately** after first login
2. Set up 2FA if available
3. Use environment-specific credentials
4. Never commit `.env` files with real credentials
5. Rotate passwords regularly

### Password Management
- The seed password is for initial setup only
- Change it through the application's user settings
- Use a strong, unique password
- Consider using a password manager

### Access Control
- Limit super admin access to trusted personnel only
- Create company-specific admin accounts for day-to-day operations
- Use the SUPER_ADMIN role only for system-wide administration

## Additional Demo Accounts

The seed script also creates these accounts for testing:

### Demo Company Admin
- Email: `admin@eliteproperties.ae`
- Password: `Admin@123`
- Role: COMPANY_ADMIN
- Company: Elite Properties UAE

### Demo Agent
- Email: `sarah@eliteproperties.ae`
- Password: `Agent@123`
- Role: AGENT
- Company: Elite Properties UAE

These accounts can be used to test different permission levels and workflows.

## Next Steps

After setting up the super admin:

1. **Configure System Settings**
   - Set up WhatsApp Business API credentials
   - Configure Stripe billing
   - Set up Bitrix24 integration
   - Configure AI providers

2. **Create Companies**
   - Add real estate agencies
   - Set up their subscriptions
   - Configure their integrations

3. **Invite Users**
   - Create company admins
   - Invite agents
   - Set up quotas and permissions

4. **Test Workflows**
   - Test WhatsApp messaging
   - Verify CRM sync
   - Check billing flows
   - Test feedback collection

## Support

For issues or questions:
1. Check the main README.md
2. Review BACKEND_IMPLEMENTATION.md
3. Check application logs
4. Contact the development team

---

**Last Updated:** 2024
**Version:** 1.0.0
