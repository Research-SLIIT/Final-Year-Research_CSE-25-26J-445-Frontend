import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PredictionDashboard from "@/components/dividend/PredictionDashboard";
import { mockDividendResult, mockLowProbabilityDividendResult } from "@/tests/fixtures/dividend.fixture";

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <svg>{children}</svg>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

// Mock llm_exp API
vi.mock("@/lib/api/dividend_api", () => ({
  llm_exp: vi.fn(),
}));

import { llm_exp } from "@/lib/api/dividend_api";
const mockLlmExp = vi.mocked(llm_exp);

beforeEach(() => {
  mockLlmExp.mockReset();
  // Default: llm_exp resolves with mock data
  mockLlmExp.mockResolvedValue({ data: null });
});

const defaultProps = {
  data: mockDividendResult.data,
  firm: "AAF",
  year: 2025,
  glossary: {},
};

describe("PredictionDashboard", () => {
  it("renders probability value from data.prediction.probability", async () => {
    mockLlmExp.mockResolvedValueOnce({ data: null });
    render(<PredictionDashboard {...defaultProps} />);
    // probability: 0.75 → displayed as percentage ~75%
    await waitFor(() => {
      expect(screen.getByText(/75/)).toBeInTheDocument();
    });
  });

  it("renders 'Very Safe' risk band when probability < 0.2", async () => {
    render(<PredictionDashboard {...defaultProps} data={mockLowProbabilityDividendResult.data} />);
    await waitFor(() => {
      const matches = screen.getAllByText("Very Safe");
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it("renders 'Very High' risk band when probability >= 0.7", async () => {
    const highRiskData = {
      ...mockDividendResult.data,
      prediction: { ...mockDividendResult.data.prediction, probability: 0.75 },
    };
    render(<PredictionDashboard {...defaultProps} data={highRiskData} />);
    await waitFor(() => {
      const matches = screen.getAllByText("Very High");
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it("renders 'Dividend decrease Probability' label", async () => {
    render(<PredictionDashboard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Dividend decrease Probability")).toBeInTheDocument();
    });
  });

  it("calls llm_exp with correct firm on mount", async () => {
    render(<PredictionDashboard {...defaultProps} firm="LOLC" />);
    await waitFor(() => {
      expect(mockLlmExp).toHaveBeenCalledWith("LOLC");
    });
  });

  it("does not crash when llm_exp rejects", async () => {
    mockLlmExp.mockRejectedValueOnce(new Error("LLM service unavailable"));
    // Should not throw
    expect(() => render(<PredictionDashboard {...defaultProps} />)).not.toThrow();
    // Component should still render core content
    await waitFor(() => {
      expect(screen.getByText(/75/)).toBeInTheDocument();
    });
  });

  it("renders llm explanation section when llm_exp resolves with data", async () => {
    const llmData = {
      data: {
        predicted_cut_percentage: "25%",
        confidence_level: "HIGH",
        explanation: "Strong ROA drives positive dividend outlook.",
      },
    };
    mockLlmExp.mockResolvedValueOnce(llmData);
    render(<PredictionDashboard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("25%")).toBeInTheDocument();
    });
  });
});
