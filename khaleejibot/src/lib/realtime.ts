/** Broadcast topic carrying "something changed" pings for one organization's inbox. */
export function inboxTopic(orgId: string): string {
  return `inbox:${orgId}`;
}

export const INBOX_EVENT = "inbox";

export type InboxPing = {
  type: "customer_message" | "handoff" | "ai_reply";
  conversationId: string;
  botId: string;
};
