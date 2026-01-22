# Quick Reference: Webhook URLs

## Chatwoot Webhook Configuration

### Development
```
http://localhost:3000/api/webhooks/chatwoot?companyId=YOUR_COMPANY_ID
```

### Production
```
https://conversure.ae/api/webhooks/chatwoot?companyId=YOUR_COMPANY_ID
```

---

## How to Get Your Company ID

### Method 1: From Dashboard URL
After login, check your browser URL:
```
https://conversure.ae/dashboard/admin
```
Use browser console:
```javascript
// Run this in browser console
console.log(window.location.href)
```

### Method 2: From Database
```sql
SELECT id, name FROM "Company" ORDER BY "createdAt" DESC LIMIT 1;
```

### Method 3: From API
```bash
curl -X GET https://conversure.ae/api/company/me \
  -H "Cookie: your-session-cookie"
```

---

## Webhook Events

### Chatwoot Sends:
- `message_created` - New message (incoming or outgoing)
- `conversation_created` - New conversation started
- `conversation_status_changed` - Status updated

### Conversure Processes:
- ✅ `message_created` + `message_type: "incoming"` 
- ❌ `message_created` + `message_type: "outgoing"` (ignored to prevent loops)

---

## Testing Webhook

### Using cURL:
```bash
curl -X POST 'https://conversure.ae/api/webhooks/chatwoot?companyId=YOUR_ID' \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "message_created",
    "message_type": "incoming",
    "content": "Test message",
    "sender": {
      "phone_number": "+971501234567",
      "type": "contact"
    },
    "conversation": {
      "id": 12345
    }
  }'
```

### Expected Response:
```json
{
  "success": true
}
```

---

## Troubleshooting

### Webhook Not Firing
1. Check Chatwoot webhook configuration
2. Verify `companyId` parameter is correct
3. Check Chatwoot webhook logs (Settings → Webhooks → View Logs)

### Messages Not Appearing
1. Check Conversure logs: `/api/webhooks/chatwoot`
2. Verify company has `whatsappBusinessNumber` set
3. Check `WebhookEvent` table for received events

### Duplicate Messages
1. Verify only ONE webhook configured in Chatwoot
2. Check message_type filtering in route.ts
3. Review sender_type safeguard
