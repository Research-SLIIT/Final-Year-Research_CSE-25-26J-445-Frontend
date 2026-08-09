/**
 * Derive market-risk statistics from the captured CSE price history.
 *
 * Why this exists: the risk tab's VaR / CVaR / beta / volatility / Sharpe /
 * max-drawdown block was static mock data — the same six numbers for every
 * company — and no backend model produces those figures. (The Z-score gauge
 * beside them is genuine: financial-health runs the SVR internally.)
 *
 * These are not model outputs and are not presented as such. They are textbook
 * statistics computed over real closing prices from the exchange, with beta
 * measured against ASPI. Deterministic, reproducible, and honest about what it
 * is — which is more than "145.5 for every company" managed.
 */

import { readFixture, writeFixture } from './harvest-lib.mjs';
import { mapLimit, progress } from './harvest-lib.mjs';

/** Trading sessions per year on the CSE — the annualisation factor. */
const SESSIONS_PER_YEAR = 252;

/**
 * Sri Lanka 364-day Treasury bill yield, the local risk-free proxy used by the
 * Sharpe ratio. Hardcoded rather than fetched: it wants to be the rate that
 * applied over the captured window, not whatever it is on the day the demo is
 * viewed. Revisit when re-harvesting a materially later window.
 */
const RISK_FREE_RATE = 0.09;

/** Below this many sessions the statistics are too noisy to stand behind. */
const MIN_SESSIONS = 40;

const CSE_CHART = 'https://www.cse.lk/api/chartData';

function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function stdev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  // Sample standard deviation — these are a sample of trading days, not the
  // whole population of possible ones.
  return Math.sqrt(xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1));
}

/** Linear-interpolated percentile, matching the usual quantile convention. */
function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (rank - low) * (sorted[high] - sorted[low]);
}

/** Simple daily returns from a close series. Non-positive closes break the ratio. */
function toReturns(closes) {
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (prev > 0 && curr > 0) returns.push(curr / prev - 1);
  }
  return returns;
}

/** ASPI daily closes keyed by ISO date, for the beta regression. */
async function loadIndexSeries() {
  const form = new FormData();
  form.append('chartId', '1'); // sectorId 1 = ASPI
  form.append('period', '5'); // 5 = one year

  const response = await fetch(CSE_CHART, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://www.cse.lk',
      Referer: 'https://www.cse.lk/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    body: form,
  });
  if (!response.ok) throw new Error(`ASPI chartData returned ${response.status}`);

  const rows = await response.json();
  const byDate = new Map();
  for (const row of rows) {
    // Several intraday ticks can share a date; the last one is that day's close.
    byDate.set(new Date(row.d).toISOString().slice(0, 10), row.v);
  }
  return byDate;
}

/**
 * Beta against ASPI, over the dates the two series share. Returns null when the
 * overlap is too thin to mean anything rather than reporting a confident number
 * derived from a handful of days.
 */
function computeBeta(dates, closes, indexByDate) {
  const paired = [];
  for (let i = 0; i < dates.length; i++) {
    const indexValue = indexByDate.get(dates[i]);
    if (indexValue != null && closes[i] > 0) {
      paired.push({ stock: closes[i], index: indexValue });
    }
  }
  if (paired.length < MIN_SESSIONS) return null;

  const stockReturns = toReturns(paired.map((p) => p.stock));
  const indexReturns = toReturns(paired.map((p) => p.index));
  const n = Math.min(stockReturns.length, indexReturns.length);
  if (n < MIN_SESSIONS - 1) return null;

  const rs = stockReturns.slice(0, n);
  const ri = indexReturns.slice(0, n);
  const meanS = mean(rs);
  const meanI = mean(ri);

  let covariance = 0;
  let indexVariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (rs[i] - meanS) * (ri[i] - meanI);
    indexVariance += (ri[i] - meanI) ** 2;
  }
  if (indexVariance === 0) return null;
  return covariance / indexVariance;
}

/** Running drawdown from the peak so far, in percent. */
function drawdownSeries(closes) {
  const series = [];
  let peak = closes[0] ?? 0;
  for (const [index, close] of closes.entries()) {
    if (close > peak) peak = close;
    series.push({
      day: index + 1,
      drawdown: peak > 0 ? Number((((close - peak) / peak) * 100).toFixed(2)) : 0,
    });
  }
  return series;
}

/** Rolling annualised volatility over a 20-session window, in percent. */
function volatilitySeries(returns, window = 20) {
  const series = [];
  for (let i = window; i <= returns.length; i++) {
    const slice = returns.slice(i - window, i);
    series.push({
      day: i,
      volatility: Number((stdev(slice) * Math.sqrt(SESSIONS_PER_YEAR) * 100).toFixed(2)),
    });
  }
  return series;
}

/** Histogram of daily returns, bucketed in one-percent bands. */
function returnsHistogram(returns) {
  const buckets = [
    { range: '< -5%', test: (r) => r < -0.05 },
    { range: '-5..-3%', test: (r) => r >= -0.05 && r < -0.03 },
    { range: '-3..-1%', test: (r) => r >= -0.03 && r < -0.01 },
    { range: '-1..0%', test: (r) => r >= -0.01 && r < 0 },
    { range: '0..1%', test: (r) => r >= 0 && r < 0.01 },
    { range: '1..3%', test: (r) => r >= 0.01 && r < 0.03 },
    { range: '3..5%', test: (r) => r >= 0.03 && r < 0.05 },
    { range: '> 5%', test: (r) => r >= 0.05 },
  ];
  return buckets.map((bucket) => ({
    range: bucket.range,
    count: returns.filter(bucket.test).length,
  }));
}

function computeMetrics(symbol, history, indexByDate) {
  const rows = history.filter((row) => row.close_price > 0);
  if (rows.length < MIN_SESSIONS) return null;

  const dates = rows.map((row) => row.date);
  const closes = rows.map((row) => row.close_price);
  const returns = toReturns(closes);
  if (returns.length < MIN_SESSIONS - 1) return null;

  const lastClose = closes[closes.length - 1];
  const sorted = [...returns].sort((a, b) => a - b);

  // VaR at 95%: the 5th-percentile daily return, expressed as the LKR loss on
  // one share at the latest close so the KPI card reads in money like before.
  const var95Pct = percentile(sorted, 5);
  const tail = sorted.filter((r) => r <= var95Pct);
  const cvarPct = tail.length ? mean(tail) : var95Pct;

  const annualReturn = mean(returns) * SESSIONS_PER_YEAR;
  const annualVol = stdev(returns) * Math.sqrt(SESSIONS_PER_YEAR);

  const drawdowns = drawdownSeries(closes);
  const maxDrawdown = Math.min(...drawdowns.map((d) => d.drawdown));

  // The trailing 20 sessions are what "20d volatility" claims to describe.
  const recent = returns.slice(-20);

  return {
    symbol,
    asofDate: dates[dates.length - 1],
    riskMetrics: {
      var95: Number((Math.abs(var95Pct) * lastClose).toFixed(2)),
      cvar: Number((Math.abs(cvarPct) * lastClose).toFixed(2)),
      beta: Number((computeBeta(dates, closes, indexByDate) ?? 0).toFixed(2)),
      volatility20d: Number((stdev(recent) * Math.sqrt(SESSIONS_PER_YEAR) * 100).toFixed(2)),
      sharpeRatio: annualVol > 0 ? Number(((annualReturn - RISK_FREE_RATE) / annualVol).toFixed(2)) : 0,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
    },
    drawdownData: drawdowns,
    volatilityData: volatilitySeries(returns),
    returnsData: returnsHistogram(returns),
    provenance: {
      method: 'computed',
      basis: 'CSE daily closing prices captured from the open-price service',
      sessions: rows.length,
      window: { from: dates[0], to: dates[dates.length - 1] },
      riskFreeRate: RISK_FREE_RATE,
      betaBenchmark: 'ASPI',
      note: 'Statistics computed from real market data — not a model prediction.',
    },
  };
}

async function main() {
  console.log('\n▸ risk statistics from captured price history');

  const coverage = await readFixture(['open-price', 'coverage.json']);
  const symbols = coverage?.covered ?? [];
  if (!symbols.length) {
    console.error('  no price history on disk — run harvest-open-price and harvest-history first');
    process.exit(1);
  }

  const indexByDate = await loadIndexSeries();
  console.log(`  ASPI benchmark: ${indexByDate.size} sessions`);

  let done = 0;
  const covered = [];
  const thin = [];

  await mapLimit(symbols, 8, async (symbol) => {
    const fixture = await readFixture(['open-price', 'history', `${symbol}.json`]);
    const history = fixture?.payload?.history ?? [];
    const metrics = computeMetrics(symbol, history, indexByDate);

    if (metrics) {
      await writeFixture(['risk', `${symbol}.json`], {
        capturedAt: new Date().toISOString(),
        // The risk tab historically waited about a second on this.
        latencyMs: 900,
        payload: metrics,
      });
      covered.push(symbol);
    } else {
      thin.push(symbol);
    }

    progress('risk', ++done, symbols.length, `(${symbol})`);
  });

  await writeFixture(['risk', 'coverage.json'], {
    capturedAt: new Date().toISOString(),
    riskFreeRate: RISK_FREE_RATE,
    betaBenchmark: 'ASPI',
    covered: covered.sort(),
    insufficientHistory: thin.sort(),
  });

  console.log(`  computed ${covered.length}, withheld ${thin.length} for thin history`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
