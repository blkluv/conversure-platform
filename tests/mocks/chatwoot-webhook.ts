/**
 * CHATWOOT WEBHOOK TEST PAYLOAD
 * 
 * Use this to manually test the webhook route:
 * POST http://localhost:3000/api/webhooks/chatwoot?companyId=YOUR_COMPANY_ID
 */

export const CHATWOOT_INCOMING_MESSAGE_MOCK = {
    "event": "message_created",
    "message_type": "incoming",
    "id": 12345,
    "content": "Hi, I'm interested in a 2-bedroom apartment in Dubai Marina",
    "created_at": "2026-01-22T02:00:00.000Z",
    "sender": {
        "id": 67890,
        "name": "Ahmed Ali",
        "phone_number": "+971501234567",
        "type": "contact"
    },
    "conversation": {
        "id": 54321,
        "inbox_id": 789,
        "status": "open",
        "meta": {
            "sender": {
                "phone_number": "+971501234567",
                "name": "Ahmed Ali"
            }
        }
    },
    "inbox": {
        "id": 789,
        "name": "WhatsApp Inbox",
        "phone_number": "+971501234568"
    },
    "attachments": []
}

export const CHATWOOT_OUTGOING_MESSAGE_MOCK = {
    "event": "message_created",
    "message_type": "outgoing",
    "id": 12346,
    "content": "Thanks for reaching out! Let me find some options for you.",
    "created_at": "2026-01-22T02:01:00.000Z",
    "sender": {
        "id": 999,
        "name": "Agent John",
        "type": "agent"
    },
    "conversation": {
        "id": 54321,
        "inbox_id": 789
    }
}

/**
 * TESTING SCRIPT
 * 
 * Run this in your terminal:
 * 
 * curl -X POST http://localhost:3000/api/webhooks/chatwoot?companyId=YOUR_COMPANY_ID \
 *   -H "Content-Type: application/json" \
 *   -d @scripts/test-chatwoot-webhook.json
 * 
 * Expected Results:
 * - Incoming message: Should create Lead and Conversation
 * - Outgoing message: Should be ignored (no duplicate in DB)
 */
