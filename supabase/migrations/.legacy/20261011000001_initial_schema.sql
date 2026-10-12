-- 20261011000001_initial_schema.sql
-- OlahData Database Schema with strict RLS and academic audit trail

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE dataset_kind AS ENUM ('original', 'derived');
CREATE TYPE column_role AS ENUM ('item', 'demografi', 'bebas', 'terikat', 'abaikan');
CREATE TYPE run_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
CREATE TYPE export_format AS ENUM ('docx', 'pdf');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'expired', 'trialing');

-- Function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 1. Profiles Table (Linked to Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    prodi TEXT NOT NULL,
    kampus TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    judul TEXT NOT NULL,
    prodi TEXT NOT NULL,
    research_type TEXT NOT NULL DEFAULT 'Regresi Linier Berganda',
    status TEXT NOT NULL DEFAULT 'draft',
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);

CREATE TRIGGER update_projects_modtime
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Datasets Table (Immutable versions; exclusions create new derived versions)
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INT NOT NULL,
    parent_version INT,
    storage_path TEXT NOT NULL,
    n_rows INT NOT NULL,
    n_cols INT NOT NULL,
    sha256 TEXT NOT NULL,
    kind dataset_kind NOT NULL DEFAULT 'original',
    excluded_rows INT[] DEFAULT '{}',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_dataset_version UNIQUE(project_id, version)
);

CREATE INDEX idx_datasets_project ON datasets(project_id);

CREATE TRIGGER update_datasets_modtime
    BEFORE UPDATE ON datasets
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Constructs Table (Research constructs grouping Likert questionnaire items)
CREATE TABLE constructs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'independent', -- 'independent' (X) or 'dependent' (Y)
    item_columns UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_constructs_project ON constructs(project_id);

CREATE TRIGGER update_constructs_modtime
    BEFORE UPDATE ON constructs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Dataset Columns Table
CREATE TABLE dataset_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    inferred_type TEXT NOT NULL, -- 'number', 'string', 'boolean'
    role column_role NOT NULL DEFAULT 'item',
    construct_id UUID REFERENCES constructs(id) ON DELETE SET NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dataset_columns_dataset ON dataset_columns(dataset_id);

CREATE TRIGGER update_dataset_columns_modtime
    BEFORE UPDATE ON dataset_columns
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Analysis Runs Table (Queue and execution tracking)
CREATE TABLE analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
    tests JSONB NOT NULL DEFAULT '[]'::jsonb,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    status run_status NOT NULL DEFAULT 'queued',
    engine_version TEXT NOT NULL DEFAULT '1.0.0-beta',
    error_code TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_runs_project ON analysis_runs(project_id);
CREATE INDEX idx_analysis_runs_status ON analysis_runs(status);

CREATE TRIGGER update_analysis_runs_modtime
    BEFORE UPDATE ON analysis_runs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Analysis Results Table (Deterministic numbers from statistical engine)
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    test_key TEXT NOT NULL,
    payload JSONB NOT NULL, -- Raw precision numbers: single source of truth
    table_rows JSONB NOT NULL DEFAULT '[]'::jsonb, -- Preformatted id-ID numbers for journal tables
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_run_test UNIQUE(run_id, test_key)
);

CREATE INDEX idx_analysis_results_run ON analysis_results(run_id);

CREATE TRIGGER update_analysis_results_modtime
    BEFORE UPDATE ON analysis_results
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Explanations Table (LLM-generated text with number guard verification)
CREATE TABLE explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    numbers_used JSONB NOT NULL DEFAULT '[]'::jsonb,
    model TEXT NOT NULL,
    guard_passed BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_explanations_result ON explanations(result_id);

CREATE TRIGGER update_explanations_modtime
    BEFORE UPDATE ON explanations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 9. Exports Table (Generated Word / PDF files)
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    format export_format NOT NULL,
    storage_path TEXT NOT NULL,
    include_declaration BOOLEAN NOT NULL DEFAULT TRUE,
    watermark BOOLEAN NOT NULL DEFAULT FALSE,
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exports_run ON exports(run_id);

CREATE TRIGGER update_exports_modtime
    BEFORE UPDATE ON exports
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 10. Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    provider TEXT NOT NULL DEFAULT 'midtrans',
    provider_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

CREATE TRIGGER update_subscriptions_modtime
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 11. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount_idr NUMERIC(12, 0) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    provider_ref TEXT UNIQUE NOT NULL,
    raw JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_provider_ref ON payments(provider_ref);

CREATE TRIGGER update_payments_modtime
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 12. Audit Log Table (Academic Integrity & Security Audit Trail, NO respondent data)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
