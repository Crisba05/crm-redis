import { startEmailWorker } from "./email.worker";
import { startWhatsappWorker } from "./whatsapp.worker";
import { startAutomationWorker } from "./automation.worker";
import { startNotificationWorker } from "./notification.worker";
import { startAiWorker } from "./ai.worker";

export const startAllWorkers = () => {
  return [
    startEmailWorker(),
    startWhatsappWorker(),
    startAutomationWorker(),
    startNotificationWorker(),
    startAiWorker()
  ];
};

export const startWorkersByName = (name: string) => {
  if (name === "all") return startAllWorkers();

  switch (name) {
    case "email":
      return [startEmailWorker()];
    case "whatsapp":
      return [startWhatsappWorker()];
    case "automation":
      return [startAutomationWorker()];
    case "notification":
      return [startNotificationWorker()];
    case "ai":
      return [startAiWorker()];
    default:
      throw new Error(`Unknown worker: ${name}`);
  }
};
