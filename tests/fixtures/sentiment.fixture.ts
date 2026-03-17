export const mockAnalyzeResponse = {
  impact: "impactful" as const,
  direction: "positive" as const,
  identified_companies: ["AAF", "LOLC"],
  historical_context: {
    examples: [
      {
        headline: "AAF posts strong quarterly results",
        date: "2024-12-01",
        direction: "positive",
        max_daily_up: 3.5,
        max_daily_down: -1.2,
      },
    ],
    narrative: "Historically, similar news has led to positive market reactions.",
    stats: {
      positive_pct: 65,
      neutral_pct: 20,
      negative_pct: 15,
    },
  },
  explanation: {
    decision_tree: [
      {
        passed: true,
        description: "News detected as market-impactful.",
        score: 0.8,
        threshold: 0.5,
      },
      {
        direction: "positive",
        description: "ML model predicts positive direction.",
        raw_score: 0.75,
        confidence: 0.85,
        source: "FinBERT ensemble",
      },
      {
        description: "Lexicon sentiment is positive.",
        score: 0.6,
        confidence: 0.78,
        triggered_rules: "profit, growth, dividend",
      },
      {
        description: "Fusion of ML and lexicon signals.",
        weights: { ML: 0.6, Lexicon: 0.4 },
      },
    ],
    final_decision: "positive",
    final_score: 0.72,
    model_confidence: 0.82,
  },
};

export const mockNonImpactfulAnalyzeResponse = {
  impact: false,
  direction: "neutral",
  identified_companies: [],
  historical_context: {
    examples: [],
    narrative: "No significant historical precedent found.",
    stats: {
      positive_pct: 30,
      neutral_pct: 50,
      negative_pct: 20,
    },
  },
  explanation: null,
};

export const mockNewsArticles = [
  {
    id: "1",
    title: "AAF posts strong quarterly profit growth",
    source: "Daily FT",
    publishedDate: "2025-01-01T08:00:00Z",
    summary: "AAF Limited reported 20% profit growth in Q4 2024.",
    tags: ["profit", "growth", "dividends"],
    content: "Full article content here.",
    url: "https://example.com/1",
  },
  {
    id: "2",
    title: "Market rally on bullish economic data",
    source: "LBO",
    publishedDate: "2025-01-02T09:00:00Z",
    summary: "CSE rallied on positive economic outlook.",
    tags: ["bull", "recovery"],
    content: "Full article content here.",
    url: "https://example.com/2",
  },
  {
    id: "3",
    title: "Interest rate concerns weigh on market",
    source: "Sunday Times",
    publishedDate: "2025-01-03T10:00:00Z",
    summary: "Rising rates create headwinds for equities.",
    tags: ["risk", "debt"],
    content: "Full article content here.",
    url: "https://example.com/3",
  },
];
