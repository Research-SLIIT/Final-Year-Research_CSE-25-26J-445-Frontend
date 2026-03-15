import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeightBar } from "@/components/analysis/WeightBar";

describe("WeightBar", () => {
  it("returns null when weights is null", () => {
    const { container } = render(<WeightBar weights={null} finalScore={0.72} finalDecision="positive" />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when weights is empty object", () => {
    const { container } = render(<WeightBar weights={{}} finalScore={0.72} finalDecision="positive" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one weight-item row per weight entry", () => {
    const weights = { ML: 0.6, Lexicon: 0.4 };
    const { container } = render(<WeightBar weights={weights} finalScore={0.72} finalDecision="positive" />);
    const items = container.querySelectorAll(".weight-item");
    expect(items).toHaveLength(2);
  });

  it("displays finalScore formatted to 2 decimal places", () => {
    const weights = { ML: 0.6 };
    render(<WeightBar weights={weights} finalScore={0.726} finalDecision="positive" />);
    expect(screen.getByText("0.73")).toBeInTheDocument();
  });

  it("applies green value class when finalDecision is 'positive'", () => {
    const weights = { ML: 0.6 };
    const { container } = render(<WeightBar weights={weights} finalScore={0.72} finalDecision="positive" />);
    const scoreValue = container.querySelector(".weight-result-value");
    expect(scoreValue?.className).toContain("green");
  });

  it("applies red value class when finalDecision is 'negative'", () => {
    const weights = { ML: 0.6 };
    const { container } = render(<WeightBar weights={weights} finalScore={0.72} finalDecision="negative" />);
    const scoreValue = container.querySelector(".weight-result-value");
    expect(scoreValue?.className).toContain("red");
  });

  it("renders source label for each weight entry", () => {
    const weights = { ML: 0.6, Lexicon: 0.4 };
    render(<WeightBar weights={weights} finalScore={0.72} finalDecision="positive" />);
    expect(screen.getByText("ML")).toBeInTheDocument();
    expect(screen.getByText("Lexicon")).toBeInTheDocument();
  });
});
