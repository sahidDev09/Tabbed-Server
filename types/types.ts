export type Message = {
  id: string;
  created_at: string;
  text: string | null;
  is_edit: boolean;
  send_by: string;
  chat_id: string;
  file_url: string | null;
  final_url: string | null; 
  file_type: string | null;
  status?: "sending" | "failed" | "sent" | null;
  reply_to?: string | null;
};

export interface Timesheet {
  reduce: string;
  end_time: string;
  start_time: string;
  title: string;
  id: string;
  user_id: string | null;
  user_email: string | null;
  task: string;
  time: string;
  date: string;
  
}