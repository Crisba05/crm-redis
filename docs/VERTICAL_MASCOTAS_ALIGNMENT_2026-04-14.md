# Mascotas Vertical Alignment (2026-04-14)

## Context
The `Mascotas` vertical now enables strategic modules aligned with the `Odontologia` operating baseline:
- `workflows`
- `customer_success`
- `integrations`

This document describes expected async/queue side effects for workers.

## Worker Impact
No direct worker code changes were required for this alignment. Existing workers should handle the additional workload patterns:
- `automation.worker.ts`: increased workflow-triggered jobs.
- `notification.worker.ts`: customer success and follow-up notifications.
- `email.worker.ts` and `whatsapp.worker.ts`: potential increase from active integrations and automations.

## Operational Expectations
- Higher background job volume for tenants under Mascotas using active campaigns + automations.
- More integration-related test/send jobs if tenant plans allow those features.
- Potential increase in retry/dead-letter traffic if third-party channels degrade.

## Monitoring Checklist
1. Track queue latency and retries by queue name.
2. Watch failed jobs for integration-related error signatures.
3. Verify worker memory remains stable under burst loads.
4. Validate Redis key growth for BullMQ namespaces.

## Coordination with Backend
- Module activation remains controlled by backend template runtime + feature entitlements.
- Redis workers should assume event-driven inputs increase after tenant rematerialization.

## Security Notes
- Keep SMTP/API/WhatsApp credentials in secure env storage only.
- Never log full credential payloads in worker traces.
- Rotate compromised keys immediately and revalidate failing queues.
