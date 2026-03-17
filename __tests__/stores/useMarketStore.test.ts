import { describe, it, expect, beforeEach } from "vitest";
import { useMarketStore } from "@/stores/useMarketStore";

const mockItem = {
  symbol: "AAF.N0000",
  name: "AAF Limited",
  lastClose: 25.5,
  volume: 10000,
  return1d: 0.02,
  return5d: 0.05,
  riskLevel: "low" as const,
};

beforeEach(() => {
  useMarketStore.setState({
    watchlist: [],
    selectedSymbol: null,
    searchQuery: "",
  });
});

describe("useMarketStore", () => {
  it("initializes with empty watchlist, null selectedSymbol, empty searchQuery", () => {
    const state = useMarketStore.getState();
    expect(state.watchlist).toEqual([]);
    expect(state.selectedSymbol).toBeNull();
    expect(state.searchQuery).toBe("");
  });

  it("setWatchlist updates watchlist array", () => {
    useMarketStore.getState().setWatchlist([mockItem]);
    expect(useMarketStore.getState().watchlist).toHaveLength(1);
    expect(useMarketStore.getState().watchlist[0].symbol).toBe("AAF.N0000");
  });

  it("setSelectedSymbol updates selectedSymbol", () => {
    useMarketStore.getState().setSelectedSymbol("LOLC.N0000");
    expect(useMarketStore.getState().selectedSymbol).toBe("LOLC.N0000");
  });

  it("setSelectedSymbol(null) clears the selection", () => {
    useMarketStore.setState({ selectedSymbol: "AAF.N0000" });
    useMarketStore.getState().setSelectedSymbol(null);
    expect(useMarketStore.getState().selectedSymbol).toBeNull();
  });

  it("setSearchQuery updates searchQuery", () => {
    useMarketStore.getState().setSearchQuery("AAF");
    expect(useMarketStore.getState().searchQuery).toBe("AAF");
  });

  it("updating one field does not affect others", () => {
    useMarketStore.getState().setWatchlist([mockItem]);
    useMarketStore.getState().setSelectedSymbol("AAF.N0000");
    useMarketStore.getState().setSearchQuery("test");
    useMarketStore.getState().setSearchQuery("new query");
    // Watchlist and selectedSymbol should not be affected
    expect(useMarketStore.getState().watchlist).toHaveLength(1);
    expect(useMarketStore.getState().selectedSymbol).toBe("AAF.N0000");
    expect(useMarketStore.getState().searchQuery).toBe("new query");
  });

  it("watchlist items have correct shape after setWatchlist", () => {
    const items = [mockItem, { ...mockItem, symbol: "LOLC.N0000", name: "LOLC Holdings", riskLevel: "high" as const }];
    useMarketStore.getState().setWatchlist(items);
    const watchlist = useMarketStore.getState().watchlist;
    expect(watchlist).toHaveLength(2);
    expect(watchlist[0]).toMatchObject({ symbol: "AAF.N0000", name: "AAF Limited" });
    expect(watchlist[1]).toMatchObject({ symbol: "LOLC.N0000", riskLevel: "high" });
  });
});
