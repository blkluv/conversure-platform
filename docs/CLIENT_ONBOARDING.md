# Conversure - Client Onboarding Guide

## Welcome to Conversure! 🎉

This guide will help you get your real estate agency up and running with automated WhatsApp follow-ups in **under 30 minutes**.

---

## Step 1: Create Your Account (5 min)

1. Visit: **https://conversure.ae/signup**
2. Fill in your details:
   - **Company Name**: Your real estate agency name
   - **Email**: Your admin email
   - **Password**: Strong password (8+ characters)
   - **City**: e.g., Dubai, Abu Dhabi
3. Click "Create Account"
4. ✅ You'll be automatically logged in

---

## Step 2: Connect Your WhatsApp (10 min)

### Option A: Using Chatwoot (Recommended)

1. **Get Chatwoot Credentials**:
   - Sign up at [app.chatwoot.com](https://app.chatwoot.com)
   - Create a WhatsApp inbox
   - Note down:
     - Base URL: `https://app.chatwoot.com`
     - API Token: (Profile → Access Token)
     - Account ID: (Settings → Account)
     - Inbox ID: (Settings → Inboxes → Your WhatsApp)

2. **Configure in Conversure**:
   - Go to **Settings → WhatsApp Configuration**
   - Select "Chatwoot" as provider
   - Enter your credentials
   - Click "Save"

3. **Setup Webhook**:
   - In Chatwoot: Settings → Integrations → Webhooks
   - Add webhook URL: `https://conversure.ae/api/webhooks/chatwoot?companyId=YOUR_COMPANY_ID`
   - Select event: `message_created`
   - Save

### Option B: Direct WhatsApp Business API

Contact your account manager for enterprise setup.

---

## Step 3: Import Your Leads (10 min)

1. **Download Template**:
   - Go to **Contacts**
   - Click "Download Template"

2. **Fill CSV**:
   - Add your leads with: Name, Phone, Email, Property Type
   - **Phone format**: `+971501234567` (include country code)

3. **Upload**:
   - Click "Import Leads"
   - Select your CSV file
   - Review and confirm

---

## Step 4: Send Your First Message (5 min)

1. **Go to Inbox**
2. **Select a conversation** (or wait for incoming message)
3. **Type your message** 
4. **Click Send**
5. ✅ Message delivered to WhatsApp!

---

## Support

- **Email**: support@conversure.ae
- **WhatsApp**: +971 50 119 1723
- **Live Chat**: Available in dashboard

---

## Pro Tips

- **Warm-up Period**: Start with 20 messages/day for the first week
- **AI Copilot**: Enable in Settings for smart reply suggestions
- **Templates**: Create message templates for faster responses
- **Analytics**: Check Dashboard for performance metrics

**You're all set!** 🚀
