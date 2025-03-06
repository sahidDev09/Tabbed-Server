
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string; // uuid
          chat_id: string; // uuid
          send_by: string; // uuid
          text: string | null; // text
          file_url: string | null; // text
          file_type: string | null; // text
          is_edit: boolean; // boolean
          created_at: string; // timestamp with time zone
        };
        Insert: {
          id?: string; // uuid (optional, auto-generated)
          chat_id: string; // uuid (required)
          send_by: string; // uuid (required)
          text?: string | null; // text (optional)
          file_url?: string | null; // text (optional)
          file_type?: string | null; // text (optional)
          is_edit?: boolean; // boolean (optional, default false)
          created_at?: string; // timestamp with time zone (optional, default to now())
        };
        Update: {
          id?: string; // uuid (optional)
          chat_id?: string; // uuid (optional)
          send_by?: string; // uuid (optional)
          text?: string | null; // text (optional)
          file_url?: string | null; // text (optional)
          file_type?: string | null; // text (optional)
          is_edit?: boolean; // boolean (optional)
          created_at?: string; // timestamp with time zone (optional)
        };
      };
      chats: {
        Row: {
          id: string; // uuid
          type: string | null; // text
          name: string | null; // text
          created_at: string; // timestamp with time zone
        };
        Insert: {
          id?: string; // uuid (optional, auto-generated)
          type?: string | null; // text (optional)
          name?: string | null; // text (optional)
          created_at?: string; // timestamp with time zone (optional, default to now())
        };
        Update: {
          id?: string; // uuid (optional)
          type?: string | null; // text (optional)
          name?: string | null; // text (optional)
          created_at?: string; // timestamp with time zone (optional)
        };
      };
      chat_participants: {
        Row: {
          chat_id: string; // uuid
          user_id: string; // uuid
        };
        Insert: {
          chat_id: string; // uuid (required)
          user_id: string; // uuid (required)
        };
        Update: {
          chat_id?: string; // uuid (optional)
          user_id?: string; // uuid (optional)
        };
      };
      timesheet: {
        Row: {
          id: string; // bigint
          user_id: string | null; // text
          user_email: string | null; // text
          task: string | null; // text
          time: string | null; // text
          date: string | null; // text
          created_at: string; // timestamp with time zone
        };
        Insert: {
          id?: string; // bigint (optional, auto-generated)
          user_id?: string | null; // text (optional)
          user_email?: string | null; // text (optional)
          task?: string | null; // text (optional)
          time?: string | null; // text (optional)
          date?: string | null; // text (optional)
          created_at?: string; // timestamp with time zone (optional, default to now())
        };
        Update: {
          id?: string; // bigint (optional)
          user_id?: string | null; // text (optional)
          user_email?: string | null; // text (optional)
          task?: string | null; // text (optional)
          time?: string | null; // text (optional)
          date?: string | null; // text (optional)
          created_at?: string; // timestamp with time zone (optional)
        };
      };
      notes: {
        Row: {
          id: string; // bigint
          title: string | null; // text
        };
        Insert: {
          id?: string; // bigint (optional, auto-generated)
          title?: string | null; // text (optional)
        };
        Update: {
          id?: string; // bigint (optional)
          title?: string | null; // text (optional)
        };
      };
      docs: {
        Row: {
          id: string;
          document_title: string;
          user_id: string;
          content: string;
          public: boolean;
          private: boolean;
          room: { user_email: string; status: string }[];
          cover: string;
          created_at: string;
        };
        Insert: {
          id?: string | undefined;
          document_title: string;
          user_id: string;
          content: string;
          public: boolean;
          private: boolean;
          room: { user_email: string; status: string }[];
          cover: string;
          created_at?: string | undefined;
        };
        Update: {
          id?: string | undefined;
          document_title?: string | undefined;
          user_id?: string | undefined;
          content?: string | undefined;
          public?: boolean | undefined;
          private?: boolean | undefined;
          room?: { user_email: string; status: string }[] | undefined;
          cover?: string | undefined;
          created_at?: string | undefined;
        };
      };
    };
  };
};
