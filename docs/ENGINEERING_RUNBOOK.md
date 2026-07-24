# Engineering Runbook

> This serves as the technical master map for the CRM Redis Worker microservice.

## Document Maps
1. **[Architecture Overview](./ARCHITECTURE.md)** - Logic behind BullMQ isolation.
2. **[Deployment Strategy](./DEPLOYMENT.md)** - Docker build details and Dokploy HTTP healthcheck warnings.
3. **[Commands Reference](./COMMANDS.md)** - NPM execution scripts.
4. **[Known Bugs & Risks](./KNOWN_BUGS.md)** - Missing healthchecks and email quota risks.
5. **[Server Operations](./SERVER_OPERATIONS.md)** - Zombie queue clearing.
6. **[Mascotas Vertical Alignment (2026-04-14)](./VERTICAL_MASCOTAS_ALIGNMENT_2026-04-14.md)** - Queue/runtime implications for new active modules in Mascotas.
7. **Notification target routing (2026-07-23)** - Worker includes a best-effort `targetUserId` in notification payloads.

## Project Goal
This directory provides a foundational codebase state so AI agents (specifically Backend/DevOps agents) have enough context to implement robust queue failure retries and add new asynchronous jobs without disrupting the main monolith backend.

### Migrated: VERTICAL_MASCOTAS_ALIGNMENT_2026-04-14.md
Source: crm-redis\docs/VERTICAL_MASCOTAS_ALIGNMENT_2026-04-14.md | Migrated: 2026-04-22

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

## Notification Target Routing (2026-07-23)

Context: notification jobs can carry the intended recipient either in `event.data.userId` or in `event.actorId`, depending on the producer.

Decision: `notification.worker.ts` now maps the first string value found from those fields into `targetUserId` before dispatching the notification payload.

Validation: whitespace check passed before commit; no secrets or credentials are introduced by the payload mapping.


