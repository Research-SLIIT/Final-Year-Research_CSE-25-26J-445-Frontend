import { NextResponse } from 'next/server';
import { baseSymbol, cached, companyIndex, csePost, logoUrl } from '@/lib/cse-server';

export const dynamic = 'force-dynamic';

interface CseMover {
  symbol: string;
  price: number;
  change: number;
  changePercentage: number;
  tradeDate: number;
}

interface CseActive {
  symbol: string;
  tradeVolume: number;
  shareVolume: number;
  turnover: number;
  percentageShareVolume: number;
}

interface MoverItem {
  symbol: string;
  ticker: string;
  name: string;
  logo: string | null;
  price: number;
  change: number;
  pct: number;
  high: number | null;
  low: number | null;
  turnover: number | null;
}

interface ActiveItem {
  symbol: string;
  ticker: string;
  name: string;
  logo: string | null;
  turnoverMn: number;
  volumeMn: number;
  trades: number;
  price: number | null;
  pct: number | null;
}

const SEED_GAINERS: MoverItem[] = [
  { symbol: 'COMB.N0000', ticker: 'COMB', name: 'Commercial Bank of Ceylon PLC', logo: null, price: 124.5, change: 3.5, pct: 2.89, high: 125.0, low: 121.0, turnover: 112800000 },
  { symbol: 'SAMP.N0000', ticker: 'SAMP', name: 'Sampath Bank PLC', logo: null, price: 96.8, change: 2.4, pct: 2.54, high: 97.5, low: 94.0, turnover: 94500000 },
  { symbol: 'HNB.N0000', ticker: 'HNB', name: 'Hatton National Bank PLC', logo: null, price: 245.0, change: 5.25, pct: 2.19, high: 246.0, low: 239.5, turnover: 65200000 },
  { symbol: 'JKH.N0000', ticker: 'JKH', name: 'John Keells Holdings PLC', logo: null, price: 21.8, change: 0.4, pct: 1.87, high: 22.0, low: 21.3, turnover: 145200000 },
  { symbol: 'LOLC.N0000', ticker: 'LOLC', name: 'LOLC Holdings PLC', logo: null, price: 468.0, change: 6.5, pct: 1.41, high: 472.0, low: 461.0, turnover: 58900000 },
];

const SEED_LOSERS: MoverItem[] = [
  { symbol: 'BIL.N0000', ticker: 'BIL', name: 'Browns Investments PLC', logo: null, price: 6.2, change: -0.3, pct: -4.62, high: 6.5, low: 6.1, turnover: 78400000 },
  { symbol: 'DIAL.N0000', ticker: 'DIAL', name: 'Dialog Axiata PLC', logo: null, price: 11.0, change: -0.3, pct: -2.65, high: 11.4, low: 10.9, turnover: 32100000 },
  { symbol: 'LIOC.N0000', ticker: 'LIOC', name: 'Lanka IOC PLC', logo: null, price: 123.5, change: -2.25, pct: -1.79, high: 126.0, low: 123.0, turnover: 45600000 },
  { symbol: 'CARG.N0000', ticker: 'CARG', name: 'Cargills (Ceylon) PLC', logo: null, price: 408.0, change: -4.5, pct: -1.09, high: 414.0, low: 407.0, turnover: 28900000 },
  { symbol: 'MELS.N0000', ticker: 'MELS', name: 'Melstacorp PLC', logo: null, price: 104.0, change: -1.0, pct: -0.95, high: 106.0, low: 103.5, turnover: 21400000 },
];

const SEED_ACTIVE: ActiveItem[] = [
  { symbol: 'JKH.N0000', ticker: 'JKH', name: 'John Keells Holdings PLC', logo: null, turnoverMn: 145.2, volumeMn: 6.66, trades: 850, price: 21.8, pct: 1.87 },
  { symbol: 'COMB.N0000', ticker: 'COMB', name: 'Commercial Bank of Ceylon PLC', logo: null, turnoverMn: 112.8, volumeMn: 0.91, trades: 620, price: 124.5, pct: 2.89 },
  { symbol: 'SAMP.N0000', ticker: 'SAMP', name: 'Sampath Bank PLC', logo: null, turnoverMn: 94.5, volumeMn: 0.98, trades: 540, price: 96.8, pct: 2.54 },
  { symbol: 'BIL.N0000', ticker: 'BIL', name: 'Browns Investments PLC', logo: null, turnoverMn: 78.4, volumeMn: 12.65, trades: 1120, price: 6.2, pct: -4.62 },
  { symbol: 'HNB.N0000', ticker: 'HNB', name: 'Hatton National Bank PLC', logo: null, turnoverMn: 65.2, volumeMn: 0.27, trades: 380, price: 245.0, pct: 2.19 },
  { symbol: 'LOLC.N0000', ticker: 'LOLC', name: 'LOLC Holdings PLC', logo: null, turnoverMn: 58.9, volumeMn: 0.13, trades: 310, price: 468.0, pct: 1.41 },
];

let lastKnownMovers: { gainers: MoverItem[]; losers: MoverItem[]; mostActive: ActiveItem[] } = {
  gainers: [...SEED_GAINERS],
  losers: [...SEED_LOSERS],
  mostActive: [...SEED_ACTIVE],
};

export async function GET() {
  try {
    const [gainersResult, losersResult, activeResult, companiesResult] = await Promise.allSettled([
      cached('topGainers', 45_000, () => csePost<CseMover[]>('topGainers')),
      // CSE really does spell this endpoint "topLooses".
      cached('topLooses', 45_000, () => csePost<CseMover[]>('topLooses')),
      cached('mostActiveTrades', 45_000, () => csePost<CseActive[]>('mostActiveTrades')),
      companyIndex(),
    ]);

    const companies =
      companiesResult.status === 'fulfilled' ? companiesResult.value : new Map();

    const decorate = (rows: CseMover[]): MoverItem[] =>
      rows.slice(0, 5).map((row) => {
        const company = companies.get(row.symbol);
        return {
          symbol: row.symbol,
          ticker: baseSymbol(row.symbol),
          name: company?.name ?? baseSymbol(row.symbol),
          logo: logoUrl(company?.logoUrl),
          price: row.price,
          change: row.change,
          pct: row.changePercentage,
          high: company?.high ?? null,
          low: company?.low ?? null,
          turnover: company?.turnover ?? null,
        };
      });

    const liveGainers = gainersResult.status === 'fulfilled' && Array.isArray(gainersResult.value)
      ? decorate(gainersResult.value)
      : [];
    const liveLosers = losersResult.status === 'fulfilled' && Array.isArray(losersResult.value)
      ? decorate(losersResult.value)
      : [];

    const liveActive: ActiveItem[] =
      activeResult.status === 'fulfilled' && Array.isArray(activeResult.value)
        ? activeResult.value.slice(0, 6).map((row) => {
            const company = companies.get(row.symbol);
            return {
              symbol: row.symbol,
              ticker: baseSymbol(row.symbol),
              name: company?.name ?? baseSymbol(row.symbol),
              logo: logoUrl(company?.logoUrl),
              turnoverMn: row.turnover / 1e6,
              volumeMn: row.shareVolume / 1e6,
              trades: row.tradeVolume,
              price: company?.price ?? null,
              pct: company?.percentageChange ?? null,
            };
          })
        : [];

    // Cache live results if any endpoint returned valid records
    if (liveGainers.length > 0 || liveLosers.length > 0 || liveActive.length > 0) {
      lastKnownMovers = {
        gainers: liveGainers.length ? liveGainers : lastKnownMovers.gainers,
        losers: liveLosers.length ? liveLosers : lastKnownMovers.losers,
        mostActive: liveActive.length ? liveActive : lastKnownMovers.mostActive,
      };
    }

    const gainers = liveGainers.length ? liveGainers : lastKnownMovers.gainers;
    const losers = liveLosers.length ? liveLosers : lastKnownMovers.losers;
    const mostActive = liveActive.length ? liveActive : lastKnownMovers.mostActive;

    return NextResponse.json({ gainers, losers, mostActive });
  } catch (error) {
    console.error('Movers fetch error:', error);
    return NextResponse.json(lastKnownMovers);
  }
}
