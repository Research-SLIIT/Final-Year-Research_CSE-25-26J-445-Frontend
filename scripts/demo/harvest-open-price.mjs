/**
 * Harvest T+5 open-price predictions for every company the model supports.
 *
 * Cheap enough to run at full coverage: no LLM in this path, ~2s per company
 * for the prediction (LightGBM/XGBoost/CatBoost ensemble plus SHAP) and well
 * under a second for the price history.
 *
 * Safe to re-run — companies already on disk are skipped unless FORCE=1.
 */

import { GATEWAY } from './config.mjs';
import { captureJson, fixtureExists, mapLimit, progress, writeFixture } from './harvest-lib.mjs';

const FORCE = process.env.FORCE === '1';
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);

async function main() {
  console.log('\n▸ open-price prediction');

  const companies = await captureJson(
    `${GATEWAY}/open-price/companies`,
    {},
    { retries: 5, validate: (p) => Array.isArray(p?.companies) && p.companies.length > 0 },
  );
  if (!companies.ok) {
    console.error('  cannot reach /open-price/companies — is the ml profile up?');
    process.exit(1);
  }
  await writeFixture(['open-price', 'companies.json'], companies.envelope);

  const health = await captureJson(`${GATEWAY}/open-price/health`);
  if (health.ok) await writeFixture(['open-price', 'health.json'], health.envelope);

  const list = companies.envelope.payload.companies ?? [];
  console.log(`  ${list.length} companies reported by the model`);

  let done = 0;
  const covered = [];
  const failed = [];

  await mapLimit(list, CONCURRENCY, async (company) => {
    const id = company.id;
    const predictSegments = ['open-price', 'predict', `${id}.json`];
    const historySegments = ['open-price', 'history', `${id}.json`];

    if (!FORCE && (await fixtureExists(predictSegments))) {
      covered.push(id);
      progress('predict', ++done, list.length, `(cached ${id})`);
      return;
    }

    const predict = await captureJson(
      `${GATEWAY}/open-price/predict?company_id=${encodeURIComponent(id)}&explain=true`,
      {},
      // `warming_up` means the service answered but the model had nothing to
      // say. Storing that would bake a permanent "please try again" into the
      // demo, so it is treated as a miss rather than a result.
      { validate: (p) => !p?.warming_up && p?.pred_open_tplus5 != null },
    );

    if (predict.ok) {
      await writeFixture(predictSegments, predict.envelope);

      const history = await captureJson(
        `${GATEWAY}/open-price/history?company_id=${encodeURIComponent(id)}&n_days=22`,
        {},
        { validate: (p) => Array.isArray(p?.history) && p.history.length > 0 },
      );
      if (history.ok) await writeFixture(historySegments, history.envelope);

      covered.push(id);
    } else {
      failed.push({ id, status: predict.status });
    }

    const usable = predict.ok;

    progress('predict', ++done, list.length, usable ? `(${id})` : `(skip ${id})`);
  });

  await writeFixture(['open-price', 'coverage.json'], {
    capturedAt: new Date().toISOString(),
    covered: covered.sort(),
    skipped: failed,
  });

  console.log(`  captured ${covered.length}, skipped ${failed.length}`);
  if (failed.length) {
    const sample = failed.slice(0, 8).map((f) => `${f.id}:${f.status}`).join(', ');
    console.log(`  skipped sample: ${sample}${failed.length > 8 ? ' …' : ''}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
