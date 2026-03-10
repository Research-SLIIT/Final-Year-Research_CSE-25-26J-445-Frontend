"use client"

import { useState } from "react"
import { analyzeNews, type AnalyzeResponse } from "@/lib/sentimentApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AnalysisBreakdown } from "@/components/analysis/AnalysisBreakdown"
import { AnalysisDisclaimer } from "@/components/analysis/AnalysisDisclaimer"
import { ScoreBar } from "@/components/analysis/ScoreBar"
import companiesData from "@/data/mock/companies.json"

function getCompanySector(ticker: string) {
  const baseSymbol = ticker.split(".")[0];
  const company = companiesData.companies.find((c: any) => c.symbol === baseSymbol);
  return company?.sector && company.sector !== "Unknown"
    ? company.sector
    : "Corporate";
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0][0].toUpperCase();
}

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
            {/* Analysis Breakdown Component */}
            {analysis.explanation && (
              <AnalysisBreakdown explanation={analysis.explanation} />
            )}

            {/* Side-by-side Impact and Direction (Secondary for custom view) */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">Impact</p>
                <p className="font-semibold capitalize">
                  {analysis.impact.replace("_", " ")}
                </p>
                {analysis.explanation?.decision_tree?.[0]?.score !== undefined && (
                   <div className="mt-2">
                    <ScoreBar
                      score={analysis.explanation.decision_tree[0].score}
                      threshold={analysis.explanation.decision_tree[0].threshold ?? 0.3}
                      label={`Impact strength (${(analysis.explanation.decision_tree[0].score * 100).toFixed(0)}%)`}
                    />
                  </div>
                )}
              </div>

              {analysis.direction && (
                <div>
                  <p className="text-sm text-muted-foreground">Direction</p>
                  <p
                    className={`font-semibold capitalize ${
                      analysis.direction === "positive"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {analysis.direction}
                  </p>
                </div>
              )}
            </div>

            {/* Identified Companies (Premium Style) */}
            {analysis.identified_companies.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Identified Entities
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.identified_companies.map((company, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl bg-background/60 border border-border/50 hover:bg-background/90 transition-all hover:border-blue-500/30 group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-border shadow-sm">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(company.company_name))}&background=2563eb&color=fff&size=100&bold=true&font-size=0.4`} 
                            alt={company.company_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
                            {company.company_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {company.ticker}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {getCompanySector(company.ticker)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="pt-4 border-t border-border">
              <AnalysisDisclaimer />
            </div>

            {/* Historical Context */}
            {analysis.historical_context?.examples &&
              analysis.historical_context.examples.length > 0 && (
                <div className="pt-4 border-t border-border space-y-3">
                  <p className="text-sm font-medium">Historical Market Context</p>

                  <div className="grid grid-cols-1 gap-3">
                    {analysis.historical_context.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            {ex.url ? (
                              <a
                                href={ex.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-400 hover:underline text-sm"
                              >
                                {ex.title || ex.topic || "Untitled article"}
                              </a>
                            ) : (
                              <p className="font-medium text-sm">
                                {ex.title || ex.topic || "Untitled article"}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {ex.article_date
                                ? new Date(ex.article_date).toLocaleDateString()
                                : ex.date || "Date unavailable"}
                            </p>
                          </div>

                          <Badge
                            variant="secondary"
                            className={`text-[10px] h-5 ${
                              ex.reaction_label === "positive"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : ex.reaction_label === "negative"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }`}
                          >
                            {ex.reaction_label}
                          </Badge>
                        </div>

                        <p className="text-xs mt-2">
                          <span className="text-muted-foreground">Market reaction: </span>
                          {ex.reaction_label === "positive" &&
                            Number.isFinite(ex.max_daily_up) && (
                              <span className="text-green-500 font-medium">
                                +{Number(ex.max_daily_up).toFixed(2)}% upside
                              </span>
                            )}
                          {ex.reaction_label === "negative" &&
                            Number.isFinite(ex.max_daily_down) && (
                              <span className="text-red-500 font-medium">
                                {Number(ex.max_daily_down).toFixed(2)}% downside
                              </span>
                            )}
                          {ex.reaction_label === "neutral" && (
                            <span className="text-gray-400">No significant reaction</span>
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
