/**
 * Custom hook for fetching report health check data via SSE streaming
 */

import { useCallback } from 'react';
import { ReportHealthCheckResponse } from '@/lib/types/financial-health.types';
import { getReportHealthCheckStreamUrl } from '@/lib/api/financial-health.api';
import { useAnalysisStream, ProgressEvent } from '@/hooks/use-analysis-stream';
import type { CacheOptions } from '@/lib/request-cache';

interface UseReportHealthCheckReturn {
    data: ReportHealthCheckResponse | null;
    loading: boolean;
    error: string | null;
    events: ProgressEvent[];
    /** Replayed from cache — no pipeline actually ran on this mount. */
    fromCache: boolean;
    fetchHealthCheck: (symbol: string, options?: CacheOptions) => Promise<void>;
    reset: () => void;
}

/**
 * Hook for managing report health check state and API calls.
 * Uses SSE streaming to receive real-time progress events.
 *
 * @param symbol The company this component is showing — see useFinancialHealth.
 */
export function useReportHealthCheck(symbol?: string): UseReportHealthCheckReturn {
    const { start, events, result, isLoading, error, fromCache, reset: resetStream } = useAnalysisStream(
        symbol ? getReportHealthCheckStreamUrl(symbol) : undefined,
    );

    const fetchHealthCheck = useCallback(async (target: string, options?: CacheOptions) => {
        if (!target) return;
        const url = getReportHealthCheckStreamUrl(target);
        await start(url, options).catch(() => {/* error already set in stream hook */});
    }, [start]);

    const reset = useCallback(() => {
        resetStream();
    }, [resetStream]);

    return {
        data: result as ReportHealthCheckResponse | null,
        loading: isLoading,
        error,
        events,
        fromCache,
        fetchHealthCheck,
        reset,
    };
}
