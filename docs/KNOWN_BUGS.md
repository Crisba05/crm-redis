# Known Bugs & Technical Risks

## Risks
1. **Missing HTTP Server**: Since there's no Express/Fastify instance running, PaaS proxies like Traefik/Dokploy will fail if they try to route traffic to this container. It must be deployed as a "Worker" or "Background Service" type, not a "Web Service".
2. **Nodemailer Limits**: If sending mass emails async, be aware of SMTP connection limits on Resend or other providers. Too many concurrent BullMQ jobs could trigger a rate limit error.
3. **Stale Jobs**: If the server force-restarts natively during job execution, standard BullMQ configuration might leave the job "Stalled", requiring a manual purge.

## Known Vulnerabilities
No hardcoded credentials detected in the repo root.
Ensure `.env` containing SMTP passwords is kept securely ignored.
