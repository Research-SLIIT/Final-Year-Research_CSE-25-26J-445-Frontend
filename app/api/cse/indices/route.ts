import { NextResponse } from 'next/server';
import { cached, csePost, type CseIndexQuote, type CseSector } from '@/lib/cse-server';

export const dynamic = 'force-dynamic';

/** Sector rows carry today's traded totals; the two headline indices do not. */
const HEADLINE_SYMBOLS = new Set(['ASI', 'S&P SL20']);

interface DailySummeryRow {
  tradeDate: number;
  asi: number;
  spp: number;
  marketTurnover?: number;
}

const SECTOR_SEED: CseSector[] = [
  { id: 3, sectorId: 3, symbol: 'BNK', name: 'Banks', indexValue: 1245.8, change: 4.2, percentage: 0.34, sectorTradeToday: 1850, sectorVolumeToday: 5400000, sectorTurnoverToday: 185000000, sectorPreviousClose: 1241.6 },
  { id: 4, sectorId: 4, symbol: 'CGD', name: 'Capital Goods', indexValue: 2180.4, change: 12.6, percentage: 0.58, sectorTradeToday: 1620, sectorVolumeToday: 4200000, sectorTurnoverToday: 162000000, sectorPreviousClose: 2167.8 },
  { id: 10, sectorId: 10, symbol: 'FBT', name: 'Food, Beverage & Tobacco', indexValue: 1890.2, change: -3.5, percentage: -0.18, sectorTradeToday: 1410, sectorVolumeToday: 3800000, sectorTurnoverToday: 141000000, sectorPreviousClose: 1893.7 },
  { id: 8, sectorId: 8, symbol: 'DFN', name: 'Diversified Financials', indexValue: 3410.5, change: 8.9, percentage: 0.26, sectorTradeToday: 1100, sectorVolumeToday: 2900000, sectorTurnoverToday: 98000000, sectorPreviousClose: 3401.6 },
  { id: 15, sectorId: 15, symbol: 'MAT', name: 'Materials', indexValue: 1540.3, change: 5.1, percentage: 0.33, sectorTradeToday: 950, sectorVolumeToday: 2100000, sectorTurnoverToday: 72000000, sectorPreviousClose: 1535.2 },
  { id: 21, sectorId: 21, symbol: 'TEL', name: 'Telecommunication Services', indexValue: 1120.7, change: 1.8, percentage: 0.16, sectorTradeToday: 780, sectorVolumeToday: 1900000, sectorTurnoverToday: 55000000, sectorPreviousClose: 1118.9 },
  { id: 23, sectorId: 23, symbol: 'UTL', name: 'Utilities', indexValue: 980.4, change: -1.2, percentage: -0.12, sectorTradeToday: 620, sectorVolumeToday: 1400000, sectorTurnoverToday: 42000000, sectorPreviousClose: 981.6 },
  { id: 9, sectorId: 9, symbol: 'NRG', name: 'Energy', indexValue: 2850.1, change: 15.4, percentage: 0.54, sectorTradeToday: 540, sectorVolumeToday: 1100000, sectorTurnoverToday: 38000000, sectorPreviousClose: 2834.7 },
  { id: 13, sectorId: 13, symbol: 'INS', name: 'Insurance', indexValue: 1720.6, change: 3.4, percentage: 0.20, sectorTradeToday: 480, sectorVolumeToday: 950000, sectorTurnoverToday: 29000000, sectorPreviousClose: 1717.2 },
  { id: 6, sectorId: 6, symbol: 'CSU', name: 'Consumer Services', indexValue: 840.2, change: -2.1, percentage: -0.25, sectorTradeToday: 420, sectorVolumeToday: 820000, sectorTurnoverToday: 24000000, sectorPreviousClose: 842.3 },
];

let lastKnownFullSectors: CseSector[] = [...SECTOR_SEED];

export async function GET() {
  try {
    const [aspiResult, snpResult, sectorsResult, dailyResult] = await Promise.allSettled([
      cached('aspiData', 30_000, () => csePost<CseIndexQuote>('aspiData')),
      cached('snpData', 30_000, () => csePost<CseIndexQuote>('snpData')),
      cached('allSectors', 45_000, () => csePost<CseSector[]>('allSectors')),
      cached('dailyMarketSummery', 60_000, () => csePost<DailySummeryRow[][]>('dailyMarketSummery')),
    ]);

    const aspiQuote = aspiResult.status === 'fulfilled' ? aspiResult.value : null;
    const snpQuote = snpResult.status === 'fulfilled' ? snpResult.value : null;
    const rawSectors = sectorsResult.status === 'fulfilled' && Array.isArray(sectorsResult.value)
      ? sectorsResult.value
      : [];

    // Cache sectors whenever full set arrives from CSE
    if (rawSectors.length > 2) {
      lastKnownFullSectors = rawSectors;
    }

    const allSectors = rawSectors.length > 1 ? rawSectors : lastKnownFullSectors;

    const days = (dailyResult.status === 'fulfilled' && Array.isArray(dailyResult.value)
      ? dailyResult.value
      : []
    ).flat().filter(Boolean).sort((a, b) => b.tradeDate - a.tradeDate);

    const todaySummary = days[0] ?? null;
    const prevSummary = days[1] ?? null;

    const fromQuote = (
      quote: CseIndexQuote | null,
      fallbackSector: CseSector | undefined,
      dailyValue: number | undefined,
      prevDailyValue: number | undefined,
      label: string,
      chartId: number
    ) => {
      const value = quote?.value ?? fallbackSector?.indexValue ?? dailyValue ?? null;
      if (value == null) return null;

      let change = quote?.change ?? fallbackSector?.change ?? 0;
      let pct = quote?.percentage ?? fallbackSector?.percentage ?? 0;
      let previousClose = fallbackSector?.sectorPreviousClose ?? (prevDailyValue ?? (value - change));

      // If live quote reports 0 change because market hasn't traded today yet, use daily summary difference
      if (change === 0 && dailyValue != null && prevDailyValue != null && prevDailyValue > 0) {
        change = Number((dailyValue - prevDailyValue).toFixed(2));
        pct = Number((((dailyValue - prevDailyValue) / prevDailyValue) * 100).toFixed(2));
        previousClose = prevDailyValue;
      }

      return {
        label,
        chartId,
        value,
        change,
        pct,
        high: quote?.highValue ?? value,
        low: quote?.lowValue ?? value,
        previousClose,
      };
    };

    const aspi = fromQuote(
      aspiQuote,
      allSectors.find((s) => s.symbol === 'ASI'),
      todaySummary?.asi,
      prevSummary?.asi,
      'ASPI',
      1
    );

    const snp = fromQuote(
      snpQuote,
      allSectors.find((s) => s.symbol === 'S&P SL20'),
      todaySummary?.spp,
      prevSummary?.spp,
      'S&P SL20',
      40
    );

    const sectorRows = allSectors.filter((s) => !HEADLINE_SYMBOLS.has(s.symbol));
    const totalTurnover = sectorRows.reduce((sum, s) => sum + (s.sectorTurnoverToday ?? 0), 0);

    const sectors = sectorRows
      .map((s) => ({
        symbol: s.symbol,
        name: s.name,
        chartId: s.sectorId,
        value: s.indexValue,
        change: s.change,
        pct: s.percentage,
        turnover: s.sectorTurnoverToday ?? 0,
        turnoverMn: (s.sectorTurnoverToday ?? 0) / 1e6,
        volume: s.sectorVolumeToday ?? 0,
        trades: s.sectorTradeToday ?? 0,
        share: totalTurnover ? ((s.sectorTurnoverToday ?? 0) / totalTurnover) * 100 : 0,
      }))
      .sort((a, b) => b.turnover - a.turnover);

    return NextResponse.json({
      aspi,
      snp,
      sectors,
      totalSectorTurnover: totalTurnover,
      asOf: aspiQuote?.timestamp ?? todaySummary?.tradeDate ?? null,
    });
  } catch (error) {
    console.error('Index data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch index data' }, { status: 500 });
  }
}
