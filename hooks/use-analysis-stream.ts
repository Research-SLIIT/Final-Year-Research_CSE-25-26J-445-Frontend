/**
 * Generic SSE hook for streaming analysis progress from the backend.
 * Works with endpoints that emit Server-Sent Events.
 */

import { useCallback, useState } from 'react';
import { cachedRequest, peekCache, type CacheOptions } from '@/lib/request-cache';
import { DEMO_MODE } from '@/lib/demo/config';
import { parseStreamUrl, replayDemoStream } from '@/lib/demo/stream';

export type ProgressEvent = {
  step: number;
  total: number;
  message: string;
  status: 'processing' | 'step-done' | 'completed' | 'error';
  result?: unknown;
};

/** What a completed stream is worth keeping: the payload and the progress log. */
interface StreamOutcome {
  events: ProgressEvent[];
  result: unknown;
}

/** Stream state is tagged with the URL it describes — see `streamUrl` below. */
interface StreamState extends StreamOutcome {
  url: string | null;
  isLoading: boolean;
  error: string | null;
  /** True when these events were replayed from cache rather than streamed now. */
  replayed: boolean;
}

interface UseAnalysisStreamReturn {
  events: ProgressEvent[];
  result: unknown;
  isLoading: boolean;
  error: string | null;
  /**
   * The result came from cache, so no work actually happened on this mount.
   * Callers use this to skip progress UI that would otherwise replay a
   * finished pipeline every time the user returns to the tab.
   */
  fromCache: boolean;
  start: (url: string, options?: CacheOptions) => Promise<void>;
  reset: () => void;
}

const EMPTY: StreamState = {
  url: null,
  events: [],
  result: null,
  isLoading: false,
  error: null,
  replayed: false,
};

const cacheKey = (url: string) => `stream:${url}`;

/**
 * @param streamUrl The URL this component expects to be showing. Supplying it
 * lets a remount read a completed stream out of the cache during the first
 * render, so switching back to a tab paints the finished analysis immediately
 * instead of flashing an empty state while an effect catches up.
 */
export function useAnalysisStream(streamUrl?: string): UseAnalysisStreamReturn {
  const [state, setState] = useState<StreamState>(EMPTY);

  // State belonging to a different company is not ours to show. Falling back to
  // the cache (then to empty) is what keeps a company switch from briefly
  // rendering the previous company's numbers.
  let current = state
  if (streamUrl && state.url !== streamUrl) {
    const hit = peekCache<StreamOutcome>(cacheKey(streamUrl))
    current = hit
      ? { url: streamUrl, ...hit, isLoading: false, error: null, replayed: true }
      : EMPTY
  }

  const reset = useCallback(() => {
    setState(EMPTY);
  }, []);

  /** Opens the connection and resolves with everything worth caching. */
  const openStream = useCallback((url: string): Promise<StreamOutcome> => {
    return new Promise((resolve, reject) => {
      // Accumulated outside React state so the resolved value is complete even
      // if the component unmounts mid-stream — the next mount still gets it.
      const collected: ProgressEvent[] = [];
      // Assigned before any frame can arrive — both transports hand back their
      // handle synchronously and only ever emit on a later tick.
      let transport: { close(): void } = { close() {} };

      /** Shared by both transports: the frame-folding and completion rules. */
      const handleEvent = (data: ProgressEvent) => {
        // If an in-progress placeholder already exists for this step, replace it
        const processingIdx = collected.findIndex(
          (event) => event.step === data.step && event.status === 'processing'
        );
        if (processingIdx !== -1 && data.status !== 'processing') {
          collected.splice(processingIdx, 1, data);
        } else {
          collected.push(data);
        }
        setState((prev) =>
          prev.url === url ? { ...prev, events: [...collected] } : prev
        );

        if (data.status === 'completed') {
          transport.close();
          resolve({ events: [...collected], result: data.result ?? null });
        } else if (data.status === 'error') {
          transport.close();
          reject(new Error(data.message));
        }
      };

      // Demo mode swaps the transport, not the contract: the captured frames
      // are replayed on their original clock, so everything above this line —
      // progress UI, caching, error handling — behaves exactly as it does live.
      const demoTarget = DEMO_MODE ? parseStreamUrl(url) : null;
      if (demoTarget) {
        transport = replayDemoStream(demoTarget.kind, demoTarget.symbol, {
          onEvent: handleEvent,
          onError: reject,
        });
        return;
      }

      const source = new EventSource(url);
      transport = source;

      source.onmessage = (e) => {
        let data: ProgressEvent;
        try {
          data = JSON.parse(e.data);
        } catch {
          return;
        }
        handleEvent(data);
      };

      source.onerror = () => {
        source.close();
        reject(new Error('Connection lost. Please try again.'));
      };
    });
  }, []);

  const start = useCallback(
    (url: string, options: CacheOptions = {}): Promise<void> => {
      const key = cacheKey(url);

      // Already streamed this company once — replay it rather than re-running
      // an analysis that takes seconds and shows a full progress log.
      if (!options.force) {
        const hit = peekCache<StreamOutcome>(key);
        if (hit) {
          setState({ url, ...hit, isLoading: false, error: null, replayed: true });
          return Promise.resolve();
        }
      }

      setState({ url, events: [], result: null, isLoading: true, error: null, replayed: false });

      return cachedRequest(key, () => openStream(url), options).then(
        (outcome) => {
          // A request shared with another mount resolves without having pushed
          // anything into this component's state, so adopt the result here.
          // Not `replayed`: this mount waited on real work either way.
          setState({ url, ...outcome, isLoading: false, error: null, replayed: false });
        },
        (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Analysis failed';
          setState((prev) => (prev.url === url ? { ...prev, isLoading: false, error: message } : prev));
          throw err;
        },
      );
    },
    [openStream],
  );

  return {
    start,
    reset,
    events: current.events,
    result: current.result,
    isLoading: current.isLoading,
    error: current.error,
    fromCache: current.replayed,
  };
}
