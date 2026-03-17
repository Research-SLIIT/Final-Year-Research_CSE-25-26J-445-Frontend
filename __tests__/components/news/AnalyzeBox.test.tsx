import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnalyzeBox from "@/components/news/AnalyzeBox";
import { usePredictStore } from "@/stores/usePredictStore";
import { useRiskStore } from "@/stores/useRiskStore";
import { useDividendStore } from "@/stores/useDividendStore";
import { mockAnalyzeResponse } from "@/tests/fixtures/sentiment.fixture";

// Shared mock push function — must be declared before vi.mock()
const mockPush = vi.fn();

// Mock API modules
vi.mock("@/lib/sentimentApi", () => ({
  analyzeNews: vi.fn(),
}));

vi.mock("@/lib/api/market-data.api", () => ({
  fetchTradeSummary: vi.fn().mockResolvedValue([]),
}));

// Override navigation mock with shared push reference
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import { analyzeNews } from "@/lib/sentimentApi";
const mockAnalyzeNews = vi.mocked(analyzeNews);

beforeEach(() => {
  mockAnalyzeNews.mockReset();
  mockPush.mockReset();
  // Reset stores
  usePredictStore.setState({ inputs: { symbol: "" }, output: null, loading: false, error: null });
  useRiskStore.setState({ inputs: { symbol: "", dateRange: { start: "", end: "" }, riskProfile: "Basic" }, results: null, loading: false, error: null });
  useDividendStore.setState({ inputs: { symbol: "" }, results: null, loading: false, error: null });
});

describe("AnalyzeBox", () => {
  it("renders the 'Analyze News' button", () => {
    render(<AnalyzeBox />);
    expect(screen.getByRole("button", { name: /Analyze News/i })).toBeInTheDocument();
  });

  it("renders the textarea with placeholder", () => {
    render(<AnalyzeBox />);
    expect(screen.getByPlaceholderText("Paste news content here...")).toBeInTheDocument();
  });

  it("button is disabled when textarea is empty", () => {
    render(<AnalyzeBox />);
    const button = screen.getByRole("button", { name: /Analyze News/i });
    expect(button).toBeDisabled();
  });

  it("button becomes enabled when user types in textarea", async () => {
    const user = userEvent.setup();
    render(<AnalyzeBox />);
    const textarea = screen.getByPlaceholderText("Paste news content here...");
    await user.type(textarea, "AAF reports strong growth");
    const button = screen.getByRole("button", { name: /Analyze News/i });
    expect(button).not.toBeDisabled();
  });

  it("calls analyzeNews with the textarea content on button click", async () => {
    const user = userEvent.setup();
    mockAnalyzeNews.mockResolvedValueOnce({ ...mockAnalyzeResponse, identified_companies: [] } as any);
    render(<AnalyzeBox />);
    const textarea = screen.getByPlaceholderText("Paste news content here...");
    await user.type(textarea, "AAF reports strong profits");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    expect(mockAnalyzeNews).toHaveBeenCalledWith("AAF reports strong profits");
  });

  it("shows 'Analyzing...' text on button while loading", async () => {
    const user = userEvent.setup();
    // Make analyzeNews hang (never resolves immediately)
    mockAnalyzeNews.mockImplementationOnce(() => new Promise(() => {}));
    render(<AnalyzeBox />);
    const textarea = screen.getByPlaceholderText("Paste news content here...");
    await user.type(textarea, "test news");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    expect(screen.getByRole("button", { name: /Analyzing.../i })).toBeInTheDocument();
  });

  it("shows error message when analyzeNews throws", async () => {
    const user = userEvent.setup();
    mockAnalyzeNews.mockRejectedValueOnce(new Error("API error"));
    render(<AnalyzeBox />);
    await user.type(screen.getByPlaceholderText("Paste news content here..."), "test");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    await waitFor(() => {
      expect(screen.getByText(/Failed to analyze news/i)).toBeInTheDocument();
    });
  });

  it("renders AITerminalStream (terminal card) while loading", async () => {
    const user = userEvent.setup();
    mockAnalyzeNews.mockImplementationOnce(() => new Promise(() => {}));
    render(<AnalyzeBox />);
    await user.type(screen.getByPlaceholderText("Paste news content here..."), "test");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    expect(screen.getByText(/sentiment_engine_v2.log/i)).toBeInTheDocument();
  });

  it("renders AnalysisBreakdown after successful analysis with explanation", async () => {
    const user = userEvent.setup();
    mockAnalyzeNews.mockResolvedValueOnce({ ...mockAnalyzeResponse, identified_companies: [] } as any);
    render(<AnalyzeBox />);
    await user.type(screen.getByPlaceholderText("Paste news content here..."), "test");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    await waitFor(() => {
      expect(screen.getByText("Market Impact Detection")).toBeInTheDocument();
    });
  });

  it("does not render AnalysisBreakdown when analysis has no explanation field", async () => {
    const user = userEvent.setup();
    const noExplanation = { ...mockAnalyzeResponse, explanation: undefined, identified_companies: [] };
    mockAnalyzeNews.mockResolvedValueOnce(noExplanation as any);
    render(<AnalyzeBox />);
    await user.type(screen.getByPlaceholderText("Paste news content here..."), "test");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    await waitFor(() => {
      expect(screen.queryByText("Market Impact Detection")).not.toBeInTheDocument();
    });
  });

  it("renders impact and direction values from analysis result", async () => {
    const user = userEvent.setup();
    mockAnalyzeNews.mockResolvedValueOnce({ ...mockAnalyzeResponse, identified_companies: [] } as any);
    render(<AnalyzeBox />);
    await user.type(screen.getByPlaceholderText("Paste news content here..."), "test");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    await waitFor(() => {
      expect(screen.getByText("Impact")).toBeInTheDocument();
      expect(screen.getByText("Direction")).toBeInTheDocument();
    });
  });

  it("sets usePredictStore symbol and navigates to /predict on Price Prediction click", async () => {
    const user = userEvent.setup();
    const analysisWithCompany = {
      ...mockAnalyzeResponse,
      identified_companies: [
        { company_name: "AAF Ltd", ticker: "AAF.N0000", matched_entity: "AAF", confidence: 92 },
      ],
    };
    mockAnalyzeNews.mockResolvedValueOnce(analysisWithCompany as any);

    render(<AnalyzeBox />);
    await user.type(screen.getByPlaceholderText("Paste news content here..."), "test");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    await waitFor(() => screen.getByText("Price Prediction"));

    await user.click(screen.getByText("Price Prediction"));
    expect(usePredictStore.getState().inputs.symbol).toBe("AAF.N0000");
    expect(mockPush).toHaveBeenCalledWith("/predict");
  });

  it("sets useRiskStore symbol and navigates to /risk on Risk Analysis click", async () => {
    const user = userEvent.setup();
    const analysisWithCompany = {
      ...mockAnalyzeResponse,
      identified_companies: [
        { company_name: "AAF Ltd", ticker: "AAF", matched_entity: "AAF", confidence: 90 },
      ],
    };
    mockAnalyzeNews.mockResolvedValueOnce(analysisWithCompany as any);

    render(<AnalyzeBox />);
    await user.type(screen.getByPlaceholderText("Paste news content here..."), "test");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    await waitFor(() => screen.getByText("Risk Analysis"));

    await user.click(screen.getByText("Risk Analysis"));
    expect(useRiskStore.getState().inputs.symbol).toBe("AAF");
    expect(mockPush).toHaveBeenCalledWith("/risk");
  });

  it("sets useDividendStore symbol and navigates to /dividend on Dividend Prediction click", async () => {
    const user = userEvent.setup();
    const analysisWithCompany = {
      ...mockAnalyzeResponse,
      identified_companies: [
        { company_name: "AAF Ltd", ticker: "AAF", matched_entity: "AAF", confidence: 90 },
      ],
    };
    mockAnalyzeNews.mockResolvedValueOnce(analysisWithCompany as any);

    render(<AnalyzeBox />);
    await user.type(screen.getByPlaceholderText("Paste news content here..."), "test");
    await user.click(screen.getByRole("button", { name: /Analyze News/i }));
    await waitFor(() => screen.getByText("Dividend Prediction"));

    await user.click(screen.getByText("Dividend Prediction"));
    expect(useDividendStore.getState().inputs.symbol).toBe("AAF");
    expect(mockPush).toHaveBeenCalledWith("/dividend");
  });
});
