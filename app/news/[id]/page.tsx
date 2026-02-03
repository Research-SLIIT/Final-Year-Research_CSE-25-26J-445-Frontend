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
import { ArrowLeft } from "lucide-react"

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

  // ================= HISTORICAL DISTRIBUTION =================
  const examples = analysis?.historical_context?.examples ?? []
  const total = examples.length

  const positiveCount = examples.filter(
    (e) => e.direction === "positive"
  ).length
  const negativeCount = examples.filter(
    (e) => e.direction === "negative"
  ).length

  const positivePct =
    total > 0 ? Math.round((positiveCount / total) * 100) : 0
  const negativePct =
    total > 0 ? Math.round((negativeCount / total) * 100) : 0

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

          {/* ===== HISTORICAL OUTCOME DISTRIBUTION (NEW) ===== */}
          {total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historical Outcome Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Similar events (n = {total})
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Positive */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-500">Positive</span>
                    <span>{positivePct}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{ width: `${positivePct}%` }}
                    />
                  </div>
                </div>

                {/* Negative */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-500">Negative</span>
                    <span>{negativePct}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded">
                    <div
                      className="h-2 bg-red-500 rounded"
                      style={{ width: `${negativePct}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* -------- Historical Market Context (LIST) -------- */}
          {total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historical Market Context</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Similar market-moving events retrieved using semantic
                  similarity
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
                        <p className="font-medium">{ex.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.date}
                        </p>
                      </div>

                      <Badge
                        className={
                          ex.direction === "positive"
                            ? "bg-green-600"
                            : "bg-red-600"
                        }
                      >
                        {ex.direction}
                      </Badge>
                    </div>

                    <p className="text-sm mt-2 text-muted-foreground">
                      Market reaction:{" "}

                      {ex.reaction_label === "positive" && Number.isFinite(ex.max_daily_up) && (
                        <span className="text-green-600">
                          +{Number(ex.max_daily_up).toFixed(2)}% max upside
                        </span>
                      )}

                      {ex.reaction_label === "negative" && Number.isFinite(ex.max_daily_down) && (
                        <span className="text-red-600">
                          {Number(ex.max_daily_down).toFixed(2)}% max downside
                        </span>
                      )}

                      {ex.reaction_label === "neutral" && (
                        <span className="text-gray-500">No significant price reaction</span>
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

                  {analysis.identified_companies.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Identified Companies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.identified_companies.map((c) => (
                          <Badge key={c.ticker} variant="secondary">
                            {c.matched_entity}
                          </Badge>
                        ))}
                      </div>
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
