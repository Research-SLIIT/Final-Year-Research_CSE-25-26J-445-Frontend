/**
 * Harvest financial-health analysis for the curated company list.
 *
 * The expensive sweep. Each company runs two SSE pipelines that locate the
 * latest CSE filing, download the PDF and parse it with Gemini — roughly 20s
 * for the analysis and a similar figure for the report health check. Both are
 * captured event-by-event with arrival offsets so the demo can replay the
 * progress log at the pace the backend produced it.
 *
 * Deliberately sequential: two concurrent Gemini pipelines per company is
 * already enough load, and a rate-limited retry costs more than it saves.
 */

import { CURATED_SYMBOLS, GATEWAY, cseTicker, healthCompanyCode } from './config.mjs';
import { captureJson, captureStream, fixtureExists, readFixture, writeFixture } from './harvest-lib.mjs';

const FORCE = process.env.FORCE === '1';
const BASE = `${GATEWAY}/financial-health`;

/** Only symbols named on the command line, when given — lets a failed few be redone. */
const TARGETS = process.argv.slice(2).length
  ? process.argv.slice(2).map((s) => s.toUpperCase())
  : CURATED_SYMBOLS;

async function main() {
  console.log(`\n▸ financial health — ${TARGETS.length} companies, ~40s each`);

  const covered = [];
  const failed = [];

  for (const [index, symbol] of TARGETS.entries()) {
    const ticker = cseTicker(symbol);
    const analyzeSegments = ['financial-health', 'analyze', `${symbol}.json`];
    const position = `[${index + 1}/${TARGETS.length}] ${symbol}`;

    if (!FORCE && (await fixtureExists(analyzeSegments))) {
      covered.push(symbol);
      console.log(`  ${position} cached`);
      continue;
    }

    const analyze = await captureStream(
      `${BASE}/analyze-cse/${encodeURIComponent(ticker)}/stream`,
    );

    // A stream that ends on an error event carries no result worth replaying.
    const analyzeOk = analyze.ok && analyze.envelope.result != null;
    if (!analyzeOk) {
      failed.push({ symbol, stage: 'analyze', status: analyze.status });
      console.log(`  ${position} analyze failed (status ${analyze.status})`);
      continue;
    }
    await writeFixture(analyzeSegments, analyze.envelope);

    const reportCheck = await captureStream(
      `${BASE}/report-health-check/${encodeURIComponent(ticker)}/stream`,
    );
    if (reportCheck.ok && reportCheck.envelope.result != null) {
      await writeFixture(['financial-health', 'report-check', `${symbol}.json`], reportCheck.envelope);
    }

    const history = await captureJson(`${BASE}/company/${healthCompanyCode(ticker)}/all`);
    if (history.ok) {
      await writeFixture(['financial-health', 'history', `${symbol}.json`], history.envelope);
    }

    covered.push(symbol);
    console.log(
      `  ${position} ok — analyze ${(analyze.envelope.totalMs / 1000).toFixed(1)}s` +
        ` (${analyze.envelope.events.length} events)` +
        `${reportCheck.ok ? `, check ${(reportCheck.envelope.totalMs / 1000).toFixed(1)}s` : ', check skipped'}` +
        `${history.ok ? ', history' : ''}`,
    );
  }

  // Merged with any previous run so a partial re-harvest does not shrink coverage.
  const existing = await readFixture(['financial-health', 'coverage.json']);
  const merged = [...new Set([...(existing?.covered ?? []), ...covered])].sort();

  await writeFixture(['financial-health', 'coverage.json'], {
    capturedAt: new Date().toISOString(),
    covered: merged,
    skipped: failed,
  });

  console.log(`  captured ${covered.length}, failed ${failed.length}, total coverage ${merged.length}`);
  if (failed.length) {
    console.log(`  failed: ${failed.map((f) => `${f.symbol}(${f.stage}:${f.status})`).join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
