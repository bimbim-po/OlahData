import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { trackEvent } from '@/lib/analytics/events';
import type { AdminRoleT } from '@/lib/db.types';

// Default allowed owner emails per specifications
const DEFAULT_ADMIN_EMAILS = 'bimdarmawa2@gmail.com,vrimae23@gmail.com';

export interface AdminSession {
  userId: string;
  email: string;
  role: AdminRoleT;
  mfaVerified: boolean;
}

/**
 * Get normalized list of configured admin emails.
 * Strict exact match: trimmed, lowercase, no alias folding.
 */
export function getConfiguredAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS;
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verify whether an email exactly matches the allowed admin whitelist.
 * Rules: exact match, no normalization of dots or +aliases.
 */
export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const allowed = getConfiguredAdminEmails();
  return allowed.includes(cleanEmail);
}

/**
 * Validate current request / server component context for admin access.
 * Returns the admin session if authorized, or null if unauthorized.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  // Static export build: provide admin session so Next.js prerenders the admin console pages
  if (process.env.NEXT_EXPORT === 'true') {
    return {
      userId: '00000000-0000-0000-0000-000000000001',
      email: getConfiguredAdminEmails()[0],
      role: 'owner',
      mfaVerified: true,
    };
  }

  try {
    const cookieStore = await cookies();
    const headerStore = await headers();

    // 1. Check for active admin token or session in cookies/headers
    const adminSessionToken = cookieStore.get('olahdata_admin_session')?.value;
    const authHeader = headerStore.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || adminSessionToken;

    const supabase = getSupabaseAdminClient();

    let user: { id: string; email?: string; email_confirmed_at?: string | null; app_metadata?: Record<string, unknown> } | null = null;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }

    // Fallback for development/testing or static export build
    if (!user && (process.env.NODE_ENV === 'development' || process.env.NEXT_EXPORT === 'true')) {
      const devAdminEmail = cookieStore?.get?.('dev_admin_email')?.value || getConfiguredAdminEmails()[0];
      if (devAdminEmail && isAllowedAdminEmail(devAdminEmail)) {
        return {
          userId: '00000000-0000-0000-0000-000000000001',
          email: devAdminEmail,
          role: 'owner',
          mfaVerified: true,
        };
      }
    }

    if (!user || !user.email) {
      await trackEvent('admin_access_rejected', { reason: 'no_session' });
      return null;
    }

    const email = user.email.trim().toLowerCase();

    // 2. Strict whitelist verification
    if (!isAllowedAdminEmail(email)) {
      await trackEvent('admin_access_rejected', { reason: 'not_in_whitelist', masked_email: email[0] + '***@' + email.split('@')[1] });
      return null;
    }

    // 3. Email verification requirement (must be confirmed via email or OAuth provider)
    const isVerified = Boolean(
      user.email_confirmed_at ||
      user.app_metadata?.provider === 'google' ||
      user.app_metadata?.email_verified === true
    );

    if (!isVerified) {
      await trackEvent('admin_access_rejected', { reason: 'unverified_email' }, user.id);
      return null;
    }

    // 4. MFA Requirement
    const mfaRequired = process.env.ADMIN_MFA_REQUIRED !== 'false';
    const mfaVerified = !mfaRequired || Boolean(cookieStore.get('admin_mfa_verified')?.value === 'true');

    if (mfaRequired && !mfaVerified) {
      // Must complete MFA step
      return null;
    }

    // 5. Ensure admin_users record is synced in database
    await supabase.from('admin_users').upsert({
      user_id: user.id,
      email: email,
      role: 'owner',
      mfa_required: mfaRequired,
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    return {
      userId: user.id,
      email: email,
      role: 'owner',
      mfaVerified: true,
    };
  } catch {
    return null;
  }
}

/**
 * Stealth Route Protection for Server Components.
 * If unauthorized, immediately trigger genuine 404 to hide the existence of /admin.
 */
export async function assertAdminServer(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    notFound();
  }
  return session;
}

/**
 * Record an immutable entry in admin_audit_log for every administrative modification.
 */
export async function logAdminAudit(params: {
  adminSession: AdminSession;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason: string;
  ip?: string | null;
}): Promise<void> {
  if (!params.reason || params.reason.trim().length === 0) {
    throw new Error('Alasan tindakan wajib diisi untuk pencatatan audit log admin.');
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from('admin_audit_log').insert({
    admin_id: params.adminSession.userId,
    admin_email: params.adminSession.email,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId || null,
    before: params.before || null,
    after: params.after || null,
    reason: params.reason.trim(),
    ip: params.ip || '127.0.0.1',
  });
}
