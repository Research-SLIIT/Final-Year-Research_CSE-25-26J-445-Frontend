/**
 * Custom hook for fetching financial health analysis data via SSE streaming
 */

import { useCallback } from 'react';
import { FinancialHealthResponse } from '@/lib/types/financial-health.types';
import { getAnalyzeCSEStreamUrl } from '@/lib/api/financial-health.api';
import { useAnalysisStream, ProgressEvent } from '@/hooks/use-analysis-stream';

interface UseFinancialHealthReturn {
    data: FinancialHealthResponse | null;
    loading: boolean;
    error: string | null;
    events: ProgressEvent[];
    fetchAnalysis: (symbol: string) => Promise<void>;
    reset: () => void;
}

/**
 * Hook for managing financial health analysis state and API calls.
 * Uses SSE streaming to receive real-time progress events.
 */
export function useFinancialHealth(): UseFinancialHealthReturn {
    const { start, events, result, isLoading, error, reset: resetStream } = useAnalysisStream();

    const fetchAnalysis = useCallback(async (symbol: string) => {
        if (!symbol) return;
        const url = getAnalyzeCSEStreamUrl(symbol);
        await start(url).catch(() => {/* error already set in stream hook */});
    }, [start]);

    const reset = useCallback(() => {
        resetStream();
    }, [resetStream]);

    return {
        data: result as FinancialHealthResponse | null,
        loading: isLoading,
        error,
        events,
        fetchAnalysis,
        reset,
    };
}
