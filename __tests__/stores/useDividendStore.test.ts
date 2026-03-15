import { describe, it, expect, beforeEach } from "vitest";
import { useDividendStore } from "@/stores/useDividendStore";
import { mockDividendResult } from "@/tests/fixtures/dividend.fixture";

beforeEach(() => {
  useDividendStore.setState({
    inputs: { symbol: "" },
    results: null,
    loading: false,
    error: null,
  });
});

describe("useDividendStore", () => {
  it("initializes with empty symbol, null results, loading false, and null error", () => {
    const state = useDividendStore.getState();
    expect(state.inputs.symbol).toBe("");
    expect(state.results).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("setInputs updates the symbol", () => {
    useDividendStore.getState().setInputs({ symbol: "LOLC" });
    expect(useDividendStore.getState().inputs.symbol).toBe("LOLC");
  });

  it("setResults stores a DividendPredictionResult", () => {
    useDividendStore.getState().setResults(mockDividendResult);
    expect(useDividendStore.getState().results).toEqual(mockDividendResult);
  });

  it("setResults with null clears results", () => {
    useDividendStore.getState().setResults(mockDividendResult);
    useDividendStore.getState().setResults(null);
    expect(useDividendStore.getState().results).toBeNull();
  });

  it("setLoading true marks store as loading", () => {
    useDividendStore.getState().setLoading(true);
    expect(useDividendStore.getState().loading).toBe(true);
  });

  it("setLoading false clears loading state", () => {
    useDividendStore.getState().setLoading(true);
    useDividendStore.getState().setLoading(false);
    expect(useDividendStore.getState().loading).toBe(false);
  });

  it("setError stores an error string", () => {
    useDividendStore.getState().setError("Dividend fetch failed");
    expect(useDividendStore.getState().error).toBe("Dividend fetch failed");
  });

  it("setError with null clears the error", () => {
    useDividendStore.getState().setError("Some error");
    useDividendStore.getState().setError(null);
    expect(useDividendStore.getState().error).toBeNull();
  });
});
