export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanT = 'free' | 'monthly' | 'thesis';
export type RoleT = 'item' | 'demografi' | 'bebas' | 'terikat' | 'abaikan';
export type DatasetKindT = 'original' | 'derived';
export type RunStatusT = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type ExportFormatT = 'docx' | 'pdf';
export type SubStatusT = 'active' | 'past_due' | 'expired' | 'canceled';
export type PayStatusT = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
export type AdminRoleT = 'owner' | 'support' | 'viewer';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nama: string | null;
          prodi: string | null;
          kampus: string | null;
          plan: PlanT;
          plan_expires_at: string | null;
          is_test: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nama?: string | null;
          prodi?: string | null;
          kampus?: string | null;
          plan?: PlanT;
          plan_expires_at?: string | null;
          is_test?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama?: string | null;
          prodi?: string | null;
          kampus?: string | null;
          plan?: PlanT;
          plan_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          judul: string;
          prodi: string | null;
          status: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          judul: string;
          prodi?: string | null;
          status?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          judul?: string;
          prodi?: string | null;
          status?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      datasets: {
        Row: {
          id: string;
          project_id: string;
          version: number;
          parent_dataset_id: string | null;
          kind: DatasetKindT;
          storage_path: string;
          n_rows: number | null;
          n_cols: number | null;
          sha256: string | null;
          excluded_rows: number[];
          exclusion_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version: number;
          parent_dataset_id?: string | null;
          kind?: DatasetKindT;
          storage_path: string;
          n_rows?: number | null;
          n_cols?: number | null;
          sha256?: string | null;
          excluded_rows?: number[];
          exclusion_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          version?: number;
          parent_dataset_id?: string | null;
          kind?: DatasetKindT;
          storage_path?: string;
          n_rows?: number | null;
          n_cols?: number | null;
          sha256?: string | null;
          excluded_rows?: number[];
          exclusion_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      constructs: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          item_columns: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          item_columns: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          item_columns?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      dataset_columns: {
        Row: {
          id: string;
          dataset_id: string;
          position: number;
          name: string;
          inferred_type: string;
          role: RoleT;
          construct_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dataset_id: string;
          position?: number;
          name: string;
          inferred_type?: string;
          role?: RoleT;
          construct_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dataset_id?: string;
          position?: number;
          name?: string;
          inferred_type?: string;
          role?: RoleT;
          construct_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      analysis_runs: {
        Row: {
          id: string;
          project_id: string;
          dataset_id: string;
          tests: string[];
          params: Json;
          status: RunStatusT;
          progress: Json;
          engine_version: string | null;
          error_code: string | null;
          error_message: string | null;
          locked_at: string | null;
          locked_by: string | null;
          attempts: number;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          dataset_id: string;
          tests: string[];
          params?: Json;
          status?: RunStatusT;
          progress?: Json;
          engine_version?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          attempts?: number;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          dataset_id?: string;
          tests?: string[];
          params?: Json;
          status?: RunStatusT;
          progress?: Json;
          engine_version?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          attempts?: number;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      analysis_results: {
        Row: {
          id: string;
          run_id: string;
          test_key: string;
          payload: Json;
          table_rows: Json;
          warnings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          test_key: string;
          payload: Json;
          table_rows?: Json;
          warnings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          test_key?: string;
          payload?: Json;
          table_rows?: Json;
          warnings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      explanations: {
        Row: {
          id: string;
          result_id: string;
          text: string;
          numbers_used: Json;
          model: string;
          prompt_version: string;
          guard_passed: boolean;
          attempts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          result_id: string;
          text: string;
          numbers_used?: Json;
          model: string;
          prompt_version?: string;
          guard_passed?: boolean;
          attempts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          result_id?: string;
          text?: string;
          numbers_used?: Json;
          model?: string;
          prompt_version?: string;
          guard_passed?: boolean;
          attempts?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      exports: {
        Row: {
          id: string;
          run_id: string;
          format: ExportFormatT;
          storage_path: string;
          include_declaration: boolean;
          watermark: boolean;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          format: ExportFormatT;
          storage_path: string;
          include_declaration?: boolean;
          watermark?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          format?: ExportFormatT;
          storage_path?: string;
          include_declaration?: boolean;
          watermark?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: PlanT;
          status: SubStatusT;
          current_period_end: string | null;
          provider: string;
          provider_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: PlanT;
          status?: SubStatusT;
          current_period_end?: string | null;
          provider?: string;
          provider_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: PlanT;
          status?: SubStatusT;
          current_period_end?: string | null;
          provider?: string;
          provider_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount_idr: number;
          status: PayStatusT;
          provider_ref: string;
          raw: Json;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_idr: number;
          status?: PayStatusT;
          provider_ref: string;
          raw?: Json;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_idr?: number;
          status?: PayStatusT;
          provider_ref?: string;
          raw?: Json;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_counters: {
        Row: {
          id: string;
          user_id: string;
          period: string;
          analyses_count: number;
          llm_tokens: number;
          exports_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period?: string;
          analyses_count?: number;
          llm_tokens?: number;
          exports_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period?: string;
          analyses_count?: number;
          llm_tokens?: number;
          exports_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      plan_limits: {
        Row: {
          plan: PlanT;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plan: PlanT;
          key: string;
          value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan?: PlanT;
          key?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_config: {
        Row: {
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
      };
      admin_users: {
        Row: {
          user_id: string;
          email: string;
          role: AdminRoleT;
          mfa_required: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          role?: AdminRoleT;
          mfa_required?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          role?: AdminRoleT;
          mfa_required?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_events: {
        Row: {
          id: string;
          user_id: string | null;
          event: string;
          props: Json;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event: string;
          props?: Json;
          session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event?: string;
          props?: Json;
          session_id?: string | null;
          created_at?: string;
        };
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          admin_email: string;
          action: string;
          entity: string;
          entity_id: string | null;
          before: Json | null;
          after: Json | null;
          reason: string;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          admin_email: string;
          action: string;
          entity: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          reason: string;
          ip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          admin_email?: string;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          reason?: string;
          ip?: string | null;
          created_at?: string;
        };
      };
      support_notes: {
        Row: {
          id: string;
          user_id: string;
          admin_id: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          admin_id: string;
          note: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          admin_id?: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      v_daily_signups: {
        Row: {
          date_wib: string;
          signups_count: number;
          free_signups: number;
          paid_signups: number;
        };
      };
      v_daily_active_users: {
        Row: {
          date_wib: string;
          dau_count: number;
        };
      };
      v_mrr: {
        Row: {
          active_monthly_subs: number;
          active_thesis_subs: number;
          mrr_idr: number;
          total_revenue_30d: number;
        };
      };
      v_funnel: {
        Row: {
          total_signups: number;
          total_created_project: number;
          total_uploaded_dataset: number;
          total_analyzed_success: number;
          total_paid: number;
        };
      };
      v_run_health: {
        Row: {
          total_runs_7d: number;
          queued_count: number;
          running_count: number;
          succeeded_count: number;
          failed_count: number;
          canceled_count: number;
          failure_rate_pct: number;
          avg_duration_seconds: number;
        };
      };
      v_llm_cost: {
        Row: {
          date_wib: string;
          total_tokens: number;
          estimated_cost_idr: number;
          active_users_llm: number;
        };
      };
      v_guard_stats: {
        Row: {
          total_explanations: number;
          passed_count: number;
          rejected_count: number;
          pass_rate_pct: number;
          avg_attempts: number;
        };
      };
      v_retention_cohort: {
        Row: {
          cohort_week: string;
          cohort_size: number;
          week_0_active: number;
          week_1_active: number;
          week_2_active: number;
          week_3_active: number;
        };
      };
    };
    Functions: {
      is_project_owner: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      is_dataset_owner: {
        Args: { p_dataset_id: string };
        Returns: boolean;
      };
      claim_next_run: {
        Args: { worker_id: string };
        Returns: Database['public']['Tables']['analysis_runs']['Row'][];
      };
      complete_run: {
        Args: { p_run_id: string; p_progress?: Json };
        Returns: void;
      };
      fail_run: {
        Args: { p_run_id: string; p_error_code: string; p_error_message: string };
        Returns: void;
      };
      requeue_stuck_runs: {
        Args: { timeout_minutes?: number; max_attempts?: number };
        Returns: number;
      };
      create_derived_dataset: {
        Args: { source_dataset_id: string; p_excluded_rows: number[]; p_note?: string };
        Returns: Database['public']['Tables']['datasets']['Row'];
      };
      check_plan_limit: {
        Args: { p_user_id: string; p_action: string };
        Returns: boolean;
      };
      purge_expired_data: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      expire_subscriptions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
  };
}
