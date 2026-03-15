import type { ProgressEvent } from "@/hooks/use-analysis-stream";

export const sseProcessingStream: ProgressEvent[] = [
  { step: 1, total: 3, message: "Fetching company data...", status: "processing" },
  { step: 1, total: 3, message: "Fetching company data... done", status: "step-done" },
  { step: 2, total: 3, message: "Running ML model...", status: "processing" },
  { step: 2, total: 3, message: "Running ML model... done", status: "step-done" },
  { step: 3, total: 3, message: "Generating report...", status: "processing" },
  { step: 3, total: 3, message: "Analysis complete", status: "completed", result: { zone: "Safe" } },
];

export const sseErrorStream: ProgressEvent[] = [
  { step: 1, total: 3, message: "Fetching company data...", status: "processing" },
  { step: 1, total: 3, message: "Failed to fetch data", status: "error" },
];

export const mockFinancialHealthResult = {
  symbol: "AAF",
  reportInfo: {
    companyName: "AAF Ltd",
    reportDate: "2025-01-01",
    period: "Annual",
  },
  prediction: {
    zone: "Safe",
    zScore: 3.2,
  },
  riskAssessment: {
    zone: "Safe",
    description: "Company is financially healthy",
  },
  extractedData: {},
  explanation: {},
};
