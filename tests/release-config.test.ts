import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static deployment contract', () => {
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as {
    globalHeaders: Record<string, string>;
    mimeTypes: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };

  it('does not precache deployment-only configuration', () => {
    const builder = readFileSync('scripts/build-sw.mjs', 'utf8');
    expect(builder).toContain("new Set(['staticwebapp.config.json'])");
    expect(builder).toContain('!deploymentOnlyFiles.has(entry.name)');
  });

  it('sets long-lived assets and no-cache worker policy', () => {
    expect(config.routes.find(({ route }) => route === '/assets/*')?.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(config.routes.find(({ route }) => route === '/sw.js')?.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  });

  it('sets browser hardening response policies', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(config.globalHeaders['Strict-Transport-Security']).toContain('max-age=63072000');
  });
});
