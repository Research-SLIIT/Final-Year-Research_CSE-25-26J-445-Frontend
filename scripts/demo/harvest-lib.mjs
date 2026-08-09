/**
 * Capture helpers shared by the harvest scripts.
 *
 * Every fixture is stored in an envelope carrying the latency the real call
 * took. The demo loader replays that number rather than a hardcoded guess, so
 * a dividend lookup still feels instant and a Gemini-backed health analysis
 * still takes twenty seconds — the loading states stay honest.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { OUT_DIR } from './config.mjs';

/**
 * Fixture paths are lowercased on the way in and on the way out. Windows would
 * happily serve `JKH.json` for a request for `jkh.json`; Vercel's Linux hosts
 * would 404 it. Normalising both sides removes the whole class of bug.
 */
export function fixturePath(...segments) {
  const parts = segments.map((s) => String(s).toLowerCase());
  return path.join(OUT_DIR, ...parts);
}

export async function writeFixture(segments, body) {
  const target = fixturePath(...segments);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(body), 'utf8');
  return target;
}

export async function readFixture(segments) {
  try {
    return JSON.parse(await fs.readFile(fixturePath(...segments), 'utf8'));
  } catch {
    return null;
  }
}

/** True when a fixture already exists — lets a re-run resume instead of redoing hours of work. */
export async function fixtureExists(segments) {
  try {
    await fs.access(fixturePath(...segments));
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET/POST a JSON endpoint once, recording how long it took.
 * A non-2xx is reported rather than thrown — a company the model has no data
 * for is an expected outcome across a 277-company sweep, not a reason to abort.
 */
async function captureJsonOnce(url, init = {}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      return { ok: false, status: response.status, latencyMs };
    }

    return {
      ok: true,
      status: response.status,
      latencyMs,
      envelope: {
        capturedAt: new Date().toISOString(),
        latencyMs,
        source: url,
        payload: await response.json(),
      },
    };
  } catch (error) {
    return { ok: false, status: 0, latencyMs: Date.now() - startedAt, error: String(error) };
  }
}

/**
 * The upstream Postgres behind the open-price service drops idle connections,
 * which surfaces as a 200 carrying `{"companies": [], "error": "SSL SYSCALL
 * error: EOF detected"}`. A 200 is therefore not enough to trust a payload —
 * an unvalidated sweep would have quietly written hundreds of error bodies
 * into the fixtures and produced an empty demo.
 *
 * `validate` decides whether a payload is worth keeping; failures back off and
 * retry, and only a payload that passes is ever returned for writing.
 */
export async function captureJson(url, init = {}, { retries = 3, validate } = {}) {
  let last;

  for (let attempt = 0; attempt <= retries; attempt++) {
    last = await captureJsonOnce(url, init);

    if (last.ok) {
      const payload = last.envelope.payload;
      const rejected =
        (payload && typeof payload === 'object' && 'error' in payload && payload.error) ||
        (validate ? !validate(payload) : false);

      if (!rejected) return last;
      last = { ...last, ok: false, status: last.status, rejected: true };
    }

    // A 404 is a real answer — this company has no data and never will.
    if (last.status === 404 || last.status === 400) return last;
    if (attempt < retries) await sleep(500 * 2 ** attempt);
  }

  return last;
}

/**
 * Consume an SSE endpoint to completion, keeping each event together with the
 * offset at which it arrived. Replaying those offsets is what makes the demo's
 * progress log the log the backend actually produced, paced as it produced it.
 */
export async function captureStream(url, { timeoutMs = 180_000 } = {}) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'text/event-stream' },
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      return { ok: false, status: response.status, latencyMs: Date.now() - startedAt };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const events = [];
    let buffer = '';

    // SSE frames are separated by a blank line; a chunk can split one in half,
    // so anything after the last separator stays buffered for the next read.
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const dataLine = frame
          .split('\n')
          .find((line) => line.startsWith('data:'));
        if (!dataLine) continue;

        try {
          events.push({
            atMs: Date.now() - startedAt,
            data: JSON.parse(dataLine.slice(5).trim()),
          });
        } catch {
          // A frame we cannot parse is a frame the browser would have dropped too.
        }
      }
    }

    const totalMs = Date.now() - startedAt;
    if (!events.length) return { ok: false, status: response.status, latencyMs: totalMs };

    const last = events[events.length - 1].data;
    return {
      ok: true,
      status: response.status,
      latencyMs: totalMs,
      envelope: {
        capturedAt: new Date().toISOString(),
        totalMs,
        source: url,
        events,
        result: last?.result ?? null,
      },
    };
  } catch (error) {
    return { ok: false, status: 0, latencyMs: Date.now() - startedAt, error: String(error) };
  } finally {
    clearTimeout(timer);
  }
}

/** Run `worker` over `items` with a bounded number in flight. */
export async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function drain() {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, drain),
  );
  return results;
}

/** Single-line progress that does not scroll a 277-company sweep off the screen. */
export function progress(label, done, total, extra = '') {
  const pct = total ? Math.round((done / total) * 100) : 100;
  process.stdout.write(`\r  ${label}: ${done}/${total} (${pct}%) ${extra}`.padEnd(96));
  if (done >= total) process.stdout.write('\n');
}
