import { env } from "./config/env";
import { startEventRouter } from "./events/router";
import { startWorkersByName } from "./workers";

const bootstrap = () => {
  startEventRouter();
  startWorkersByName(env.WORKER);
  console.log(`crm-redis started. worker=${env.WORKER}`);
};

bootstrap();
