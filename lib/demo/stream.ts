/**
 * SSE replay for demo mode.
 *
 * The financial-health analysis is a five-step pipeline that streams progress
 * while it locates a CSE filing, downloads the PDF, parses it with Gemini and
 * scores the result — about twenty seconds of genuinely interesting UI. Freezing
 * that into a single instant payload would throw away the most demonstrative
 * screen in the app.
 *
 * So the harvest records every `data:` frame with the offset at which it
 * arrived, and this replays them on the same clock. What a visitor watches is
 * the log the backend actually emitted, paced as it emitted it.
 */

import { DEMO_DATA_BASE } from './config';

/** Matches the `ProgressEvent` the analysis-stream hook consumes. */
export interface DemoStreamEvent {
  step: number;
  total: number;
  message: string;
  status: 'processing' | 'step-done' | 'completed' | 'error';
  result?: unknown;
}

interface CapturedStream {
  capturedAt: string;
  totalMs: number;
  source: string;
  events: Array<{ atMs: number; data: DemoStreamEvent }>;
  result: unknown;
}

/**
 * Replaying a twenty-second capture faithfully is right for a first visit and
 * tedious on the fifth. This compresses the timeline without flattening it:
 * the steps still arrive in order, spaced proportionally, just faster.
 *
 * The captures run 18–31s, and almost all of that is a single gap — the LLM
 * parse in step 3 — so at the original pace a visitor watches one spinner for
 * twenty seconds and learns nothing more than they did at second three. 8×
 * brings a run to roughly four seconds: long enough to read the steps as they
 * land, short enough to sit through twice. Set
 * NEXT_PUBLIC_DEMO_STREAM_SPEED=1 to watch the pipeline at its true pace.
 */
const REPLAY_SPEED = Number(process.env.NEXT_PUBLIC_DEMO_STREAM_SPEED || 8);

/** Never let compression collapse two steps into the same frame. */
const MIN_GAP_MS = 120;

export interface DemoStreamHandle {
  /** Stop replaying — mirrors `EventSource.close()`. */
  close(): void;
}

/**
 * Replay a captured stream for `symbol`, invoking `onEvent` per frame.
 *
 * Deliberately shaped like the EventSource call site it replaces, so the hook
 * that consumes it needs a transport swap rather than a rewrite.
 */
export function replayDemoStream(
  kind: 'analyze' | 'report-check',
  symbol: string,
  handlers: {
    onEvent: (event: DemoStreamEvent) => void;
    onError: (error: Error) => void;
  },
): DemoStreamHandle {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const url = `${DEMO_DATA_BASE}/financial-health/${kind}/${symbol.toLowerCase()}.json`;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`No captured analysis for ${symbol}`);
      return response.json() as Promise<CapturedStream>;
    })
    .then((captured) => {
      if (cancelled) return;

      const events = captured.events ?? [];
      if (!events.length) throw new Error(`Captured analysis for ${symbol} is empty`);

      // Schedule against the capture's own offsets rather than accumulating
      // per-event delays, so rounding cannot drift the tail of a long stream.
      let previousAt = 0;
      let scheduledAt = 0;

      for (const { atMs, data } of events) {
        const gap = Math.max(MIN_GAP_MS, (atMs - previousAt) / REPLAY_SPEED);
        scheduledAt += gap;
        previousAt = atMs;

        timers.push(
          setTimeout(() => {
            if (!cancelled) handlers.onEvent(data);
          }, scheduledAt),
        );
      }
    })
    .catch((error: unknown) => {
      if (cancelled) return;
      handlers.onError(error instanceof Error ? error : new Error('Replay failed'));
    });

  return {
    close() {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
      timers.length = 0;
    },
  };
}

/**
 * Recover the symbol and pipeline from a stream URL the app built.
 *
 * Callers still construct real backend URLs; demo mode intercepts at the
 * transport, so the URL stays the single source of truth for what was asked
 * for and nothing upstream needs to know which mode it is in.
 */
export function parseStreamUrl(
  url: string,
): { kind: 'analyze' | 'report-check'; symbol: string } | null {
  const analyze = url.match(/\/financial-health\/analyze-cse\/([^/]+)\/stream/);
  if (analyze) return { kind: 'analyze', symbol: baseSymbol(analyze[1]) };

  const report = url.match(/\/financial-health\/report-health-check\/([^/]+)\/stream/);
  if (report) return { kind: 'report-check', symbol: baseSymbol(report[1]) };

  return null;
}

/** "JKH.N0000" (possibly URL-encoded) → "JKH", the key fixtures are stored under. */
function baseSymbol(raw: string): string {
  return decodeURIComponent(raw).split('.')[0].toUpperCase();
}
