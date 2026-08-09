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

    const decorate = (rows: CseMover[]) =>
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

    const gainers = gainersResult.status === 'fulfilled' ? decorate(gainersResult.value ?? []) : [];
    const losers = losersResult.status === 'fulfilled' ? decorate(losersResult.value ?? []) : [];

    const mostActive =
      activeResult.status === 'fulfilled'
        ? (activeResult.value ?? []).slice(0, 6).map((row) => {
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

    if (!gainers.length && !losers.length && !mostActive.length) {
      return NextResponse.json({ error: 'CSE movers unavailable' }, { status: 502 });
    }

    return NextResponse.json({ gainers, losers, mostActive });
  } catch (error) {
    console.error('Movers fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch market movers' }, { status: 500 });
  }
}
