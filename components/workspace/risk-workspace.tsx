"use client"

import { useCallback, useEffect, useState } from "react"
import { runRiskAnalysis, getOhlcvSnapshot, type OhlcvSnapshot } from "@/lib/fakeApi"
import { useRiskStore } from "@/stores/useRiskStore"
import { useFinancialHealth } from "@/hooks/use-financial-health"
import { useCompanyHealthHistory } from "@/hooks/use-company-health-history"
import { useReportHealthCheck } from "@/hooks/use-report-health-check"
import { KpiCard } from "@/components/kpi-card"
import { ChartCard } from "@/components/chart-card"
import { MetricsChart } from "@/components/metrics-chart"
import { ZScoreGauge } from "@/components/z-score-gauge"
import { AnalysisProgress } from "@/components/analysis-progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts"
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, FileText, ExternalLink, Lightbulb, Target, ArrowUpRight, ArrowDownRight, Shield, Gauge, Info, ClipboardList } from "lucide-react"

// Helper function to get zone color
const getZoneColor = (zone: string) => {
  switch (zone) {
    case 'Safe':
      return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
    case 'Grey':
      return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
    case 'Distress':
      return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

// Helper function to get zone icon
const getZoneIcon = (zone: string) => {
  switch (zone) {
    case 'Safe':
      return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
    case 'Grey':
      return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
    case 'Distress':
      return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
    default:
      return null
  }
}

// Helper function to get health check status color
const getHealthStatusColor = (status: string) => {
  switch (status) {
    case 'Excellent':
      return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
    case 'Good':
      return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
    case 'Average':
      return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
    case 'Poor':
      return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30'
    case 'Critical':
      return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

// Helper function to get score ring color
const getScoreColor = (score: number) => {
  if (score >= 90) return '#22c55e' // green
  if (score >= 70) return '#3b82f6' // blue
  if (score >= 50) return '#f59e0b' // amber
  if (score >= 30) return '#f97316' // orange
  return '#ef4444' // red
}

// Helper to format percentage
const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`

// Helper to format decimal
const formatDecimal = (value: number) => value.toFixed(4)

// Helper function to get Z-Score zone
const getZScoreZone = (zScore: number): 'Safe' | 'Grey' | 'Distress' => {
  if (zScore > 2.99) return 'Safe'
  if (zScore >= 1.81) return 'Grey'
  return 'Distress'
}

export interface RiskWorkspaceProps {
  /** Canonical short code, used for display. */
  symbol: string
  /** Full exchange ticker — the financial-health endpoints key on this form. */
  cseSymbol: string
}

export function RiskWorkspace({ symbol, cseSymbol }: RiskWorkspaceProps) {
  const { inputs, results, loading, setInputs, setResults, setLoading } = useRiskStore()
  const [snapshot, setSnapshot] = useState<OhlcvSnapshot | null>(null)
  const { toast } = useToast()

  // Each hook is handed the symbol it is meant to be showing, so a remount —
  // which is what a tab switch is — renders the cached analysis on the first
  // frame instead of re-streaming it.
  const {
    data: financialHealthData,
    loading: financialHealthLoading,
    error: financialHealthError,
    events: financialHealthEvents,
    fromCache: financialHealthFromCache,
    fetchAnalysis,
  } = useFinancialHealth(cseSymbol)

  const {
    chartData: historyChartData,
    loading: historyLoading,
    error: historyError,
    fetchHistory,
  } = useCompanyHealthHistory(cseSymbol)

  const {
    data: healthCheckData,
    loading: healthCheckLoading,
    error: healthCheckError,
    events: healthCheckEvents,
    fromCache: healthCheckFromCache,
    fetchHealthCheck,
  } = useReportHealthCheck(cseSymbol)

  /**
   * The three calls that make up a full risk read for one company.
   * `force` is what the Re-run button passes to go past the cache.
   */
  const runAnalysis = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!cseSymbol) return

      // Read through getState rather than the subscribed `inputs`: the store keeps
      // date range and risk profile alongside the symbol, and depending on the
      // rendered value here would re-arm the effect below on every store write.
      setInputs({ ...useRiskStore.getState().inputs, symbol: cseSymbol })
      setSnapshot(null)
      setResults(null)

      await Promise.all([
        fetchAnalysis(cseSymbol, { force }),
        fetchHistory(cseSymbol, { force }),
        fetchHealthCheck(cseSymbol, { force }),
      ])
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [cseSymbol],
  )

  // The company now comes from the route, so the analysis runs on arrival
  // instead of waiting for the user to re-pick a company they already chose.
  // On a revisit every call resolves straight out of the cache.
  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  const handleAnalyze = async () => {
    if (!inputs.symbol) {
      toast({ title: "Error", description: "Please select a stock", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      // Get OHLCV snapshot
      const snap = await getOhlcvSnapshot(inputs.symbol)
      setSnapshot(snap)

      // Run risk analysis
      const result = await runRiskAnalysis(inputs.symbol, inputs.dateRange, inputs.riskProfile)
      setResults(result)
    } catch (error) {
      toast({ title: "Error", description: "Failed to run analysis", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Prepare feature impact chart data
  const getFeatureImpactChartData = () => {
    if (!financialHealthData?.explanation?.featureImpacts) return []
    return financialHealthData.explanation.featureImpacts.map(item => ({
      name: item.displayName.length > 20 ? item.displayName.substring(0, 20) + '...' : item.displayName,
      fullName: item.displayName,
      impact: item.impact,
      value: item.value,
      direction: item.direction,
      context: item.thresholdContext
    }))
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-background via-background to-muted/20 p-6 shadow-sm">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-500/8 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 shrink-0">
              <Shield className="h-7 w-7 text-white" />
            </div>

            {/* Title & subtitle */}
            <div className="space-y-0.5">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Financial Risk Analysis</h2>
              <p className="text-sm text-muted-foreground">
                Financial health and Z-Score outlook for <span className="font-mono">{symbol}</span>
              </p>
            </div>
          </div>

          {/* Status pill + re-run. The company arrives from the route, so the
              only action left here is asking for a fresh read of it. */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ML model active · CSE market data
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => runAnalysis({ force: true })}
              disabled={financialHealthLoading}
              className="cursor-pointer"
            >
              {financialHealthLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 border-t-foreground animate-spin" />
                  Analyzing…
                </span>
              ) : (
                "Re-run analysis"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* SSE analysis progress — only while work is genuinely happening.
          Coming back to this tab replays a cached run, and re-showing a
          finished pipeline (which then fades out after ~3s) would put a
          progress bar in front of results the user already has. */}
      {!financialHealthFromCache && (
        <AnalysisProgress
          events={financialHealthEvents}
          isLoading={financialHealthLoading}
          title="Financial Health Analysis"
        />
      )}
      {!healthCheckFromCache && (
        <AnalysisProgress
          events={healthCheckEvents}
          isLoading={healthCheckLoading}
          title="Report Health Check"
        />
      )}

      {/* Financial Health Error State */}
      {financialHealthError && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Error loading financial health data</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{financialHealthError}</p>
          </CardContent>
        </Card>
      )}

      {/* Financial Health Data Display.
          The company profile card that used to open this section now sits above
          the tab strip, in CompanyProfileCard — it describes the company, not
          this analysis, and gating it behind this stream meant it only appeared
          on the Risk tab and only once the stream finished. */}
      {financialHealthData && !financialHealthLoading && (
        <>
          {/* Report provenance — what the numbers below were read from */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0" />
            <span>Analysis based on the</span>
            <Badge variant="outline" className="text-xs">
              {financialHealthData.extractedData.report_period}
            </Badge>
            <span>report for {financialHealthData.extractedData.company_name}</span>
          </div>

          {/* Next 3 Month Z-Score Prediction - Full Width */}
          {(() => {
            const predScore = financialHealthData.prediction.z_score_next_quarter
            const isDistress = predScore < 1.81
            const isGrey = predScore >= 1.81 && predScore <= 2.99
            const isSafe = predScore > 2.99
            const zoneColors = isDistress
              ? { bg: 'from-red-500/10 via-rose-500/10 to-red-500/5', border: 'border-red-500/30', glow: 'from-red-400/20', glowColor: '#ef4444', icon: 'from-red-500 to-rose-600', iconShadow: 'shadow-red-500/20', title: 'from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400', divider: 'border-red-500/20', dividerV: 'bg-red-500/20', barGradient: 'from-red-500 to-rose-500', barText: 'text-red-600 dark:text-red-400' }
              : isGrey
              ? { bg: 'from-amber-500/10 via-yellow-500/10 to-amber-500/5', border: 'border-amber-500/30', glow: 'from-amber-400/20', glowColor: '#f59e0b', icon: 'from-amber-500 to-yellow-500', iconShadow: 'shadow-amber-500/20', title: 'from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400', divider: 'border-amber-500/20', dividerV: 'bg-amber-500/20', barGradient: 'from-amber-500 to-yellow-500', barText: 'text-amber-600 dark:text-amber-400' }
              : { bg: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10', border: 'border-emerald-500/30', glow: 'from-emerald-400/20', glowColor: '#22c55e', icon: 'from-emerald-500 to-teal-500', iconShadow: 'shadow-emerald-500/20', title: 'from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400', divider: 'border-emerald-500/20', dividerV: 'bg-emerald-500/20', barGradient: 'from-emerald-500 to-teal-500', barText: 'text-emerald-600 dark:text-emerald-400' }
            return (
              <Card className={`relative overflow-hidden bg-gradient-to-br ${zoneColors.bg} ${zoneColors.border} backdrop-blur`}>
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${zoneColors.glow} to-transparent rounded-full blur-3xl`} />

                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 bg-gradient-to-br ${zoneColors.icon} rounded-lg shadow-lg ${zoneColors.iconShadow}`}>
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className={`text-lg bg-gradient-to-r ${zoneColors.title} bg-clip-text text-transparent`}>
                          Next 90 Days Z-Score Prediction
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Powered by {financialHealthData.prediction.model_name} Model
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="py-4">
                    {/* Z-Score Threshold Gauge */}
                    <ZScoreGauge
                      currentScore={financialHealthData.extractedData.ratios.z_score}
                      predictedScore={financialHealthData.prediction.z_score_next_quarter}
                      showBothScores={true}
                    />

                    {/* Change Indicator */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm ${financialHealthData.prediction.z_score_next_quarter > financialHealthData.extractedData.ratios.z_score
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                        {financialHealthData.prediction.z_score_next_quarter > financialHealthData.extractedData.ratios.z_score ? (
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`text-base font-bold ${financialHealthData.prediction.z_score_next_quarter > financialHealthData.extractedData.ratios.z_score
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                          }`}>
                          {((financialHealthData.prediction.z_score_next_quarter - financialHealthData.extractedData.ratios.z_score) / financialHealthData.extractedData.ratios.z_score * 100).toFixed(2)}%
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          change expected
                        </span>
                      </div>
                    </div>

                    {/* Model Accuracy Indicator */}
                    <div className={`mt-6 pt-4 border-t ${zoneColors.divider}`}>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground mb-1">Model Confidence</p>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${zoneColors.barGradient} rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: '86%' }}
                              />
                            </div>
                            <span className={`text-sm font-bold ${zoneColors.barText}`}>86%</span>
                          </div>
                        </div>

                        <div className={`h-8 w-px ${zoneColors.dividerV}`} />

                        <div className="text-left">
                          <p className="text-xs text-muted-foreground mb-1">Prediction Date</p>
                          <p className="text-sm font-medium">
                            {new Date(financialHealthData.prediction.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* AI Explanation Summary */}
          {/* <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{financialHealthData.explanation.summary}</p>
            </CardContent>
          </Card> */}

          {/* Key Drivers */}
          <h2 className="text-3xl font-bold tracking-tight text-foreground">🔍 Primary factors influencing the Z-Score</h2>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {financialHealthData.explanation.keyDrivers.map((driver, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <p className="text-sm text-muted-foreground">{driver}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Feature Impacts Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Feature Impact Analysis</CardTitle>
              <CardDescription>How each financial metric contributes to the Z-Score prediction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getFeatureImpactChartData()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                    <XAxis type="number" stroke="var(--color-muted-foreground)" />
                    <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `Impact: ${value.toFixed(4)}`,
                        props.payload.fullName
                      ]}
                    />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {getFeatureImpactChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.direction === 'positive' ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Positive & Negative Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-5 w-5" />
                  Positive Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialHealthData.explanation.topPositiveFactors.length > 0 ? (
                  <ul className="space-y-3">
                    {financialHealthData.explanation.topPositiveFactors.map((factor, index) => (
                      <li key={index} className="p-3 bg-green-500/10 rounded-lg">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">{factor.feature}</p>
                          <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/30">
                            +{factor.impact.toFixed(4)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Value: {factor.value.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">{factor.context}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No significant positive factors identified.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-red-500/5 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-5 w-5" />
                  Negative Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {financialHealthData.explanation.topNegativeFactors.map((factor, index) => (
                    <li key={index} className="p-3 bg-red-500/10 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{factor.feature}</p>
                        <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-500/30">
                          {factor.impact.toFixed(4)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Value: {factor.value.toFixed(4)}</p>
                      <p className="text-xs text-muted-foreground">{factor.context}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Financial Ratios Grid
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Financial Ratios</CardTitle>
              <CardDescription>Key financial metrics extracted from the Latest report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Working Capital / Total Assets</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.working_capital_to_total_assets)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Retained Earnings / Total Assets</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.retained_earnings_to_total_assets)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">EBIT / Total Assets</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.ebit_to_total_assets)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">MVE / Total Liabilities</p>
                  <p className="text-lg font-semibold">{formatDecimal(financialHealthData.extractedData.ratios.mve_to_total_liabilities)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Sales / Total Assets</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.sales_to_total_assets)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Current Ratio</p>
                  <p className="text-lg font-semibold">{formatDecimal(financialHealthData.extractedData.ratios.current_ratio)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Debt to Equity Ratio</p>
                  <p className="text-lg font-semibold">{formatDecimal(financialHealthData.extractedData.ratios.debt_to_equity_ratio)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Net Profit Margin</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.net_profit_margin)}</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Z Score</p>
                    <p className="text-xs font-bold">{financialHealthData.extractedData.ratios.z_score.toFixed(4)}</p>
                    <div className="mt-2 flex justify-center">
                      <Badge className={`${getZoneColor(financialHealthData.riskAssessment.zone)} px-4 py-1 text-xs font-medium`}>
                        {getZoneIcon(financialHealthData.riskAssessment.zone)}
                        <span className="ml-2">{financialHealthData.riskAssessment.zone} Zone</span>
                      </Badge>
                    </div>
                  </div>
                </div>

              </div>
              {financialHealthData.reportInfo?.downloadUrl && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={financialHealthData.reportInfo.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Financial Report ({financialHealthData.reportInfo.reportDate})
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* Historical Metrics Chart */}
          <MetricsChart
            data={historyChartData}
            loading={historyLoading}
            error={historyError}
            companyCode={financialHealthData.symbol}
          />

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Recommendations
              </CardTitle>
              <CardDescription>Actionable insights to improve financial health</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {financialHealthData.explanation.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-1">{recommendation}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {/* Report Health Check Section */}
      {healthCheckLoading && (
        <Card className="bg-card border-border">
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {healthCheckError && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Error loading report health check</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{healthCheckError}</p>
          </CardContent>
        </Card>
      )}


  {financialHealthData && !financialHealthLoading && (
    <>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">📊 Key financial metrics extracted from the Latest report</h2>
                {financialHealthData.reportInfo?.downloadUrl && (
                  <a
                    href={financialHealthData.reportInfo.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Source Report ({financialHealthData.reportInfo.reportDate})
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

  {/* Financial Ratios Grid */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Financial Ratios</CardTitle>
              {/* <CardDescription>Key financial metrics extracted from the Latest report</CardDescription> */}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Working Capital / Total Assets</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.working_capital_to_total_assets)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Retained Earnings / Total Assets</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.retained_earnings_to_total_assets)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">EBIT / Total Assets</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.ebit_to_total_assets)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">MVE / Total Liabilities</p>
                  <p className="text-lg font-semibold">{formatDecimal(financialHealthData.extractedData.ratios.mve_to_total_liabilities)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Sales / Total Assets</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.sales_to_total_assets)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Current Ratio</p>
                  <p className="text-lg font-semibold">{formatDecimal(financialHealthData.extractedData.ratios.current_ratio)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Debt to Equity Ratio</p>
                  <p className="text-lg font-semibold">{formatDecimal(financialHealthData.extractedData.ratios.debt_to_equity_ratio)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Net Profit Margin</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealthData.extractedData.ratios.net_profit_margin)}</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Z Score</p>
                    <p className="text-xs font-bold">{financialHealthData.extractedData.ratios.z_score.toFixed(4)}</p>
                    <div className="mt-2 flex justify-center">
                      <Badge className={`${getZoneColor(financialHealthData.riskAssessment.zone)} px-4 py-1 text-xs font-medium`}>
                        {getZoneIcon(financialHealthData.riskAssessment.zone)}
                        <span className="ml-2">{financialHealthData.riskAssessment.zone} Zone</span>
                      </Badge>
                    </div>
                  </div>
                </div>

              </div>
              {/* {financialHealthData.reportInfo?.downloadUrl && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={financialHealthData.reportInfo.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Financial Report ({financialHealthData.reportInfo.reportDate})
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )} */}
            </CardContent>
          </Card>

          </>
        )}

      

      {healthCheckData && !healthCheckLoading && (
        <>
          <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                Latest Report Health Check
              </CardTitle>
              <CardDescription>
                {healthCheckData.companyName} • {healthCheckData.detectedIndustry}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">

                <div className="relative flex-shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/30"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={getScoreColor(healthCheckData.overallScore)}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(healthCheckData.overallScore / 100) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{healthCheckData.overallScore}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <Badge className={`${getHealthStatusColor(healthCheckData.overallStatus)} px-4 py-1 text-sm font-medium mb-3`}>
                    {healthCheckData.overallStatus}
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                    {healthCheckData.analysisNotes}
                  </p>
                  {/* {healthCheckData.reportInfo?.downloadUrl && (
                    <div className="mt-4">
                      <a
                        href={healthCheckData.reportInfo.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View Source Report ({healthCheckData.reportInfo.reportPeriod})
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )} */}
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Standard Health Checks
              </CardTitle>
              <CardDescription>Core financial health metrics assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthCheckData.standardHealthChecks.map((check, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-sm">{check.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: getScoreColor(check.score) }}>
                          {check.score}
                        </span>
                        <Badge className={`${getHealthStatusColor(check.status)} text-xs`}>
                          {check.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${check.score}%`,
                          backgroundColor: getScoreColor(check.score)
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{check.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {healthCheckData.dynamicHealthChecks.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Industry-Specific Health Checks
                </CardTitle>
                <CardDescription>Identified metrics relevant to this company's industry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthCheckData.dynamicHealthChecks.map((check, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-gradient-to-r from-muted/20 to-muted/10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-indigo-500" />
                          <h4 className="font-medium text-sm">{check.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: getScoreColor(check.score) }}>
                            {check.score}
                          </span>
                          <Badge className={`${getHealthStatusColor(check.status)} text-xs`}>
                            {check.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${check.score}%`,
                            backgroundColor: getScoreColor(check.score)
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{check.description}</p>
                      <div className="flex items-start gap-2 p-2 rounded bg-indigo-500/10 border border-indigo-500/20">
                        <Info className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                          <strong>Why this matters:</strong> {check.relevanceReason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


          {healthCheckData.recommendations.length > 0 && (
            <Card className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-teal-500" />
                  Health Check Recommendations
                </CardTitle>
                <CardDescription>Strategic recommendations based on the health assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {healthCheckData.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-1">{recommendation}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Snapshot Card */}
          {snapshot && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Market Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Open</p>
                    <p className="text-lg font-semibold">{snapshot.open.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">High</p>
                    <p className="text-lg font-semibold">{snapshot.high.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="text-lg font-semibold">{snapshot.low.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Close</p>
                    <p className="text-lg font-semibold">{snapshot.close.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-lg font-semibold">{(snapshot.volume / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              label="Value at Risk (95%)"
              value={`LKR ${results.riskMetrics.var95.toFixed(2)}`}
              description="Maximum expected loss"
            />
            <KpiCard
              label="Conditional VaR"
              value={`LKR ${results.riskMetrics.cvar.toFixed(2)}`}
              description="Expected loss beyond VaR"
            />
            <KpiCard label="Beta" value={results.riskMetrics.beta.toFixed(2)} description="Market correlation" />
            <KpiCard
              label="Volatility (20D)"
              value={`${results.riskMetrics.volatility20d.toFixed(2)}%`}
              description="Price variation"
            />
            <KpiCard
              label="Sharpe Ratio"
              value={results.riskMetrics.sharpeRatio.toFixed(2)}
              description="Risk-adjusted return"
            />
            <KpiCard
              label="Max Drawdown"
              value={`${results.riskMetrics.maxDrawdown.toFixed(2)}%`}
              description="Peak-to-trough decline"
              trend={{ value: Math.abs(results.riskMetrics.maxDrawdown), isPositive: false }}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Drawdown Curve" description="Historical peak-to-trough decline">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.drawdownData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <Line type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Rolling Volatility (20D)" description="Volatility trend over time">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.volatilityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <Line type="monotone" dataKey="volatility" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Returns Distribution" description="Frequency of returns in different ranges">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results.returnsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                <XAxis dataKey="range" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => toast({ title: "Coming soon", description: "PDF export" })}>
              Export as PDF
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Coming soon", description: "CSV export" })}>
              Export as CSV
            </Button>
          </div>
        </>
      )}

      {/* Empty state — the analysis auto-runs, so reaching here means it came
          back with nothing rather than that the user has yet to ask for it. */}
      {!financialHealthData && !financialHealthLoading && !results && !loading && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center space-y-3">
            <p className="text-muted-foreground">
              No risk analysis available for <span className="font-mono">{symbol}</span>.
            </p>
            <Button variant="outline" size="sm" onClick={() => runAnalysis({ force: true })}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
