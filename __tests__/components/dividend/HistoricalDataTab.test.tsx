import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HistoricalDataTab } from "@/components/dividend/HistoricalDataTab";
import { mockHistoricalDividendData } from "@/tests/fixtures/dividend.fixture";

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <svg>{children}</svg>,
  Line: () => null,
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
      data-testid="ticker-search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onSelect({ symbol: e.target.value })}
      readOnly={false}
    />
  ),
}));

const defaultProps = {
  loading: false,
  inputs: { symbol: "" },
  historicalData: null,
  selectedMetrics: new Set(["Revenue", "EBIT"]),
  onSearch: vi.fn(),
  onFetchData: vi.fn(),
  onMetricToggle: vi.fn(),
};

describe("HistoricalDataTab", () => {
  it("renders 'Stock Selection' label", () => {
    render(<HistoricalDataTab {...defaultProps} />);
    expect(screen.getByText("Stock Selection")).toBeInTheDocument();
  });

  it("renders 'Fetch Historical Data' button", () => {
    render(<HistoricalDataTab {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Fetch Historical Data/i })).toBeInTheDocument();
  });

  it("button is disabled when inputs.symbol is empty", () => {
    render(<HistoricalDataTab {...defaultProps} inputs={{ symbol: "" }} />);
    expect(screen.getByRole("button", { name: /Fetch Historical Data/i })).toBeDisabled();
  });

  it("button is disabled when loading is true", () => {
    render(<HistoricalDataTab {...defaultProps} loading={true} inputs={{ symbol: "AAF" }} />);
    expect(screen.getByRole("button", { name: /Loading Historical Data.../i })).toBeDisabled();
  });

  it("button shows loading text when loading", () => {
    render(<HistoricalDataTab {...defaultProps} loading={true} inputs={{ symbol: "AAF" }} />);
    expect(screen.getByText("Loading Historical Data...")).toBeInTheDocument();
  });

  it("calls onFetchData on button click", () => {
    const onFetchData = vi.fn();
    render(<HistoricalDataTab {...defaultProps} inputs={{ symbol: "AAF" }} onFetchData={onFetchData} />);
    fireEvent.click(screen.getByRole("button", { name: /Fetch Historical Data/i }));
    expect(onFetchData).toHaveBeenCalledOnce();
  });

  it("calls onSearch when ticker input changes", () => {
    const onSearch = vi.fn();
    render(<HistoricalDataTab {...defaultProps} onSearch={onSearch} />);
    fireEvent.change(screen.getByTestId("ticker-search"), { target: { value: "AAF" } });
    expect(onSearch).toHaveBeenCalled();
  });

  it("shows empty state card when historicalData is null", () => {
    render(<HistoricalDataTab {...defaultProps} historicalData={null} />);
    // No table rendered; the stock selection card should still be shown
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows data table when historicalData has records", () => {
    render(<HistoricalDataTab {...defaultProps} inputs={{ symbol: "AAF" }} historicalData={mockHistoricalDividendData} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders Year column header", () => {
    render(<HistoricalDataTab {...defaultProps} inputs={{ symbol: "AAF" }} historicalData={mockHistoricalDividendData} />);
    expect(screen.getByText("Year")).toBeInTheDocument();
  });

  it("renders Revenue column header", () => {
    render(<HistoricalDataTab {...defaultProps} inputs={{ symbol: "AAF" }} historicalData={mockHistoricalDividendData} />);
    const matches = screen.getAllByText("Revenue");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders 'No dividend' for zero Dividends Paid", () => {
    const dataWithZeroDividend = {
      ...mockHistoricalDividendData,
      records: [
        { ...mockHistoricalDividendData.records[0], "Dividends Paid": 0 },
      ],
    };
    render(<HistoricalDataTab {...defaultProps} inputs={{ symbol: "AAF" }} historicalData={dataWithZeroDividend} />);
    expect(screen.getByText("No dividend")).toBeInTheDocument();
  });

  it("renders metric toggle checkboxes", () => {
    render(<HistoricalDataTab {...defaultProps} inputs={{ symbol: "AAF" }} historicalData={mockHistoricalDividendData} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("calls onMetricToggle when a metric checkbox is clicked", () => {
    const onMetricToggle = vi.fn();
    render(
      <HistoricalDataTab
        {...defaultProps}
        inputs={{ symbol: "AAF" }}
        historicalData={mockHistoricalDividendData}
        onMetricToggle={onMetricToggle}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onMetricToggle).toHaveBeenCalled();
  });
});
