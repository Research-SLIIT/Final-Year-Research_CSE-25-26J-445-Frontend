/**
 * Harvest the news article corpus held by sentiment-backend.
 *
 * The news list merges these real articles with a small bundled mock file.
 * Without this capture the demo would fall back to the mock alone — fabricated
 * headlines on a page whose whole point is real CSE coverage — so this is the
 * fixture that keeps the news section honest.
 *
 * Stored as one file rather than per-article: the list, the tag filter and the
 * article detail page all read the same corpus, and it is small enough that
 * splitting it would cost more requests than it saves bytes.
 */

import { GATEWAY } from './config.mjs';
import { captureJson, writeFixture } from './harvest-lib.mjs';

const BASE = `${GATEWAY}/sentiment`;
const LIMIT = Number(process.env.NEWS_LIMIT || 200);

async function main() {
  console.log('\n▸ news corpus');

  const articles = await captureJson(
    `${BASE}/articles?limit=${LIMIT}`,
    {},
    { validate: (p) => Array.isArray(p?.articles) },
  );

  if (!articles.ok) {
    console.error(`  cannot reach ${BASE}/articles (status ${articles.status})`);
    console.error('  start the backend stack, then re-run: npm run demo:harvest:news');
    process.exit(1);
  }

  const tags = await captureJson(`${BASE}/articles/tags`);

  const list = articles.envelope.payload.articles ?? [];
  // Tags the corpus actually uses, so the filter cannot offer a dead option.
  const fromArticles = new Set(list.flatMap((a) => a.tags ?? []));
  const fromEndpoint = tags.ok ? (tags.envelope.payload.tags ?? []) : [];
  const merged = [...new Set([...fromArticles, ...fromEndpoint])].sort();

  await writeFixture(['news', 'corpus.json'], {
    capturedAt: new Date().toISOString(),
    latencyMs: articles.envelope.latencyMs,
    source: articles.envelope.source,
    articles: list,
    tags: merged,
  });

  console.log(`  captured ${list.length} articles, ${merged.length} tags`);
  if (!list.length) {
    console.log('  corpus is empty — the news page will show no articles in demo mode');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
