# Commands Reference

This document lists operational commands for the Worker/Redis application.

## Development Commands
- `npm ci`: Clean install dependencies.
- `npm run dev`: Uses `tsx` to run the worker in watch mode automatically refreshing on file changes.
- `docker-compose up -d`: Spins up a minimal Redis 7 server locally for testing queue isolation.

## Production
- `npm run build`: Compiles TypeScript files securely into `dist/` using the strict `tsconfig.build.json`.
- `npm start`: The runtime entrypoint `node dist/index.js` for executing workers.

## Important Note
Unlike the NestJS server, this is a plain Node.js script. Adding CLI libraries (like commander) is recommended if specific workers need to be triggered manually.
