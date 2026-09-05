import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Claim { id: string; test: string }

describe('public claim inventory', () => {
  const claims = JSON.parse(readFileSync('.factory/claims.json', 'utf8')) as Claim[];
  const browserTests = readFileSync('tests/e2e/claims.spec.ts', 'utf8');

  it('has unique IDs and one tagged browser test per claim', () => {
    expect(new Set(claims.map(({ id }) => id)).size).toBe(claims.length);
    for (const { id, test } of claims) {
      const occurrences = browserTests.match(new RegExp(`@claim:${id}(?![a-z0-9-])`, 'g')) ?? [];
      expect(occurrences, id).toHaveLength(1);
      expect(test).toBe(`npx playwright test --grep "@claim:${id}"`);
    }
  });
});
