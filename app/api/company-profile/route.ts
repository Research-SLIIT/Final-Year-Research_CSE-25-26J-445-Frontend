import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const symbol = request.nextUrl.searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
    }

    const upstreamUrl = `https://www.cse.lk/api/companyProfile?symbol=${encodeURIComponent(symbol)}`;

    const response = await fetch(upstreamUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
        },
        next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!response.ok) {
        return NextResponse.json(
            { error: `Upstream error: ${response.status}` },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
}
