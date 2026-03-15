import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DividendPredictionTab } from "@/components/dividend/DividendPredictionTab";
import { mockDividendResult } from "@/tests/fixtures/dividend.fixture";

// Mock PredictionDashboard to avoid llm_exp API calls in this test suite
vi.mock("@/components/dividend/PredictionDashboard", () => ({
  default: ({ data }: any) => (
    <div data-testid="prediction-dashboard">
      Probability: {data.prediction.probability}
    </div>
  ),
}));

// Mock TickerSearchDIV to simplify testing
vi.mock("@/components/ticker-search_div", () => ({
  TickerSearchDIV: ({ onSelect, value, placeholder }: any) => (
    <input
      data-testid="ticker-search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onSelect({ symbol: e.target.value })}
    />
  ),
}));

const defaultProps = {
  loading: false,
  inputs: { symbol: "" },
  results: null,
  glossary: {},
  onSearch: vi.fn(),
  onPredict: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DividendPredictionTab", () => {
  it("renders the 'Stock Selection' label", () => {
    render(<DividendPredictionTab {...defaultProps} />);
    expect(screen.getByText("Stock Selection")).toBeInTheDocument();
  });

  it("renders the 'Analyze Dividend' button", () => {
    render(<DividendPredictionTab {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Analyze Dividend/i })).toBeInTheDocument();
  });

  it("button is disabled when inputs.symbol is empty string", () => {
    render(<DividendPredictionTab {...defaultProps} inputs={{ symbol: "" }} />);
    expect(screen.getByRole("button", { name: /Analyze Dividend/i })).toBeDisabled();
  });

  it("button is disabled when loading is true", () => {
    render(<DividendPredictionTab {...defaultProps} inputs={{ symbol: "AAF" }} loading={true} />);
    expect(screen.getByRole("button", { name: /Analyzing Dividend.../i })).toBeDisabled();
  });

  it("button label changes to 'Analyzing Dividend...' when loading", () => {
    render(<DividendPredictionTab {...defaultProps} inputs={{ symbol: "AAF" }} loading={true} />);
    expect(screen.getByText("Analyzing Dividend...")).toBeInTheDocument();
  });

  it("button is enabled when a symbol is provided and not loading", () => {
    render(<DividendPredictionTab {...defaultProps} inputs={{ symbol: "AAF" }} />);
    expect(screen.getByRole("button", { name: /Analyze Dividend/i })).not.toBeDisabled();
  });

  it("calls onPredict when Analyze Dividend button is clicked", async () => {
    const user = userEvent.setup();
    const onPredict = vi.fn();
    render(<DividendPredictionTab {...defaultProps} inputs={{ symbol: "AAF" }} onPredict={onPredict} />);
    await user.click(screen.getByRole("button", { name: /Analyze Dividend/i }));
    expect(onPredict).toHaveBeenCalledOnce();
  });

  it("calls onSearch when user changes ticker search input", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<DividendPredictionTab {...defaultProps} onSearch={onSearch} />);
    await user.type(screen.getByTestId("ticker-search"), "AAF");
    expect(onSearch).toHaveBeenCalled();
  });

  it("shows PredictionDashboard when results are provided", () => {
    render(
      <DividendPredictionTab
        {...defaultProps}
        inputs={{ symbol: "AAF" }}
        results={mockDividendResult}
      />
    );
    expect(screen.getByTestId("prediction-dashboard")).toBeInTheDocument();
  });

  it("shows empty state card when results is null and loading is false", () => {
    render(<DividendPredictionTab {...defaultProps} />);
    expect(screen.getByText(/Select a stock and run the analysis/i)).toBeInTheDocument();
  });

  it("does not show empty state when loading is true", () => {
    render(<DividendPredictionTab {...defaultProps} loading={true} />);
    expect(screen.queryByText(/Select a stock and run the analysis/i)).not.toBeInTheDocument();
  });
});
