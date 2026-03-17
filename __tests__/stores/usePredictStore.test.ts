import { describe, it, expect, beforeEach } from "vitest";
import { usePredictStore } from "@/stores/usePredictStore";
import { mockPredictionResult } from "@/tests/fixtures/prediction.fixture";

beforeEach(() => {
  usePredictStore.setState({
    inputs: { symbol: "" },
    output: null,
    loading: false,
    error: null,
  });
});

describe("usePredictStore", () => {
  it("initializes with empty symbol, null output, loading false, and null error", () => {
    const state = usePredictStore.getState();
    expect(state.inputs.symbol).toBe("");
    expect(state.output).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("setInputs updates the symbol in inputs", () => {
    usePredictStore.getState().setInputs({ symbol: "AAF" });
    expect(usePredictStore.getState().inputs.symbol).toBe("AAF");
  });

  it("setOutput stores a PredictionResult", () => {
    usePredictStore.getState().setOutput(mockPredictionResult);
    expect(usePredictStore.getState().output).toEqual(mockPredictionResult);
  });

  it("setOutput with null clears the output", () => {
    usePredictStore.getState().setOutput(mockPredictionResult);
    usePredictStore.getState().setOutput(null);
    expect(usePredictStore.getState().output).toBeNull();
  });

  it("setLoading true marks store as loading", () => {
    usePredictStore.getState().setLoading(true);
    expect(usePredictStore.getState().loading).toBe(true);
  });

  it("setLoading false clears loading state", () => {
    usePredictStore.getState().setLoading(true);
    usePredictStore.getState().setLoading(false);
    expect(usePredictStore.getState().loading).toBe(false);
  });

  it("setError stores an error string", () => {
    usePredictStore.getState().setError("Something went wrong");
    expect(usePredictStore.getState().error).toBe("Something went wrong");
  });

  it("setError with null clears the error", () => {
    usePredictStore.getState().setError("Some error");
    usePredictStore.getState().setError(null);
    expect(usePredictStore.getState().error).toBeNull();
  });
});
