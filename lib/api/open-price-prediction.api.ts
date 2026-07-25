/**
 * Open Price Prediction API Service
 * Handles all API calls related to T+5 open price forecasting
 */

import {
  OpenPricePredictionBackendResponse,
  OpenPriceHealthCheckResponse,
  PredictionResult,
} from "@/lib/types/open-price-prediction.types";
import { normalizeSymbol } from "@/lib/utils";

// API base URL - configured via environment variable.
// Must include the gateway's global prefix (/api/v1); the controller is mounted
// at `/open-price` under that prefix, so the full path is /api/v1/open-price/*.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3400/api/v1";

/**
 * Check health of the open price prediction service
 */
export async function checkOpenPriceServiceHealth(): Promise<OpenPriceHealthCheckResponse> {
  const url = `${API_BASE_URL}/open-price/health`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Health check failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during health check");
  }
}

/**
 * Generate mock historical forecast data for visualization
 * This creates the chart data points that the backend doesn't provide
 */
function generateMockForecastData(openToday: number, predOpenTplus5: number) {
  const forecastPoints = [];
  const baselinePoints = [];
  const deltaPoints = [];

  for (let day = 0; day <= 7; day++) {
    // Baseline: assume no change from today's open
    const baselinePrice = openToday;
    baselinePoints.push({ day, price: baselinePrice });

    // Forecast: interpolate from today to T+5 prediction
    let forecastPrice: number;
    if (day === 0) {
      forecastPrice = openToday;
    } else if (day <= 5) {
      // Linear interpolation to T+5
      const progress = day / 5;
      forecastPrice = openToday + (predOpenTplus5 - openToday) * progress;
    } else {
      // Days 6-7: slight continuation of trend
      const trend = predOpenTplus5 - openToday;
      forecastPrice = predOpenTplus5 + trend * 0.1 * (day - 5);
    }
    forecastPoints.push({ day, price: forecastPrice });

    // Calculate delta
    const deltaPrice = forecastPrice - baselinePrice;
    const deltaPct = (deltaPrice / baselinePrice) * 100;
    deltaPoints.push({ day, deltaPrice, deltaPct });
  }

  return { forecastPoints, baselinePoints, deltaPoints };
}

/**
 * Calculate confidence level from model agreement score
 */
function calculateConfidence(
  backendResponse: OpenPricePredictionBackendResponse,
): "low" | "medium" | "high" {
  const score = backendResponse.explanation?.model_agreement?.agreement_score;
  if (score == null) return "medium";
  if (score >= 0.85) return "high";
  if (score >= 0.65) return "medium";
  return "low";
}

/**
 * Transform backend response to frontend-friendly format
 */
function transformBackendResponse(
  backendResponse: OpenPricePredictionBackendResponse,
): PredictionResult {
  // Handle null values with fallbacks
  const openToday = backendResponse.open_today ?? 0;
  const predOpenTplus5 = backendResponse.pred_open_tplus5 ?? openToday;
  const asofDate =
    backendResponse.asof_trading_date ?? new Date().toISOString().split("T")[0];

  // Compute approximate T+5 calendar date
  const asofDateObj = new Date(asofDate + "T00:00:00");
  asofDateObj.setDate(asofDateObj.getDate() + 7);
  const predictedForDate = asofDateObj.toISOString().split("T")[0];

  // Generate mock chart data
  const { forecastPoints, baselinePoints, deltaPoints } =
    generateMockForecastData(openToday, predOpenTplus5);

  // Calculate confidence from model agreement
  const confidence = calculateConfidence(backendResponse);

  return {
    symbol: backendResponse.company_id,
    asofDate,
    predictedForDate,
    openToday,
    predOpenTplus5,
    confidence,
    reason: backendResponse.reason ?? null,
    forecastPoints,
    baselinePoints,
    deltaPoints,
    explanation: backendResponse.explanation,
  };
}

export interface OpenPriceHistoryPoint {
  date:        string;  // "DD MMM" formatted (e.g. "01 Dec")
  openPrice:   number;
  highPrice:   number;
  lowPrice:    number;
  closePrice:  number;
  tradeVolume: number;
  shareVolume: number;
  turnover:    number;
}

/**
 * Fetch real historical open prices for a company.
 * Always fetches nDays trading days (default 22 = 4 weeks max); caller slices locally per time range.
 */
export async function fetchOpenPriceHistory(
  companyId: string,
  nDays: number = 22,
): Promise<OpenPriceHistoryPoint[]> {
  const normalizedId = normalizeSymbol(companyId);
  const url = `${API_BASE_URL}/open-price/history?company_id=${encodeURIComponent(normalizedId)}&n_days=${nDays}`;
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) return [];
    const data = await response.json();
    const rawHistory: Array<{
      date: string; open_price: number; high_price: number; low_price: number;
      close_price: number; trade_volume: number; share_volume: number; turnover: number;
    }> = data.history ?? [];
    return rawHistory.map((point) => {
      const dateObj = new Date(point.date + "T00:00:00"); // force local-time parse
      return {
        date:        dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        openPrice:   point.open_price,
        highPrice:   point.high_price   ?? 0,
        lowPrice:    point.low_price    ?? 0,
        closePrice:  point.close_price  ?? 0,
        tradeVolume: point.trade_volume ?? 0,
        shareVolume: point.share_volume ?? 0,
        turnover:    point.turnover     ?? 0,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch the list of companies available for prediction
 */
export async function fetchCompanies(): Promise<
  Array<{ id: string; name: string }>
> {
  const url = `${API_BASE_URL}/open-price/companies`;
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) return [];
    const data = await response.json();
    return data.companies ?? [];
  } catch {
    return [];
  }
}

/**
 * Get T+5 open price prediction for a company
 */
export async function predictOpenPrice(
  companyId: string,
  asofDate?: string,
): Promise<PredictionResult> {
  // Normalize symbol (removes .N0000 suffix if present)
  const normalizedId = normalizeSymbol(companyId);
  const encodedCompanyId = encodeURIComponent(normalizedId);

  // Build URL with query parameters
  const params = new URLSearchParams({
    company_id: encodedCompanyId,
    explain: "true",
  });
  if (asofDate) {
    params.append("asof", asofDate);
  }

  const url = `${API_BASE_URL}/open-price/predict?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error cases
      if (response.status === 404) {
        throw new Error(`Company ${companyId} not found in dataset`);
      }

      if (response.status === 503) {
        throw new Error(
          "ML model is warming up. Please try again in a few moments.",
        );
      }

      throw new Error(
        errorData.message ||
          `Prediction failed: ${response.status} ${response.statusText}`,
      );
    }

    const backendData: OpenPricePredictionBackendResponse =
      await response.json();

    // Check if service is warming up
    if (backendData.warming_up) {
      throw new Error(backendData.reason || "Service is warming up");
    }

    // Transform and return
    return transformBackendResponse(backendData);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching prediction");
  }
}
