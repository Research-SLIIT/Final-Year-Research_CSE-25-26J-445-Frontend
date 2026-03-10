"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { analyzeNews, type AnalyzeResponse } from "@/lib/sentimentApi"
import { fetchTradeSummary, type TradeSummaryItem } from "@/lib/api/market-data.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AnalysisBreakdown } from "@/components/analysis/AnalysisBreakdown"
import { AnalysisDisclaimer } from "@/components/analysis/AnalysisDisclaimer"
import { AITerminalStream } from "@/components/news/AITerminalStream"
import { ScoreBar } from "@/components/analysis/ScoreBar"
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

export default function AnalyzeBox() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [marketData, setMarketData] = useState<Record<string, TradeSummaryItem>>({})
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const setPredictInputs = usePredictStore((state) => state.setInputs)
  const setRiskInputs = useRiskStore((state) => state.setInputs)
  const setDividendInputs = useDividendStore((state) => state.setInputs)

  const handleQuickAction = (ticker: string, type: 'predict' | 'risk' | 'dividend') => {
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

  const handleAnalyze = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const result = await analyzeNews(text)
      setAnalysis(result)

      // Fetch live market data
      if (result.identified_companies?.length > 0) {
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

        {loading && (
          <div className="pt-4 border-t border-border">
            <AITerminalStream />
          </div>
        )}

        {analysis && !loading && (
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-tight">Identified Entities</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.identified_companies.map((company, idx) => {
                    const data = marketData[company.ticker];
                    return (
                      <div key={idx} className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:bg-slate-900/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-500/30 group overflow-hidden relative">
                        {/* Identity & Price Row */}
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex gap-3">
                            <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/50 group-hover:scale-105 transition-transform duration-500">
                              <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(company.company_name))}&background=2563eb&color=fff&size=100&bold=true&font-size=0.4`} 
                                alt={company.company_name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold truncate text-white group-hover:text-blue-400 transition-colors" title={company.company_name}>
                                {company.company_name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-slate-800/50 text-blue-300 border-blue-500/20 font-mono">
                                  {company.ticker}
                                </Badge>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {getCompanySector(company.ticker)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {data && (
                            <div className="flex flex-col items-end">
                              <div className="text-sm font-black text-white whitespace-nowrap">
                                <span className="text-[9px] text-slate-500 mr-0.5 font-medium">LKR</span>
                                {data.price.toFixed(2)}
                              </div>
                              <div className={`text-[10px] font-bold mt-0.5 ${
                                data.percentageChange >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}>
                                {data.percentageChange >= 0 ? "↑" : "↓"} {Math.abs(data.percentageChange).toFixed(2)}%
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Confidence Indicator */}
                        <div className="relative z-10 space-y-1.5">
                          <div className="flex justify-between items-center px-0.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Match Confidence</span>
                            <span className="text-[10px] font-black text-blue-400">{(company.confidence).toFixed(0)}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${company.confidence}%` }} 
                            />
                          </div>
                        </div>

                        {/* Compact Stats if data exists */}
                        {data && (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-slate-800/30 relative z-10">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">High</span>
                              <span className="text-[10px] font-semibold text-slate-300">{(data.high || data.price).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">Low</span>
                              <span className="text-[10px] font-semibold text-slate-300">{(data.low || data.price).toFixed(2)}</span>
                            </div>
                          </div>
                        )}

                        {/* Quick Actions Row */}
                        <div className="relative z-10 pt-2 flex flex-col gap-2 border-t border-slate-800/30">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-full text-[10px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/10 rounded-md flex items-center justify-start gap-2 transition-all px-3"
                            onClick={() => handleQuickAction(company.ticker, 'predict')}
                          >
                            <TrendingUp className="h-3 w-3" />
                            Price Prediction
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-full text-[10px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/10 rounded-md flex items-center justify-start gap-2 transition-all px-3"
                            onClick={() => handleQuickAction(company.ticker, 'risk')}
                          >
                            <ShieldAlert className="h-3 w-3" />
                            Risk Analysis
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/10 rounded-md flex items-center justify-start gap-2 transition-all px-3"
                            onClick={() => handleQuickAction(company.ticker, 'dividend')}
                          >
                            <Coins className="h-3 w-3" />
                            Dividend Prediction
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
