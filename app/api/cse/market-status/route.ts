import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getCalculatedMarketStatus(): string {
  // Colombo is UTC+5:30
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const colomboTime = new Date(utc + 3_600_000 * 5.5);
  const day = colomboTime.getDay(); // 0 = Sun, 6 = Sat
  const hour = colomboTime.getHours();
  const minute = colomboTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Monday to Friday
  if (day >= 1 && day <= 5) {
    if (timeInMinutes >= 540 && timeInMinutes < 570) {
      // 09:00 - 09:30
      return 'Pre Trading';
    }
    if (timeInMinutes >= 570 && timeInMinutes < 870) {
      // 09:30 - 14:30
      return 'Regular Trading';
    }
  }
  return 'Market Closed';
}

async function handleMarketStatus() {
  try {
    const response = await fetch('https://www.cse.lk/api/marketStatus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.cse.lk',
        'Referer': 'https://www.cse.lk/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({}),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().length > 0) {
        try {
          const data = JSON.parse(text);
          const status = data?.status ?? data?.marketStatus;
          if (status) {
            return NextResponse.json({ status, marketStatus: status });
          }
        } catch {
          // Response body was not valid JSON
        }
      }
    }

    const fallbackStatus = getCalculatedMarketStatus();
    return NextResponse.json({ status: fallbackStatus, marketStatus: fallbackStatus });
  } catch (error) {
    console.warn('[market-status] Upstream unavailable, using calculated status:', error);
    const fallbackStatus = getCalculatedMarketStatus();
    return NextResponse.json({ status: fallbackStatus, marketStatus: fallbackStatus });
  }
}

export async function POST() {
  return handleMarketStatus();
}

export async function GET() {
  return handleMarketStatus();
}
