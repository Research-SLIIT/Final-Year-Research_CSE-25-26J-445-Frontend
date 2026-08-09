/**
 * Consolidate the per-module coverage files into one manifest.
 *
 * The frontend fetches this once on boot. It decides which analyses a company
 * can offer (so search never routes to a dead tab), and carries the capture
 * date and provenance notes the demo banner shows.
 */

import fs from 'node:fs/promises';
import { OUT_DIR } from './config.mjs';
import { readFixture, writeFixture } from './harvest-lib.mjs';

/** Symbols with a fixture in a directory — the ground truth for coverage. */
async function symbolsIn(...segments) {
  try {
    const dir = `${OUT_DIR}/${segments.join('/')}`.toLowerCase();
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith('.json') && !['coverage.json', 'index.json'].includes(f))
      .map((f) => f.replace(/\.json$/, '').toUpperCase())
      .sort();
  } catch {
    return [];
  }
}

async function main() {
  console.log('\n▸ manifest');

  const predict = await symbolsIn('open-price', 'predict');
  const dividend = await symbolsIn('dividend', 'data');
  const health = await symbolsIn('financial-health', 'analyze');
  const risk = await symbolsIn('risk');

  const companies = await readFixture(['open-price', 'companies.json']);
  const names = new Map(
    (companies?.payload?.companies ?? []).map((c) => [c.id.toUpperCase(), c.name]),
  );

  const sentiment = await readFixture(['sentiment', 'index.json']);
  const riskCoverage = await readFixture(['risk', 'coverage.json']);

  // One row per company that any module can answer for.
  const union = [...new Set([...predict, ...dividend, ...health, ...risk])].sort();
  const modules = {};
  for (const symbol of union) {
    modules[symbol] = {
      name: names.get(symbol) ?? symbol,
      predict: predict.includes(symbol),
      dividend: dividend.includes(symbol),
      // The risk tab needs the health stream; the computed statistics alone
      // are not enough to render it, so both must be present.
      risk: health.includes(symbol),
      stats: risk.includes(symbol),
    };
  }

  const manifest = {
    capturedAt: new Date().toISOString(),
    counts: {
      companies: union.length,
      predict: predict.length,
      dividend: dividend.length,
      health: health.length,
      stats: risk.length,
      sentiment: sentiment?.headlines?.length ?? 0,
    },
    provenance: {
      predict: 'Live output of the T+5 open-price ensemble (LightGBM, XGBoost, CatBoost) with SHAP attributions.',
      dividend: 'Live output of the dividend-cut model, with investor explanations written by Gemini.',
      health: 'Live output of the financial-health pipeline: the latest CSE filing parsed by Gemini, scored by the Altman Z-model, with the next-quarter Z-score from the SVR model.',
      stats: `Market-risk statistics computed from ${riskCoverage?.covered?.length ?? 0} companies' real CSE closing prices. Beta measured against ${riskCoverage?.betaBenchmark ?? 'ASPI'}; Sharpe uses a ${((riskCoverage?.riskFreeRate ?? 0) * 100).toFixed(0)}% risk-free rate. Computed statistics, not model predictions.`,
      sentiment: sentiment?.curation
        ? `Curated example set: ${sentiment.curation.accepted} of ${sentiment.curation.candidates} candidates kept. ${sentiment.modes?.includes('lexicon-fallback') ? 'Captured while the service was running its financial-lexicon fallback rather than the XGBoost classifier, which requires OpenAI embeddings.' : ''} Selected examples, not measured accuracy.`
        : null,
    },
    sentiment: {
      count: sentiment?.headlines?.length ?? 0,
      modes: sentiment?.modes ?? [],
      curation: sentiment?.curation ?? null,
    },
    modules,
  };

  await writeFixture(['manifest.json'], manifest);

  console.log(`  ${union.length} companies`);
  for (const [key, value] of Object.entries(manifest.counts)) {
    console.log(`    ${key.padEnd(10)} ${value}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
