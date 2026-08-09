import { NextResponse } from 'next/server';
import { cached, csePost, type CseIndexQuote, type CseSector } from '@/lib/cse-server';

export const dynamic = 'force-dynamic';

/** Sector rows carry today's traded totals; the two headline indices do not. */
const HEADLINE_SYMBOLS = new Set(['ASI', 'S&P SL20']);

export async function GET() {
  try {
    const [aspiResult, snpResult, sectorsResult] = await Promise.allSettled([
      cached('aspiData', 30_000, () => csePost<CseIndexQuote>('aspiData')),
      cached('snpData', 30_000, () => csePost<CseIndexQuote>('snpData')),
      cached('allSectors', 45_000, () => csePost<CseSector[]>('allSectors')),
    ]);

    const aspiQuote = aspiResult.status === 'fulfilled' ? aspiResult.value : null;
    const snpQuote = snpResult.status === 'fulfilled' ? snpResult.value : null;
    const allSectors = sectorsResult.status === 'fulfilled' ? sectorsResult.value ?? [] : [];

    if (!aspiQuote && !snpQuote && !allSectors.length) {
      return NextResponse.json({ error: 'CSE index data unavailable' }, { status: 502 });
    }

    const fromQuote = (
      quote: CseIndexQuote | null,
      fallback: CseSector | undefined,
      label: string,
      chartId: number
    ) => {
      const value = quote?.value ?? fallback?.indexValue ?? null;
      if (value == null) return null;
      const change = quote?.change ?? fallback?.change ?? 0;
      return {
        label,
        chartId,
        value,
        change,
        // aspiData/snpData report percentage directly; sector rows do too.
        pct: quote?.percentage ?? fallback?.percentage ?? 0,
        // Real session high/low — previously these were fabricated from `change`.
        high: quote?.highValue ?? null,
        low: quote?.lowValue ?? null,
        previousClose: fallback?.sectorPreviousClose ?? (value - change),
      };
    };

    const aspi = fromQuote(
      aspiQuote,
      allSectors.find((s) => s.symbol === 'ASI'),
      'ASPI',
      1
    );
    const snp = fromQuote(
      snpQuote,
      allSectors.find((s) => s.symbol === 'S&P SL20'),
      'S&P SL20',
      40
    );

    const sectorRows = allSectors.filter((s) => !HEADLINE_SYMBOLS.has(s.symbol));
    const totalTurnover = sectorRows.reduce((sum, s) => sum + (s.sectorTurnoverToday ?? 0), 0);

    const sectors = sectorRows
      .map((s) => ({
        symbol: s.symbol,
        name: s.name,
        // chartData keys sector series by sectorId.
        chartId: s.sectorId,
        value: s.indexValue,
        change: s.change,
        pct: s.percentage,
        turnover: s.sectorTurnoverToday ?? 0,
        turnoverMn: (s.sectorTurnoverToday ?? 0) / 1e6,
        volume: s.sectorVolumeToday ?? 0,
        trades: s.sectorTradeToday ?? 0,
        // Real share of today's traded value, instead of equal-weight slices.
        share: totalTurnover ? ((s.sectorTurnoverToday ?? 0) / totalTurnover) * 100 : 0,
      }))
      .sort((a, b) => b.turnover - a.turnover);

    return NextResponse.json({
      aspi,
      snp,
      sectors,
      totalSectorTurnover: totalTurnover,
      asOf: aspiQuote?.timestamp ?? null,
    });
  } catch (error) {
    console.error('Index data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch index data' }, { status: 500 });
  }
}
