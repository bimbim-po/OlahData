-- 20261011000002_rls_policies.sql
-- Strict Row Level Security (RLS) policies for all OlahData tables

-- Enable RLS on every table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE constructs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. Projects Policies
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = owner_id);

-- 3. Datasets Policies (via project ownership)
CREATE POLICY "Users can view own project datasets"
    ON datasets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = datasets.project_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Users can insert datasets to own project"
    ON datasets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = datasets.project_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Users can update own datasets"
    ON datasets FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = datasets.project_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Users can delete own datasets"
    ON datasets FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = datasets.project_id
        AND projects.owner_id = auth.uid()
    ));

-- 4. Constructs Policies
CREATE POLICY "Users can view own project constructs"
    ON constructs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = constructs.project_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Users can manage own project constructs"
    ON constructs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = constructs.project_id
        AND projects.owner_id = auth.uid()
    ));

-- 5. Dataset Columns Policies
CREATE POLICY "Users can view own dataset columns"
    ON dataset_columns FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM datasets
        JOIN projects ON projects.id = datasets.project_id
        WHERE datasets.id = dataset_columns.dataset_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Users can manage own dataset columns"
    ON dataset_columns FOR ALL
    USING (EXISTS (
        SELECT 1 FROM datasets
        JOIN projects ON projects.id = datasets.project_id
        WHERE datasets.id = dataset_columns.dataset_id
        AND projects.owner_id = auth.uid()
    ));

-- 6. Analysis Runs Policies
CREATE POLICY "Users can view own analysis runs"
    ON analysis_runs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = analysis_runs.project_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Users can insert analysis runs to own project"
    ON analysis_runs FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = analysis_runs.project_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Users can update own analysis runs"
    ON analysis_runs FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = analysis_runs.project_id
        AND projects.owner_id = auth.uid()
    ));

-- 7. Analysis Results Policies
CREATE POLICY "Users can view own analysis results"
    ON analysis_results FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM analysis_runs
        JOIN projects ON projects.id = analysis_runs.project_id
        WHERE analysis_runs.id = analysis_results.run_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Service can insert analysis results"
    ON analysis_results FOR ALL
    USING (EXISTS (
        SELECT 1 FROM analysis_runs
        JOIN projects ON projects.id = analysis_runs.project_id
        WHERE analysis_runs.id = analysis_results.run_id
        AND projects.owner_id = auth.uid()
    ));

-- 8. Explanations Policies
CREATE POLICY "Users can view own explanations"
    ON explanations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM analysis_results
        JOIN analysis_runs ON analysis_runs.id = analysis_results.run_id
        JOIN projects ON projects.id = analysis_runs.project_id
        WHERE analysis_results.id = explanations.result_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Service can manage explanations"
    ON explanations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM analysis_results
        JOIN analysis_runs ON analysis_runs.id = analysis_results.run_id
        JOIN projects ON projects.id = analysis_runs.project_id
        WHERE analysis_results.id = explanations.result_id
        AND projects.owner_id = auth.uid()
    ));

-- 9. Exports Policies
CREATE POLICY "Users can view own exports"
    ON exports FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM analysis_runs
        JOIN projects ON projects.id = analysis_runs.project_id
        WHERE analysis_runs.id = exports.run_id
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Service can manage exports"
    ON exports FOR ALL
    USING (EXISTS (
        SELECT 1 FROM analysis_runs
        JOIN projects ON projects.id = analysis_runs.project_id
        WHERE analysis_runs.id = exports.run_id
        AND projects.owner_id = auth.uid()
    ));

-- 10. Subscriptions Policies
CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- 11. Payments Policies
CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- 12. Audit Log Policies
CREATE POLICY "Users can view own audit logs"
    ON audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can append to own audit log"
    ON audit_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);
