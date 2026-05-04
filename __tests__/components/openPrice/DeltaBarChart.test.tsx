import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeltaBarChart } from "@/components/delta-bar-chart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  BarChart: ({ data, children }: any) => (
    <div data-testid="bar-chart" data-count={data?.length}>
      {children}
    </div>
  ),
  Bar: ({ dataKey }: any) => <div data-testid="bar" data-key={dataKey} />,
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockDeltaData = [
  { day: 1, deltaPrice: 2.5, deltaPct: 1.5 },
  { day: 2, deltaPrice: -1.0, deltaPct: -0.6 },
  { day: 3, deltaPrice: 3.2, deltaPct: 1.9 },
  { day: 4, deltaPrice: 0.5, deltaPct: 0.3 },
  { day: 5, deltaPrice: -2.1, deltaPct: -1.2 },
];

describe("DeltaBarChart", () => {
  it("renders the chart container", () => {
    render(<DeltaBarChart deltaData={mockDeltaData} />);
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
  });

  it("renders a BarChart with the correct number of data points", () => {
    render(<DeltaBarChart deltaData={mockDeltaData} />);
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-count", "5");
  });

  it("renders the Bar with 'delta' dataKey", () => {
    render(<DeltaBarChart deltaData={mockDeltaData} />);
    expect(screen.getByTestId("bar")).toHaveAttribute("data-key", "delta");
  });

  it("renders XAxis with 'day' dataKey", () => {
    render(<DeltaBarChart deltaData={mockDeltaData} />);
    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-key", "day");
  });

  it("renders with empty deltaData without crashing", () => {
    render(<DeltaBarChart deltaData={[]} />);
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-count", "0");
  });

  it("renders a single data point without crashing", () => {
    render(<DeltaBarChart deltaData={[{ day: 1, deltaPrice: 5.0, deltaPct: 2.5 }]} />);
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-count", "1");
  });

  it("renders the YAxis", () => {
    render(<DeltaBarChart deltaData={mockDeltaData} />);
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
  });

  it("renders the Tooltip", () => {
    render(<DeltaBarChart deltaData={mockDeltaData} />);
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
  });
});
