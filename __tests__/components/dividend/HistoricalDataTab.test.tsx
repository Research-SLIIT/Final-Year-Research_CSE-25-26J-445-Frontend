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

// The company picker is gone — the tab renders whatever symbol the route gives it.
const defaultProps = {
  loading: false,
  symbol: "",
  historicalData: null,
  selectedMetrics: new Set(["Revenue", "EBIT"]),
  onFetchData: vi.fn(),
  onMetricToggle: vi.fn(),
};

describe("HistoricalDataTab", () => {
  it("names the company it is showing", () => {
    render(<HistoricalDataTab {...defaultProps} symbol="AAF" />);
    expect(screen.getAllByText("AAF").length).toBeGreaterThan(0);
  });

  it("renders 'Refresh data' button", () => {
    render(<HistoricalDataTab {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Refresh data/i })).toBeInTheDocument();
  });

  it("button is disabled when no symbol is provided", () => {
    render(<HistoricalDataTab {...defaultProps} symbol="" />);
    expect(screen.getByRole("button", { name: /Refresh data/i })).toBeDisabled();
  });

  it("button is disabled when loading is true", () => {
    render(<HistoricalDataTab {...defaultProps} loading={true} symbol="AAF" />);
    expect(screen.getByRole("button", { name: /Loading Historical Data.../i })).toBeDisabled();
  });

  it("button shows loading text when loading", () => {
    render(<HistoricalDataTab {...defaultProps} loading={true} symbol="AAF" />);
    expect(screen.getByText("Loading Historical Data...")).toBeInTheDocument();
  });

  it("calls onFetchData on button click", () => {
    const onFetchData = vi.fn();
    render(<HistoricalDataTab {...defaultProps} symbol="AAF" onFetchData={onFetchData} />);
    fireEvent.click(screen.getByRole("button", { name: /Refresh data/i }));
    expect(onFetchData).toHaveBeenCalledOnce();
  });

  it("shows no table when historicalData is null", () => {
    render(<HistoricalDataTab {...defaultProps} historicalData={null} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows data table when historicalData has records", () => {
    render(<HistoricalDataTab {...defaultProps} symbol="AAF" historicalData={mockHistoricalDividendData} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders Year column header", () => {
    render(<HistoricalDataTab {...defaultProps} symbol="AAF" historicalData={mockHistoricalDividendData} />);
    expect(screen.getByText("Year")).toBeInTheDocument();
  });

  it("renders Revenue column header", () => {
    render(<HistoricalDataTab {...defaultProps} symbol="AAF" historicalData={mockHistoricalDividendData} />);
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
    render(<HistoricalDataTab {...defaultProps} symbol="AAF" historicalData={dataWithZeroDividend} />);
    expect(screen.getByText("No dividend")).toBeInTheDocument();
  });

  it("renders metric toggle checkboxes", () => {
    render(<HistoricalDataTab {...defaultProps} symbol="AAF" historicalData={mockHistoricalDividendData} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("calls onMetricToggle when a metric checkbox is clicked", () => {
    const onMetricToggle = vi.fn();
    render(
      <HistoricalDataTab
        {...defaultProps}
        symbol="AAF"
        historicalData={mockHistoricalDividendData}
        onMetricToggle={onMetricToggle}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onMetricToggle).toHaveBeenCalled();
  });
});
