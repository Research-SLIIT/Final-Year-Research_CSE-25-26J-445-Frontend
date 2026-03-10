import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const numberOfRecord = searchParams.get('numberOfRecord') || '5';
  const type = searchParams.get('type') || 'CN';

  try {
    const params = new URLSearchParams({
      top: 'true',
      type,
      numberOfRecord,
    });

    const response = await fetch(`https://www.cse.lk/api/news/web?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.cse.lk',
        'Referer': 'https://www.cse.lk/',
      },
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
    console.error('News fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
