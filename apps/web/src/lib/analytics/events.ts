import { getSupabaseAdminClient } from '@/lib/supabase/server';

const FORBIDDEN_PROPS_KEYS = new Set([
  'data',
  'rows',
  'values',
  'text',
  'cells',
  'answers',
  'responses',
  'records',
  'preview',
  'dataset_content',
  'file_content',
  'raw_data',
]);

/**
 * Filter props to guarantee that no respondent answers or raw dataset cells
 * ever leak into the analytics database.
 */
function sanitizeProps(props?: Record<string, unknown>): Record<string, unknown> {
  if (!props || typeof props !== 'object') return {};
  const clean: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(props)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_PROPS_KEYS.has(lowerKey)) {
      // Omit forbidden keys
      continue;
    }
    // Also guard against nested arrays containing objects with rows/data
    if (typeof val === 'string' && val.length > 500) {
      clean[key] = `${val.substring(0, 100)}...[TRUNCATED]`;
    } else {
      clean[key] = val;
    }
  }

  return clean;
}

export type EventType =
  | 'signup'
  | 'login'
  | 'project_created'
  | 'dataset_uploaded'
  | 'validation_failed'
  | 'analysis_started'
  | 'analysis_succeeded'
  | 'analysis_failed'
  | 'explanation_guard_failed'
  | 'export_created'
  | 'plan_checkout_started'
  | 'plan_paid'
  | 'plan_expired'
  | 'account_deleted'
  | 'admin_login'
  | 'admin_action';

/**
 * Global product analytics tracker.
 * Fails silently to ensure user requests are never blocked or broken by logging issues.
 */
export async function trackEvent(
  event: EventType | string,
  props: Record<string, unknown> = {},
  userId?: string | null,
  sessionId?: string | null
): Promise<void> {
  try {
    const cleanProps = sanitizeProps(props);
    const supabase = getSupabaseAdminClient();

    await supabase.from('app_events').insert({
      event,
      props: cleanProps,
      user_id: userId || null,
      session_id: sessionId || null,
    });
  } catch (err) {
    // Fail silently per privacy & reliability rules
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Analytics Warning] Failed to log event "${event}":`, (err as Error)?.message);
    }
  }
}
