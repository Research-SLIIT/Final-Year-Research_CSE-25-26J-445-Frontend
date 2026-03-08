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
import { ScoreBar } from "@/components/analysis/ScoreBar"
import { AITerminalStream } from "@/components/news/AITerminalStream"
import { ArrowLeft } from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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
        
        setArticle(articleData || null)
        setLoading(false) // Hide global spinner so UI can render the article + terminal

        if (!articleData) return

        // Only analyze if there is meaningful text content
        const textToAnalyze = (articleData.content || articleData.summary || "").trim()
        if (textToAnalyze.length > 20) {
          setAnalyzing(true)
          const result = await analyzeNews(textToAnalyze)
          setAnalysis(result)
        }

      } catch (err) {
        console.error("Failed to load article or analysis:", err)
        setLoading(false)
      } finally {
        setAnalyzing(false)
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
  const chartData =
    total > 0
      ? examples.map((ex, idx) => ({
          name: ex.article_date
            ? new Date(ex.article_date).toLocaleDateString()
            : `#${idx + 1}`,
          up: ex.max_daily_up ?? 0,
          down: ex.max_daily_down ?? 0,
        }))
      : []

  const impactScore =
    analysis?.explanation?.decision_tree?.[0]?.score ??
    analysis?.explanation?.final_score ??
    null

  const stats = analysis?.historical_context?.stats
  const reactionMix =
    stats &&
    (typeof stats.positive_pct === "number" ||
      typeof stats.neutral_pct === "number" ||
      typeof stats.negative_pct === "number")
      ? [
          { name: "Positive", value: Math.max(stats.positive_pct ?? 0, 0) },
          { name: "Neutral", value: Math.max(stats.neutral_pct ?? 0, 0) },
          { name: "Negative", value: Math.max(stats.negative_pct ?? 0, 0) },
        ]
      : null

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
          {analyzing && (
            <div className="mt-8">
              <AITerminalStream />
            </div>
          )}
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
                {/* ===== Historical reaction mini-chart ===== */}
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" hide />
                      <YAxis
                        tickFormatter={(value) => `${value}%`}
                        stroke="#64748b"
                        fontSize={10}
                      />
                      <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                      <Tooltip
                        formatter={(value, key) => [
                          `${Number(value as number).toFixed(2)}%`,
                          key === "up" ? "Max daily up" : "Max daily down",
                        ]}
                      />
                      <Bar
                        dataKey="up"
                        name="Max daily up"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="down"
                        name="Max daily down"
                        fill="#ef4444"
                        radius={[0, 0, 4, 4]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* ===== Individual examples list ===== */}
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
                        <span className="text-gray-500 inline-flex flex-wrap items-center gap-2">
                          {Number.isFinite(ex.max_daily_up) ||
                          Number.isFinite(ex.max_daily_down) ? (
                            <>
                              <span className="text-gray-500">Range</span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-300 px-2 py-0.5 text-xs font-medium">
                                <span className="opacity-80">Max up</span>
                                <span>
                                  {Number.isFinite(ex.max_daily_up)
                                    ? `+${Number(ex.max_daily_up).toFixed(2)}%`
                                    : "—"}
                                </span>
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 text-red-300 px-2 py-0.5 text-xs font-medium">
                                <span className="opacity-80">Max down</span>
                                <span>
                                  {Number.isFinite(ex.max_daily_down)
                                    ? `${Number(ex.max_daily_down).toFixed(2)}%`
                                    : "—"}
                                </span>
                              </span>
                            </>
                          ) : (
                            "No significant price reaction"
                          )}
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-blue-400 animate-pulse font-medium">Processing...</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/2 animate-[progress_2s_ease-in-out_infinite]" />
                  </div>
                </div>
              )}

              {!analyzing && analysis && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Impact</p>
                    <p className="font-semibold capitalize">
                      {analysis.impact.replace("_", " ")}
                    </p>
                    {impactScore !== null && (
                      <div className="mt-2">
                        <ScoreBar
                          score={impactScore}
                          threshold={0.5}
                          label={`Impact strength (${(impactScore * 100).toFixed(
                            0
                          )}%)`}
                        />
                      </div>
                    )}
                  </div>

                  {reactionMix && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-medium mb-2">
                        Historical reaction mix
                      </p>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip
                              formatter={(value, name) => [
                                `${(Number(value) * 100).toFixed(0)}%`,
                                String(name),
                              ]}
                            />
                            <Pie
                              data={reactionMix}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={2}
                              stroke="rgba(148,163,184,0.2)"
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#94a3b8" />
                              <Cell fill="#ef4444" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground -mt-2">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Positive
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          Neutral
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Negative
                        </span>
                      </div>
                    </div>
                  )}

                  {analysis.direction && (
                    <div>
                      <p className="text-sm text-muted-foreground">Direction</p>
                      <p
                        className={
                          analysis.direction === "positive"
                            ? "font-semibold text-green-500 capitalize"
                            : "font-semibold text-red-500 capitalize"
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
