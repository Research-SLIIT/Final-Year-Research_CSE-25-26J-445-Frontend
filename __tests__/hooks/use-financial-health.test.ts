import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinancialHealth } from "@/hooks/use-financial-health";
import { invalidateCache } from "@/lib/request-cache";

// Helper to get the last MockEventSource instance
function getLastInstance() {
  const MockES = EventSource as any;
  return MockES.mock.instances[MockES.mock.instances.length - 1];
}

beforeEach(() => {
  (EventSource as any).mockClear();
  // Analyses are cached per company for the page session; every case here uses
  // the same symbol, so the cache has to be cleared between them.
  invalidateCache();
});

describe("useFinancialHealth", () => {
  it("exposes data, loading, error, events initially as null/false/null/empty", () => {
    const { result } = renderHook(() => useFinancialHealth());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.events).toEqual([]);
  });

  it("fetchAnalysis does nothing when symbol is empty string", async () => {
    const { result } = renderHook(() => useFinancialHealth());
    await act(async () => {
      await result.current.fetchAnalysis("");
    });
    // No EventSource should be created
    expect(vi.mocked(EventSource as any).mock.instances).toHaveLength(0);
  });

  it("fetchAnalysis constructs SSE URL containing the symbol", async () => {
    const { result } = renderHook(() => useFinancialHealth());

    await act(async () => {
      const p = result.current.fetchAnalysis("AAF");
      const instance = getLastInstance();
      const healthResult = { symbol: "AAF", riskAssessment: { zone: "Safe" } };
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: healthResult }) });
      return p;
    });

    const instance = getLastInstance();
    expect(instance.url).toContain("AAF");
  });

  it("exposes the result as data after a completed stream", async () => {
    const { result } = renderHook(() => useFinancialHealth());
    const healthResult = { symbol: "AAF", riskAssessment: { zone: "Safe" } };

    await act(async () => {
      const p = result.current.fetchAnalysis("AAF");
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: healthResult }) });
      return p;
    });

    expect(result.current.data).toEqual(healthResult);
  });

  it("exposes error string after stream error event", async () => {
    const { result } = renderHook(() => useFinancialHealth());

    await act(async () => {
      const p = result.current.fetchAnalysis("AAF");
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "Analysis failed", status: "error" }) });
      return p;
    });

    expect(result.current.error).toBe("Analysis failed");
  });

  it("reset() clears data, events, error, and loading state", async () => {
    const { result } = renderHook(() => useFinancialHealth());

    // Load some data first
    await act(async () => {
      const p = result.current.fetchAnalysis("AAF");
      const instance = getLastInstance();
      instance.onmessage?.({ data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: { symbol: "AAF" } }) });
      return p;
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
