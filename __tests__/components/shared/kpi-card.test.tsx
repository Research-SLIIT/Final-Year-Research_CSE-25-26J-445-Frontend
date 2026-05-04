import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "@/components/kpi-card";

describe("KpiCard", () => {
  it("renders the label text", () => {
    render(<KpiCard label="Total Revenue" value="1,000,000" />);
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
  });

  it("renders the value text", () => {
    render(<KpiCard label="Z-Score" value="3.45" />);
    expect(screen.getByText("3.45")).toBeInTheDocument();
  });

  it("renders numeric value correctly", () => {
    render(<KpiCard label="Beta" value={1.25} />);
    expect(screen.getByText("1.25")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<KpiCard label="Volatility" value="12.5%" description="20-day rolling" />);
    expect(screen.getByText("20-day rolling")).toBeInTheDocument();
  });

  it("does not render description element when not provided", () => {
    render(<KpiCard label="Beta" value="1.2" />);
    expect(screen.queryByText("20-day rolling")).not.toBeInTheDocument();
  });

  it("renders animated skeleton when loading=true", () => {
    const { container } = render(<KpiCard label="Beta" value="1.2" loading={true} />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("does not render skeleton when loading=false", () => {
    const { container } = render(<KpiCard label="Beta" value="1.2" loading={false} />);
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("renders positive trend badge with + prefix", () => {
    render(<KpiCard label="Profit" value="1M" trend={{ value: 5.5, isPositive: true }} />);
    expect(screen.getByText("+5.5%")).toBeInTheDocument();
  });

  it("renders negative trend badge without + prefix", () => {
    render(<KpiCard label="Loss" value="-1M" trend={{ value: -3.2, isPositive: false }} />);
    expect(screen.getByText("-3.2%")).toBeInTheDocument();
  });
});
