import { describe, it, expect, beforeEach } from "vitest";
import { useRiskStore } from "@/stores/useRiskStore";

const defaultInputs = {
  symbol: "",
  dateRange: { start: "", end: "" },
  riskProfile: "Basic" as const,
};

beforeEach(() => {
  useRiskStore.setState({
    inputs: defaultInputs,
    results: null,
    loading: false,
    error: null,
  });
});

describe("useRiskStore", () => {
  it("initializes with empty symbol, null results, loading false, and null error", () => {
    const state = useRiskStore.getState();
    expect(state.inputs.symbol).toBe("");
    expect(state.inputs.dateRange).toEqual({ start: "", end: "" });
    expect(state.inputs.riskProfile).toBe("Basic");
    expect(state.results).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("setInputs updates all fields in inputs", () => {
    useRiskStore.getState().setInputs({
      symbol: "JKH",
      dateRange: { start: "2024-01-01", end: "2024-12-31" },
      riskProfile: "Advanced",
    });
    const state = useRiskStore.getState();
    expect(state.inputs.symbol).toBe("JKH");
    expect(state.inputs.riskProfile).toBe("Advanced");
    expect(state.inputs.dateRange.start).toBe("2024-01-01");
  });

  it("setResults stores a RiskResult", () => {
    const mockResult = { symbol: "JKH", asofDate: "2025-01-01" } as any;
    useRiskStore.getState().setResults(mockResult);
    expect(useRiskStore.getState().results).toEqual(mockResult);
  });

  it("setResults with null clears results", () => {
    useRiskStore.getState().setResults({ symbol: "JKH" } as any);
    useRiskStore.getState().setResults(null);
    expect(useRiskStore.getState().results).toBeNull();
  });

  it("setLoading true marks store as loading", () => {
    useRiskStore.getState().setLoading(true);
    expect(useRiskStore.getState().loading).toBe(true);
  });

  it("setLoading false clears loading state", () => {
    useRiskStore.getState().setLoading(true);
    useRiskStore.getState().setLoading(false);
    expect(useRiskStore.getState().loading).toBe(false);
  });

  it("setError stores an error string", () => {
    useRiskStore.getState().setError("Risk analysis failed");
    expect(useRiskStore.getState().error).toBe("Risk analysis failed");
  });

  it("setError with null clears the error", () => {
    useRiskStore.getState().setError("Some error");
    useRiskStore.getState().setError(null);
    expect(useRiskStore.getState().error).toBeNull();
  });
});
