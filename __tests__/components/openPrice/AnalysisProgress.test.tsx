import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AnalysisProgress } from "@/components/analysis-progress";
import type { ProgressEvent } from "@/hooks/use-analysis-stream";

const processingEvent: ProgressEvent = {
  step: 1,
  total: 4,
  message: "Fetching company data...",
  status: "processing",
};

const stepDoneEvent: ProgressEvent = {
  step: 1,
  total: 4,
  message: "Company data fetched",
  status: "step-done",
};

const completedEvent: ProgressEvent = {
  step: 4,
  total: 4,
  message: "Analysis complete",
  status: "completed",
};

const errorEvent: ProgressEvent = {
  step: 2,
  total: 4,
  message: "Failed to process data",
  status: "error",
};

describe("AnalysisProgress", () => {
  it("renders nothing when events are empty and not loading", () => {
    const { container } = render(<AnalysisProgress events={[]} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the card when isLoading is true", () => {
    render(<AnalysisProgress events={[]} isLoading={true} />);
    expect(screen.getByText("Analysis Progress")).toBeInTheDocument();
  });

  it("renders default title 'Analysis Progress'", () => {
    render(<AnalysisProgress events={[processingEvent]} isLoading={true} />);
    expect(screen.getByText("Analysis Progress")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(<AnalysisProgress events={[processingEvent]} isLoading={true} title="Risk Analysis" />);
    expect(screen.getByText("Risk Analysis")).toBeInTheDocument();
  });

  it("renders event messages", () => {
    render(<AnalysisProgress events={[processingEvent]} isLoading={true} />);
    expect(screen.getByText("Fetching company data...")).toBeInTheDocument();
  });

  it("renders multiple event messages", () => {
    render(
      <AnalysisProgress
        events={[processingEvent, stepDoneEvent]}
        isLoading={true}
      />
    );
    expect(screen.getByText("Fetching company data...")).toBeInTheDocument();
    expect(screen.getByText("Company data fetched")).toBeInTheDocument();
  });

  it("shows step counter text (e.g. '1/4')", () => {
    render(<AnalysisProgress events={[processingEvent]} isLoading={true} />);
    expect(screen.getByText("1/4")).toBeInTheDocument();
  });

  it("shows '— Done' label when completed and not loading", () => {
    render(<AnalysisProgress events={[completedEvent]} isLoading={false} />);
    expect(screen.getByText(/Done/)).toBeInTheDocument();
  });

  it("shows 'Processing…' indicator when isLoading is true", () => {
    render(<AnalysisProgress events={[processingEvent]} isLoading={true} />);
    expect(screen.getByText("Processing…")).toBeInTheDocument();
  });

  it("renders progress counter text (completedStep / total)", () => {
    render(<AnalysisProgress events={[stepDoneEvent]} isLoading={true} />);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("renders error message in red-colored text", () => {
    render(<AnalysisProgress events={[errorEvent]} isLoading={false} />);
    const msg = screen.getByText("Failed to process data");
    expect(msg.className).toMatch(/red/);
  });

  it("renders completed message in emerald-colored text", () => {
    render(<AnalysisProgress events={[completedEvent]} isLoading={false} />);
    const msg = screen.getByText("Analysis complete");
    expect(msg.className).toMatch(/emerald/);
  });

  it("auto-hides after completion using timers", () => {
    vi.useFakeTimers();
    render(<AnalysisProgress events={[completedEvent]} isLoading={false} />);
    expect(screen.getByText("Analysis Progress")).toBeInTheDocument();
    // After 2700ms the card fades out and becomes hidden
    act(() => { vi.advanceTimersByTime(2800); });
    expect(screen.queryByText("Analysis Progress")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
