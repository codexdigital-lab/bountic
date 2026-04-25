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
      users: {
        Row: {
          github_username: string;
          locus_wallet_address: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          github_username: string;
          locus_wallet_address?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          github_username?: string;
          locus_wallet_address?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bounties: {
        Row: {
          issue_id: string;
          status: Database["public"]["Enums"]["bounty_status"];
          total_amount: number;
          ledger_comment_id: string | null;
          funded_by_agent: boolean;
          payout_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          issue_id: string;
          status?: Database["public"]["Enums"]["bounty_status"];
          total_amount?: number;
          ledger_comment_id?: string | null;
          funded_by_agent?: boolean;
          payout_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          issue_id?: string;
          status?: Database["public"]["Enums"]["bounty_status"];
          total_amount?: number;
          ledger_comment_id?: string | null;
          funded_by_agent?: boolean;
          payout_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      funding_events: {
        Row: {
          id: string;
          issue_id: string;
          funder_username: string;
          amount: number;
          locus_checkout_id: string;
          locus_webhook_secret: string | null;
          payment_status: Database["public"]["Enums"]["funding_payment_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          funder_username: string;
          amount: number;
          locus_checkout_id: string;
          locus_webhook_secret?: string | null;
          payment_status?: Database["public"]["Enums"]["funding_payment_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          funder_username?: string;
          amount?: number;
          locus_checkout_id?: string;
          locus_webhook_secret?: string | null;
          payment_status?: Database["public"]["Enums"]["funding_payment_status"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "funding_events_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "bounties";
            referencedColumns: ["issue_id"];
          },
        ];
      };
      payout_events: {
        Row: {
          id: string;
          issue_id: string;
          recipient_username: string;
          amount: number;
          locus_transaction_id: string | null;
          transaction_hash: string | null;
          status: Database["public"]["Enums"]["payout_status"];
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          recipient_username: string;
          amount: number;
          locus_transaction_id?: string | null;
          transaction_hash?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          recipient_username?: string;
          amount?: number;
          locus_transaction_id?: string | null;
          transaction_hash?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payout_events_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "bounties";
            referencedColumns: ["issue_id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      bounty_status: "OPEN" | "LOCKED" | "PAID";
      funding_payment_status: "PENDING" | "SUCCESS";
      payout_status: "PENDING" | "SUCCESS" | "FAILED";
    };
    CompositeTypes: Record<string, never>;
  };
};
