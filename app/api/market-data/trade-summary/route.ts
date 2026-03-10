import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('https://www.cse.lk/api/tradeSummary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.cse.lk',
        'Referer': 'https://www.cse.lk/equity/trade-summary',
      },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `CSE API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Market data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
