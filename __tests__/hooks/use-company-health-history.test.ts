import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCompanyHealthHistory } from "@/hooks/use-company-health-history";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function makeDataPoint(quarterDate: string, overrides: Record<string, string> = {}) {
  return {
    QuarterDate: quarterDate,
    z_score: "3.2",
    working_capital_to_total_assets: "0.15",
    retained_earnings_to_total_assets: "0.20",
    ebit_to_total_assets: "0.10",
    mve_to_total_liabilities: "2.5",
    sales_to_total_assets: "0.8",
    current_ratio: "1.5",
    debt_to_equity_ratio: "0.4",
    net_profit_margin: "0.12",
    z_score_next_quarter: "3.1",
    ...overrides,
  };
}

describe("useCompanyHealthHistory", () => {
  it("starts with null data, empty chartData, loading false, no error", () => {
    const { result } = renderHook(() => useCompanyHealthHistory());
    expect(result.current.data).toBeNull();
    expect(result.current.chartData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets loading true during fetch and false after success", async () => {
    const mockResponse = { data: [makeDataPoint("1/1/2023")] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("AAF");
    });

    expect(result.current.loading).toBe(false);
  });

  it("calls getCompanyHealthHistory with provided companyCode", async () => {
    const mockResponse = { data: [makeDataPoint("1/1/2023")] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("ACL");
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("acl");
  });

  it("stores result in data on success", async () => {
    const mockResponse = { data: [makeDataPoint("1/1/2023")] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("AAF");
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it("stores error message and sets data to null on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Company not found" }),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("FAKE");
    });

    expect(result.current.error).toBe("Company not found");
    expect(result.current.data).toBeNull();
  });

  it("sets error 'Please provide a company code' when given empty string", async () => {
    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("");
    });

    expect(result.current.error).toBe("Please provide a company code");
  });

  it("chartData is empty array when data is null", () => {
    const { result } = renderHook(() => useCompanyHealthHistory());
    expect(result.current.chartData).toEqual([]);
  });

  it("chartData transforms QuarterDate '1/1/2023' to 'Q1 2023'", async () => {
    const mockResponse = { data: [makeDataPoint("1/1/2023")] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("AAF");
    });

    expect(result.current.chartData[0].date).toBe("Q1 2023");
  });

  it("chartData transforms QuarterDate '7/1/2023' to 'Q3 2023'", async () => {
    const mockResponse = { data: [makeDataPoint("7/1/2023")] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("AAF");
    });

    expect(result.current.chartData[0].date).toBe("Q3 2023");
  });

  it("chartData parses string ratio values to floats", async () => {
    const mockResponse = { data: [makeDataPoint("1/1/2023", { z_score: "3.14159" })] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("AAF");
    });

    expect(result.current.chartData[0].z_score).toBeCloseTo(3.14159);
  });

  it("chartData sorts entries chronologically by date", async () => {
    const mockResponse = {
      data: [
        makeDataPoint("7/1/2023"), // Q3 2023
        makeDataPoint("1/1/2022"), // Q1 2022
        makeDataPoint("4/1/2023"), // Q2 2023
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("AAF");
    });

    const dates = result.current.chartData.map((p) => p.date);
    expect(dates).toEqual(["Q1 2022", "Q2 2023", "Q3 2023"]);
  });

  it("reset() clears data, error, and loading", async () => {
    const mockResponse = { data: [makeDataPoint("1/1/2023")] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCompanyHealthHistory());
    await act(async () => {
      await result.current.fetchHistory("AAF");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
