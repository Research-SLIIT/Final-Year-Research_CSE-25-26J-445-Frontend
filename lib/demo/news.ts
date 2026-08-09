/**
 * News corpus for demo mode.
 *
 * The news list merges two sources: the article corpus held by sentiment-backend
 * (real CSE coverage, indexed for the FAISS historical lookup) and a small
 * bundled mock file. Live, the real articles land first and the mock ones only
 * pad the tail. With no backend, the mock file would be all that is left — so
 * the demo replays the captured corpus and keeps the mock padding out entirely.
 *
 * `hasCorpus` lets callers tell "not captured yet" apart from "captured and
 * empty", so a missing fixture degrades to the old behaviour rather than
 * silently showing an empty news page.
 */

import { DEMO_DATA_BASE } from './config';

export interface DemoArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  publishedDate: string;
  tags: string[];
  [key: string]: unknown;
}

interface CapturedNews {
  capturedAt: string;
  latencyMs: number;
  articles: DemoArticle[];
  tags: string[];
}

let corpusPromise: Promise<CapturedNews | null> | null = null;

function loadCorpus(): Promise<CapturedNews | null> {
  if (corpusPromise) return corpusPromise;

  corpusPromise = fetch(`${DEMO_DATA_BASE}/news/corpus.json`)
    .then((response) => (response.ok ? (response.json() as Promise<CapturedNews>) : null))
    .catch(() => null);

  return corpusPromise;
}

export async function hasCorpus(): Promise<boolean> {
  return (await loadCorpus()) !== null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Captured articles, filtered and sorted the way the live endpoint would. */
export async function demoNewsList(
  query?: string,
  tag?: string,
  sort?: string,
): Promise<DemoArticle[] | null> {
  const startedAt = Date.now();
  const corpus = await loadCorpus();
  if (!corpus) return null;

  let articles = [...corpus.articles];

  if (query) {
    const q = query.toLowerCase();
    articles = articles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q),
    );
  }
  if (tag) {
    articles = articles.filter((a) => a.tags?.includes(tag));
  }

  articles.sort((a, b) => {
    const left = new Date(a.publishedDate).getTime();
    const right = new Date(b.publishedDate).getTime();
    return sort === 'oldest' ? left - right : right - left;
  });

  const remaining = (corpus.latencyMs ?? 300) - (Date.now() - startedAt);
  if (remaining > 0) await sleep(remaining);

  return articles;
}

export async function demoNewsById(id: string): Promise<DemoArticle | null> {
  const corpus = await loadCorpus();
  if (!corpus) return null;
  return corpus.articles.find((article) => String(article.id) === String(id)) ?? null;
}

export async function demoNewsTags(): Promise<string[] | null> {
  const corpus = await loadCorpus();
  if (!corpus) return null;
  return corpus.tags;
}
