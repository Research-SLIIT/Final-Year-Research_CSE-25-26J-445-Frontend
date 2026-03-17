import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricRow } from "@/components/analysis/MetricRow";

describe("MetricRow", () => {
  it("renders the label text", () => {
    render(<MetricRow label="Sharpe Ratio" value={1.23} />);
    expect(screen.getByText("Sharpe Ratio")).toBeInTheDocument();
  });

  it("formats number value to 2 decimal places", () => {
    render(<MetricRow label="Beta" value={1.5678} />);
    expect(screen.getByText("1.57")).toBeInTheDocument();
  });

  it("renders string value unchanged", () => {
    render(<MetricRow label="Zone" value="Safe Zone" />);
    expect(screen.getByText("Safe Zone")).toBeInTheDocument();
  });

  it("renders both label and value in DOM", () => {
    render(<MetricRow label="VaR" value={0.05} />);
    expect(screen.getByText("VaR")).toBeInTheDocument();
    expect(screen.getByText("0.05")).toBeInTheDocument();
  });

  it("handles zero value correctly", () => {
    render(<MetricRow label="Drawdown" value={0} />);
    expect(screen.getByText("0.00")).toBeInTheDocument();
  });
});
