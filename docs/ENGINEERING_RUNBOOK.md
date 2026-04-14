# Engineering Runbook

> This serves as the technical master map for the CRM Redis Worker microservice.

## Document Maps
1. **[Architecture Overview](./ARCHITECTURE.md)** - Logic behind BullMQ isolation.
2. **[Deployment Strategy](./DEPLOYMENT.md)** - Docker build details and Dokploy HTTP healthcheck warnings.
3. **[Commands Reference](./COMMANDS.md)** - NPM execution scripts.
4. **[Known Bugs & Risks](./KNOWN_BUGS.md)** - Missing healthchecks and email quota risks.
5. **[Server Operations](./SERVER_OPERATIONS.md)** - Zombie queue clearing.
6. **[Mascotas Vertical Alignment (2026-04-14)](./VERTICAL_MASCOTAS_ALIGNMENT_2026-04-14.md)** - Queue/runtime implications for new active modules in Mascotas.

## Project Goal
This directory provides a foundational codebase state so AI agents (specifically Backend/DevOps agents) have enough context to implement robust queue failure retries and add new asynchronous jobs without disrupting the main monolith backend.
