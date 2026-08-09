/**
 * Re-harvest price history at the widest window the service will return.
 *
 * The app asks for 22 trading days because that is all its chart needs, but
 * the risk statistics (VaR, CVaR, volatility, Sharpe, max drawdown) are
 * meaningless over a month of returns. Requesting 250 yields whatever the
 * service actually holds — about 152 sessions — and the demo loader slices
 * that down to whatever `n_days` the caller asked for, so one file serves
 * both the chart and the risk maths.
 */

import { GATEWAY } from './config.mjs';
import { captureJson, mapLimit, progress, readFixture, writeFixture } from './harvest-lib.mjs';

const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
const WINDOW = Number(process.env.WINDOW || 250);

async function main() {
  console.log(`\n▸ price history — ${WINDOW}-session window`);

  const coverage = await readFixture(['open-price', 'coverage.json']);
  const symbols = coverage?.covered ?? [];
  if (!symbols.length) {
    console.error('  no open-price coverage on disk — run harvest-open-price first');
    process.exit(1);
  }

  let done = 0;
  let rowTotal = 0;
  const thin = [];

  await mapLimit(symbols, CONCURRENCY, async (id) => {
    const result = await captureJson(
      `${GATEWAY}/open-price/history?company_id=${encodeURIComponent(id)}&n_days=${WINDOW}`,
      {},
      { validate: (p) => Array.isArray(p?.history) && p.history.length > 0 },
    );

    if (result.ok) {
      const rows = result.envelope.payload.history.length;
      rowTotal += rows;
      // Under ~40 sessions the risk statistics are too noisy to stand behind.
      if (rows < 40) thin.push({ id, rows });
      await writeFixture(['open-price', 'history', `${id}.json`], result.envelope);
    }

    progress('history', ++done, symbols.length, `(${id})`);
  });

  console.log(`  mean ${Math.round(rowTotal / symbols.length)} sessions per company`);
  if (thin.length) {
    console.log(`  ${thin.length} companies under 40 sessions — risk stats will be withheld for these`);
  }

  await writeFixture(['open-price', 'history-meta.json'], {
    capturedAt: new Date().toISOString(),
    requestedWindow: WINDOW,
    thin: thin.sort((a, b) => a.rows - b.rows),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
