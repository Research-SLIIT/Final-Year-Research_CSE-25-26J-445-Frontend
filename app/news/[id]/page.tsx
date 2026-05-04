"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { newsGetById, type NewsArticle } from "@/lib/fakeApi"
import { analyzeNews, type AnalyzeResponse } from "@/lib/sentimentApi"
import { fetchTradeSummary, type TradeSummaryItem } from "@/lib/api/market-data.api"
import companiesData from "@/data/mock/companies.json"

import { usePredictStore } from "@/stores/usePredictStore"
import { useRiskStore } from "@/stores/useRiskStore"
import { useDividendStore } from "@/stores/useDividendStore"
import { TrendingUp, ShieldAlert, Coins } from "lucide-react"

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

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnalysisBreakdown } from "@/components/analysis/AnalysisBreakdown"
import { AnalysisDisclaimer } from "@/components/analysis/AnalysisDisclaimer"
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

  const setPredictInputs = usePredictStore((state) => state.setInputs)
  const setRiskInputs = useRiskStore((state) => state.setInputs)
  const setDividendInputs = useDividendStore((state) => state.setInputs)

  const handleQuickAction = (ticker: string, type: 'predict' | 'risk' | 'dividend') => {
    // Basic ticker is often needed (without .NXX if it exists)
    const baseTicker = ticker.split('.')[0];
    
    if (type === 'predict') {
      setPredictInputs({ symbol: ticker });
      router.push('/predict');
    } else if (type === 'risk') {
      setRiskInputs({ 
        symbol: ticker,
        dateRange: { start: "", end: "" },
        riskProfile: "Basic"
      });
      router.push('/risk');
    } else if (type === 'dividend') {
      setDividendInputs({ symbol: ticker });
      router.push('/dividend');
    }
  }
  const [marketData, setMarketData] = useState<Record<string, TradeSummaryItem>>({})
  const [hoveredExampleIndex, setHoveredExampleIndex] = useState<number | null>(null)

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

          // Fetch live market data if companies are identified
          if (result.identified_companies?.[0]) {
            try {
              const summary = await fetchTradeSummary();
              const lookup: Record<string, TradeSummaryItem> = {};
              summary.forEach(item => {
                lookup[item.symbol] = item;
              });
              setMarketData(lookup);
            } catch (marketErr) {
              console.error("Failed to fetch market data:", marketErr);
            }
          }
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
                    <BarChart 
                      data={chartData}
                      onMouseMove={(state: any) => {
                        if (state?.isTooltipActive && state?.activeTooltipIndex !== undefined) {
                          setHoveredExampleIndex(state.activeTooltipIndex);
                        } else {
                          setHoveredExampleIndex(null);
                        }
                      }}
                      onMouseLeave={() => setHoveredExampleIndex(null)}
                    >
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
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      hoveredExampleIndex === idx 
                        ? 'bg-blue-500/10 border-blue-500/50 scale-[1.02] shadow-sm shadow-blue-500/10' 
                        : 'bg-muted/30 border-border'
                    }`}
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
                          threshold={analysis?.explanation?.decision_tree?.[0]?.threshold ?? 0.3}
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

          {/* -------- Identified Companies -------- */}
          {!analyzing && analysis && analysis.identified_companies && analysis.identified_companies.length > 0 && (
            <Card className="mt-6 border-blue-500/20 bg-blue-500/5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Identified Entities
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-4 space-y-4">
                {analysis.identified_companies.map((company, idx) => {
                  const data = marketData[company.ticker];
                  return (
                    <div key={idx} className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:bg-slate-900/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/40 group overflow-hidden relative">
                      {/* Interactive background glow */}
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                      
                      {/* Top Row: Identity & Price */}
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex gap-4">
                          <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(company.company_name))}&background=2563eb&color=fff&size=100&bold=true&font-size=0.4`} 
                              alt={company.company_name}
                              className="h-full w-full object-cover"
                            />
                            {data && (
                              <div className="absolute top-0 right-0 p-1">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold truncate text-white group-hover:text-blue-400 transition-colors" title={company.company_name}>
                                {company.company_name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] px-2 py-0 h-4.5 bg-slate-800/50 text-blue-300 border-blue-500/30 font-mono tracking-wider">
                                {company.ticker}
                              </Badge>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {getCompanySector(company.ticker)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {data && (
                          <div className="flex flex-col items-end">
                            <div className="text-lg font-black text-white tracking-tighter">
                              <span className="text-[10px] text-slate-500 mr-1 font-medium">LKR</span>
                              {data.price.toFixed(2)}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`text-[10px] px-2 py-0.5 mt-1 border-0 font-bold ${
                                data.percentageChange >= 0 
                                  ? "bg-emerald-500/20 text-emerald-400" 
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {data.percentageChange >= 0 ? "↑" : "↓"} {Math.abs(data.percentageChange).toFixed(2)}%
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Middle: Market Quick Stats */}
                      {data && (
                        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800/30 relative z-10 transition-colors group-hover:bg-slate-950/60">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">High</span>
                            <span className="text-xs font-semibold text-slate-200 mt-0.5">{(data.high || data.price).toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Low</span>
                            <span className="text-xs font-semibold text-slate-200 mt-0.5">{(data.low || data.price).toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Volume</span>
                            <span className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
                              {(data.sharevolume || data.volume || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="relative z-10 pt-1">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Extraction Match</span>
                          </div>
                          <span className="text-[10.5px] font-black text-blue-400">{(company.confidence).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-400 rounded-full transition-all duration-[2000ms] cubic-bezier(0.34, 1.56, 0.64, 1)" 
                            style={{ width: `${company.confidence}%` }} 
                          />
                        </div>
                      </div>

                      {/* Quick Actions Row */}
                      <div className="relative z-10 pt-3 flex flex-col gap-2 border-t border-slate-800/30">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-full text-[11px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/20 rounded-lg flex items-center justify-start gap-2.5 transition-all px-4"
                          onClick={() => handleQuickAction(company.ticker, 'predict')}
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                          Price Prediction
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-full text-[11px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/20 rounded-lg flex items-center justify-start gap-2.5 transition-all px-4"
                          onClick={() => handleQuickAction(company.ticker, 'risk')}
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Risk Analysis
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 rounded-lg flex items-center justify-start gap-2.5 transition-all px-4"
                          onClick={() => handleQuickAction(company.ticker, 'dividend')}
                        >
                          <Coins className="h-3.5 w-3.5" />
                          Dividend Prediction
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* -------- Disclaimer -------- */}
          {!analyzing && analysis && (
            <div className="mt-6">
              <AnalysisDisclaimer />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
