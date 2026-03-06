/**
 * Open Price Prediction API Response Types
 * Backend Endpoint: GET /api/v1/open-price/predict
 */

export interface ExplanationDriver {
  feature: string;
  display_name: string;
  value: number;
  shap_value: number;
  direction: "bullish" | "bearish";
  description: string;
}

export interface CategoryImpact {
  total_shap: number;
  direction: "bullish" | "bearish";
}

export interface ModelAgreement {
  agreement_score: number;
  per_model_predictions: Record<string, number>;
  prediction_std: number;
}

export interface PredictionExplanation {
  shap_values: Record<string, number>;
  base_value: number;
  top_drivers: ExplanationDriver[];
  summary: string;
  category_impacts: Record<string, CategoryImpact>;
  model_agreement: ModelAgreement;
}

/**
 * Raw response from backend API (matches OpenPricePredictionResponseDto)
 */
export interface OpenPricePredictionBackendResponse {
  company_id: string;
  asof_trading_date: string | null;
  open_today: number | null;
  pred_logret_tplus5: number | null;
  pred_open_tplus5: number | null;
  baseline_open_tplus5: number | null;
  warming_up: boolean;
  reason: string | null;
  explanation?: PredictionExplanation;
}

/**
 * Health check response from backend
 */
export interface OpenPriceHealthCheckResponse {
  status: string;
  data_source: string;
  model_loaded: boolean;
  model_info: {
    model_type: string;
    model_path: string;
    config: Record<string, any>;
    is_loaded: boolean;
  };
  feature_cols_loaded: boolean;
  feature_cols_count: number;
  csv_rows_loaded: number;
}

/**
 * Frontend-friendly prediction result
 * Combines real backend data with client-generated mock data for visualizations
 */
export interface PredictionResult {
  symbol: string;
  asofDate: string;
  predictedForDate: string;
  openToday: number;
  predOpenTplus5: number;
  confidence: "low" | "medium" | "high";
  reason: string | null;
  forecastPoints: Array<{ day: number; price: number }>;
  baselinePoints: Array<{ day: number; price: number }>;
  deltaPoints: Array<{ day: number; deltaPrice: number; deltaPct: number }>;
  explanation?: PredictionExplanation;
}
