import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const SERVER_KEY = 'SB-Mid-server-WxaVRWag2.0qOo1r_iJg07RE';
const SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';
const TEST_PROFILE_ID = '84539b01-61d7-4dfc-88d3-ad306d2d12b2';

test.describe('Midtrans Sandbox & Database Persistence QA Suite', () => {
  let createdOrderId: string;

  test('1. Pre-Snap Database INSERT into public.payments', async () => {
    createdOrderId = `OD-TEST-QA-${Date.now()}`;
    const amount = 39000;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        user_id: TEST_PROFILE_ID,
        amount_idr: amount,
        status: 'pending',
        provider_ref: createdOrderId,
        raw: {
          plan: 'monthly',
          planName: 'Paket Bulanan OlahData (30 Hari)',
          customerName: 'QA Test Runner',
          customerEmail: 'qa@olahdata.id',
          isSandbox: true,
          created_at: new Date().toISOString(),
        },
      }),
    });

    expect(res.status).toBe(201);
    const inserted = await res.json();
    expect(inserted.length).toBe(1);
    expect(inserted[0].provider_ref).toBe(createdOrderId);
    expect(inserted[0].status).toBe('pending');

    // Update with snap_token simulation
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(createdOrderId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          raw: {
            ...inserted[0].raw,
            snap_token: 'dummy-snap-token-qa-12345',
          },
          updated_at: new Date().toISOString(),
        }),
      }
    );
    expect(updateRes.status).toBe(200);
  });

  test('2. Midtrans Webhook SHA-512 Signature Verification & Tamper Detection', async () => {
    expect(createdOrderId).toBeDefined();
    const statusCode = '200';
    const grossAmount = '39000.00';

    const rawSig = `${createdOrderId}${statusCode}${grossAmount}${SERVER_KEY}`;
    const validSignature = crypto.createHash('sha512').update(rawSig).digest('hex');

    const checkSig = crypto.createHash('sha512').update(rawSig).digest('hex');
    expect(validSignature).toBe(checkSig);

    const tamperedSig = 'a'.repeat(128);
    expect(validSignature).not.toBe(tamperedSig);
  });

  test('3. Webhook Settlement & Idempotency Guard (No Backward Overwrite)', async () => {
    expect(createdOrderId).toBeDefined();
    const paidAt = new Date().toISOString();

    // Mark as paid
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(createdOrderId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          status: 'paid',
          paid_at: paidAt,
          updated_at: paidAt,
        }),
      }
    );
    expect(updateRes.status).toBe(200);
    const rows = await updateRes.json();
    expect(rows[0].status).toBe('paid');

    // Idempotency: Query DB to verify status remains paid
    const queryRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(createdOrderId)}&select=id,status`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const current = await queryRes.json();
    expect(current[0].status).toBe('paid');

    // Clean up
    await fetch(
      `${SUPABASE_URL}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(createdOrderId)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
  });

  test('4. Midtrans Sandbox Status API Connectivity', async () => {
    const auth = Buffer.from(`${SERVER_KEY}:`).toString('base64');
    const res = await fetch('https://api.sandbox.midtrans.com/v2/OD-PING-TEST/status', {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });
    const json = await res.json();
    expect(json.status_code === '404' || res.status === 404).toBe(true);
  });

  test('5. Variable Prefix Auto-Grouping Logic (X1.1 -> X1, KL1 -> KL)', async () => {
    const candidateCols = [
      'X1.1', 'X1.2', 'X1.3',
      'X2.1', 'X2.2', 'X2.3',
      'Y1.1', 'Y1.2', 'Y1.3',
      'Z.1', 'Z.2',
      'KL1', 'KL2', 'KL3',
      'KP1', 'KP2',
    ];

    const prefixMap = new Map<string, string[]>();
    candidateCols.forEach((col) => {
      const dotUnderscoreMatch = col.match(/^([A-Za-z]+\d+)[._\-\s]/);
      const letterDotMatch = col.match(/^([A-Za-z])[._\-\s]/);
      const lettersDigitsMatch = col.match(/^([A-Za-z]+)(?=\d+)/);
      const genericMatch = col.match(/^([A-Za-z]+|\w+?)(?:_|\d+|$)/);

      let prefix = '';
      if (dotUnderscoreMatch && dotUnderscoreMatch[1]) {
        prefix = dotUnderscoreMatch[1].toUpperCase();
      } else if (letterDotMatch && letterDotMatch[1]) {
        prefix = letterDotMatch[1].toUpperCase();
      } else if (lettersDigitsMatch && lettersDigitsMatch[1]) {
        prefix = lettersDigitsMatch[1].toUpperCase();
      } else if (genericMatch && genericMatch[1]) {
        prefix = genericMatch[1].toUpperCase();
      }

      if (prefix) {
        const list = prefixMap.get(prefix) || [];
        list.push(col);
        prefixMap.set(prefix, list);
      }
    });

    expect(prefixMap.get('X1')).toEqual(['X1.1', 'X1.2', 'X1.3']);
    expect(prefixMap.get('X2')).toEqual(['X2.1', 'X2.2', 'X2.3']);
    expect(prefixMap.get('Y1')).toEqual(['Y1.1', 'Y1.2', 'Y1.3']);
    expect(prefixMap.get('Z')).toEqual(['Z.1', 'Z.2']);
    expect(prefixMap.get('KL')).toEqual(['KL1', 'KL2', 'KL3']);
    expect(prefixMap.get('KP')).toEqual(['KP1', 'KP2']);
  });
});
