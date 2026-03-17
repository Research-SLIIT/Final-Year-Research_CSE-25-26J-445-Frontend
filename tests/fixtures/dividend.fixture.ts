import type { DividendPredictionResult, HistoricalDividendData } from "@/lib/api/dividend_api";

export const mockDividendResult: DividendPredictionResult = {
  data: {
    features: {
      ROA: { "1": 0.05 },
      asset_turnover: { "1": 0.8 },
      current_ratio: { "1": 1.5 },
      non_current_to_total_assets: { "1": 0.6 },
      ROA_x_leverage: { "1": 0.03 },
      efficiency_score: { "1": 0.7 },
      ROA_lag1: { "1": 0.04 },
      profit_margin_lag1: { "1": 0.12 },
      debt_to_assets_lag1: { "1": 0.4 },
    },
    prediction: {
      probability: 0.75,
      predicted_dividend: 5.25,
      decision: "Dividend Expected",
      confidence: "high",
      feature_contributions: {
        contributions: { ROA: 0.15, asset_turnover: 0.10 },
        intercept: -0.5,
        top_positive_features: { ROA: 0.15 },
        top_negative_features: { debt_to_assets_lag1: -0.08 },
        explanation: "Strong profitability drives positive prediction.",
      },
      investor_explanation: {
        summary: "Company shows strong dividend capacity.",
        key_strengths: ["High ROA", "Solid liquidity"],
        key_concerns: ["Moderate leverage"],
        recommendation: "Hold/Buy",
        risk_assessment: "Low",
        confidence_level: "High",
        model_certainty: "Strong consensus across models",
      },
    },
    financial_possition: {
      profitability: 0.72,
      efficiency: 0.65,
      liquidity: 0.80,
      leverage: 0.45,
    },
  },
};

export const mockLowProbabilityDividendResult: DividendPredictionResult = {
  ...mockDividendResult,
  data: {
    ...mockDividendResult.data,
    prediction: {
      ...mockDividendResult.data.prediction,
      probability: 0.15,
      decision: "No Dividend Expected",
    },
  },
};

export const mockHistoricalDividendData: HistoricalDividendData = {
  success: true,
  firm: "AAF",
  records: [
    {
      Year: 2023,
      Revenue: 1000000,
      EBIT: 150000,
      "Profit After Tax": 100000,
      "Current Assets": 500000,
      "Non-Current Assets": 1000000,
      "Current Liabilities": 300000,
      "Non-Current Liabilities": 400000,
      "Total Equity": 800000,
      "Net Cash from Operating Activities": 120000,
      "Net Cash Used in Investing Activities": -80000,
      "Capital Expenditure (CAPEX)": 60000,
      "GDP change": 0.03,
      "ccpi change": 0.05,
      "Dividends Paid": 50000,
      FIRM: "AAF",
    },
    {
      Year: 2024,
      Revenue: 1100000,
      EBIT: 170000,
      "Profit After Tax": 115000,
      "Current Assets": 550000,
      "Non-Current Assets": 1050000,
      "Current Liabilities": 310000,
      "Non-Current Liabilities": 390000,
      "Total Equity": 850000,
      "Net Cash from Operating Activities": 130000,
      "Net Cash Used in Investing Activities": -70000,
      "Capital Expenditure (CAPEX)": 55000,
      "GDP change": 0.035,
      "ccpi change": 0.045,
      "Dividends Paid": 55000,
      FIRM: "AAF",
    },
  ],
  count: 2,
  start_year: 2023,
  end_year: 2024,
  message: "Success",
  error: null,
};
