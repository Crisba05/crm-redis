# Server Operations

## Overview
This background worker processes BullMQ requests continuously by polling Redis.

## System Maintenance
1. **Memory Growth**: Long-running Node.js worker processes can experience memory leaks (especially if closures hold onto big payload datasets). Set a max memory limit (`--max-old-space-size=...`) in Dokploy if unexpected crashing occurs.
2. **Queue Dashboard**: A visual dashboard like `bull-board` should be hooked up (usually securely exposed on the `crm-backend`) to interact with this service's queues, since this container runs headless.

## Emergency Operations
- **Stalled / Frozen Queues**: If jobs are queued but not processing:
  1. Verify the `REDIS_URL` matches exactly between `crm-backend` and `crm-redis` (including the precise DB index).
  2. Restart the worker container: `docker restart crm-redis-worker`.
  3. Purge failed sets securely from Redis: `redis-cli DEL bull:queueName:failed`.
