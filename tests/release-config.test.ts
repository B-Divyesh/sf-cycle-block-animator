import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static deployment contract', () => {
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as {
    globalHeaders: Record<string, string>;
    mimeTypes: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };

  it('uses the designed 404 document without rewriting unknown routes to the editor', () => {
    const typedConfig = config as typeof config & { navigationFallback?: unknown; responseOverrides: Record<string, { rewrite: string }> };
    expect(typedConfig.navigationFallback).toBeUndefined();
    expect(typedConfig.responseOverrides['404']).toEqual({ rewrite: '/404.html' });
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
