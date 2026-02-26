"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { newsGetById, type NewsArticle } from "@/lib/fakeApi"
import { analyzeNews, type AnalyzeResponse } from "@/lib/sentimentApi"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnalysisBreakdown } from "@/components/analysis/AnalysisBreakdown"
import { ArrowLeft } from "lucide-react"

// Mock explanation data for demonstration
const MOCK_EXPLANATION = {
  decision_tree: [
    {
      passed: true,
      description:
        "News article contains significant market-moving keywords and company mentions. Impact detection model triggered with high confidence.",
      score: 0.87,
      threshold: 0.5,
    },
    {
      description:
        "ML LSTM model analyzed sentiment trajectory and market context. Strong bullish signals detected from historical patterns.",
      direction: "positive",
      raw_score: 0.78,
      confidence: 0.85,
      source: "LSTM Sentiment Model",
    },
    {
      description:
        "Lexicon-based sentiment analysis found bullish keywords including 'growth', 'positive', 'earnings', 'upside'. Low contradiction with ML prediction.",
      score: 0.72,
      confidence: 0.81,
      triggered_rules: "growth, positive sentiment, earnings boost, market upside",
    },
    {
      description:
        "Fusion layer weighted ML model (60%) and Lexicon analysis (40%) to produce final prediction. Both signals aligned positively.",
      weights: { "ML Model": 0.6, "Lexicon Analysis": 0.4 },
    },
  ],
  final_decision: "POSITIVE",
  final_score: 0.78,
  model_confidence: 0.83,
}

export default function NewsDetail() {
  const params = useParams()
  const router = useRouter()

  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = params.id as string
        const articleData = await newsGetById(id)
        if (!articleData) return

        setArticle(articleData)

        setAnalyzing(true)
        const result = await analyzeNews(
          articleData.content || articleData.summary
        )
        // Add mock explanation if backend doesn't provide one
        if (!result.explanation) {
          result.explanation = MOCK_EXPLANATION
        }
        setAnalysis(result)
      } catch (err) {
        console.error("Failed to load article or analysis:", err)
      } finally {
        setAnalyzing(false)
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Article not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const examples = analysis?.historical_context?.examples ?? []
  const total = examples.length

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to News
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= MAIN CONTENT ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* -------- Article -------- */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl font-bold">{article.title}</h1>

              <div className="text-sm text-muted-foreground">
                {article.source} •{" "}
                {new Date(article.publishedDate).toLocaleDateString()}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">{article.summary}</p>

              {article.content && (
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {article.content}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* -------- Analysis Breakdown -------- */}
          {!analyzing && analysis?.explanation && (
            <AnalysisBreakdown explanation={analysis.explanation} />
          )}

          {/* -------- Historical Market Context -------- */}
          {total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historical Market Context</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Similar market-moving events retrieved using semantic similarity
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        {/* ✅ TITLE + URL (SAFE) */}
                        {ex.url ? (
                          <a
                            href={ex.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-400 hover:underline"
                          >
                            {ex.title ?? "Untitled article"}
                          </a>
                        ) : (
                          <p className="font-medium">
                            {ex.title ?? "Untitled article"}
                          </p>
                        )}

                        {/* ✅ DATE (DEFENSIVE) */}
                        <p className="text-xs text-muted-foreground">
                          {ex.article_date
                            ? new Date(ex.article_date).toLocaleDateString()
                            : "Date unavailable"}
                        </p>
                      </div>

                      {/* ✅ REACTION BADGE */}
                      <Badge
                        className={
                          ex.reaction_label === "positive"
                            ? "bg-green-600"
                            : ex.reaction_label === "negative"
                            ? "bg-red-600"
                            : "bg-gray-600"
                        }
                      >
                        {ex.reaction_label}
                      </Badge>
                    </div>

                    {/* ✅ MARKET REACTION TEXT */}
                    <p className="text-sm mt-2 text-muted-foreground">
                      Market reaction:{" "}
                      {ex.reaction_label === "positive" &&
                        Number.isFinite(ex.max_daily_up) && (
                          <span className="text-green-600">
                            +{Number(ex.max_daily_up).toFixed(2)}% max upside
                          </span>
                        )}

                      {ex.reaction_label === "negative" &&
                        Number.isFinite(ex.max_daily_down) && (
                          <span className="text-red-600">
                            {Number(ex.max_daily_down).toFixed(2)}% max downside
                          </span>
                        )}

                      {ex.reaction_label === "neutral" && (
                        <span className="text-gray-500">
                          No significant price reaction
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ================= SIDEBAR ================= */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Market Impact Analysis</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {analyzing && (
                <p className="text-sm text-muted-foreground">
                  Running market impact analysis…
                </p>
              )}

              {!analyzing && analysis && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Impact</p>
                    <p className="font-semibold capitalize">
                      {analysis.impact.replace("_", " ")}
                    </p>
                  </div>

                  {analysis.direction && (
                    <div>
                      <p className="text-sm text-muted-foreground">Direction</p>
                      <p
                        className={
                          analysis.direction === "positive"
                            ? "font-semibold text-green-500"
                            : "font-semibold text-red-500"
                        }
                      >
                        {analysis.direction}
                      </p>
                    </div>
                  )}

                  {analysis.historical_context?.narrative && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-medium mb-1">
                        Historical Summary
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.historical_context.narrative}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
