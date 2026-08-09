/**
 * Custom hook for fetching financial health analysis data via SSE streaming
 */

import { useCallback } from 'react';
import { FinancialHealthResponse } from '@/lib/types/financial-health.types';
import { getAnalyzeCSEStreamUrl } from '@/lib/api/financial-health.api';
import { useAnalysisStream, ProgressEvent } from '@/hooks/use-analysis-stream';
import type { CacheOptions } from '@/lib/request-cache';

interface UseFinancialHealthReturn {
    data: FinancialHealthResponse | null;
    loading: boolean;
    error: string | null;
    events: ProgressEvent[];
    /** Replayed from cache — no pipeline actually ran on this mount. */
    fromCache: boolean;
    fetchAnalysis: (symbol: string, options?: CacheOptions) => Promise<void>;
    reset: () => void;
}

/**
 * Hook for managing financial health analysis state and API calls.
 * Uses SSE streaming to receive real-time progress events.
 *
 * @param symbol The company this component is showing. Passing it lets a
 * remount replay a completed analysis from cache instead of re-streaming it.
 */
export function useFinancialHealth(symbol?: string): UseFinancialHealthReturn {
    const { start, events, result, isLoading, error, fromCache, reset: resetStream } = useAnalysisStream(
        symbol ? getAnalyzeCSEStreamUrl(symbol) : undefined,
    );

    const fetchAnalysis = useCallback(async (target: string, options?: CacheOptions) => {
        if (!target) return;
        const url = getAnalyzeCSEStreamUrl(target);
        await start(url, options).catch(() => {/* error already set in stream hook */});
    }, [start]);

    const reset = useCallback(() => {
        resetStream();
    }, [resetStream]);

    return {
        data: result as FinancialHealthResponse | null,
        loading: isLoading,
        error,
        events,
        fromCache,
        fetchAnalysis,
        reset,
    };
}
