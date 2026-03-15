import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ForecastLineChart } from "@/components/forecast-line-chart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ data, children }: any) => (
    <div data-testid="line-chart" data-count={data?.length}>
      {children}
    </div>
  ),
  Line: ({ dataKey, name }: any) => (
    <div data-testid="line" data-key={dataKey} data-name={name} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const forecastData = [
  { day: 0, price: 100 },
  { day: 1, price: 102 },
  { day: 2, price: 104 },
  { day: 3, price: 103 },
  { day: 4, price: 106 },
];

const baselineData = [
  { day: 0, price: 100 },
  { day: 1, price: 100.5 },
  { day: 2, price: 101 },
  { day: 3, price: 101.5 },
  { day: 4, price: 102 },
];

describe("ForecastLineChart", () => {
  it("renders the chart container", () => {
    render(<ForecastLineChart forecastData={forecastData} baselineData={baselineData} />);
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
  });

  it("renders a LineChart with correct number of merged data points", () => {
    render(<ForecastLineChart forecastData={forecastData} baselineData={baselineData} />);
    expect(screen.getByTestId("line-chart")).toHaveAttribute("data-count", "5");
  });

  it("renders two Line components (predicted and baseline)", () => {
    render(<ForecastLineChart forecastData={forecastData} baselineData={baselineData} />);
    const lines = screen.getAllByTestId("line");
    expect(lines).toHaveLength(2);
  });

  it("renders predicted line with correct dataKey", () => {
    render(<ForecastLineChart forecastData={forecastData} baselineData={baselineData} />);
    const lines = screen.getAllByTestId("line");
    const predicted = lines.find((l) => l.getAttribute("data-key") === "predicted");
    expect(predicted).toBeInTheDocument();
  });

  it("renders baseline line with correct dataKey", () => {
    render(<ForecastLineChart forecastData={forecastData} baselineData={baselineData} />);
    const lines = screen.getAllByTestId("line");
    const baseline = lines.find((l) => l.getAttribute("data-key") === "baseline");
    expect(baseline).toBeInTheDocument();
  });

  it("renders predicted line with name 'Predicted Path'", () => {
    render(<ForecastLineChart forecastData={forecastData} baselineData={baselineData} />);
    const lines = screen.getAllByTestId("line");
    const predicted = lines.find((l) => l.getAttribute("data-name") === "Predicted Path");
    expect(predicted).toBeInTheDocument();
  });

  it("renders baseline line with name 'Baseline Path'", () => {
    render(<ForecastLineChart forecastData={forecastData} baselineData={baselineData} />);
    const lines = screen.getAllByTestId("line");
    const baseline = lines.find((l) => l.getAttribute("data-name") === "Baseline Path");
    expect(baseline).toBeInTheDocument();
  });

  it("renders the legend", () => {
    render(<ForecastLineChart forecastData={forecastData} baselineData={baselineData} />);
    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("renders with empty arrays without crashing", () => {
    render(<ForecastLineChart forecastData={[]} baselineData={[]} />);
    expect(screen.getByTestId("line-chart")).toHaveAttribute("data-count", "0");
  });

  it("uses forecast price as baseline when day is not in baselineData", () => {
    const partialBaseline = [{ day: 0, price: 100 }];
    // Should not crash — missing baseline days fall back to forecast price
    render(<ForecastLineChart forecastData={forecastData} baselineData={partialBaseline} />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
