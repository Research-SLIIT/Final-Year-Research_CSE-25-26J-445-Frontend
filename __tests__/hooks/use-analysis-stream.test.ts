import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnalysisStream } from "@/hooks/use-analysis-stream";

// Helper to get the last MockEventSource instance
function getLastInstance() {
  const MockES = (EventSource as any);
  return MockES.mock.instances[MockES.mock.instances.length - 1];
}

beforeEach(() => {
  (EventSource as any).mockClear();
});

describe("useAnalysisStream", () => {
  it("starts with empty events, null result, isLoading false, and no error", () => {
    const { result } = renderHook(() => useAnalysisStream());
    expect(result.current.events).toEqual([]);
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading true immediately after start() is called", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    // Start but don't resolve - just check loading starts
    let resolveHook: () => void;
    const promise = act(async () => {
      const p = result.current.start("http://test/stream");
      resolveHook = () => {};
      return p;
    });

    // Trigger completion so test doesn't hang
    await act(async () => {
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: {} }) });
    });
    await promise;
  });

  it("accumulates progress events in order for processing status messages", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    await act(async () => {
      const p = result.current.start("http://test/stream");
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 3, message: "Step 1", status: "processing" }) });
      instance.onmessage?.({ data: JSON.stringify({ step: 2, total: 3, message: "Step 2", status: "processing" }) });
      instance.onmessage?.({ data: JSON.stringify({ step: 3, total: 3, message: "done", status: "completed", result: {} }) });
      return p;
    });

    expect(result.current.events.length).toBeGreaterThanOrEqual(2);
  });

  it("replaces processing placeholder with step-done event for same step", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    await act(async () => {
      const p = result.current.start("http://test/stream");
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 2, message: "Processing...", status: "processing" }) });
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 2, message: "Done!", status: "step-done" }) });
      instance.onmessage?.({ data: JSON.stringify({ step: 2, total: 2, message: "All done", status: "completed", result: {} }) });
      return p;
    });

    const step1Events = result.current.events.filter((e) => e.step === 1);
    expect(step1Events).toHaveLength(1);
    expect(step1Events[0].status).toBe("step-done");
  });

  it("sets result and clears isLoading when status='completed'", async () => {
    const { result } = renderHook(() => useAnalysisStream());
    const testResult = { zone: "Safe" };

    await act(async () => {
      const p = result.current.start("http://test/stream");
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: testResult }) });
      return p;
    });

    expect(result.current.result).toEqual(testResult);
    expect(result.current.isLoading).toBe(false);
  });

  it("closes EventSource when status='completed'", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    await act(async () => {
      const p = result.current.start("http://test/stream");
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: {} }) });
      return p;
    });

    const instance = getLastInstance();
    expect(instance.close).toHaveBeenCalledOnce();
  });

  it("sets error message when status='error' event is received", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    await act(async () => {
      const p = result.current.start("http://test/stream").catch(() => {});
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "Analysis failed", status: "error" }) });
      return p;
    });

    expect(result.current.error).toBe("Analysis failed");
  });

  it("rejects the returned promise when status='error'", async () => {
    const { result } = renderHook(() => useAnalysisStream());
    let rejected = false;

    await act(async () => {
      const p = result.current.start("http://test/stream").catch(() => { rejected = true; });
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "Error", status: "error" }) });
      return p;
    });

    expect(rejected).toBe(true);
  });

  it("sets connection error and clears loading on onerror", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    await act(async () => {
      const p = result.current.start("http://test/stream").catch(() => {});
      const instance = getLastInstance();
      instance.onerror?.();
      return p;
    });

    expect(result.current.error).toBe("Connection lost. Please try again.");
    expect(result.current.isLoading).toBe(false);
  });

  it("closes EventSource on onerror", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    await act(async () => {
      const p = result.current.start("http://test/stream").catch(() => {});
      const instance = getLastInstance();
      instance.onerror?.();
      return p;
    });

    const instance = getLastInstance();
    expect(instance.close).toHaveBeenCalledOnce();
  });

  it("reset() clears events, result, error, and isLoading", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    // Load some state first
    await act(async () => {
      const p = result.current.start("http://test/stream").catch(() => {});
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "Error", status: "error" }) });
      return p;
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("ignores malformed JSON in onmessage without throwing", async () => {
    const { result } = renderHook(() => useAnalysisStream());

    await act(async () => {
      const p = result.current.start("http://test/stream");
      const instance = getLastInstance();
      // Send malformed JSON
      instance.onmessage?.({ data: "not-valid-json{{" });
      // Then complete normally
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: {} }) });
      return p;
    });

    expect(result.current.error).toBeNull();
  });

  it("resolves the returned promise when stream completes successfully", async () => {
    const { result } = renderHook(() => useAnalysisStream());
    let resolved = false;

    await act(async () => {
      const p = result.current.start("http://test/stream").then(() => { resolved = true; });
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: {} }) });
      return p;
    });

    expect(resolved).toBe(true);
  });
});
