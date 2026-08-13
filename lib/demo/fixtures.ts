/**
 * Fixture transport for demo mode.
 *
 * Two jobs: fetch a captured payload, and take as long doing it as the real
 * backend did. The second matters as much as the first — the app's loading
 * states, skeletons and progress logs were built around real latency, and a
 * demo that resolves everything in 5ms never shows the UI that took the most
 * work to build. Each fixture carries the latency measured at capture time and
 * the loader honours it.
 */

import { DEMO_DATA_BASE } from './config';

/** Envelope written by `scripts/demo/harvest-lib.mjs`. */
export interface FixtureEnvelope<T> {
  capturedAt: string;
  latencyMs: number;
  source: string;
  payload: T;
}

/** Raised when a fixture is missing, so callers can map it to their own 404 path. */
export class DemoFixtureMissing extends Error {
  constructor(public readonly path: string) {
    super(`No demo fixture for ${path}`);
    this.name = 'DemoFixtureMissing';
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ceiling on replayed latency.
 *
 * Honouring the capture exactly is right up to a point, and the dividend LLM
 * explanation is past it — twelve seconds of spinner shows nothing the first
 * two seconds did not. A cap rather than a divisor keeps the texture that
 * makes replayed latency worth having: the sub-second calls still return
 * sub-second, so the demo stays honest about which work is cheap and which is
 * expensive. Set NEXT_PUBLIC_DEMO_MAX_LATENCY_MS=0 to replay uncapped.
 */
const MAX_LATENCY_MS = Number(process.env.NEXT_PUBLIC_DEMO_MAX_LATENCY_MS ?? 2500);

/**
 * Fixture paths are lowercased on both sides of the wire.
 *
 * The harvest writes `jkh.json`; a lookup for `JKH` would resolve on a
 * case-insensitive dev filesystem and 404 on the Linux host serving the
 * deployed demo. Normalising here removes that whole class of bug.
 */
function fixtureUrl(segments: string[]): string {
  return `${DEMO_DATA_BASE}/${segments.map((s) => s.toLowerCase()).join('/')}`;
}

/**
 * The captured latency is a floor on how long the call appears to take, not a
 * sleep bolted onto the fetch: the fetch itself counts toward it. A cached
 * fixture returning in 3ms still waits out the remaining time; a slow network
 * that already exceeded it adds nothing.
 */
async function pace<T>(startedAt: number, latencyMs: number, value: T): Promise<T> {
  const target = MAX_LATENCY_MS > 0 ? Math.min(latencyMs, MAX_LATENCY_MS) : latencyMs;
  const remaining = target - (Date.now() - startedAt);
  if (remaining > 0) await sleep(remaining);
  return value;
}

/**
 * Load a fixture and replay its captured latency.
 * @throws {DemoFixtureMissing} when the company has no captured output.
 */
export async function loadFixture<T>(...segments: string[]): Promise<T> {
  const url = fixtureUrl(segments);
  const startedAt = Date.now();

  const response = await fetch(url);
  if (!response.ok) throw new DemoFixtureMissing(url);

  const envelope = (await response.json()) as FixtureEnvelope<T>;
  return pace(startedAt, envelope.latencyMs ?? 0, envelope.payload);
}

/**
 * Load a fixture, or resolve to `fallback` when it does not exist.
 * Still paces the miss, so an unsupported company takes a plausible moment to
 * come back empty rather than snapping to an error state instantly.
 */
export async function loadFixtureOr<T>(fallback: T, ...segments: string[]): Promise<T> {
  const startedAt = Date.now();
  try {
    return await loadFixture<T>(...segments);
  } catch {
    return pace(startedAt, 400, fallback);
  }
}

/** Load a fixture envelope whole, when the caller wants the capture metadata. */
export async function loadEnvelope<T>(...segments: string[]): Promise<FixtureEnvelope<T>> {
  const url = fixtureUrl(segments);
  const response = await fetch(url);
  if (!response.ok) throw new DemoFixtureMissing(url);
  return (await response.json()) as FixtureEnvelope<T>;
}
