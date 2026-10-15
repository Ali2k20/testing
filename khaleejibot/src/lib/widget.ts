import type { ConversationStatus, MessageRow } from "@/lib/supabase/database.types";

/** What the public widget is allowed to see of a message. */
export type WidgetMessage = Pick<MessageRow, "id" | "sender_type" | "input_type" | "content_text" | "created_at">;

export type WidgetMessagesResponse = {
  status: ConversationStatus;
  messages: WidgetMessage[];
};

export function toWidgetMessage(message: WidgetMessage): WidgetMessage {
  return {
    id: message.id,
    sender_type: message.sender_type,
    input_type: message.input_type,
    content_text: message.content_text,
    created_at: message.created_at,
  };
}
