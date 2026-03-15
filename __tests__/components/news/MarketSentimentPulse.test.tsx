import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketSentimentPulse } from "@/components/news/MarketSentimentPulse";
import type { NewsArticle } from "@/lib/fakeApi";
import { mockNewsArticles } from "@/tests/fixtures/sentiment.fixture";

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <svg>{children}</svg>,
  Area: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  defs: () => null,
  linearGradient: () => null,
  stop: () => null,
}));

describe("MarketSentimentPulse", () => {
  it("returns null when articles array is empty", () => {
    const { container } = render(<MarketSentimentPulse articles={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when only one article is provided (insufficient for chart)", () => {
    const { container } = render(
      <MarketSentimentPulse articles={[mockNewsArticles[0]] as NewsArticle[]} />
    );
    // Component returns null if chartData.length < 2
    // With 1 article on 1 unique date, chartData has 1 point
    expect(container.firstChild).toBeNull();
  });

  it("renders 'Market Pulse' heading when articles list has 2+ entries on different dates", () => {
    render(<MarketSentimentPulse articles={mockNewsArticles as NewsArticle[]} />);
    expect(screen.getByText("Market Pulse")).toBeInTheDocument();
  });

  it("shows 'Overall Sentiment' label", () => {
    render(<MarketSentimentPulse articles={mockNewsArticles as NewsArticle[]} />);
    expect(screen.getByText("Overall Sentiment:")).toBeInTheDocument();
  });

  it("renders either 'Bullish' or 'Bearish' based on computed sentiment", () => {
    render(<MarketSentimentPulse articles={mockNewsArticles as NewsArticle[]} />);
    const sentimentText = screen.getByText(/Bullish|Bearish/);
    expect(sentimentText).toBeInTheDocument();
  });
});
