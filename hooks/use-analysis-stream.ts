/**
 * Generic SSE hook for streaming analysis progress from the backend.
 * Works with endpoints that emit Server-Sent Events.
 */

import { useState, useCallback } from 'react';

export type ProgressEvent = {
  step: number;
  total: number;
  message: string;
  status: 'processing' | 'step-done' | 'completed' | 'error';
  result?: unknown;
};

interface UseAnalysisStreamReturn {
  events: ProgressEvent[];
  result: unknown;
  isLoading: boolean;
  error: string | null;
  start: (url: string) => Promise<void>;
  reset: () => void;
}

export function useAnalysisStream(): UseAnalysisStreamReturn {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setEvents([]);
    setResult(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const start = useCallback((url: string): Promise<void> => {
    setEvents([]);
    setResult(null);
    setError(null);
    setIsLoading(true);

    return new Promise((resolve, reject) => {
      const source = new EventSource(url);

      source.onmessage = (e) => {
        let data: ProgressEvent;
        try {
          data = JSON.parse(e.data);
        } catch {
          return;
        }

        setEvents((prev) => {
          // If an in-progress placeholder already exists for this step, replace it
          const processingIdx = prev.findIndex(
            (e) => e.step === data.step && e.status === 'processing'
          );
          if (processingIdx !== -1 && data.status !== 'processing') {
            return [
              ...prev.slice(0, processingIdx),
              data,
              ...prev.slice(processingIdx + 1),
            ];
          }
          return [...prev, data];
        });

        if (data.status === 'completed') {
          setResult(data.result ?? null);
          setIsLoading(false);
          source.close();
          resolve();
        } else if (data.status === 'error') {
          setError(data.message);
          setIsLoading(false);
          source.close();
          reject(new Error(data.message));
        }
      };

      source.onerror = () => {
        const msg = 'Connection lost. Please try again.';
        setError(msg);
        setIsLoading(false);
        source.close();
        reject(new Error(msg));
      };
    });
  }, []);

  return { start, events, result, isLoading, error, reset };
}
