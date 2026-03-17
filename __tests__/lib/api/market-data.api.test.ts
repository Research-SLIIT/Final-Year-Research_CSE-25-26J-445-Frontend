import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTradeSummary } from "@/lib/api/market-data.api";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

const mockItem = {
  symbol: "AAF.N0000",
  name: "AAF Limited",
  price: 25.5,
  change: 0.5,
  percentageChange: 2.0,
  volume: 10000,
  turnover: 255000,
  lastTradedTime: "10:30:00",
  high: 26.0,
  low: 25.0,
  previousClose: 25.0,
};

describe("fetchTradeSummary", () => {
  it("sends POST to /api/market-data/trade-summary", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reqTradeSummery: [mockItem] }),
    });
    await fetchTradeSummary();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/market-data/trade-summary",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns reqTradeSummery array from response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reqTradeSummery: [mockItem] }),
    });
    const result = await fetchTradeSummary();
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("AAF.N0000");
  });

  it("returns empty array on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await fetchTradeSummary();
    expect(result).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));
    const result = await fetchTradeSummary();
    expect(result).toEqual([]);
  });

  it("maps all TradeSummaryItem fields correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reqTradeSummery: [mockItem] }),
    });
    const result = await fetchTradeSummary();
    expect(result[0]).toMatchObject({
      symbol: "AAF.N0000",
      name: "AAF Limited",
      price: 25.5,
      change: 0.5,
      percentageChange: 2.0,
      volume: 10000,
      turnover: 255000,
    });
  });

  it("handles missing optional fields (high, low) with undefined", async () => {
    const itemWithoutOptionals = {
      symbol: "LOLC.N0000",
      name: "LOLC",
      price: 100,
      change: 1,
      percentageChange: 1,
      volume: 5000,
      turnover: 500000,
      lastTradedTime: "09:00:00",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reqTradeSummery: [itemWithoutOptionals] }),
    });
    const result = await fetchTradeSummary();
    expect(result[0].high).toBeUndefined();
    expect(result[0].low).toBeUndefined();
  });

  it("includes correct Content-Type header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reqTradeSummery: [] }),
    });
    await fetchTradeSummary();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("returns empty array when reqTradeSummery key is missing from response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    const result = await fetchTradeSummary();
    expect(result).toEqual([]);
  });
});
