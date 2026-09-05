export const PRODUCT_SLUG = 'cycle-block-animator';
export const BILLING_BASE = 'https://api.sociobot.in/api/v1';
const TOKEN_KEY = `sb_license:${PRODUCT_SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;
const DAY = 86_400_000;

interface CachedVerdict { valid: boolean; reason: string; checkedAt: number; token: string }
let pendingVerification: Promise<{ valid: boolean; reason: string }> | null = null;

export function checkoutUrl(): string {
  return `${BILLING_BASE}/products/${PRODUCT_SLUG}/checkout`;
}

export function captureReturnedLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  storeLicense(token);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function storeLicense(token: string): void {
  const cleanToken = token.trim();
  if (localStorage.getItem(TOKEN_KEY) !== cleanToken) localStorage.removeItem(VERDICT_KEY);
  localStorage.setItem(TOKEN_KEY, cleanToken);
}

export function hasStoredLicense(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function hasOptimisticUnlock(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as CachedVerdict;
    return cached.token === token && cached.valid;
  } catch { return false; }
}

export async function verifyLicense(): Promise<{ valid: boolean; reason: string }> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { valid: false, reason: 'missing' };
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as CachedVerdict;
    if (cached.token === token && Date.now() - cached.checkedAt < DAY) return { valid: cached.valid, reason: cached.reason };
  } catch { /* verify below */ }
  if (pendingVerification) return pendingVerification;
  pendingVerification = (async () => {
    const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error(response.status === 429 ? 'Too many license checks. Try again later.' : 'License service is unavailable.');
    const data = await response.json() as { valid: boolean; reason: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: data.valid, reason: data.reason, checkedAt: Date.now(), token }));
    return data;
  })();
  try { return await pendingVerification; } finally { pendingVerification = null; }
}
