import { describe, it, expect, vi, beforeEach } from "vitest";
import { predictOpenPrice, fetchOpenPriceHistory, fetchCompanies } from "@/lib/api/open-price-prediction.api";
import { mockBackendResponse, mockHistoryRaw } from "@/tests/fixtures/prediction.fixture";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function makeFetchOk(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}

function makeFetchError(status: number, data: unknown = {}) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: "Error",
    json: () => Promise.resolve(data),
  } as Response);
}

describe("predictOpenPrice", () => {
  it("returns a transformed PredictionResult on 200 response", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockBackendResponse));
    const result = await predictOpenPrice("AAF");
    expect(result.symbol).toBe("AAF");
    expect(result.openToday).toBe(100.0);
    expect(result.predOpenTplus5).toBe(105.0);
  });

  it("normalizes symbol by stripping .N0000 suffix before calling fetch", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockBackendResponse));
    await predictOpenPrice("AAF.N0000");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("AAF");
    expect(calledUrl).not.toContain("N0000");
  });

  it("includes explain=true in query params", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockBackendResponse));
    await predictOpenPrice("AAF");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("explain=true");
  });

  it("includes asofDate param when provided", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockBackendResponse));
    await predictOpenPrice("AAF", "2025-01-15");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("asof=2025-01-15");
  });

  it("throws 'Company not found' error on 404 response", async () => {
    mockFetch.mockReturnValueOnce(makeFetchError(404));
    await expect(predictOpenPrice("FAKE")).rejects.toThrow("FAKE not found in dataset");
  });

  it("throws 'ML model is warming up' error on 503 response", async () => {
    mockFetch.mockReturnValueOnce(makeFetchError(503));
    await expect(predictOpenPrice("AAF")).rejects.toThrow("ML model is warming up");
  });

  it("throws generic error message from response body on other errors", async () => {
    mockFetch.mockReturnValueOnce(makeFetchError(500, { message: "Internal server error" }));
    await expect(predictOpenPrice("AAF")).rejects.toThrow("Internal server error");
  });

  it("throws 'Service is warming up' when backendResponse.warming_up is true", async () => {
    mockFetch.mockReturnValueOnce(
      makeFetchOk({ ...mockBackendResponse, warming_up: true, reason: "Service is warming up" })
    );
    await expect(predictOpenPrice("AAF")).rejects.toThrow("Service is warming up");
  });

  it("sets confidence to 'high' when agreement_score >= 0.85", async () => {
    const response = {
      ...mockBackendResponse,
      explanation: { model_agreement: { agreement_score: 0.90 } },
    };
    mockFetch.mockReturnValueOnce(makeFetchOk(response));
    const result = await predictOpenPrice("AAF");
    expect(result.confidence).toBe("high");
  });

  it("sets confidence to 'medium' when agreement_score is between 0.65 and 0.84", async () => {
    const response = {
      ...mockBackendResponse,
      explanation: { model_agreement: { agreement_score: 0.75 } },
    };
    mockFetch.mockReturnValueOnce(makeFetchOk(response));
    const result = await predictOpenPrice("AAF");
    expect(result.confidence).toBe("medium");
  });

  it("sets confidence to 'low' when agreement_score is below 0.65", async () => {
    const response = {
      ...mockBackendResponse,
      explanation: { model_agreement: { agreement_score: 0.50 } },
    };
    mockFetch.mockReturnValueOnce(makeFetchOk(response));
    const result = await predictOpenPrice("AAF");
    expect(result.confidence).toBe("low");
  });

  it("sets confidence to 'medium' when explanation is absent", async () => {
    const response = { ...mockBackendResponse, explanation: undefined };
    mockFetch.mockReturnValueOnce(makeFetchOk(response));
    const result = await predictOpenPrice("AAF");
    expect(result.confidence).toBe("medium");
  });

  it("generates 8 forecastPoints (day 0 to day 7)", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockBackendResponse));
    const result = await predictOpenPrice("AAF");
    expect(result.forecastPoints).toHaveLength(8);
    expect(result.forecastPoints[0].day).toBe(0);
    expect(result.forecastPoints[7].day).toBe(7);
  });

  it("forecastPoint at day 0 equals openToday", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockBackendResponse));
    const result = await predictOpenPrice("AAF");
    expect(result.forecastPoints[0].price).toBe(result.openToday);
  });

  it("forecastPoint at day 5 equals predOpenTplus5", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockBackendResponse));
    const result = await predictOpenPrice("AAF");
    expect(result.forecastPoints[5].price).toBeCloseTo(result.predOpenTplus5, 5);
  });

  it("deltaPoint deltaPct is computed as (deltaPrice / baseline) * 100", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockBackendResponse));
    const result = await predictOpenPrice("AAF");
    const dp = result.deltaPoints[1]; // day 1
    const expected = (dp.deltaPrice / result.openToday) * 100;
    expect(dp.deltaPct).toBeCloseTo(expected, 5);
  });
});

describe("fetchOpenPriceHistory", () => {
  it("maps snake_case API fields to camelCase OpenPriceHistoryPoint shape", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockHistoryRaw));
    const result = await fetchOpenPriceHistory("AAF");
    expect(result[0]).toHaveProperty("openPrice");
    expect(result[0]).toHaveProperty("highPrice");
    expect(result[0]).toHaveProperty("tradeVolume");
  });

  it("returns an array with correct number of points", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockHistoryRaw));
    const result = await fetchOpenPriceHistory("AAF");
    expect(result).toHaveLength(2);
  });

  it("returns empty array on non-ok response", async () => {
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: false } as Response));
    const result = await fetchOpenPriceHistory("AAF");
    expect(result).toEqual([]);
  });

  it("returns empty array when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));
    const result = await fetchOpenPriceHistory("AAF");
    expect(result).toEqual([]);
  });
});

describe("fetchCompanies", () => {
  it("returns companies array from response", async () => {
    const companies = [{ id: "AAF", name: "AAF Ltd" }];
    mockFetch.mockReturnValueOnce(makeFetchOk({ companies }));
    const result = await fetchCompanies();
    expect(result).toEqual(companies);
  });

  it("returns empty array on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await fetchCompanies();
    expect(result).toEqual([]);
  });
});
