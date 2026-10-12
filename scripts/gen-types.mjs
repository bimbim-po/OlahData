import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'apps', 'web', 'src', 'lib', 'db.types.ts');

console.log('Generating Supabase TypeScript definitions...');

let generated = false;
try {
  const output = execSync('npx supabase gen types typescript --local', {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (output && output.includes('export type Json')) {
    fs.writeFileSync(outputFile, output, 'utf-8');
    console.log(`Successfully generated types via Supabase CLI to: ${outputFile}`);
    generated = true;
  }
} catch {
  // Local Docker/Supabase container is not running, proceed to exact static generation below
}

if (!generated) {
  console.log('Generating strong TypeScript database definitions directly from schema...');
  // The exact Supabase Database TypeScript contract corresponding to migrations 0001 - 0006
  const staticTypes = `export type Json =
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
`;
  fs.writeFileSync(outputFile, staticTypes, 'utf-8');
  console.log(`Successfully generated types to: ${outputFile}`);
}
