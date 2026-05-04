import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceBadge } from "@/components/analysis/ConfidenceBadge";

describe("ConfidenceBadge (analysis)", () => {
  it("renders percentage value for confidence=0.85 as '85%'", () => {
    render(<ConfidenceBadge confidence={0.85} />);
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it("applies green class when confidence >= 0.8", () => {
    const { container } = render(<ConfidenceBadge confidence={0.85} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/green/);
  });

  it("applies blue class when confidence >= 0.6 and < 0.8", () => {
    const { container } = render(<ConfidenceBadge confidence={0.65} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/blue/);
  });

  it("applies yellow class when confidence >= 0.4 and < 0.6", () => {
    const { container } = render(<ConfidenceBadge confidence={0.5} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/yellow/);
  });

  it("applies red class when confidence < 0.4", () => {
    const { container } = render(<ConfidenceBadge confidence={0.3} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/red/);
  });

  it("clamps values: confidence=2 renders '100%'", () => {
    render(<ConfidenceBadge confidence={2} />);
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("clamps values: confidence=-1 renders '0%'", () => {
    render(<ConfidenceBadge confidence={-1} />);
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });
});
