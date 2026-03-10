import { NextResponse } from 'next/server';

// Maps friendly period labels to CSE numeric period codes
const PERIOD_MAP: Record<string, string> = {
  '1D': '1',
  '1W': '2',
  '1M': '3',
  '3M': '4',
  '1Y': '5',
  // Also accept raw numeric strings
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chartId = '1', period = '1D' } = body;

    const csePeriod = PERIOD_MAP[period] ?? '1';

    // CSE expects multipart/form-data for chartData
    const formData = new FormData();
    formData.append('chartId', String(chartId));
    formData.append('period', csePeriod);

    const response = await fetch('https://www.cse.lk/api/chartData', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.cse.lk',
        'Referer': 'https://www.cse.lk/',
      },
      body: formData,
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
    console.error('Chart data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
