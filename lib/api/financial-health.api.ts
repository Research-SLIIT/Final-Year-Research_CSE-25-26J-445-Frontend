/**
 * Financial Health API Service
 * Handles all API calls related to financial health analysis
 */

import { CompanyHealthHistoryResponse } from '@/lib/types/company-health-history.types';
import { DEMO_MODE } from '@/lib/demo/config';
import { loadFixture } from '@/lib/demo/fixtures';

// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3400';

/**
 * Returns the SSE stream URL for the analyze-cse endpoint
 */
export function getAnalyzeCSEStreamUrl(symbol: string): string {
    const encodedSymbol = encodeURIComponent(symbol);
    return `${API_BASE_URL}/api/v1/financial-health/analyze-cse/${encodedSymbol}/stream`;
}

/**
 * Returns the SSE stream URL for the report-health-check endpoint
 */
export function getReportHealthCheckStreamUrl(symbol: string): string {
    const encodedSymbol = encodeURIComponent(symbol);
    return `${API_BASE_URL}/api/v1/financial-health/report-health-check/${encodedSymbol}/stream`;
}

/**
 * Get all historical financial health data for a company
 * @param companyCode - The company code (e.g., "acl_n0000")
 * @returns Promise with the historical financial health data
 */
export async function getCompanyHealthHistory(companyCode: string): Promise<CompanyHealthHistoryResponse> {
    const encodedCode = encodeURIComponent(companyCode.toLowerCase().replace('.', '_'));
    const url = `${API_BASE_URL}/api/v1/financial-health/company/${encodedCode}/all`;

    try {
        if (DEMO_MODE) {
            // This endpoint 404s upstream for every company — the history
            // collection is not populated — so there is nothing to replay.
            // Failing the same way keeps the UI's existing empty state.
            return await loadFixture<CompanyHealthHistoryResponse>(
                'financial-health', 'history', `${companyCode.split('.')[0].toUpperCase()}.json`,
            );
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `Failed to fetch company health history: ${response.status} ${response.statusText}`
            );
        }

        const data: CompanyHealthHistoryResponse = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred while fetching company health history');
    }
}


