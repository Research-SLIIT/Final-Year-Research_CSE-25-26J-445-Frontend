import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartCard } from "@/components/chart-card";

describe("ChartCard", () => {
  it("renders the title text", () => {
    render(<ChartCard title="Price History"><div>chart</div></ChartCard>);
    expect(screen.getByText("Price History")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <ChartCard title="Price History" description="Last 30 days">
        <div>chart</div>
      </ChartCard>
    );
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
  });

  it("does not render description element when not provided", () => {
    render(<ChartCard title="Price History"><div>chart</div></ChartCard>);
    expect(screen.queryByText("Last 30 days")).not.toBeInTheDocument();
  });

  it("renders children inside the card content", () => {
    render(
      <ChartCard title="My Chart">
        <div data-testid="chart-content">chart content</div>
      </ChartCard>
    );
    expect(screen.getByTestId("chart-content")).toBeInTheDocument();
  });
});
