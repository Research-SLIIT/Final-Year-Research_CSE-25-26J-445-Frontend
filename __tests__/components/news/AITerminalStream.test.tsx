import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AITerminalStream } from "@/components/news/AITerminalStream";

describe("AITerminalStream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders zero terminal step lines initially (before any timer fires)", () => {
    render(<AITerminalStream />);
    // Only the blinking cursor should be visible, no step text
    expect(screen.queryByText("Initializing analysis pipeline...")).not.toBeInTheDocument();
  });

  it("renders the blinking cursor when steps are still in progress", () => {
    const { container } = render(<AITerminalStream />);
    // The animate-pulse underscore cursor
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders the first step after the first timeout fires (delay 0ms)", () => {
    render(<AITerminalStream />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText("Initializing analysis pipeline...")).toBeInTheDocument();
  });

  it("renders multiple steps after advancing timers", () => {
    render(<AITerminalStream />);
    act(() => {
      vi.advanceTimersByTime(1200); // covers delays 0, 400, 1100
    });
    expect(screen.getByText("Initializing analysis pipeline...")).toBeInTheDocument();
    expect(screen.getByText(/Connecting to NLP engine/)).toBeInTheDocument();
    expect(screen.getByText(/Extracting named entities/)).toBeInTheDocument();
  });

  it("renders all 11 steps after all timeouts have fired", () => {
    render(<AITerminalStream />);
    act(() => {
      vi.advanceTimersByTime(8000); // beyond last step delay of 7000ms
    });
    expect(screen.getByText("Analysis complete. Rendering results...")).toBeInTheDocument();
  });

  it("hides the blinking cursor when all steps are rendered", () => {
    const { container } = render(<AITerminalStream />);
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    // cursor only shows when visibleSteps < TERMINAL_STEPS.length
    // After all 11 steps, cursor should not render
    const cursors = container.querySelectorAll(".animate-pulse");
    // The only animate-pulse left should NOT be the cursor _ element
    const cursorText = Array.from(cursors).find(el => el.textContent === "_");
    expect(cursorText).toBeUndefined();
  });

  it("cleans up all timers on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = render(<AITerminalStream />);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
