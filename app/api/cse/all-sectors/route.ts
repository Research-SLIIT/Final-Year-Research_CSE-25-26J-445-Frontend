import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('https://www.cse.lk/api/allSectors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.cse.lk',
        'Referer': 'https://www.cse.lk/',
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
    console.error('All sectors fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sector data' },
      { status: 500 }
    );
  }
}
