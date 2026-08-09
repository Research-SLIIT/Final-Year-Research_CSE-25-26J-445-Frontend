import { NextResponse } from 'next/server';
import { cached, csePost } from '@/lib/cse-server';

export const dynamic = 'force-dynamic';

/** Live intraday totals — refreshed continuously while the market is open. */
interface MarketSummery {
  tradeVolume: number; // LKR turnover, despite the name
  shareVolume: number;
  trades: number;
  tradeDate: number;
}

/** End-of-day totals; CSE returns [[today], [previousDay]]. */
interface DailySummery {
  tradeDate: number;
  marketTurnover: number;
  volumeOfTurnOverNumber: number;
  tradesNo: number;
  marketCap: number;
  listedCompanyNumber: number;
  tradeCompanyNumber: number;
  equityForeignPurchase: number;
  equityForeignSales: number;
  per: number;
  pbv: number;
  dy: number;
  asi: number;
  spp: number;
}

function pctChange(current: number, previous: number): number | null {
  if (!previous || !Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return ((current - previous) / previous) * 100;
}

export async function GET() {
  try {
    const [liveResult, dailyResult] = await Promise.allSettled([
      cached('marketSummery', 30_000, () => csePost<MarketSummery>('marketSummery')),
      cached('dailyMarketSummery', 60_000, () => csePost<DailySummery[][]>('dailyMarketSummery')),
    ]);

    const live = liveResult.status === 'fulfilled' ? liveResult.value : null;

    // Flatten [[today], [prev]] and order newest first, defensively — the outer
    // grouping is not documented and has changed shape before.
    const days = (dailyResult.status === 'fulfilled' ? dailyResult.value : [])
      .flat()
      .filter(Boolean)
      .sort((a, b) => b.tradeDate - a.tradeDate);

    const today = days[0] ?? null;
    const prev = days[1] ?? null;

    if (!live && !today) {
      return NextResponse.json({ error: 'CSE market summary unavailable' }, { status: 502 });
    }

    // Prefer live intraday figures for the headline number; measure the trend
    // against the previous session's official close.
    const turnover = live?.tradeVolume ?? today?.marketTurnover ?? null;
    const volume = live?.shareVolume ?? today?.volumeOfTurnOverNumber ?? null;
    const trades = live?.trades ?? today?.tradesNo ?? null;
    const marketCap = today?.marketCap ?? null;

    const netForeign =
      today != null ? today.equityForeignPurchase - today.equityForeignSales : null;

    return NextResponse.json({
      asOf: live?.tradeDate ?? today?.tradeDate ?? null,
      previousSessionDate: prev?.tradeDate ?? null,
      tiles: {
        marketCapBn: marketCap != null ? marketCap / 1e9 : null,
        marketCapTrend: prev && marketCap ? pctChange(marketCap, prev.marketCap) : null,
        turnoverMn: turnover != null ? turnover / 1e6 : null,
        turnoverTrend: prev && turnover ? pctChange(turnover, prev.marketTurnover) : null,
        volumeMn: volume != null ? volume / 1e6 : null,
        volumeTrend: prev && volume ? pctChange(volume, prev.volumeOfTurnOverNumber) : null,
        trades,
        tradesTrend: prev && trades ? pctChange(trades, prev.tradesNo) : null,
      },
      internals: {
        per: today?.per ?? null,
        pbv: today?.pbv ?? null,
        dividendYield: today?.dy ?? null,
        netForeignFlowMn: netForeign != null ? netForeign / 1e6 : null,
        listedCompanies: today?.listedCompanyNumber ?? null,
        tradedCompanies: today?.tradeCompanyNumber ?? null,
      },
    });
  } catch (error) {
    console.error('Market summary fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch market summary' }, { status: 500 });
  }
}
