import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface PurgeResult {
  processed: number;
  completed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Eksekusi pembersihan berkas fisik storage dari antrean storage_purge_queue.
 * Memanggil Storage API untuk menghapus berkas fisik yang telah kadaluwarsa atau diminta dihapus.
 */
export async function executeStoragePurge(batchSize = 50): Promise<PurgeResult> {
  const result: PurgeResult = {
    processed: 0,
    completed: 0,
    failed: 0,
    errors: [],
  };

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      console.warn('[StoragePurge] Supabase admin client tidak tersedia.');
      return result;
    }

    // 1. Ambil antrean pending yang jadwal eksekusinya telah tiba
    const { data: queueItems, error: fetchErr } = await supabase
      .from('storage_purge_queue')
      .select('id, bucket_id, storage_path, attempts')
      .eq('status', 'pending')
      .lte('scheduled_purge_at', new Date().toISOString())
      .limit(batchSize);

    if (fetchErr) {
      console.error('[StoragePurge] Gagal mengambil antrean:', fetchErr);
      return result;
    }

    if (!queueItems || queueItems.length === 0) {
      return result;
    }

    result.processed = queueItems.length;

    // 2. Kelompokkan berdasarkan bucket untuk efisiensi panggilan Storage API
    const itemsByBucket: Record<string, Array<{ id: string; path: string; attempts: number }>> = {};
    for (const item of queueItems) {
      if (!itemsByBucket[item.bucket_id]) {
        itemsByBucket[item.bucket_id] = [];
      }
      itemsByBucket[item.bucket_id].push({
        id: item.id,
        path: item.storage_path,
        attempts: item.attempts || 0,
      });
    }

    // 3. Hapus berkas fisik per bucket
    for (const [bucketId, items] of Object.entries(itemsByBucket)) {
      const paths = items.map((i) => i.path);
      const itemIds = items.map((i) => i.id);

      try {
        const { error: removeErr } = await supabase.storage.from(bucketId).remove(paths);

        if (removeErr) {
          throw removeErr;
        }

        // Tandai sukses
        await supabase
          .from('storage_purge_queue')
          .update({
            status: 'completed',
            purged_at: new Date().toISOString(),
          })
          .in('id', itemIds);

        result.completed += items.length;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown storage delete error';
        console.error(`[StoragePurge] Gagal menghapus berkas di bucket ${bucketId}:`, errMsg);

        for (const item of items) {
          result.failed += 1;
          result.errors.push({ id: item.id, error: errMsg });

          const newAttempts = item.attempts + 1;
          const newStatus = newAttempts >= 3 ? 'failed' : 'pending';

          await supabase
            .from('storage_purge_queue')
            .update({
              status: newStatus,
              attempts: newAttempts,
              error_message: errMsg,
            })
            .eq('id', item.id);
        }
      }
    }

    return result;
  } catch (err: unknown) {
    console.error('[StoragePurge] Error fatal dalam eksekusi pembersihan:', err);
    return result;
  }
}
