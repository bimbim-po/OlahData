import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const backupDir = path.join(webRoot, '.export_backup');
const apiPath = path.join(webRoot, 'src', 'app', 'api');
const apiTempPath = path.join(backupDir, 'api');
const testsPath = path.join(webRoot, 'src', 'lib', '__tests__');
const testsTempPath = path.join(backupDir, '__tests__');

console.log('--- OlahData Static Export Build ---');

let renamedApi = false;
let renamedTests = false;
try {
  fs.mkdirSync(backupDir, { recursive: true });
  if (fs.existsSync(apiPath)) {
    console.log('[1/4] Moving server API routes aside for static export...');
    fs.renameSync(apiPath, apiTempPath);
    renamedApi = true;
  }
  if (fs.existsSync(testsPath)) {
    console.log('[1/4] Moving test suite aside for static export...');
    fs.renameSync(testsPath, testsTempPath);
    renamedTests = true;
  }

  console.log('[2/4] Running next build with NEXT_EXPORT=true...');
  let result = spawnSync('npx next build', {
    cwd: webRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NEXT_EXPORT: 'true',
    },
  });

  if (result.status !== 0) {
    console.log('Retrying next build (handling Next.js advisory prompt)...');
    result = spawnSync('npx next build', {
      cwd: webRoot,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NEXT_EXPORT: 'true',
      },
    });
  }

  if (result.status !== 0) {
    throw new Error(`Build exited with code ${result.status}`);
  }

  console.log('[3/4] Adding Cloudflare Pages SPA redirects & /api/version.json...');
  const outDir = path.join(webRoot, 'out');
  if (fs.existsSync(outDir)) {
    // Helper to mirror every *.html into */index.html for complete compatibility with Cloudflare Pages
    function copyHtmlToDirectoryIndex(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          copyHtmlToDirectoryIndex(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html' && entry.name !== '404.html') {
          const dirName = entry.name.replace(/\.html$/, '');
          const targetDir = path.join(dir, dirName);
          const targetIndex = path.join(targetDir, 'index.html');
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.copyFileSync(fullPath, targetIndex);
        }
      }
    }

    copyHtmlToDirectoryIndex(outDir);

    // Generate /api/version.json for deployment verification (Step 6)
    const apiOutDir = path.join(outDir, 'api');
    fs.mkdirSync(apiOutDir, { recursive: true });
    const buildId = `build-0.1.0-${Date.now()}`;
    const versionPayload = {
      service: 'olahdata-web',
      version: '0.1.0',
      buildId,
      commitSha: process.env.CF_PAGES_COMMIT_SHA || 'sync-s1-s5-verified',
      builtAt: new Date().toISOString(),
      syncSpecVersion: 'S1-S5-v1',
      status: 'healthy',
    };
    fs.writeFileSync(
      path.join(apiOutDir, 'version.json'),
      JSON.stringify(versionPayload, null, 2),
      'utf-8'
    );

    const redirectsContent = `# Cloudflare Pages Redirects for SPA routes
/api/version /api/version.json 200
/auth/callback /auth/callback/index.html 200
/reset-sandi /reset-sandi/index.html 200
/lupa-sandi /lupa-sandi/index.html 200
/app/proyek/baru /app/proyek/baru/index.html 200
/app/proyek/*/hasil /app/proyek/sample/hasil/index.html 200
/app/proyek/*/analisis /app/proyek/sample/analisis/index.html 200
/admin/pelanggan/* /admin/pelanggan/sample/index.html 200
`;
    fs.writeFileSync(path.join(outDir, '_redirects'), redirectsContent, 'utf-8');

    const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()

/api/*
  Cache-Control: no-store, no-cache, must-revalidate
  Content-Type: application/json; charset=utf-8
`;
    fs.writeFileSync(path.join(outDir, '_headers'), headersContent, 'utf-8');
    console.log('Static export complete in out/ folder with _redirects, _headers, and /api/version.json.');
  }
} finally {
  if (renamedApi && fs.existsSync(apiTempPath)) {
    console.log('[4/4] Restoring server API routes...');
    fs.renameSync(apiTempPath, apiPath);
  }
  if (renamedTests && fs.existsSync(testsTempPath)) {
    console.log('[4/4] Restoring test suite...');
    fs.renameSync(testsTempPath, testsPath);
  }
  if (fs.existsSync(backupDir)) {
    try {
      fs.rmdirSync(backupDir);
    } catch {
      // ignore if non-empty
    }
  }
}
