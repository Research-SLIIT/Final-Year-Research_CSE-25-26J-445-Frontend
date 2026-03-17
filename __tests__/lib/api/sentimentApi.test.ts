import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeNews } from "@/lib/sentimentApi";

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

const rawResponse = {
  impact: "impactful",
  direction: "positive",
  identified_companies: [
    { company_name: "AAF Ltd", ticker: "AAF", matched_entity: "AAF", confidence: 92 },
  ],
  historical_context: {
    narrative: "Positive market reactions observed.",
    related_news: [
      {
        Topic: "Quarterly results",
        Date: "2024-12-01",
        reaction_label: "positive",
        max_daily_up: "3.5",
        max_daily_down: "-1.2",
        faiss_rank: 1,
        url: "https://example.com/1",
        title: "Strong quarterly results",
        article_date: "2024-12-01",
      },
      {
        Topic: "Market drop",
        Date: "2024-11-15",
        reaction_label: "negative",
        max_daily_up: null,
        max_daily_down: "-2.5",
        faiss_rank: 2,
      },
    ],
    stats: {
      positive_pct: 65,
      negative_pct: 15,
      neutral_pct: 20,
      aligned_pct: 70,
    },
  },
  explanation: {
    decision_tree: [
      { description: "Impact detection", score: 0.8, threshold: 0.5, passed: true },
      { description: "ML direction", direction: "positive", raw_score: 0.75, confidence: 0.85 },
    ],
    final_decision: "positive",
    final_score: 0.72,
    model_confidence: 0.82,
  },
};

describe("analyzeNews", () => {
  it("sends a POST request to the sentiment analyze URL", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    await analyzeNews("AAF reports strong profits");
    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/sentiment/analyze");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("sends text as JSON body", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    await analyzeNews("AAF reports strong profits");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toBe("AAF reports strong profits");
  });

  it("maps raw.impact and raw.direction to response", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    const result = await analyzeNews("test");
    expect(result.impact).toBe("impactful");
    expect(result.direction).toBe("positive");
  });

  it("maps identified_companies array from raw response", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    const result = await analyzeNews("test");
    expect(result.identified_companies).toHaveLength(1);
    expect(result.identified_companies[0].ticker).toBe("AAF");
  });

  it("maps related_news to historical_context.examples with correct field names", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    const result = await analyzeNews("test");
    const examples = result.historical_context?.examples ?? [];
    expect(examples).toHaveLength(2);
    expect(examples[0].reaction_label).toBe("positive");
    expect(examples[0].topic).toBe("Quarterly results");
  });

  it("converts max_daily_up string to number", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    const result = await analyzeNews("test");
    const example = result.historical_context?.examples[0];
    expect(example?.max_daily_up).toBe(3.5);
  });

  it("maps max_daily_up to undefined when null/NaN", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    const result = await analyzeNews("test");
    const example = result.historical_context?.examples[1];
    expect(example?.max_daily_up).toBeUndefined();
  });

  it("constructs ExplanationData from raw.explanation when present", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    const result = await analyzeNews("test");
    expect(result.explanation).toBeDefined();
    expect(result.explanation?.final_decision).toBe("positive");
    expect(result.explanation?.final_score).toBe(0.72);
    expect(result.explanation?.model_confidence).toBe(0.82);
  });

  it("returns undefined explanation when raw has no explanation field", async () => {
    const noExplanation = { ...rawResponse, explanation: undefined };
    mockFetch.mockReturnValueOnce(makeFetchOk(noExplanation));
    const result = await analyzeNews("test");
    expect(result.explanation).toBeUndefined();
  });

  it("throws 'Failed to analyze news' on non-ok response", async () => {
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: false, status: 500 } as Response));
    await expect(analyzeNews("test")).rejects.toThrow("Failed to analyze news");
  });

  it("maps historical_context.stats fields correctly", async () => {
    mockFetch.mockReturnValueOnce(makeFetchOk(rawResponse));
    const result = await analyzeNews("test");
    expect(result.historical_context?.stats?.positive_pct).toBe(65);
    expect(result.historical_context?.stats?.negative_pct).toBe(15);
    expect(result.historical_context?.stats?.neutral_pct).toBe(20);
  });
});
