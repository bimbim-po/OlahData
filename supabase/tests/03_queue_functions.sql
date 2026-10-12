-- supabase/tests/03_queue_functions.sql
-- Pengujian pgTAP untuk fungsi antrean worker Python:
-- claim_next_run, complete_run, fail_run, dan requeue_stuck_runs.

BEGIN;
SELECT plan(6);

-- Set peran service_role (worker Python menggunakan service_role)
SET LOCAL ROLE service_role;

-- Pastikan ada satu run berstatus queued untuk Proyek 3
UPDATE public.analysis_runs
SET status = 'queued', attempts = 0, locked_at = NULL, locked_by = NULL
WHERE id = 'r1111111-1111-1111-1111-111111111111';

-- 1. Uji claim_next_run oleh worker 1
DO $$
DECLARE
    v_claimed public.analysis_runs;
BEGIN
    SELECT * INTO v_claimed FROM public.claim_next_run('worker-pod-alpha');
END $$;

SELECT is(
    (SELECT status FROM public.analysis_runs WHERE id = 'r1111111-1111-1111-1111-111111111111'),
    'running'::run_status_t,
    'claim_next_run mengubah status antrean menjadi running'
);

SELECT is(
    (SELECT locked_by FROM public.analysis_runs WHERE id = 'r1111111-1111-1111-1111-111111111111'),
    'worker-pod-alpha',
    'claim_next_run mengunci antrean ke worker-pod-alpha'
);

-- 2. Uji konkurensi: Worker 2 tidak boleh mengklaim tugas yang sedang berjalan
SELECT is(
    (SELECT COUNT(*)::INT FROM public.claim_next_run('worker-pod-beta')),
    0,
    'Worker paralel kedua TIDAK BISA mengklaim tugas yang sudah dikunci oleh worker pertama'
);

-- 3. Uji complete_run
SELECT lives_ok(
    $$ SELECT public.complete_run('r1111111-1111-1111-1111-111111111111'::UUID, '{"status":"ok"}'::JSONB) $$,
    'complete_run berhasil dieksekusi tanpa galat'
);

SELECT is(
    (SELECT status FROM public.analysis_runs WHERE id = 'r1111111-1111-1111-1111-111111111111'),
    'succeeded'::run_status_t,
    'complete_run memutakhirkan status menjadi succeeded dan membersihkan kunci'
);

-- 4. Uji requeue_stuck_runs saat terjadi timeout
-- Simulasikan tugas yang macet (status running dengan locked_at 30 menit yang lalu)
UPDATE public.analysis_runs
SET status = 'running',
    locked_at = NOW() - INTERVAL '30 minutes',
    locked_by = 'worker-crashed-instance',
    attempts = 1
WHERE id = 'r1111111-1111-1111-1111-111111111111';

-- Jalankan requeue_stuck_runs dengan timeout 10 menit
SELECT is(
    public.requeue_stuck_runs(10, 3),
    1,
    'requeue_stuck_runs berhasil memulihkan 1 antrean yang macet'
);

SELECT * FROM finish();
ROLLBACK;
