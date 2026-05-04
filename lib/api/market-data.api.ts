/**
 * Market Data API Service
 * Proxies requests to CSE through internal Next.js API routes
 */

export interface TradeSummaryItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentageChange: number;
  volume: number;
  turnover: number;
  lastTradedTime: string | number;
  high?: number;
  low?: number;
  previousClose?: number;
  open?: number;
  sharevolume?: number;
  tradevolume?: number;
  marketCap?: number;
  logoUrl?: string;
}

export interface TradeSummaryResponse {
  reqTradeSummery: TradeSummaryItem[];
}

/**
 * Fetch the latest trade summary for all companies
 */
export async function fetchTradeSummary(): Promise<TradeSummaryItem[]> {
  try {
    const response = await fetch('/api/market-data/trade-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trade summary: ${response.status}`);
    }

    const data: TradeSummaryResponse = await response.json();
    return data.reqTradeSummery || [];
  } catch (error) {
    console.error('Error fetching trade summary:', error);
    return [];
  }
}
