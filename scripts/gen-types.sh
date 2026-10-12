#!/usr/bin/env bash
# scripts/gen-types.sh
# Menghasilkan definisi tipe TypeScript otomatis dari skema database Supabase lokal/cloud.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_FILE="$ROOT_DIR/apps/web/src/lib/db.types.ts"

echo "=== Menghasilkan Definisi Tipe TypeScript Supabase ==="

if command -v supabase &> /dev/null; then
    supabase gen types typescript --local > "$OUTPUT_FILE"
elif command -v npx &> /dev/null; then
    npx supabase gen types typescript --local > "$OUTPUT_FILE"
else
    echo "Peringatan: Supabase CLI tidak ditemukan di PATH. Menjalankan fallback generator..."
    node "$SCRIPT_DIR/gen-types.mjs"
fi

echo "Berhasil! Tipe data disimpan di: $OUTPUT_FILE"
