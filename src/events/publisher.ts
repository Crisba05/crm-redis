import { getQueue } from "../queues";
import { QUEUE_NAMES } from "../queues/names";
import type { BaseEvent } from "./types";

export const publishEvent = async (event: BaseEvent) => {
  const queue = getQueue(QUEUE_NAMES.events);
  await queue.add(event.name, event, {
    removeOnComplete: true,
    removeOnFail: 1000
  });
};
