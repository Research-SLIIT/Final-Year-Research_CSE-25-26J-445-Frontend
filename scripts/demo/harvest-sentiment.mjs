/**
 * Harvest sentiment analysis for the curated headline set.
 *
 * Sentiment is the one module whose input is free text, so it cannot be
 * precomputed for whatever a visitor types. The demo offers the accepted
 * headlines as one-click examples and nearest-matches anything else.
 *
 * Curation is explicit and auditable: a candidate is kept only when the
 * backend resolves the company we said it was about AND agrees with the
 * direction a reader would obviously assign. Everything rejected is recorded
 * with the reason, and the counts go into the manifest so the UI can say this
 * is a selected set rather than imply it is measured accuracy.
 *
 * Provenance note: the service currently answers from its financial-lexicon
 * fallback (the XGBoost classifier requires OpenAI embeddings) and marks that
 * inside its own payload. The mode is recorded per headline.
 */

import { GATEWAY, SENTIMENT_CANDIDATES } from './config.mjs';
import { captureJson, progress, writeFixture } from './harvest-lib.mjs';

/** Stable, filesystem-safe id for a headline — also the demo's lookup key. */
function headlineId(index) {
  return `h${String(index + 1).padStart(2, '0')}`;
}

/**
 * Did the backend answer from the real classifier, or its lexicon fallback?
 *
 * A headline whose entity matcher found no listed company short-circuits before
 * either path runs and carries no decision tree at all — reporting that as
 * "classifier" would overstate what was captured, so it gets its own label.
 */
function detectMode(payload) {
  const stages = payload?.explanation?.decision_tree ?? [];
  if (!stages.length) return 'no-company-matched';

  const fallback = stages.some((stage) =>
    String(stage?.description ?? '').includes('DEMO:'),
  );
  return fallback ? 'lexicon-fallback' : 'classifier';
}

/** Why a candidate was dropped, or null when it is worth keeping. */
function rejectionReason(candidate, payload) {
  const companies = payload?.identified_companies ?? [];
  if (!companies.length) return 'no company matched';

  const top = companies[0]?.ticker;
  if (top !== candidate.ticker) return `resolved to ${top}, expected ${candidate.ticker}`;

  if (payload?.impact !== 'impactful') return 'classified not impactful';
  if (payload?.direction !== candidate.direction) {
    return `direction ${payload?.direction}, expected ${candidate.direction}`;
  }
  return null;
}

async function main() {
  console.log(`\n▸ sentiment — probing ${SENTIMENT_CANDIDATES.length} candidates`);

  const accepted = [];
  const rejected = [];
  const modes = new Set();
  let done = 0;

  for (const candidate of SENTIMENT_CANDIDATES) {
    const result = await captureJson(`${GATEWAY}/sentiment/analyze`, {
      method: 'POST',
      body: JSON.stringify({ text: candidate.text }),
    });

    if (result.ok) {
      const payload = result.envelope.payload;
      const reason = rejectionReason(candidate, payload);

      if (reason) {
        rejected.push({ ticker: candidate.ticker, reason });
      } else {
        const id = headlineId(accepted.length);
        const mode = detectMode(payload);
        modes.add(mode);

        await writeFixture(['sentiment', 'analysis', `${id}.json`], {
          ...result.envelope,
          text: candidate.text,
          mode,
        });

        accepted.push({
          id,
          text: candidate.text,
          mode,
          impact: payload.impact,
          direction: payload.direction,
          // Tickers the entity matcher resolved — the demo uses these to pick
          // the closest stored analysis for free text a visitor types.
          tickers: (payload.identified_companies ?? []).map((c) => c.ticker),
        });
      }
    } else {
      rejected.push({ ticker: candidate.ticker, reason: `request failed (${result.status})` });
    }

    progress('candidates', ++done, SENTIMENT_CANDIDATES.length, `(${candidate.ticker})`);
  }

  await writeFixture(['sentiment', 'index.json'], {
    capturedAt: new Date().toISOString(),
    modes: [...modes],
    // Deliberately visible: the demo states that these are selected examples
    // and how many candidates were dropped to arrive at them.
    curation: {
      candidates: SENTIMENT_CANDIDATES.length,
      accepted: accepted.length,
      rejected: rejected.length,
      reasons: rejected,
      basis: 'kept only where the backend resolved the expected company and agreed with the obvious reading',
    },
    headlines: accepted,
  });

  console.log(`  accepted ${accepted.length} of ${SENTIMENT_CANDIDATES.length}`);
  console.log(`  backend mode: ${[...modes].join(', ') || 'unknown'}`);
  for (const entry of rejected) console.log(`    dropped ${entry.ticker}: ${entry.reason}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
