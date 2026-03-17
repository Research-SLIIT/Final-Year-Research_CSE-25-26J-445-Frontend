import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalysisBreakdown } from "@/components/analysis/AnalysisBreakdown";
import { mockAnalyzeResponse } from "@/tests/fixtures/sentiment.fixture";

const explanation = mockAnalyzeResponse.explanation;

describe("AnalysisBreakdown", () => {
  it("renders the stage 1 'Market Impact Detection' heading", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    expect(screen.getByText("Market Impact Detection")).toBeInTheDocument();
  });

  it("renders StatusBadge in stage 1 when passed is defined", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    // Stage 1 has passed: true
    expect(screen.getByText(/Passed/)).toBeInTheDocument();
  });

  it("renders stage 2A 'ML Direction Prediction' heading", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    expect(screen.getByText("ML Direction Prediction")).toBeInTheDocument();
  });

  it("renders DirectionBadge with 'Positive' for stage 2A when direction is positive", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    // Stage 2A has direction: "positive"
    const positiveBadges = screen.getAllByText("Positive");
    expect(positiveBadges.length).toBeGreaterThan(0);
  });

  it("renders stage 2B 'Lexicon Sentiment Analysis' heading", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    expect(screen.getByText("Lexicon Sentiment Analysis")).toBeInTheDocument();
  });

  it("renders triggered rules as tags in stage 2B", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    // triggered_rules: "profit, growth, dividend"
    expect(screen.getByText("profit")).toBeInTheDocument();
    expect(screen.getByText("growth")).toBeInTheDocument();
    expect(screen.getByText("dividend")).toBeInTheDocument();
  });

  it("renders stage 3 'Fusion & Final Decision' heading", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    expect(screen.getByText("Fusion & Final Decision")).toBeInTheDocument();
  });

  it("renders final decision text in the result section", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    expect(screen.getByText(/Final Prediction: positive/i)).toBeInTheDocument();
  });

  it("renders model confidence as percentage", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    // model_confidence: 0.82 → 82%
    expect(screen.getByText(/82%/)).toBeInTheDocument();
  });

  it("renders WeightBar in stage 3 when weights are present", () => {
    render(<AnalysisBreakdown explanation={explanation} />);
    // weights: { ML: 0.6, Lexicon: 0.4 }
    expect(screen.getByText("ML")).toBeInTheDocument();
    expect(screen.getByText("Lexicon")).toBeInTheDocument();
  });
});
