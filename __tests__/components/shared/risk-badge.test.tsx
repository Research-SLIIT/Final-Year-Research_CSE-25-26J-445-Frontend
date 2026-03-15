import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "@/components/risk-badge";

describe("RiskBadge", () => {
  it('renders "Low Risk" text for level="low"', () => {
    render(<RiskBadge level="low" />);
    expect(screen.getByText("Low Risk")).toBeInTheDocument();
  });

  it('renders "Medium Risk" text for level="medium"', () => {
    render(<RiskBadge level="medium" />);
    expect(screen.getByText("Medium Risk")).toBeInTheDocument();
  });

  it('renders "High Risk" text for level="high"', () => {
    render(<RiskBadge level="high" />);
    expect(screen.getByText("High Risk")).toBeInTheDocument();
  });

  it("applies green color class for low risk", () => {
    const { container } = render(<RiskBadge level="low" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("green");
  });

  it("applies yellow color class for medium risk", () => {
    const { container } = render(<RiskBadge level="medium" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("yellow");
  });

  it("applies red color class for high risk", () => {
    const { container } = render(<RiskBadge level="high" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("red");
  });
});
