import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CompanyProfileCard } from "@/components/workspace/company-profile-card";
import { invalidateCache } from "@/lib/request-cache";

const profilePayload = {
  reqComSumInfo: [
    {
      securityId: 389,
      registerOffice: "475, Union Place, Colombo 02",
      tel1: "0777 887 887",
      name: "DIALOG AXIATA PLC",
      symbol: "DIAL",
      fax: null,
      email1: "ir@dialog.lk ",
      web: "www.dialog.lk",
      sector: "Telecommunication Services",
      boardType: "Main Board",
    },
  ],
  reqLogo: { path: "upload_logo/389_1601452556.jpeg" },
};

const mockFetch = vi.fn();

beforeEach(() => {
  invalidateCache();
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, json: async () => profilePayload });
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  invalidateCache();
});

describe("CompanyProfileCard", () => {
  // Regression: the card was split out of the risk workspace but nothing called
  // fetchProfile, so it only ever rendered the fallback name and symbol.
  it("fetches the profile on mount", async () => {
    render(<CompanyProfileCard symbol="DIAL.N0000" fallbackName="Dialog Axiata" />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch.mock.calls[0][0]).toContain("/api/company-profile?symbol=DIAL.N0000");
  });

  it("renders every profile field the endpoint returns", async () => {
    render(<CompanyProfileCard symbol="DIAL.N0000" fallbackName="Dialog Axiata" />);

    expect(await screen.findByText("DIALOG AXIATA PLC")).toBeInTheDocument();
    expect(screen.getByText("Telecommunication Services")).toBeInTheDocument();
    expect(screen.getByText("Main Board")).toBeInTheDocument();
    expect(screen.getByText("475, Union Place, Colombo 02")).toBeInTheDocument();
    expect(screen.getByText("0777 887 887")).toBeInTheDocument();
    expect(screen.getByText(/ir@dialog\.lk/)).toBeInTheDocument();
    expect(screen.getByText("www.dialog.lk")).toBeInTheDocument();

    // The API-provided symbol replaces the routed one once the profile lands
    expect(screen.getByText("DIAL")).toBeInTheDocument();
  });

  it("renders the logo from the CSE CDN", async () => {
    render(<CompanyProfileCard symbol="DIAL.N0000" />);

    const logo = (await screen.findByAltText("DIALOG AXIATA PLC")) as HTMLImageElement;
    expect(logo.src).toBe("https://cdn.cse.lk/cmt/upload_logo/389_1601452556.jpeg");
  });

  it("omits fields the endpoint returns as null rather than rendering a blank row", async () => {
    render(<CompanyProfileCard symbol="DIAL.N0000" />);

    await screen.findByText("DIALOG AXIATA PLC");
    expect(screen.queryByText("Fax")).not.toBeInTheDocument();
  });

  it("falls back to the directory name when the endpoint has no summary", async () => {
    // Loading shows a skeleton rather than a half-filled card, so the fallback
    // is for a company the CSE profile endpoint simply knows nothing about.
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ reqComSumInfo: [], reqLogo: null }),
    });

    render(<CompanyProfileCard symbol="DIAL.N0000" fallbackName="Dialog Axiata" />);

    expect(await screen.findByText("Dialog Axiata")).toBeInTheDocument();
    expect(screen.getByText("DIAL.N0000")).toBeInTheDocument();
  });

  it("does not refetch when remounted for the same company", async () => {
    const first = render(<CompanyProfileCard symbol="DIAL.N0000" />);
    await screen.findByText("DIALOG AXIATA PLC");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    first.unmount();

    // A tab switch remounts the page shell; the profile must survive it intact.
    render(<CompanyProfileCard symbol="DIAL.N0000" />);
    expect(screen.getByText("DIALOG AXIATA PLC")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
