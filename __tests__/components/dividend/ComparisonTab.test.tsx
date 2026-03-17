import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComparisonTab } from "@/components/dividend/ComparisonTab";
import { mockHistoricalDividendData } from "@/tests/fixtures/dividend.fixture";

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <svg>{children}</svg>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// Mock TickerSearchDIV
vi.mock("@/components/ticker-search_div", () => ({
  TickerSearchDIV: ({ onSelect, placeholder, value }: any) => (
    <input
      data-testid={`ticker-${placeholder}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onSelect({ symbol: e.target.value })}
    />
  ),
}));

const mockData2 = {
  ...mockHistoricalDividendData,
  firm: "LOLC",
  records: [
    {
      ...mockHistoricalDividendData.records[0],
      FIRM: "LOLC",
      Revenue: 2000000,
      "Profit After Tax": 200000,
      "Dividends Paid": 80000,
      "Total Equity": 1500000,
      "Current Liabilities": 400000,
      "Non-Current Liabilities": 500000,
    },
  ],
};

const defaultProps = {
  loading: false,
  compareSymbol1: "",
  compareSymbol2: "",
  comparisonData1: null,
  comparisonData2: null,
  comparisonSelectedMetric: "Revenue",
  onSymbol1Change: vi.fn(),
  onSymbol2Change: vi.fn(),
  onFetchComparison: vi.fn(),
  onMetricSelect: vi.fn(),
  getLastDividendPaymentYear: vi.fn().mockReturnValue(2023),
  calculateDividendStreak: vi.fn().mockReturnValue(3),
  calculateDividendSustainabilityScore: vi.fn().mockReturnValue(72),
};

describe("ComparisonTab", () => {
  it("renders two ticker search inputs", () => {
    render(<ComparisonTab {...defaultProps} />);
    const inputs = screen.getAllByTestId(/^ticker-/);
    expect(inputs).toHaveLength(2);
  });

  it("renders 'Compare Firms' button", () => {
    render(<ComparisonTab {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Compare Firms/i })).toBeInTheDocument();
  });

  it("button is disabled when both symbols are empty", () => {
    render(<ComparisonTab {...defaultProps} compareSymbol1="" compareSymbol2="" />);
    expect(screen.getByRole("button", { name: /Compare Firms/i })).toBeDisabled();
  });

  it("button is disabled when one symbol is empty", () => {
    render(<ComparisonTab {...defaultProps} compareSymbol1="AAF" compareSymbol2="" />);
    expect(screen.getByRole("button", { name: /Compare Firms/i })).toBeDisabled();
  });

  it("button is disabled when loading is true", () => {
    render(<ComparisonTab {...defaultProps} loading={true} compareSymbol1="AAF" compareSymbol2="LOLC" />);
    expect(screen.getByRole("button", { name: /Loading Comparison.../i })).toBeDisabled();
  });

  it("calls onFetchComparison on button click when both symbols set", () => {
    const onFetchComparison = vi.fn();
    render(
      <ComparisonTab
        {...defaultProps}
        compareSymbol1="AAF"
        compareSymbol2="LOLC"
        onFetchComparison={onFetchComparison}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Compare Firms/i }));
    expect(onFetchComparison).toHaveBeenCalledOnce();
  });

  it("shows empty state when both comparisonData are null", () => {
    render(<ComparisonTab {...defaultProps} comparisonData1={null} comparisonData2={null} />);
    expect(screen.getByText(/Select two firms/i)).toBeInTheDocument();
  });

  it("renders metric selector buttons when data is provided", () => {
    render(
      <ComparisonTab
        {...defaultProps}
        compareSymbol1="AAF"
        compareSymbol2="LOLC"
        comparisonData1={mockHistoricalDividendData}
        comparisonData2={mockData2}
      />
    );
    expect(screen.getByRole("button", { name: "Profit Margin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EBIT Margin" })).toBeInTheDocument();
  });

  it("calls onMetricSelect when a metric button is clicked", () => {
    const onMetricSelect = vi.fn();
    render(
      <ComparisonTab
        {...defaultProps}
        compareSymbol1="AAF"
        compareSymbol2="LOLC"
        comparisonData1={mockHistoricalDividendData}
        comparisonData2={mockData2}
        onMetricSelect={onMetricSelect}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "EBIT Margin" }));
    expect(onMetricSelect).toHaveBeenCalledWith("EBIT");
  });

  it("renders firm names in summary section when data is provided", () => {
    render(
      <ComparisonTab
        {...defaultProps}
        compareSymbol1="AAF"
        compareSymbol2="LOLC"
        comparisonData1={mockHistoricalDividendData}
        comparisonData2={mockData2}
      />
    );
    expect(screen.getByText("AAF")).toBeInTheDocument();
    expect(screen.getByText("LOLC")).toBeInTheDocument();
  });

  it("calls getLastDividendPaymentYear with the data", () => {
    const getLastDividendPaymentYear = vi.fn().mockReturnValue(2023);
    render(
      <ComparisonTab
        {...defaultProps}
        compareSymbol1="AAF"
        compareSymbol2="LOLC"
        comparisonData1={mockHistoricalDividendData}
        comparisonData2={mockData2}
        getLastDividendPaymentYear={getLastDividendPaymentYear}
      />
    );
    expect(getLastDividendPaymentYear).toHaveBeenCalled();
  });

  it("calls calculateDividendStreak with the data", () => {
    const calculateDividendStreak = vi.fn().mockReturnValue(3);
    render(
      <ComparisonTab
        {...defaultProps}
        compareSymbol1="AAF"
        compareSymbol2="LOLC"
        comparisonData1={mockHistoricalDividendData}
        comparisonData2={mockData2}
        calculateDividendStreak={calculateDividendStreak}
      />
    );
    expect(calculateDividendStreak).toHaveBeenCalled();
  });

  it("calls calculateDividendSustainabilityScore with the data", () => {
    const calculateDividendSustainabilityScore = vi.fn().mockReturnValue(72);
    render(
      <ComparisonTab
        {...defaultProps}
        compareSymbol1="AAF"
        compareSymbol2="LOLC"
        comparisonData1={mockHistoricalDividendData}
        comparisonData2={mockData2}
        calculateDividendSustainabilityScore={calculateDividendSustainabilityScore}
      />
    );
    expect(calculateDividendSustainabilityScore).toHaveBeenCalled();
  });
});
