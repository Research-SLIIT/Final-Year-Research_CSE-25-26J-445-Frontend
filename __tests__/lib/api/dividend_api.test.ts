import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  predictDividend,
  fetchHistoricalDividendData,
  fetchGlossary,
  fetchDataFromBackend,
  fetchDataFromBackend_llm,
  llm_exp,
} from "@/lib/api/dividend_api";
import { mockDividendResult } from "@/tests/fixtures/dividend.fixture";

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

function makeFetchError(status: number) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: "Error",
  } as Response);
}

describe("fetchDataFromBackend", () => {
  it("sends GET to correct URL with firm and year query params", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockDividendResult));
    await fetchDataFromBackend("AAF", 2025);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("firm=AAF");
    expect(calledUrl).toContain("year=2025");
  });

  it("defaults year to 2025 when not provided", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockDividendResult));
    await fetchDataFromBackend("AAF");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("year=2025");
  });

  it("returns parsed JSON on successful response", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockDividendResult));
    const result = await fetchDataFromBackend("AAF");
    expect(result).toEqual(mockDividendResult);
  });

  it("throws HTTP error when response is not ok", async () => {
    mockFetch.mockReturnValueOnce(makeFetchError(500));
    await expect(fetchDataFromBackend("AAF")).rejects.toThrow("HTTP error! status: 500");
  });
});

describe("predictDividend", () => {
  it("returns DividendPredictionResult from fetchDataFromBackend", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockDividendResult));
    const result = await predictDividend("AAF");
    expect(result.data.prediction.probability).toBe(0.75);
  });

  it("throws 'Dividend data not available' when backend returns falsy", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(null));
    await expect(predictDividend("AAF")).rejects.toThrow("Dividend data not available");
  });
});

describe("fetchHistoricalDividendData", () => {
  it("sends GET to history endpoint with encoded firm param", async () => {
    const mockHistory = { data: { success: true, firm: "AAF", records: [], count: 0 } };
    mockFetch.mockReturnValueOnce(makeFetchOk(mockHistory));
    await fetchHistoricalDividendData("AAF");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("history");
    expect(calledUrl).toContain("firm=AAF");
  });

  it("extracts data from response.data wrapper when present", async () => {
    const innerData = { success: true, firm: "AAF", records: [], count: 0, start_year: 2020, end_year: 2024, message: "OK", error: null };
    mockFetch.mockReturnValueOnce(makeFetchOk({ data: innerData }));
    const result = await fetchHistoricalDividendData("AAF");
    expect(result.firm).toBe("AAF");
  });

  it("returns response directly when no .data wrapper", async () => {
    const directData = { success: true, firm: "LOLC", records: [], count: 0, start_year: 2020, end_year: 2024, message: "OK", error: null };
    mockFetch.mockReturnValueOnce(makeFetchOk(directData));
    const result = await fetchHistoricalDividendData("LOLC");
    expect(result.firm).toBe("LOLC");
  });

  it("throws when response is not ok", async () => {
    mockFetch.mockReturnValueOnce(makeFetchError(404));
    await expect(fetchHistoricalDividendData("FAKE")).rejects.toThrow("HTTP error! status: 404");
  });
});

describe("fetchGlossary", () => {
  it("returns json.data when status is 'success'", async () => {
    const glossary = { ROA: "Return on Assets", EPS: "Earnings Per Share" };
    mockFetch.mockReturnValueOnce(makeFetchOk({ status: "success", data: glossary }));
    const result = await fetchGlossary();
    expect(result).toEqual(glossary);
  });

  it("returns empty object when response has no data field", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk({ status: "success" }));
    const result = await fetchGlossary();
    expect(result).toEqual({});
  });

  it("returns empty object on fetch error (does not throw)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await fetchGlossary();
    expect(result).toEqual({});
  });
});

describe("fetchDataFromBackend_llm", () => {
  it("sends GET to llm-explanation endpoint with firm and year", async () => {
    const mockResponse = { explanation: "Company is healthy." };
    mockFetch.mockReturnValueOnce(makeFetchOk(mockResponse));
    await fetchDataFromBackend_llm("AAF", 2025);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("llm-explanation");
    expect(calledUrl).toContain("firm=AAF");
    expect(calledUrl).toContain("year=2025");
  });
});

describe("llm_exp", () => {
  it("calls fetchDataFromBackend_llm and returns result", async () => {
    const mockResponse = { explanation: "Company shows stable growth." };
    mockFetch.mockReturnValueOnce(makeFetchOk(mockResponse));
    const result = await llm_exp("AAF");
    expect(result).toEqual(mockResponse);
  });

  it("throws 'Dividend data not available' when result is falsy", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(null));
    await expect(llm_exp("AAF")).rejects.toThrow("Dividend data not available");
  });
});
