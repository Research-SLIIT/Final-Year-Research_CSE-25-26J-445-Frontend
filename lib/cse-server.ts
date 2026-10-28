/**
 * Server-side helpers for talking to the Colombo Stock Exchange public API.
 *
 * All CSE endpoints are POST-only and reject requests without a cse.lk Origin,
 * so every call has to be proxied through our own routes. Next.js does not
 * cache POST fetches, so we keep a small in-process TTL cache to avoid hitting
 * cse.lk once per endpoint per page load.
 */

const CSE_API = 'https://www.cse.lk/api';

/** News images and announcement PDFs live at the CDN root. */
export const CSE_CDN = 'https://cdn.cse.lk';
/** Company logos live under /cmt on the same CDN. */
export const CSE_LOGO_CDN = 'https://cdn.cse.lk/cmt';

const CSE_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  Origin: 'https://www.cse.lk',
  Referer: 'https://www.cse.lk/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
};

type CacheEntry = { at: number; data: unknown };
const cache = new Map<string, CacheEntry>();

/**
 * Runs `fn` at most once per `ttlMs`. If a refresh fails but we still hold a
 * previous value, the stale value is served rather than surfacing an error —
 * a dashboard showing slightly old real numbers beats one showing nothing.
 */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;

  try {
    const data = await fn();
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch (err) {
    if (hit) {
      console.warn(`[cse] refresh failed for "${key}", serving stale value:`, err);
      return hit.data as T;
    }
    throw err;
  }
}

/** POST a CSE JSON endpoint (allSectors, aspiData, topGainers, …). */
export async function csePost<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${CSE_API}/${endpoint}`, {
    method: 'POST',
    headers: { ...CSE_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CSE ${endpoint} returned ${res.status}`);
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text || !text.trim()) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn(`[cse] Failed to parse JSON from ${endpoint}:`, err);
    return null as T;
  }
}

/** GET a CSE endpoint (only /news/web works this way). */
export async function cseGet<T>(path: string): Promise<T> {
  const res = await fetch(`${CSE_API}/${path}`, {
    method: 'GET',
    headers: CSE_HEADERS,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CSE ${path} returned ${res.status}`);
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text || !text.trim()) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn(`[cse] Failed to parse JSON from ${path}:`, err);
    return null as T;
  }
}

/** CSE index/sector chart series. `chartId` is the sectorId (1 = ASPI, 40 = S&P SL20). */
export async function cseChart(chartId: string | number, period: string | number) {
  const form = new FormData();
  form.append('chartId', String(chartId));
  form.append('period', String(period));

  const res = await fetch(`${CSE_API}/chartData`, {
    method: 'POST',
    headers: CSE_HEADERS,
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CSE chartData ${chartId} returned ${res.status}`);
  return res.json() as Promise<Array<{ d: number; v: number; pc: number }>>;
}

// ─── Shared CSE response shapes ───────────────────────────────────────────────

export interface CseIndexQuote {
  value: number;
  lowValue: number;
  highValue: number;
  change: number;
  percentage: number;
  sectorId: number;
  timestamp: number;
}

export interface CseSector {
  id: number;
  sectorId: number;
  symbol: string;
  name: string;
  indexValue: number;
  change: number;
  percentage: number;
  sectorTradeToday: number | null;
  sectorVolumeToday: number | null;
  sectorTurnoverToday: number | null;
  sectorPreviousClose: number;
}

export interface CseTradeSummaryRow {
  id: number;
  name: string;
  symbol: string;
  logoUrl: string | null;
  price: number;
  change: number;
  percentageChange: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
  turnover: number;
  sharevolume: number;
  tradevolume: number;
  marketCap: number;
  marketCapPercentage: number;
}

/** Company metadata keyed by symbol — the movers endpoints only return symbols. */
export async function companyIndex(): Promise<Map<string, CseTradeSummaryRow>> {
  return cached('tradeSummary', 60_000, async () => {
    const data = await csePost<{ reqTradeSummery: CseTradeSummaryRow[] }>('tradeSummary');
    const rows = data?.reqTradeSummery ?? [];
    return new Map(rows.map((r) => [r.symbol, r]));
  });
}

/** "COMB.N0000" → "COMB" */
export function baseSymbol(symbol: string): string {
  return symbol?.split('.')[0] ?? symbol;
}

export function logoUrl(path?: string | null): string | null {
  return path ? `${CSE_LOGO_CDN}/${path}` : null;
}
