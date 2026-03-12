# CRM Redis

Event processing and async workers for the CRM platform.

## What this service does
- Receives domain events in a Redis queue
- Routes events to workers (email, whatsapp, automation, notifications, AI)
- Runs workers with BullMQ

## Local setup
1. Start Redis
   - Use docker-compose in this folder or your own Redis instance
2. Install deps
   - npm install
3. Configure env
   - copy .env.example -> .env
4. Run in dev
   - npm run dev

## Notes
- BullMQ is for queues and background jobs.
- Socket.IO is separate and should live in the API gateway or dedicated realtime service.

## Worker selection
Set WORKER to one of: all, email, whatsapp, automation, notification, ai
