import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const apiPath = path.join(webRoot, 'src', 'app', 'api');
const apiTempPath = path.join(webRoot, 'src', 'app', '_api_server');

console.log('--- OlahData Static Export Build ---');

let renamed = false;
try {
  if (fs.existsSync(apiPath)) {
    console.log('[1/4] Moving server API routes aside for static export...');
    fs.renameSync(apiPath, apiTempPath);
    renamed = true;
  }

  console.log('[2/4] Running next build with NEXT_EXPORT=true...');
  const result = spawnSync('npx next build', {
    cwd: webRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NEXT_EXPORT: 'true',
    },
  });

  if (result.status !== 0) {
    throw new Error(`Build exited with code ${result.status}`);
  }

  console.log('[3/4] Adding Cloudflare Pages SPA redirects if needed...');
  const outDir = path.join(webRoot, 'out');
  if (fs.existsSync(outDir)) {
    // Cloudflare Pages _redirects file for SPA fallback if needed
    const redirectsContent = `# Cloudflare Pages Redirects for SPA routes
/app/proyek/*/hasil /app/proyek/sample/hasil 200
/app/proyek/*/analisis /app/proyek/sample/analisis 200
/app/proyek/* /app/proyek/sample/analisis 200
/admin/pelanggan/* /admin/pelanggan/sample 200
`;
    fs.writeFileSync(path.join(outDir, '_redirects'), redirectsContent, 'utf-8');
    console.log('Static export complete in out/ folder.');
  }

} finally {
  if (renamed && fs.existsSync(apiTempPath)) {
    console.log('[4/4] Restoring server API routes...');
    fs.renameSync(apiTempPath, apiPath);
  }
}
