/**
 * Sentiment replay for demo mode.
 *
 * Every other module keys off a company symbol, so a captured fixture answers
 * the question exactly. Sentiment takes free text, and no capture can cover
 * what a visitor decides to type.
 *
 * So the demo does two things. It offers the captured headlines as one-click
 * examples — those return their genuine stored analysis. For anything typed, it
 * finds the closest stored headline and says so; when nothing is close, it
 * returns the same "no listed company mentioned" answer the backend gives,
 * rather than inventing a verdict.
 *
 * The stored set is curated: `scripts/demo/harvest-sentiment.mjs` kept only the
 * candidates where the backend resolved the expected company and agreed with
 * the obvious reading, because the service was running its financial-lexicon
 * fallback rather than the XGBoost classifier. The counts travel with the data
 * so the UI can present these as selected examples, not measured accuracy.
 */

import { DEMO_DATA_BASE } from './config';

export interface DemoHeadline {
  id: string;
  text: string;
  mode: string;
  impact: string | null;
  direction: string | null;
  tickers: string[];
}

export interface DemoSentimentIndex {
  capturedAt: string;
  modes: string[];
  curation: {
    candidates: number;
    accepted: number;
    rejected: number;
    basis: string;
  } | null;
  headlines: DemoHeadline[];
}

let indexPromise: Promise<DemoSentimentIndex | null> | null = null;

export function loadSentimentIndex(): Promise<DemoSentimentIndex | null> {
  if (indexPromise) return indexPromise;

  indexPromise = fetch(`${DEMO_DATA_BASE}/sentiment/index.json`)
    .then((response) => (response.ok ? (response.json() as Promise<DemoSentimentIndex>) : null))
    .catch(() => null);

  return indexPromise;
}

/** Words too common to carry any signal about which headline was meant. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'as', 'at', 'by',
  'its', 'it', 'is', 'was', 'were', 'has', 'have', 'had', 'with', 'from', 'that',
  'this', 'plc', 'ltd', 'lanka', 'sri', 'company', 'holdings', 'reported', 'reports',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word)),
  );
}

/** Jaccard overlap — symmetric, and forgiving of length differences. */
function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared / (a.size + b.size - shared);
}

/** Below this, "closest match" is a stretch and we decline instead. */
const MATCH_THRESHOLD = 0.12;

export interface DemoMatch {
  headline: DemoHeadline;
  /** True when the visitor picked an example rather than typing free text. */
  exact: boolean;
  similarity: number;
}

/**
 * The stored headline closest to `text`, or null when nothing is close enough.
 */
export function matchHeadline(index: DemoSentimentIndex, text: string): DemoMatch | null {
  const query = text.trim();
  if (!query) return null;

  const exact = index.headlines.find((h) => h.text.trim() === query);
  if (exact) return { headline: exact, exact: true, similarity: 1 };

  const queryTokens = tokenize(query);
  let best: DemoMatch | null = null;

  for (const headline of index.headlines) {
    const score = similarity(queryTokens, tokenize(headline.text));
    if (!best || score > best.similarity) {
      best = { headline, exact: false, similarity: score };
    }
  }

  return best && best.similarity >= MATCH_THRESHOLD ? best : null;
}

/** Fetch the stored analysis behind a headline id. */
export async function loadStoredAnalysis(id: string): Promise<any> {
  const response = await fetch(`${DEMO_DATA_BASE}/sentiment/analysis/${id.toLowerCase()}.json`);
  if (!response.ok) throw new Error(`No stored analysis for ${id}`);
  const envelope = await response.json();
  return envelope.payload;
}

/** The backend's own answer when its entity matcher finds nothing listed. */
export const NO_COMPANY_RESPONSE = {
  identified_companies: [],
  impact: 'not_impactful',
  direction: null,
  historical_context: null,
  reason: 'No listed company mentioned',
};
