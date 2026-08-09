/**
 * Custom hook for fetching company financial health history data
 */

import { useState, useCallback, useMemo } from 'react';
import {
    CompanyHealthHistoryResponse,
    ChartDataPoint,
    CompanyHealthDataPoint
} from '@/lib/types/company-health-history.types';
import { getCompanyHealthHistory } from '@/lib/api/financial-health.api';
import { cachedRequest, peekCache, type CacheOptions } from '@/lib/request-cache';

interface UseCompanyHealthHistoryReturn {
    data: CompanyHealthHistoryResponse | null;
    chartData: ChartDataPoint[];
    loading: boolean;
    error: string | null;
    fetchHistory: (companyCode: string, options?: CacheOptions) => Promise<void>;
    reset: () => void;
}

interface HistoryState {
    code: string | null;
    data: CompanyHealthHistoryResponse | null;
    loading: boolean;
    error: string | null;
}

const EMPTY_HISTORY: HistoryState = { code: null, data: null, loading: false, error: null };

const cacheKey = (companyCode: string) => `health-history:${companyCode}`;

/**
 * Parse a date string in M/D/YYYY format to a Date object
 */
function parseQuarterDate(dateStr: string): Date {
    const [month, day, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Format date for display in chart
 */
function formatDateForChart(dateStr: string): string {
    const date = parseQuarterDate(dateStr);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter} ${date.getFullYear()}`;
}

/**
 * Transform raw API data to chart-friendly format
 */
function transformToChartData(data: CompanyHealthDataPoint[]): ChartDataPoint[] {
    return data
        .map(item => ({
            date: formatDateForChart(item.QuarterDate),
            quarterDate: parseQuarterDate(item.QuarterDate),
            working_capital_to_total_assets: parseFloat(item.working_capital_to_total_assets) || 0,
            retained_earnings_to_total_assets: parseFloat(item.retained_earnings_to_total_assets) || 0,
            ebit_to_total_assets: parseFloat(item.ebit_to_total_assets) || 0,
            mve_to_total_liabilities: parseFloat(item.mve_to_total_liabilities) || 0,
            sales_to_total_assets: parseFloat(item.sales_to_total_assets) || 0,
            current_ratio: parseFloat(item.current_ratio) || 0,
            debt_to_equity_ratio: parseFloat(item.debt_to_equity_ratio) || 0,
            net_profit_margin: parseFloat(item.net_profit_margin) || 0,
            z_score: parseFloat(item.z_score) || 0,
            z_score_next_quarter: parseFloat(item.z_score_next_quarter) || 0,
        }))
        .sort((a, b) => a.quarterDate.getTime() - b.quarterDate.getTime());
}

/**
 * Hook for managing company health history state and API calls
 * @returns Object with data, chartData, loading, error states and control functions
 */
/**
 * @param companyCode The company being displayed. Passing it lets a remount
 * render already-fetched history on the first frame instead of refetching.
 */
export function useCompanyHealthHistory(companyCode?: string): UseCompanyHealthHistoryReturn {
    const [state, setState] = useState<HistoryState>(EMPTY_HISTORY);

    let current = state;
    if (companyCode && state.code !== companyCode) {
        const hit = peekCache<CompanyHealthHistoryResponse>(cacheKey(companyCode));
        current = hit ? { code: companyCode, data: hit, loading: false, error: null } : EMPTY_HISTORY;
    }

    const data = current.data;

    // Transform data for charting (memoized)
    const chartData = useMemo(() => {
        if (!data?.data) return [];
        return transformToChartData(data.data);
    }, [data]);

    const fetchHistory = useCallback(async (target: string, options?: CacheOptions) => {
        if (!target) {
            setState({ ...EMPTY_HISTORY, error: 'Please provide a company code' });
            return;
        }

        const key = cacheKey(target);
        if (!options?.force) {
            const hit = peekCache<CompanyHealthHistoryResponse>(key);
            if (hit) {
                setState({ code: target, data: hit, loading: false, error: null });
                return;
            }
        }

        setState({ code: target, data: null, loading: true, error: null });

        try {
            const result = await cachedRequest(key, () => getCompanyHealthHistory(target), options);
            setState({ code: target, data: result, loading: false, error: null });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch company health history';
            setState((prev) =>
                prev.code === target ? { ...prev, data: null, loading: false, error: errorMessage } : prev
            );
        }
    }, []);

    const reset = useCallback(() => {
        setState(EMPTY_HISTORY);
    }, []);

    return {
        data,
        chartData,
        loading: current.loading,
        error: current.error,
        fetchHistory,
        reset,
    };
}
