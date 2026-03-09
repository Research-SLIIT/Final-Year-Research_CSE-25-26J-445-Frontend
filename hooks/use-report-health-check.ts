/**
 * Custom hook for fetching report health check data via SSE streaming
 */

import { useCallback } from 'react';
import { ReportHealthCheckResponse } from '@/lib/types/financial-health.types';
import { getReportHealthCheckStreamUrl } from '@/lib/api/financial-health.api';
import { useAnalysisStream, ProgressEvent } from '@/hooks/use-analysis-stream';

interface UseReportHealthCheckReturn {
    data: ReportHealthCheckResponse | null;
    loading: boolean;
    error: string | null;
    events: ProgressEvent[];
    fetchHealthCheck: (symbol: string) => Promise<void>;
    reset: () => void;
}

/**
 * Hook for managing report health check state and API calls.
 * Uses SSE streaming to receive real-time progress events.
 */
export function useReportHealthCheck(): UseReportHealthCheckReturn {
    const { start, events, result, isLoading, error, reset: resetStream } = useAnalysisStream();

    const fetchHealthCheck = useCallback(async (symbol: string) => {
        if (!symbol) return;
        const url = getReportHealthCheckStreamUrl(symbol);
        await start(url).catch(() => {/* error already set in stream hook */});
    }, [start]);

    const reset = useCallback(() => {
        resetStream();
    }, [resetStream]);

    return {
        data: result as ReportHealthCheckResponse | null,
        loading: isLoading,
        error,
        events,
        fetchHealthCheck,
        reset,
    };
}
