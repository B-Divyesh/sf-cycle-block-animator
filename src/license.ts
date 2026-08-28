export const PRODUCT_SLUG = 'cycle-block-animator';
export const BILLING_BASE = 'https://api.sociobot.in/api/v1';
const TOKEN_KEY = `sb_license:${PRODUCT_SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;
const DAY = 86_400_000;

interface CachedVerdict { valid: boolean; checkedAt: number }

export function checkoutUrl(): string {
  return `${BILLING_BASE}/products/${PRODUCT_SLUG}/checkout`;
}

export function captureReturnedLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function storeLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function hasStoredLicense(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function hasOptimisticUnlock(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as CachedVerdict;
    return cached.valid;
  } catch { return true; }
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; reason: string }> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { valid: false, reason: 'missing' };
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as CachedVerdict;
      if (Date.now() - cached.checkedAt < DAY) return { valid: cached.valid, reason: 'cached' };
    } catch { /* verify below */ }
  }
  const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service is unavailable');
  const data = await response.json() as { valid: boolean; reason: string };
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: data.valid, checkedAt: Date.now() }));
  return data;
}
