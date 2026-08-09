/**
 * Market-risk statistics and price snapshots for demo mode.
 *
 * These replace two of the last fabricated surfaces in the app:
 *
 *   - `runRiskAnalysis` returned the same six numbers (VaR 145.5, beta 1.12, …)
 *     for every company on the exchange.
 *   - `getOhlcvSnapshot` read a nine-company mock file and returned null for
 *     everyone else.
 *
 * Neither has a backend model behind it — no service produces VaR or beta — so
 * there was nothing to capture. Instead `scripts/demo/compute-risk.mjs` derives
 * them from the real CSE closing prices harvested for each company, with beta
 * measured against ASPI. Statistics over real market data, and the payload says
 * as much in its `provenance` block so the UI can label them correctly rather
 * than let them read as model predictions.
 *
 * The Z-score gauge on the same screen is a genuine model output and arrives
 * separately, through the financial-health stream.
 */

import { loadFixture } from './fixtures';
import type { OhlcvSnapshot, RiskResult } from '@/lib/fakeApi';

export interface RiskProvenance {
  method: 'computed';
  basis: string;
  sessions: number;
  window: { from: string; to: string };
  riskFreeRate: number;
  betaBenchmark: string;
  note: string;
}

export type DemoRiskResult = RiskResult & { provenance: RiskProvenance };

/** "JKH.N0000" → "JKH", the key the fixtures are stored under. */
function baseSymbol(symbol: string): string {
  return symbol.split('.')[0].trim().toUpperCase();
}

/** Computed risk statistics for a company. Throws when it has none. */
export function loadRiskResult(symbol: string): Promise<DemoRiskResult> {
  return loadFixture<DemoRiskResult>('risk', `${baseSymbol(symbol)}.json`);
}

interface CapturedHistoryRow {
  date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  share_volume: number;
}

/**
 * Latest session's OHLCV, taken from the tail of the captured price history.
 *
 * `prevClose` comes from the session before it, so the day's change is a real
 * comparison rather than a repeated number.
 */
export async function loadOhlcvSnapshot(symbol: string): Promise<OhlcvSnapshot | null> {
  const key = baseSymbol(symbol);

  try {
    const captured = await loadFixture<{ history?: CapturedHistoryRow[] }>(
      'open-price', 'history', `${key}.json`,
    );
    const history = captured.history ?? [];
    if (!history.length) return null;

    const latest = history[history.length - 1];
    const previous = history[history.length - 2] ?? latest;

    return {
      symbol: key,
      name: key,
      open: latest.open_price,
      high: latest.high_price,
      low: latest.low_price,
      close: latest.close_price,
      prevClose: previous.close_price,
      volume: latest.share_volume,
      date: latest.date,
    };
  } catch {
    return null;
  }
}
