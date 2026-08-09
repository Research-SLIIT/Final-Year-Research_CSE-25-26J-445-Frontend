/**
 * Shared configuration for the demo-fixture harvest.
 *
 * The harvest runs against a fully-up local backend and writes real model
 * output into `public/demo-data/`, which the frontend replays when
 * NEXT_PUBLIC_DEMO_MODE is on. Nothing here ships to the browser.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Repo root (…/Frontend), derived so the script works from any cwd. */
export const REPO_ROOT = path.resolve(here, '..', '..');

/** Where fixtures land. Served statically, fetched at runtime by the demo loader. */
export const OUT_DIR = path.join(REPO_ROOT, 'public', 'demo-data');

/** The api-gateway. Override with GATEWAY=… when harvesting elsewhere. */
export const GATEWAY = process.env.GATEWAY || 'http://localhost:3400/api/v1';

/**
 * Companies that get the expensive treatment: financial-health runs a Gemini
 * pass over a real CSE filing PDF and takes ~21s per stream, so full coverage
 * would be hours of wall clock and a lot of quota. This list is the 15 firms
 * with dividend data (so the dividend tab always has a health tab beside it)
 * plus the large caps a visitor is most likely to search for.
 */
export const CURATED_SYMBOLS = [
  // Dividend firms — every one of these has a dividend fixture too.
  'BALA', 'BFL', 'CARG', 'CBH', 'CCS', 'CTC', 'CTEA', 'HVA',
  'KFP', 'KTH', 'MAL', 'RAF', 'RF', 'SOY', 'TSH',
  // Large caps / most-searched.
  'JKH', 'DIAL', 'COMB', 'HNB', 'SAMP', 'LIOC', 'AEL', 'LOLC',
  'MELS', 'RICH', 'SPEN', 'TJL', 'HAYL', 'DIST', 'NEST',
];

/** The 15 firms seeded into the backend `financial_records` collection. */
export const DIVIDEND_FIRMS = [
  'BALA', 'BFL', 'CARG', 'CBH', 'CCS', 'CTC', 'CTEA', 'HVA',
  'KFP', 'KTH', 'MAL', 'RAF', 'RF', 'SOY', 'TSH',
];

/** Dividend prediction is trained per-year; this is the year the UI requests. */
export const DIVIDEND_YEAR = 2025;

/**
 * Candidate headlines for the sentiment module.
 *
 * Free-text input cannot be precomputed, so the demo offers a set of examples
 * and nearest-matches anything else a visitor types.
 *
 * Each candidate declares the ticker it is about and the direction a reader
 * would obviously assign. The harvest keeps only the candidates where the
 * backend agrees on both, because the service is currently running its
 * financial-lexicon fallback (the XGBoost classifier needs OpenAI embeddings)
 * and that fallback inverts a substantial share of headlines — it reads
 * "profit falls sharply on rising credit losses" as positive.
 *
 * This is a curated example set, not a measurement. The rejection count is
 * written into the fixture manifest and surfaced in the UI so the selection is
 * visible rather than hidden — a curated set presented as model accuracy would
 * be a lie about the model.
 */
export const SENTIMENT_CANDIDATES = [
  // Direction is what an analyst reading the headline would conclude.
  { text: 'Commercial Bank of Ceylon PLC reported a 32% rise in profit after tax for the quarter, supported by lower impairment charges and stronger net interest margins.', ticker: 'COMB.N0000', direction: 'positive' },
  { text: 'Dialog Axiata PLC announces acquisition of Airtel Lanka operations, expanding its subscriber base significantly across the island.', ticker: 'DIAL.N0000', direction: 'positive' },
  { text: 'Hatton National Bank PLC declared a final dividend of LKR 10.00 per share following a strong full-year performance.', ticker: 'HNB.N0000', direction: 'positive' },
  { text: 'Lanka IOC PLC benefits from favourable refining margins as global crude prices ease.', ticker: 'LIOC.N0000', direction: 'positive' },
  { text: 'LOLC Holdings PLC announces the divestment of its stake in a regional microfinance subsidiary at a substantial gain.', ticker: 'LOLC.N0000', direction: 'positive' },
  { text: 'Ceylon Cold Stores PLC posts strong beverage growth driven by the summer season and new product launches.', ticker: 'CCS.N0000', direction: 'positive' },
  { text: 'Keells Food Products PLC expands processing capacity with a new facility investment.', ticker: 'KFP.N0000', direction: 'positive' },
  { text: 'Dilmah Ceylon Tea Company PLC grows export revenue on the back of premium brand demand.', ticker: 'CTEA.N0000', direction: 'positive' },
  { text: 'Cargills (Ceylon) PLC (CARG) opens 50 new retail outlets, accelerating its expansion into rural markets.', ticker: 'CARG.N0000', direction: 'positive' },
  { text: 'Sampath Bank PLC reports record fee income and improved asset quality for the financial year.', ticker: 'SAMP.N0000', direction: 'positive' },
  { text: 'Access Engineering PLC secures a major road infrastructure contract valued at LKR 12 billion.', ticker: 'AEL.N0000', direction: 'positive' },
  { text: 'Aitken Spence PLC sees hotel occupancy improve as tourist arrivals climb year on year.', ticker: 'SPEN.N0000', direction: 'positive' },
  { text: 'Bairaha Farms PLC reports improved poultry margins as feed costs decline.', ticker: 'BFL.N0000', direction: 'positive' },
  { text: 'Ceylon Tobacco Company PLC lifts full-year earnings on firm pricing and stable volumes.', ticker: 'CTC.N0000', direction: 'positive' },
  { text: 'Melstacorp PLC posts a decline in earnings as beverage volumes weaken.', ticker: 'MELS.N0000', direction: 'negative' },
  { text: 'Teejay Lanka PLC reports a steep fall in export orders and warns of weaker margins ahead.', ticker: 'TJL.N0000', direction: 'negative' },
  { text: 'Balangoda Plantations PLC reports a decline in tea production volumes following adverse weather.', ticker: 'BALA.N0000', direction: 'negative' },
  { text: 'Malwatte Valley Plantations PLC posts a loss as crop yields deteriorate and costs rise.', ticker: 'MAL.N0000', direction: 'negative' },
  { text: 'HVA Foods PLC reports widening losses amid weak demand and margin pressure.', ticker: 'HVA.N0000', direction: 'negative' },
  { text: 'Convenience Foods (Lanka) PLC warns of lower profitability as input costs climb.', ticker: 'SOY.N0000', direction: 'negative' },
  { text: 'Distilleries Company of Sri Lanka PLC sees earnings fall after a sharp excise duty increase.', ticker: 'DIST.N0000', direction: 'negative' },
  { text: 'Richard Pieris and Company PLC (RICH) reports a drop in group profit as plantation margins contract.', ticker: 'RICH.N0000', direction: 'negative' },
  { text: 'Lanka Walltiles PLC reports softer sales volumes as construction activity slows.', ticker: 'LWL.N0000', direction: 'negative' },
  { text: 'Chevron Lubricants Lanka PLC lifts profit on stronger industrial demand and pricing.', ticker: 'LLUB.N0000', direction: 'positive' },
  { text: 'Nations Trust Bank PLC grows profit sharply on lower provisioning and higher fee income.', ticker: 'NTB.N0000', direction: 'positive' },
  { text: 'DFCC Bank PLC reports a fall in quarterly profit as net interest margins compress.', ticker: 'DFCC.N0000', direction: 'negative' },
  { text: 'Hemas Holdings PLC posts higher earnings driven by its consumer and healthcare segments.', ticker: 'HHL.N0000', direction: 'positive' },
  { text: 'Royal Ceramics Lanka PLC reports weaker demand and a decline in operating profit.', ticker: 'RCL.N0000', direction: 'negative' },
  { text: 'Sunshine Holdings PLC delivers strong growth across its healthcare and consumer businesses.', ticker: 'SUN.N0000', direction: 'positive' },
  { text: 'Vallibel One PLC reports lower group earnings as its finance segment slows.', ticker: 'VONE.N0000', direction: 'negative' },
];

/** Retained for reference — the original flat list before expectations were added. */
export const SENTIMENT_HEADLINES = [
  'Commercial Bank of Ceylon PLC reported a 32% rise in profit after tax for the quarter, supported by lower impairment charges and stronger net interest margins.',
  'Dialog Axiata PLC announces acquisition of Airtel Lanka operations, expanding its subscriber base significantly across the island.',
  'John Keells Holdings PLC posted record quarterly earnings as the leisure segment returned to pre-pandemic occupancy levels.',
  'Hatton National Bank PLC declared a final dividend of LKR 10.00 per share following a strong full-year performance.',
  'Sampath Bank PLC reported a decline in profitability as elevated credit costs weighed on the quarter.',
  'Lanka IOC PLC benefits from favourable refining margins as global crude prices ease.',
  'Ceylon Tobacco Company PLC faces pressure from a proposed excise duty increase announced in the national budget.',
  'Cargills (Ceylon) PLC opens 50 new retail outlets, accelerating its expansion into rural markets.',
  'Access Engineering PLC secures a major road infrastructure contract valued at LKR 12 billion.',
  'LOLC Holdings PLC announces the divestment of its stake in a regional microfinance subsidiary at a substantial gain.',
  'Melstacorp PLC reports weaker beverage volumes amid subdued consumer spending.',
  'Aitken Spence PLC sees hotel occupancy improve as tourist arrivals climb year on year.',
  'Hayleys PLC warns of margin compression in its hand protection segment due to rising input costs.',
  'Distilleries Company of Sri Lanka PLC maintains steady earnings despite a challenging excise environment.',
  'Nestle Lanka PLC announces a price revision across its product portfolio in response to currency movements.',
  'Teejay Lanka PLC reports lower order volumes as key export markets soften.',
  'Richard Pieris and Company PLC completes a major restructuring of its plantations segment.',
  'Ceylon Cold Stores PLC posts strong beverage growth driven by the summer season and new product launches.',
  'Keells Food Products PLC expands processing capacity with a new facility investment.',
  'Bairaha Farms PLC reports improved poultry margins as feed costs decline.',
  'The Central Bank of Sri Lanka cuts policy rates by 50 basis points, easing borrowing costs for listed banks.',
  'Colombo Stock Exchange turnover hits a six-month high as foreign investors return to blue chips.',
  'Sri Lanka secures the next tranche of its IMF programme, boosting sentiment across the banking sector.',
  'Balangoda Plantations PLC reports a decline in tea production volumes following adverse weather.',
  'Dilmah Ceylon Tea Company PLC grows export revenue on the back of premium brand demand.',
];

/** "JKH" → "JKH.N0000". The financial-health endpoints want the full ticker. */
export function cseTicker(symbol) {
  return symbol.includes('.') ? symbol : `${symbol}.N0000`;
}

/** "JKH.N0000" → "jkh_n0000", the shape `/financial-health/company/:code/all` wants. */
export function healthCompanyCode(symbol) {
  return cseTicker(symbol).toLowerCase().replace('.', '_');
}
