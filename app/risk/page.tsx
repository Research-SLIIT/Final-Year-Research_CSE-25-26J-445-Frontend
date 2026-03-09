"use client"

import { useState } from "react"
import { runRiskAnalysis, getOhlcvSnapshot, type OhlcvSnapshot } from "@/lib/fakeApi"
import { useRiskStore } from "@/stores/useRiskStore"
import { useFinancialHealth } from "@/hooks/use-financial-health"
import { useCompanyHealthHistory } from "@/hooks/use-company-health-history"
import { useReportHealthCheck } from "@/hooks/use-report-health-check"
import { TickerSearch } from "@/components/ticker-search"
import { KpiCard } from "@/components/kpi-card"
import { ChartCard } from "@/components/chart-card"
import { MetricsChart } from "@/components/metrics-chart"
import { ZScoreGauge } from "@/components/z-score-gauge"
import { CompanySymbolSearch } from "@/components/company-symbol-search"
import { AnalysisProgress } from "@/components/analysis-progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts"
import { Building2, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, FileText, ExternalLink, Lightbulb, Target, ArrowUpRight, ArrowDownRight, Shield, Gauge, Info, ClipboardList } from "lucide-react"

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

export default function RiskAnalysisPage() {
  const { inputs, results, loading, setInputs, setResults, setLoading } = useRiskStore()
  const [snapshot, setSnapshot] = useState<OhlcvSnapshot | null>(null)
  const [symbolInput, setSymbolInput] = useState<string>("")
  const { toast } = useToast()

  // Use the financial health hook
  const {
    data: financialHealthData,
    loading: financialHealthLoading,
    error: financialHealthError,
    events: financialHealthEvents,
    fetchAnalysis,
    reset: resetFinancialHealth
  } = useFinancialHealth()

  // Use the company health history hook
  const {
    chartData: historyChartData,
    loading: historyLoading,
    error: historyError,
    fetchHistory,
    reset: resetHistory
  } = useCompanyHealthHistory()

  // Use the report health check hook
  const {
    data: healthCheckData,
    loading: healthCheckLoading,
    error: healthCheckError,
    events: healthCheckEvents,
    fetchHealthCheck,
    reset: resetHealthCheck
  } = useReportHealthCheck()

  // Handle manual symbol input and API call
  const handleSymbolAnalyze = async () => {
    if (!symbolInput.trim()) {
      toast({ title: "Error", description: "Please enter a stock symbol", variant: "destructive" })
      return
    }

    setInputs({ ...inputs, symbol: symbolInput.trim() })
    setSnapshot(null)
    setResults(null)

    // Fetch financial health data, history, and health check from the API
    await Promise.all([
      fetchAnalysis(symbolInput.trim()),
      fetchHistory(symbolInput.trim()),
      fetchHealthCheck(symbolInput.trim())
    ])
  }

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSymbolAnalyze()
    }
  }

  const handleSearch = async (company: any) => {
    setInputs({ ...inputs, symbol: company.symbol })
    setSymbolInput(company.symbol)
    setSnapshot(null)
    setResults(null)

    // Fetch financial health data, history, and health check from the API
    await Promise.all([
      fetchAnalysis(company.symbol),
      fetchHistory(company.symbol),
      fetchHealthCheck(company.symbol)
    ])
  }

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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Financial Risk Analysis</h1>
        <p className="text-muted-foreground">Analyze portfolio risk metrics and volatility trends</p>
      </div>

      {/* Input Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Analysis Configuration</CardTitle>
          <CardDescription>Enter a CSE stock symbol to analyze its financial health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual Symbol Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Stock Symbol</label>
            <div className="flex gap-2">
              <CompanySymbolSearch
                value={symbolInput}
                onChange={setSymbolInput}
                onSelect={(symbol) => {
                  setSymbolInput(symbol)
                }}
                onEnter={handleSymbolAnalyze}
                disabled={financialHealthLoading}
                placeholder="Search by company name or symbol..."
              />
              <Button
                onClick={handleSymbolAnalyze}
                disabled={!symbolInput.trim() || financialHealthLoading}
                className="px-6 cursor-pointer"
              >
                {financialHealthLoading ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Search for a company by name and select from the list, or enter the symbol directly
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SSE Analysis Progress */}
      <AnalysisProgress
        events={financialHealthEvents}
        isLoading={financialHealthLoading}
        title="Financial Health Analysis"
      />
      <AnalysisProgress
        events={healthCheckEvents}
        isLoading={healthCheckLoading}
        title="Report Health Check"
      />

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

      {/* Financial Health Data Display */}
      {financialHealthData && !financialHealthLoading && (
        <>
          {/* Company Basic Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Company Name</p>
                  <p className="text-sm font-semibold">{financialHealthData.extractedData.company_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Symbol</p>
                  <p className="text-sm font-semibold">{financialHealthData.symbol}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Report Period</p>
                  <p className="text-sm font-semibold">{financialHealthData.extractedData.report_period}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-sm font-semibold">{financialHealthData.extractedData.currency}</p>
                </div>
              </div>
              {/* Report Link */}
              {/* <div className="mt-4 pt-4 border-t">
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
              </div> */}
            </CardContent>
          </Card>

          {/* Next 3 Month Z-Score Prediction - Full Width */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-500/30 backdrop-blur">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-3xl" />

            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                      Next 90 Days Z-Score Prediction
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Powered by {financialHealthData.prediction.model_name} Model
                    </CardDescription>
                  </div>
                </div>

                {/* Confidence Badge */}
                {/* <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-full backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    86% Confidence
                  </span>
                </div> */}
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
                <div className="mt-6 pt-4 border-t border-emerald-500/20">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground mb-1">Model Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: '86%' }}
                          />
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">86%</span>
                      </div>
                    </div>

                    <div className="h-8 w-px bg-emerald-500/20" />

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

          {/* AI Explanation Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{financialHealthData.explanation.summary}</p>
            </CardContent>
          </Card>

          {/* Key Drivers */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Drivers
              </CardTitle>
              <CardDescription>Primary factors influencing the Z-Score</CardDescription>
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

          {/* Financial Ratios Grid */}
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
          </Card>

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

      {healthCheckData && !healthCheckLoading && (
        <>
          <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                Financial Health Check Report
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
                  {healthCheckData.reportInfo?.downloadUrl && (
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
                  )}
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

      {/* Empty State */}
      {!financialHealthData && !financialHealthLoading && !results && !loading && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">Select a stock and run the analysis to see results</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
