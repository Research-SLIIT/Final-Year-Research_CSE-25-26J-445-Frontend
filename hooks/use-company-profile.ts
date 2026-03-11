/**
 * Custom hook for fetching CSE company profile data
 */

import { useState, useCallback } from 'react';

const CSE_CDN_BASE = 'https://cdn.cse.lk/cmt';

export interface CompanyProfileSummary {
    securityId: number;
    registerOffice: string;
    tel1: string;
    name: string;
    symbol: string;
    fax: string;
    email1: string;
    web: string;
    sector: string;
    boardType: string;
}

export interface CompanyProfile {
    summary: CompanyProfileSummary | null;
    logoUrl: string | null;
}

interface UseCompanyProfileReturn {
    data: CompanyProfile | null;
    loading: boolean;
    error: string | null;
    fetchProfile: (symbol: string) => Promise<void>;
    reset: () => void;
}

export function useCompanyProfile(): UseCompanyProfileReturn {
    const [data, setData] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async (symbol: string) => {
        if (!symbol) return;

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(
                `/api/company-profile?symbol=${encodeURIComponent(symbol)}`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch company profile: ${response.status}`);
            }

            const json = await response.json();

            const summaryRaw = json?.reqComSumInfo?.[0] ?? null;
            const logoPath: string | null = json?.reqLogo?.path ?? null;

            const summary: CompanyProfileSummary | null = summaryRaw
                ? {
                    securityId: summaryRaw.securityId,
                    registerOffice: summaryRaw.registerOffice ?? '',
                    tel1: summaryRaw.tel1 ?? '',
                    name: summaryRaw.name ?? '',
                    symbol: summaryRaw.symbol ?? '',
                    fax: summaryRaw.fax ?? '',
                    email1: summaryRaw.email1 ?? '',
                    web: summaryRaw.web ?? '',
                    sector: summaryRaw.sector ?? '',
                    boardType: summaryRaw.boardType ?? '',
                }
                : null;

            setData({
                summary,
                logoUrl: logoPath ? `${CSE_CDN_BASE}/${logoPath}` : null,
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error fetching company profile');
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { data, loading, error, fetchProfile, reset };
}
