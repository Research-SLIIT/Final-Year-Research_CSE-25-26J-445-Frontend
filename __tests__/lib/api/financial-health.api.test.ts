import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAnalyzeCSEStreamUrl,
  getReportHealthCheckStreamUrl,
  getCompanyHealthHistory,
} from "@/lib/api/financial-health.api";

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

describe("getAnalyzeCSEStreamUrl", () => {
  it("encodes symbol and returns correct URL path", () => {
    const url = getAnalyzeCSEStreamUrl("AAF");
    expect(url).toContain("/api/v1/financial-health/analyze-cse/AAF/stream");
  });

  it("encodes special characters in symbol", () => {
    const url = getAnalyzeCSEStreamUrl("AAF.N0000");
    expect(url).toContain(encodeURIComponent("AAF.N0000"));
  });
});

describe("getReportHealthCheckStreamUrl", () => {
  it("encodes symbol and returns correct URL path", () => {
    const url = getReportHealthCheckStreamUrl("LOLC");
    expect(url).toContain("/api/v1/financial-health/report-health-check/LOLC/stream");
  });
});

describe("getCompanyHealthHistory", () => {
  const mockHistory = {
    data: [
      {
        QuarterDate: "1/1/2023",
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
      },
    ],
  };

  it("fetches from correct URL with lowercased and underscore-replaced companyCode", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockHistory));
    await getCompanyHealthHistory("ACL.N0000");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/v1/financial-health/company/");
    // The company code should be lowercased and dot replaced with underscore
    expect(calledUrl).toContain("acl_n0000");
  });

  it("returns typed CompanyHealthHistoryResponse on success", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(mockHistory));
    const result = await getCompanyHealthHistory("ACL");
    expect(result).toEqual(mockHistory);
  });

  it("throws error with message from response body on failure", async () => {
    mockFetch.mockReturnValueOnce(makeFetchError(404, { message: "Company not found" }));
    await expect(getCompanyHealthHistory("FAKE")).rejects.toThrow("Company not found");
  });

  it("throws generic error when response has no message field", async () => {
    mockFetch.mockReturnValueOnce(makeFetchError(500));
    await expect(getCompanyHealthHistory("AAF")).rejects.toThrow("Failed to fetch");
  });

  it("rethrows Error instances from catch block unchanged", async () => {
    const originalError = new Error("Custom error message");
    mockFetch.mockRejectedValueOnce(originalError);
    await expect(getCompanyHealthHistory("AAF")).rejects.toThrow("Custom error message");
  });

  it("wraps non-Error throws in a generic error message", async () => {
    mockFetch.mockRejectedValueOnce("string error");
    await expect(getCompanyHealthHistory("AAF")).rejects.toThrow(
      "An unexpected error occurred while fetching company health history"
    );
  });
});
