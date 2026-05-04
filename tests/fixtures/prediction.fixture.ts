import type { PredictionResult } from "@/lib/types/open-price-prediction.types";
import type { OpenPriceHistoryPoint } from "@/lib/api/open-price-prediction.api";

export const mockPredictionResult: PredictionResult = {
  symbol: "AAF",
  asofDate: "2025-01-10",
  predictedForDate: "2025-01-17",
  openToday: 100.0,
  predOpenTplus5: 105.0,
  confidence: "high",
  reason: null,
  forecastPoints: [
    { day: 0, price: 100.0 },
    { day: 1, price: 101.0 },
    { day: 2, price: 102.0 },
    { day: 3, price: 103.0 },
    { day: 4, price: 104.0 },
    { day: 5, price: 105.0 },
    { day: 6, price: 105.5 },
    { day: 7, price: 106.0 },
  ],
  baselinePoints: [
    { day: 0, price: 100.0 },
    { day: 1, price: 100.0 },
    { day: 2, price: 100.0 },
    { day: 3, price: 100.0 },
    { day: 4, price: 100.0 },
    { day: 5, price: 100.0 },
    { day: 6, price: 100.0 },
    { day: 7, price: 100.0 },
  ],
  deltaPoints: [
    { day: 0, deltaPrice: 0, deltaPct: 0 },
    { day: 1, deltaPrice: 1.0, deltaPct: 1.0 },
    { day: 5, deltaPrice: 5.0, deltaPct: 5.0 },
  ],
  explanation: {
    shap_values: { feature1: 0.5, feature2: -0.2 },
    base_value: 100.0,
    top_drivers: [],
    summary: "Model is confident",
    category_impacts: {},
    model_agreement: {
      agreement_score: 0.90,
      models: [],
      consensus: "buy",
    },
  },
};

export const mockBackendResponse = {
  company_id: "AAF",
  asof_trading_date: "2025-01-10",
  open_today: 100.0,
  pred_open_tplus5: 105.0,
  reason: null,
  warming_up: false,
  explanation: {
    model_agreement: {
      agreement_score: 0.90,
      models: [],
      consensus: "buy",
    },
  },
};

export const mockHistoryRaw = {
  history: [
    {
      date: "2025-01-01",
      open_price: 98.0,
      high_price: 100.0,
      low_price: 96.0,
      close_price: 99.0,
      trade_volume: 1000,
      share_volume: 500,
      turnover: 98500,
    },
    {
      date: "2025-01-02",
      open_price: 99.0,
      high_price: 101.0,
      low_price: 97.0,
      close_price: 100.0,
      trade_volume: 1200,
      share_volume: 600,
      turnover: 120000,
    },
  ],
};

export const mockHistoryPoints: OpenPriceHistoryPoint[] = [
  {
    date: "01 Jan",
    openPrice: 98.0,
    highPrice: 100.0,
    lowPrice: 96.0,
    closePrice: 99.0,
    tradeVolume: 1000,
    shareVolume: 500,
    turnover: 98500,
  },
];
