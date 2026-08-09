/**
 * Harvest dividend-prediction output for the 15 firms in `financial_records`.
 *
 * Three calls per firm: the model output (logistic model plus per-feature
 * contributions), the Gemini-written investor explanation, and the 2011-2024
 * financial history the comparison tab charts.
 */

import { DIVIDEND_FIRMS, DIVIDEND_YEAR, GATEWAY } from './config.mjs';
import { captureJson, fixtureExists, progress, writeFixture } from './harvest-lib.mjs';

const FORCE = process.env.FORCE === '1';
const BASE = `${GATEWAY}/dividend-prediction`;

async function main() {
  console.log('\n▸ dividend prediction');

  // The glossary backs the metric tooltips and is the same for every firm.
  const glossary = await captureJson(`${BASE}/metadata/glossary`);
  if (glossary.ok) {
    await writeFixture(['dividend', 'glossary.json'], glossary.envelope);
    console.log('  glossary captured');
  } else {
    console.log(`  glossary unavailable (status ${glossary.status}) — tooltips will fall back`);
  }

  let done = 0;
  const covered = [];
  const failed = [];

  for (const firm of DIVIDEND_FIRMS) {
    const dataSegments = ['dividend', 'data', `${firm}.json`];

    if (!FORCE && (await fixtureExists(dataSegments))) {
      covered.push(firm);
      progress('firms', ++done, DIVIDEND_FIRMS.length, `(cached ${firm})`);
      continue;
    }

    const query = `firm=${encodeURIComponent(firm)}&year=${DIVIDEND_YEAR}`;
    const data = await captureJson(`${BASE}/data?${query}`);

    if (!data.ok) {
      failed.push({ firm, status: data.status });
      progress('firms', ++done, DIVIDEND_FIRMS.length, `(skip ${firm})`);
      continue;
    }
    await writeFixture(dataSegments, data.envelope);

    // Gemini-backed; several seconds each, and the slowest part of this sweep.
    const llm = await captureJson(`${BASE}/llm-explanation?${query}`);
    if (llm.ok) await writeFixture(['dividend', 'llm', `${firm}.json`], llm.envelope);

    const history = await captureJson(`${BASE}/history?firm=${encodeURIComponent(firm)}`);
    if (history.ok) await writeFixture(['dividend', 'history', `${firm}.json`], history.envelope);

    covered.push(firm);
    progress('firms', ++done, DIVIDEND_FIRMS.length, `(${firm}${llm.ok ? ' +llm' : ''})`);
  }

  await writeFixture(['dividend', 'coverage.json'], {
    capturedAt: new Date().toISOString(),
    year: DIVIDEND_YEAR,
    covered: covered.sort(),
    skipped: failed,
  });

  console.log(`  captured ${covered.length}, skipped ${failed.length}`);
  if (failed.length) console.log(`  skipped: ${failed.map((f) => `${f.firm}:${f.status}`).join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
