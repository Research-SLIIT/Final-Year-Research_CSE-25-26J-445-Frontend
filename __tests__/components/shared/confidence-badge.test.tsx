import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceBadge } from "@/components/confidence-badge";

describe("ConfidenceBadge", () => {
  it('renders "Low Confidence" text for confidence="low"', () => {
    render(<ConfidenceBadge confidence="low" />);
    expect(screen.getByText("Low Confidence")).toBeInTheDocument();
  });

  it('renders "Medium Confidence" text for confidence="medium"', () => {
    render(<ConfidenceBadge confidence="medium" />);
    expect(screen.getByText("Medium Confidence")).toBeInTheDocument();
  });

  it('renders "High Confidence" text for confidence="high"', () => {
    render(<ConfidenceBadge confidence="high" />);
    expect(screen.getByText("High Confidence")).toBeInTheDocument();
  });

  it("applies orange color class for low confidence", () => {
    const { container } = render(<ConfidenceBadge confidence="low" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("orange");
  });

  it("applies blue color class for medium confidence", () => {
    const { container } = render(<ConfidenceBadge confidence="medium" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("blue");
  });

  it("applies green color class for high confidence", () => {
    const { container } = render(<ConfidenceBadge confidence="high" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("green");
  });
});
