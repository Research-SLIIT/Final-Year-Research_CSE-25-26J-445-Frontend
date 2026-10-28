import { NextResponse } from 'next/server';
import { CSE_CDN, cached, cseGet, logoUrl } from '@/lib/cse-server';
import { parseRss } from '@/lib/rss';

export const dynamic = 'force-dynamic';

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  image: string | null;
  logo: string | null;
  source: string;
  sourceKind: 'cse' | 'press';
  category: string;
  url: string | null;
  publishedAt: string | null;
}

// ─── CSE corporate news & announcements ───────────────────────────────────────

interface CseNewsRecord {
  id: string;
  title: string;
  shortDescription: string;
  publishedDate: string; // "2026-07-28 09:58:45", already Colombo time
  type: string;
  source: string;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  companyLogo: string | null;
  localization?: { en?: { pdf?: string } };
}

/** CSE timestamps have no zone; they are Asia/Colombo (UTC+5:30). */
function parseCseDate(value: string): string | null {
  const parsed = new Date(`${value.replace(' ', 'T')}+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function fetchCseNews(type: 'CN' | 'BN', count: number): Promise<MarketNewsItem[]> {
  const payload = await cseGet<Record<string, CseNewsRecord[]>>(
    `news/web?top=true&type=${type}&numberOfRecord=${count}`
  );
  const records = payload?.[type] ?? [];

  return records.map((record) => {
    const image = record.image1 ?? record.image2 ?? record.image3;
    const pdf = record.localization?.en?.pdf;
    return {
      id: `cse-${record.id}`,
      title: record.title,
      summary: record.shortDescription ?? '',
      image: image ? `${CSE_CDN}/${image}` : null,
      logo: logoUrl(record.companyLogo),
      // CSE sometimes pads this field (" Daily News"), which splits it into two
      // apparent sources in the UI.
      source: record.source?.trim() || 'CSE',
      sourceKind: 'cse' as const,
      category: type === 'BN' ? 'Corporate' : 'Exchange',
      // The announcement PDF is the only stable per-item link CSE exposes.
      url: pdf ? `${CSE_CDN}/${pdf}` : 'https://www.cse.lk/pages/news/news.component.html',
      publishedAt: parseCseDate(record.publishedDate),
    };
  });
}

// ─── Sri Lankan business press ────────────────────────────────────────────────

// ─── Sri Lankan business press ────────────────────────────────────────────────

// Business/economy desks only — general news wires drown the page in stories
// that have nothing to do with the market.
const FEEDS = [
  { name: 'Daily FT', url: 'https://www.ft.lk/rss/Business/26', category: 'Business' },
  { name: 'EconomyNext', url: 'https://economynext.com/feed/', category: 'Economy' },
  {
    name: 'Lanka Business Online',
    url: 'https://www.lankabusinessonline.com/feed/',
    category: 'Business',
  },
  { name: 'Daily FT Markets', url: 'https://www.ft.lk/rss/front-page/44', category: 'Economy' },
];

const ogImageCache = new Map<string, string | null>();

async function resolveOgImage(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (ogImageCache.has(url)) return ogImageCache.get(url)!;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) {
      ogImageCache.set(url, null);
      return null;
    }
    const html = await res.text();
    const match =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);

    let img = match ? match[1].trim() : null;
    if (img && img.startsWith('http://')) {
      img = img.replace(/^http:\/\//i, 'https://');
    }
    ogImageCache.set(url, img);
    return img;
  } catch {
    ogImageCache.set(url, null);
    return null;
  }
}

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<MarketNewsItem[]> {
  const res = await fetch(feed.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${feed.name} returned ${res.status}`);

  return parseRss(await res.text(), 8).map((item, index) => ({
    id: `${feed.name}-${index}-${item.link}`,
    title: item.title,
    summary: item.summary,
    image: item.image,
    logo: null,
    source: feed.name,
    sourceKind: 'press' as const,
    category: item.categories[0] || feed.category,
    url: item.link,
    publishedAt: item.publishedAt,
  }));
}

const byRecency = (a: MarketNewsItem, b: MarketNewsItem) =>
  (b.publishedAt ? Date.parse(b.publishedAt) : 0) - (a.publishedAt ? Date.parse(a.publishedAt) : 0);

/**
 * Press wires publish many times a day and CSE announcements only occasionally,
 * so a pure recency sort buries the exchange filings that matter most here.
 * Reserve a few slots for them, then re-sort so the page still reads in order.
 */
function withExchangeQuota(items: MarketNewsItem[], limit: number, quota = 4): MarketNewsItem[] {
  const head = items.slice(0, limit);
  if (head.filter((i) => i.sourceKind === 'cse').length >= quota) return head;

  const exchange = items.filter((i) => i.sourceKind === 'cse').slice(0, quota);
  const press = items.filter((i) => i.sourceKind === 'press');

  return [...exchange, ...press].slice(0, limit).sort(byRecency);
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit')) || 12, 40);

  try {
    const items = await cached('market-news', 5 * 60_000, async () => {
      const results = await Promise.allSettled([
        fetchCseNews('CN', 6),
        fetchCseNews('BN', 6),
        ...FEEDS.map(fetchFeed),
      ]);

      results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .forEach((r) => console.warn('[market-news] source failed:', r.reason));

      const merged = results
        .filter((r): r is PromiseFulfilledResult<MarketNewsItem[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      // Same story often runs on more than one wire — keep the first copy.
      const seen = new Set<string>();
      const unique = merged.filter((item) => {
        const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Enrich stories missing images by fetching og:image from the article page
      const enriched = await Promise.all(
        unique.map(async (item) => {
          if (item.image) return item;
          const ogImg = await resolveOgImage(item.url);
          return ogImg ? { ...item, image: ogImg } : item;
        })
      );

      return enriched.sort(byRecency);
    });

    if (!items.length) {
      return NextResponse.json({ error: 'No news sources reachable' }, { status: 502 });
    }

    return NextResponse.json({ items: withExchangeQuota(items, limit), total: items.length });
  } catch (error) {
    console.error('Market news fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch market news' }, { status: 500 });
  }
}
