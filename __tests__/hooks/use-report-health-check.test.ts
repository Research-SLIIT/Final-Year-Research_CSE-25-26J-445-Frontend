import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReportHealthCheck } from "@/hooks/use-report-health-check";

function getLastInstance() {
  const MockES = EventSource as any;
  return MockES.mock.instances[MockES.mock.instances.length - 1];
}

beforeEach(() => {
  (EventSource as any).mockClear();
});

describe("useReportHealthCheck", () => {
  it("initializes with null data, false loading, null error, empty events", () => {
    const { result } = renderHook(() => useReportHealthCheck());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.events).toEqual([]);
  });

  it("fetchHealthCheck does nothing when symbol is empty string", async () => {
    const { result } = renderHook(() => useReportHealthCheck());
    await act(async () => {
      await result.current.fetchHealthCheck("");
    });
    expect((EventSource as any).mock.instances).toHaveLength(0);
  });

  it("SSE URL contains the symbol", async () => {
    const { result } = renderHook(() => useReportHealthCheck());

    await act(async () => {
      const p = result.current.fetchHealthCheck("AAF");
      const instance = getLastInstance();
      instance.onmessage?.({
        data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: { symbol: "AAF" } }),
      });
      return p;
    });

    const instance = getLastInstance();
    expect(instance.url).toContain("AAF");
  });

  it("exposes the result as data after a completed stream", async () => {
    const { result } = renderHook(() => useReportHealthCheck());
    const healthResult = { symbol: "AAF", riskAssessment: { zone: "Safe" } };

    await act(async () => {
      const p = result.current.fetchHealthCheck("AAF");
      const instance = getLastInstance();
      instance.onmessage?.({
        data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: healthResult }),
      });
      return p;
    });

    expect(result.current.data).toEqual(healthResult);
  });

  it("exposes error string after stream error event", async () => {
    const { result } = renderHook(() => useReportHealthCheck());

    await act(async () => {
      const p = result.current.fetchHealthCheck("AAF");
      const instance = getLastInstance();
      instance.onmessage?.({
        data: JSON.stringify({ step: 1, total: 1, message: "Analysis failed", status: "error" }),
      });
      return p;
    });

    expect(result.current.error).toBe("Analysis failed");
  });

  it("reset() clears all state", async () => {
    const { result } = renderHook(() => useReportHealthCheck());

    await act(async () => {
      const p = result.current.fetchHealthCheck("AAF");
      const instance = getLastInstance();
      instance.onmessage?.({
        data: JSON.stringify({ step: 1, total: 1, message: "done", status: "completed", result: { symbol: "AAF" } }),
      });
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
