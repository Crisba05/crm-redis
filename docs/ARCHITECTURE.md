# Architecture Document

## Overview
This repository contains a dedicated background worker microservice for the CRM suite, specialized in event processing and async tasks.

## Technology Stack
- **Runtime**: Node.js v20 (Alpine)
- **Language**: TypeScript (using `tsx` for execution in dev, `tsc` for production builds)
- **Queues**: BullMQ + ioredis
- **Email Processing**: Nodemailer
- **Validation**: Zod
- **Environment**: Dotenv

## System Architecture
### 1. Job Processing
The service connects to the centralized Redis instance shared with the main backend. It acts as an asynchronous processor, pulling jobs from BullMQ.

### 2. Module Design (`src/`)
- `events/`: Definitions and payloads for system events.
- `queues/`: Queue instance initialization mirroring the backend.
- `workers/`: Background job execution logic (e.g. sending emails using nodemailer).
- `config/`: Integration setups mapping to environment variables.

### 3. Isolation Advantage
By keeping this service decoupled from the main HTTP API (`crm-backend`), memory-heavy jobs like PDF generation or bulk emailing will not block the main single-threaded Event Loop serving the frontend clients.
