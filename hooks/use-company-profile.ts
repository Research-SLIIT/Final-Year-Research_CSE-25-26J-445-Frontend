/**
 * Custom hook for fetching CSE company profile data
 */

import { useState, useCallback } from 'react';
import { cachedRequest, peekCache, type CacheOptions } from '@/lib/request-cache';

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

interface ProfileState {
    symbol: string | null;
    data: CompanyProfile | null;
    loading: boolean;
    error: string | null;
}

interface UseCompanyProfileReturn {
    data: CompanyProfile | null;
    loading: boolean;
    error: string | null;
    fetchProfile: (symbol: string, options?: CacheOptions) => Promise<void>;
    reset: () => void;
}

const EMPTY: ProfileState = { symbol: null, data: null, loading: false, error: null };

const cacheKey = (symbol: string) => `profile:${symbol}`;

async function requestProfile(symbol: string): Promise<CompanyProfile> {
    const response = await fetch(`/api/company-profile?symbol=${encodeURIComponent(symbol)}`);

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

    return {
        summary,
        logoUrl: logoPath ? `${CSE_CDN_BASE}/${logoPath}` : null,
    };
}

/**
 * @param symbol The company being displayed. Passing it lets a remount render
 * an already-fetched profile on the first frame — the profile sits above the
 * tab strip, so it must not blink every time a tab is switched.
 */
export function useCompanyProfile(symbol?: string): UseCompanyProfileReturn {
    const [state, setState] = useState<ProfileState>(EMPTY);

    let current = state;
    if (symbol && state.symbol !== symbol) {
        const hit = peekCache<CompanyProfile>(cacheKey(symbol));
        current = hit
            ? { symbol, data: hit, loading: false, error: null }
            : EMPTY;
    }

    const fetchProfile = useCallback(async (target: string, options?: CacheOptions) => {
        if (!target) return;

        const key = cacheKey(target);
        if (!options?.force) {
            const hit = peekCache<CompanyProfile>(key);
            if (hit) {
                setState({ symbol: target, data: hit, loading: false, error: null });
                return;
            }
        }

        setState({ symbol: target, data: null, loading: true, error: null });

        try {
            const data = await cachedRequest(key, () => requestProfile(target), options);
            setState({ symbol: target, data, loading: false, error: null });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error fetching company profile';
            setState((prev) => (prev.symbol === target ? { ...prev, loading: false, error: message } : prev));
        }
    }, []);

    const reset = useCallback(() => {
        setState(EMPTY);
    }, []);

    return { data: current.data, loading: current.loading, error: current.error, fetchProfile, reset };
}
