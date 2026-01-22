# 24-Hour Production Monitoring Checklist

## Hour 0-6: Critical Watch Period

### System Health
- [ ] Database connections stable
- [ ] No error spikes in logs
- [ ] All API endpoints responsive (<500ms)

### Webhook Monitoring
- [ ] Chatwoot webhooks receiving (check `/api/webhooks/chatwoot`)
- [ ] No 500 errors in webhook logs
- [ ] Messages being processed (check `Message` table)

### User Activity
- [ ] New leads being created
- [ ] Conversations being tracked
- [ ] No duplicate leads

**Check Every**: 30 minutes

---

## Hour 6-12: Active Monitoring

### Performance Metrics
- [ ] Average response time: <1s
- [ ] Database query time: <100ms
- [ ] Webhook processing time: <3s

### WhatsApp Integration
- [ ] Inbound messages arriving
- [ ] Outbound messages sending
- [ ] No echo/loop issues
- [ ] Quota tracking accurate

**Check Every**: 1 hour

---

## Hour 12-24: Stability Verification

### Data Integrity
- [ ] Lead count matches webhook events
- [ ] Conversation count accurate
- [ ] No orphaned records

### Client Feedback
- [ ] Response from first client
- [ ] WhatsApp delivery confirmed
- [ ] UI performance acceptable

**Check Every**: 2 hours

---

## Key Metrics to Track

### Database
```sql
-- Total companies
SELECT COUNT(*) FROM "Company";

-- Total leads today
SELECT COUNT(*) FROM "Lead" WHERE "createdAt" > NOW() - INTERVAL '1 day';

-- Messages today
SELECT COUNT(*) FROM "Message" WHERE "sentAt" > NOW() - INTERVAL '1 day';
```

### Logs to Monitor
```bash
# Check for errors
grep -i "error" logs/app.log | tail -n 50

# Check webhook activity
grep "Chatwoot Webhook" logs/app.log | tail -n 20

# Check database queries
grep "prisma:query" logs/app.log | tail -n 20
```

---

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | >1% | >5% |
| Response Time | >2s | >5s |
| Webhook Failures | >3 | >10 |
| Database Connections | >80% pool | >95% pool |

---

## Emergency Contacts

- **Database Issues**: Check connection pool, restart if needed
- **Webhook Issues**: Verify Chatwoot configuration
- **Performance Issues**: Scale horizontally, check indexes

## Rollback Plan

If critical issues occur within first 6 hours:

1. **Disable Webhooks**: Pause Chatwoot webhook temporarily
2. **Database Backup**: Restore from pre-deployment snapshot
3. **Notify Clients**: Send status email
4. **Root Cause Analysis**: Review logs, fix issue
5. **Gradual Re-enable**: Test with single client first
