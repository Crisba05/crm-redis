export const EventNames = {
  LeadCreated: "lead.created",
  ContactCreated: "contact.created",
  DealStageChanged: "deal.stage.changed",
  QuoteSent: "quote.sent",
  TaskDue: "task.due",
  TaskUpdated: "task.updated",
  ActivityCreated: "activity.created",
  NotificationCreated: "notification.created",
  MessageCreated: "message.created",
  EmailSend: "email.send",
  WhatsappSend: "whatsapp.send"
} as const;

export type EventName = typeof EventNames[keyof typeof EventNames];

export type BaseEvent = {
  name: EventName;
  tenantId: string;
  actorId?: string;
  data: Record<string, unknown>;
  occurredAt: string;
};
