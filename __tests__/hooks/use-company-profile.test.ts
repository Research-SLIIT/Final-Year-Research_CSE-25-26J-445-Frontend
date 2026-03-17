import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCompanyProfile } from "@/hooks/use-company-profile";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

const mockApiResponse = {
  reqComSumInfo: [
    {
      securityId: 1,
      registerOffice: "123 Main St, Colombo",
      tel1: "+94-11-1234567",
      name: "AAF Limited",
      symbol: "AAF.N0000",
      fax: "+94-11-7654321",
      email1: "info@aaf.lk",
      web: "https://www.aaf.lk",
      sector: "Finance",
      boardType: "Main Board",
    },
  ],
  reqLogo: {
    path: "logos/aaf.png",
  },
};

describe("useCompanyProfile", () => {
  it("initializes with null data, false loading, null error", () => {
    const { result } = renderHook(() => useCompanyProfile());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("fetchProfile does nothing when symbol is empty string", async () => {
    const { result } = renderHook(() => useCompanyProfile());
    await act(async () => {
      await result.current.fetchProfile("");
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls /api/company-profile?symbol=<encoded> URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });
    const { result } = renderHook(() => useCompanyProfile());
    await act(async () => {
      await result.current.fetchProfile("AAF.N0000");
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/company-profile?symbol=")
    );
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("AAF");
  });

  it("sets loading=true during fetch and false after", async () => {
    let resolvePromise: (v: any) => void;
    const pendingFetch = new Promise((res) => { resolvePromise = res; });
    mockFetch.mockReturnValueOnce(pendingFetch);

    const { result } = renderHook(() => useCompanyProfile());

    act(() => {
      result.current.fetchProfile("AAF");
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({ ok: true, json: async () => mockApiResponse });
    });

    expect(result.current.loading).toBe(false);
  });

  it("parses reqComSumInfo[0] into summary", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });
    const { result } = renderHook(() => useCompanyProfile());
    await act(async () => {
      await result.current.fetchProfile("AAF.N0000");
    });
    expect(result.current.data?.summary?.name).toBe("AAF Limited");
    expect(result.current.data?.summary?.sector).toBe("Finance");
  });

  it("constructs logo URL as https://cdn.cse.lk/cmt/{path}", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });
    const { result } = renderHook(() => useCompanyProfile());
    await act(async () => {
      await result.current.fetchProfile("AAF.N0000");
    });
    expect(result.current.data?.logoUrl).toBe("https://cdn.cse.lk/cmt/logos/aaf.png");
  });

  it("logoUrl is null when reqLogo.path is missing", async () => {
    const responseWithoutLogo = { ...mockApiResponse, reqLogo: null };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithoutLogo,
    });
    const { result } = renderHook(() => useCompanyProfile());
    await act(async () => {
      await result.current.fetchProfile("AAF.N0000");
    });
    expect(result.current.data?.logoUrl).toBeNull();
  });

  it("stores error message on HTTP failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const { result } = renderHook(() => useCompanyProfile());
    await act(async () => {
      await result.current.fetchProfile("UNKNOWN");
    });
    expect(result.current.error).toContain("404");
  });

  it("sets data to null on HTTP failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const { result } = renderHook(() => useCompanyProfile());
    await act(async () => {
      await result.current.fetchProfile("AAF");
    });
    expect(result.current.data).toBeNull();
  });

  it("reset() clears data, error, loading", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });
    const { result } = renderHook(() => useCompanyProfile());
    await act(async () => {
      await result.current.fetchProfile("AAF.N0000");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
