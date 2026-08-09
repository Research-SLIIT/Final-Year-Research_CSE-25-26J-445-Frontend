/**
 * Minimal RSS 2.0 reader.
 *
 * The feeds we consume are plain RSS with predictable markup, so a dependency
 * -free regex reader is enough and keeps the bundle unchanged.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

export function stripHtml(input: string): string {
  return decodeEntities(input.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function tagText(block: string, tag: string): string | null {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i')
  );
  if (!match) return null;
  const raw = match[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '');
  return raw.trim();
}

/** Force http → https so images are not blocked as mixed content. */
function secureUrl(url: string): string {
  return url.replace(/^http:\/\//i, 'https://');
}

function extractImage(block: string): string | null {
  // Ordered by how likely each is to be the full-size lead image.
  const patterns = [
    /<media:content[^>]+url=["']([^"']+)["']/i,
    /<media:thumbnail[^>]+url=["']([^"']+)["']/i,
    /<enclosure[^>]+url=["']([^"']+\.(?:jpe?g|png|webp|gif))["']/i,
    /<img[^>]+src=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match) return secureUrl(decodeEntities(match[1]));
  }
  return null;
}

/**
 * Some Sri Lankan feeds (Daily FT) publish a zone-less pubDate. Those are
 * Colombo time, so pin the offset explicitly rather than letting the result
 * depend on whatever zone the server happens to run in.
 */
function parseFeedDate(value: string | null): string | null {
  if (!value) return null
  const raw = value.trim()
  const hasZone = /(GMT|UTC|[+-]\d{2}:?\d{2}|\s[A-Z]{2,4}$)/.test(raw)
  const parsed = new Date(hasZone ? raw : `${raw} GMT+0530`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export interface RssItem {
  title: string;
  link: string;
  summary: string;
  image: string | null;
  publishedAt: string | null;
  categories: string[];
}

export function parseRss(xml: string, limit = 12): RssItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];

  return blocks.slice(0, limit).flatMap((block) => {
    const title = tagText(block, 'title');
    const link = tagText(block, 'link');
    if (!title || !link) return [];

    const body = tagText(block, 'content:encoded') ?? tagText(block, 'description') ?? '';
    const publishedAt = parseFeedDate(tagText(block, 'pubDate'));

    const categories = (block.match(/<category(?:\s[^>]*)?>[\s\S]*?<\/category>/gi) ?? [])
      .map((c) => stripHtml(c.replace(/<\/?category(?:\s[^>]*)?>/gi, '')))
      .filter((c) => c && c.length < 40);

    return [
      {
        title: stripHtml(title),
        link: decodeEntities(link),
        // WordPress feeds append a "Continue Reading / The post … appeared first on"
        // tail to every excerpt; drop it so summaries read cleanly.
        summary: stripHtml(body)
          .replace(/Continue Reading.*$/i, '')
          .replace(/The post .*? appeared first on .*$/i, '')
          .trim(),
        image: extractImage(block),
        publishedAt,
        categories: categories.slice(0, 3),
      },
    ];
  });
}
