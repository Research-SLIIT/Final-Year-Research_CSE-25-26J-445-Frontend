"use client"

import { useState } from "react"
import { analyzeNews, type AnalyzeResponse } from "@/lib/sentimentApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

export default function AnalyzeBox() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const result = await analyzeNews(text)
      setAnalysis(result)
    } catch (err) {
      setError("Failed to analyze news. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Analyze Custom News</CardTitle>
        <p className="text-sm text-muted-foreground">
          Paste a news article or headline to analyze market impact using the
          two-stage ML model
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste news content here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />

        <div className="flex justify-end">
          <Button onClick={handleAnalyze} disabled={loading || !text.trim()}>
            {loading ? "Analyzing..." : "Analyze News"}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {analysis && (
          <div className="pt-4 border-t border-border space-y-4">
            {/* Impact */}
            <div>
              <p className="text-sm text-muted-foreground">Impact</p>
              <p className="font-semibold capitalize">
                {analysis.impact.replace("_", " ")}
              </p>
            </div>

            {/* Direction */}
            {analysis.direction && (
              <div>
                <p className="text-sm text-muted-foreground">Direction</p>
                <p
                  className={`font-semibold ${
                    analysis.direction === "positive"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {analysis.direction}
                </p>
              </div>
            )}

            {/* Companies */}
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

            {/* Historical Context */}
            {analysis.historical_context?.examples &&
              analysis.historical_context.examples.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm font-medium mb-2">
                    Historical Market Context
                  </p>

                  <div className="space-y-3">
                    {analysis.historical_context.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-border bg-muted/30"
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

                        <p className="text-sm text-muted-foreground mt-2">
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
                  </div>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
