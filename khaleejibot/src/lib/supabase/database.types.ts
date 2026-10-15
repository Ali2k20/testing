// Hand-maintained to mirror supabase/migrations/001_init.sql. Regenerate with
// `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`
// once the project is linked; the shape below matches that output.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PlanTier = "starter" | "growth" | "enterprise";
export type MemberRole = "owner" | "admin" | "agent";
export type DialectPersona = "emirati_khaleeji" | "levantine" | "msa_formal" | "bilingual_auto";
export type ChannelType = "web_widget" | "whatsapp";
export type ConversationStatus = "AI_ACTIVE" | "HUMAN_PENDING" | "HUMAN_ACTIVE" | "RESOLVED";
export type SenderType = "customer" | "ai" | "human_agent";
export type InputType = "text" | "voice_note";

type Relationship<Columns extends string, Referenced extends string> = {
  foreignKeyName: string;
  columns: [Columns];
  isOneToOne: false;
  referencedRelation: Referenced;
  referencedColumns: ["id"];
};

type Table<Row, Required extends keyof Row, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type OrganizationRow = {
  id: string;
  name: string;
  plan_tier: PlanTier;
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRow = {
  org_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
};

export type BotRow = {
  id: string;
  org_id: string;
  name: string;
  dialect_persona: DialectPersona;
  system_instructions: string;
  confidence_threshold: number;
  handoff_message_ar: string;
  handoff_message_en: string;
  welcome_message_ar: string;
  welcome_message_en: string;
  is_whatsapp_default: boolean;
  created_at: string;
  updated_at: string;
};

export type KnowledgeChunkRow = {
  id: string;
  bot_id: string;
  source_name: string;
  content: string;
  /** pgvector columns travel as their text form, e.g. "[0.1,0.2,…]". */
  embedding: string;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  bot_id: string;
  channel: ChannelType;
  customer_identifier: string;
  customer_name: string | null;
  status: ConversationStatus;
  handoff_reason: string | null;
  ai_summary: string | null;
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  input_type: InputType;
  content_text: string;
  audio_url: string | null;
  confidence_score: number | null;
  external_id: string | null;
  sender_user_id: string | null;
  created_at: string;
};

export type KnowledgeSourceRow = {
  bot_id: string;
  source_name: string;
  chunk_count: number;
  updated_at: string;
};

export type KnowledgeMatch = {
  id: string;
  source_name: string;
  content: string;
  similarity: number;
};

export type Database = {
  public: {
    Tables: {
      organizations: Table<OrganizationRow, "name">;
      organization_members: Table<OrganizationMemberRow, "org_id" | "user_id">;
      bots: Table<BotRow, "org_id" | "name">;
      knowledge_chunks: Table<
        KnowledgeChunkRow,
        "bot_id" | "source_name" | "content" | "embedding",
        [Relationship<"bot_id", "bots">]
      >;
      conversations: Table<
        ConversationRow,
        "bot_id" | "channel" | "customer_identifier",
        [Relationship<"bot_id", "bots">]
      >;
      messages: Table<MessageRow, "conversation_id" | "sender_type", [Relationship<"conversation_id", "conversations">]>;
    };
    Views: {
      knowledge_sources: {
        Row: KnowledgeSourceRow;
        Relationships: [Relationship<"bot_id", "bots">];
      };
    };
    Functions: {
      create_organization: { Args: { p_name: string }; Returns: string };
      is_org_member: { Args: { p_org_id: string }; Returns: boolean };
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean };
      match_knowledge_chunks: {
        Args: {
          query_embedding: string;
          filter_bot_id: string;
          match_count?: number;
          match_threshold?: number;
        };
        Returns: KnowledgeMatch[];
      };
    };
    Enums: {
      plan_tier: PlanTier;
      member_role: MemberRole;
      dialect_persona: DialectPersona;
      channel_type: ChannelType;
      conversation_status: ConversationStatus;
      sender_type: SenderType;
      input_type: InputType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
