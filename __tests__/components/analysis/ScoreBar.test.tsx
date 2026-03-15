import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBar } from "@/components/analysis/ScoreBar";

describe("ScoreBar", () => {
  it("renders the label text", () => {
    render(<ScoreBar score={0.7} threshold={0.5} label="Impact Score" />);
    expect(screen.getByText("Impact Score")).toBeInTheDocument();
  });

  it("bar fill is green when score >= threshold (passed)", () => {
    const { container } = render(<ScoreBar score={0.8} threshold={0.5} label="Test" />);
    const barFill = container.querySelector(".bar-fill") as HTMLElement;
    expect(barFill.style.backgroundColor).toBe("rgb(16, 185, 129)"); // #10b981
  });

  it("bar fill is red when score < threshold (failed)", () => {
    const { container } = render(<ScoreBar score={0.3} threshold={0.5} label="Test" />);
    const barFill = container.querySelector(".bar-fill") as HTMLElement;
    expect(barFill.style.backgroundColor).toBe("rgb(239, 68, 68)"); // #ef4444
  });

  it("bar width percentage is clamped to 100 max", () => {
    const { container } = render(<ScoreBar score={2.0} threshold={0.5} label="Test" />);
    const barFill = container.querySelector(".bar-fill") as HTMLElement;
    expect(barFill.style.width).toBe("100%");
  });

  it("threshold line is positioned at correct percentage", () => {
    const { container } = render(<ScoreBar score={0.7} threshold={0.5} label="Test" />);
    const thresholdLine = container.querySelector(".threshold-line") as HTMLElement;
    expect(thresholdLine.style.left).toBe("50%");
  });
});
