


export interface DividendForecast {
  quarter: string;
  predictedDividend: number;
  probability: number;
}


export interface DividendPredictionResult {
  data: {
    features: {
      ROA: { "1": number };
      asset_turnover: { "1": number };
      current_ratio: { "1": number };
      non_current_to_total_assets: { "1": number };
      ROA_x_leverage: { "1": number };
      efficiency_score: { "1": number };
      ROA_lag1: { "1": number };
      profit_margin_lag1: { "1": number };
      debt_to_assets_lag1: { "1": number };
    };
    prediction: {
      probability: number;
      predicted_dividend: number;
      decision: string;
      confidence: string;
      feature_contributions: {
        contributions: Record<string, number>;
        intercept: number;
        top_positive_features: Record<string, number>;
        top_negative_features: Record<string, number>;
        explanation: string;
      };
      investor_explanation: {
        summary: string;
        key_strengths: string[];
        key_concerns: string[];
        recommendation: string;
        risk_assessment: string;
        confidence_level: string;
        model_certainty: string;
      };
    };
    financial_possition: {
      profitability: number;
      efficiency: number;
      liquidity: number;
      leverage: number;
    };
  };
}


// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://16.171.27.203:8080/api/v1/dividend-prediction/';

export const predictDividend = async (
  symbol: string
): Promise<DividendPredictionResult> => {
  const data = await fetchDataFromBackend(symbol);
  if (!data) {
    throw new Error("Dividend data not available for this symbol");
  }
  return data as DividendPredictionResult;
};

export const llm_exp = async (
  symbol: string
): Promise<any> => {
  const data = await fetchDataFromBackend_llm(symbol);
  if (!data) {
    throw new Error("Dividend data not available for this symbol");
  }
  return data as any;
};

// API function to fetch data from backend
export const fetchDataFromBackend = async (symbol: string, year: number = 2025): Promise<DividendPredictionResult> => {
  try {
    console.log("symbol", symbol);
    const response = await fetch(`${API_BASE_URL}data?firm=${encodeURIComponent(symbol)}&year=${year}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching data from backend:', error);
    throw error;
  }
};


export const fetchDataFromBackend_llm = async (symbol: string, year: number = 2025): Promise<DividendPredictionResult> => {
  try {
    const url = `${API_BASE_URL}llm-explanation?firm=${encodeURIComponent(symbol)}&year=${year}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching data from backend:', error);
    throw error;
  }
};

import { GlossaryMap } from '@/lib/types/dividend/glossary';

export async function fetchGlossary(): Promise<GlossaryMap> {
  try {
    const res = await fetch(`${API_BASE_URL}metadata/glossary`);
    const json = await res.json();
    
    if (json.status === 'success' && json.data) {
      return json.data; // ✅ Correctly returns the data
    }
    return {};
  } catch (err) {
    console.error("Failed to load glossary:", err);
    return {};
  }
}

export interface HistoricalRecord {
  Year: number;
  Revenue: number;
  EBIT: number;
  "Profit After Tax": number;
  "Current Assets": number;
  "Non-Current Assets": number;
  "Current Liabilities": number;
  "Non-Current Liabilities": number;
  "Total Equity": number;
  "Net Cash from Operating Activities": number;
  "Net Cash Used in Investing Activities": number;
  "Capital Expenditure (CAPEX)": number;
  "GDP change": number;
  "ccpi change": number;
  "Dividends Paid": number;
  FIRM: string;
}

export interface HistoricalDividendData {
  success: boolean;
  firm: string;
  records: HistoricalRecord[];
  count: number;
  start_year: number;
  end_year: number;
  message: string;
  error: string | null;
}

export const fetchHistoricalDividendData = async (symbol: string): Promise<HistoricalDividendData> => {
  try {
    const response = await fetch(`${API_BASE_URL}history?firm=${encodeURIComponent(symbol)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Historical data response:', responseData);
    
    // Extract the data from the response wrapper
    const data = responseData.data || responseData;
    return data as HistoricalDividendData;
  } catch (error) {
    console.error('Error fetching historical data from backend:', error);
    throw error;
  }
};
