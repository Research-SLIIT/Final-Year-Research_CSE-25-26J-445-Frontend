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

// The tab no longer owns a company picker — the symbol comes from the route,
// so there is nothing left here to mock.
const defaultProps = {
  loading: false,
  symbol: "",
  results: null,
  glossary: {},
  onPredict: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DividendPredictionTab", () => {
  it("names the company it is analysing", () => {
    render(<DividendPredictionTab {...defaultProps} symbol="AAF" />);
    expect(screen.getAllByText("AAF").length).toBeGreaterThan(0);
  });

  it("renders the re-run button", () => {
    render(<DividendPredictionTab {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Re-run analysis/i })).toBeInTheDocument();
  });

  it("button is disabled when no symbol is provided", () => {
    render(<DividendPredictionTab {...defaultProps} symbol="" />);
    expect(screen.getByRole("button", { name: /Re-run analysis/i })).toBeDisabled();
  });

  it("button is disabled when loading is true", () => {
    render(<DividendPredictionTab {...defaultProps} symbol="AAF" loading={true} />);
    expect(screen.getByRole("button", { name: /Analyzing Dividend.../i })).toBeDisabled();
  });

  it("button label changes to 'Analyzing Dividend...' when loading", () => {
    render(<DividendPredictionTab {...defaultProps} symbol="AAF" loading={true} />);
    expect(screen.getByText("Analyzing Dividend...")).toBeInTheDocument();
  });

  it("button is enabled when a symbol is provided and not loading", () => {
    render(<DividendPredictionTab {...defaultProps} symbol="AAF" />);
    expect(screen.getByRole("button", { name: /Re-run analysis/i })).not.toBeDisabled();
  });

  it("calls onPredict when the re-run button is clicked", async () => {
    const user = userEvent.setup();
    const onPredict = vi.fn();
    render(<DividendPredictionTab {...defaultProps} symbol="AAF" onPredict={onPredict} />);
    await user.click(screen.getByRole("button", { name: /Re-run analysis/i }));
    expect(onPredict).toHaveBeenCalledOnce();
  });

  it("shows PredictionDashboard when results are provided", () => {
    render(
      <DividendPredictionTab
        {...defaultProps}
        symbol="AAF"
        results={mockDividendResult}
      />
    );
    expect(screen.getByTestId("prediction-dashboard")).toBeInTheDocument();
  });

  it("shows empty state card when results is null and loading is false", () => {
    render(<DividendPredictionTab {...defaultProps} symbol="AAF" />);
    expect(screen.getByText(/No dividend prediction available/i)).toBeInTheDocument();
  });

  it("does not show empty state when loading is true", () => {
    render(<DividendPredictionTab {...defaultProps} symbol="AAF" loading={true} />);
    expect(screen.queryByText(/No dividend prediction available/i)).not.toBeInTheDocument();
  });
});
