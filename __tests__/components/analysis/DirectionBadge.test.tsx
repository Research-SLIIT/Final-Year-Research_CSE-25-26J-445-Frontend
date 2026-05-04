import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DirectionBadge } from "@/components/analysis/DirectionBadge";

describe("DirectionBadge", () => {
  it('renders "Positive" for direction="positive"', () => {
    render(<DirectionBadge direction="positive" />);
    expect(screen.getByText("Positive")).toBeInTheDocument();
  });

  it('renders "Negative" for direction="negative"', () => {
    render(<DirectionBadge direction="negative" />);
    expect(screen.getByText("Negative")).toBeInTheDocument();
  });

  it('renders "Neutral" for any other value', () => {
    render(<DirectionBadge direction="unknown" />);
    expect(screen.getByText("Neutral")).toBeInTheDocument();
  });

  it("is case-insensitive: POSITIVE renders Positive", () => {
    render(<DirectionBadge direction="POSITIVE" />);
    expect(screen.getByText("Positive")).toBeInTheDocument();
  });

  it("applies green class for positive direction", () => {
    const { container } = render(<DirectionBadge direction="positive" />);
    expect(container.firstChild).toHaveClass("bg-green-500/20");
  });

  it("applies red class for negative direction", () => {
    const { container } = render(<DirectionBadge direction="negative" />);
    expect(container.firstChild).toHaveClass("bg-red-500/20");
  });
});
