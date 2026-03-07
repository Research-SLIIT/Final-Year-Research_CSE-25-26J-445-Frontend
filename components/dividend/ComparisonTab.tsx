"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TickerSearchDIV } from "@/components/ticker-search_div"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { type HistoricalDividendData } from "@/lib/api/dividend_api"

interface ComparisonTabProps {
  loading: boolean
  compareSymbol1: string
  compareSymbol2: string
  comparisonData1: HistoricalDividendData | null
  comparisonData2: HistoricalDividendData | null
  comparisonSelectedMetric: string
  onSymbol1Change: (company: any) => void
  onSymbol2Change: (company: any) => void
  onFetchComparison: () => void
  onMetricSelect: (metric: string) => void
  getLastDividendPaymentYear: (data: HistoricalDividendData) => number | null
  calculateDividendStreak: (data: HistoricalDividendData) => number
  calculateDividendSustainabilityScore: (data: HistoricalDividendData) => number
}

export function ComparisonTab({
  loading,
  compareSymbol1,
  compareSymbol2,
  comparisonData1,
  comparisonData2,
  comparisonSelectedMetric,
  onSymbol1Change,
  onSymbol2Change,
  onFetchComparison,
  onMetricSelect,
  getLastDividendPaymentYear,
  calculateDividendStreak,
  calculateDividendSustainabilityScore,
}: ComparisonTabProps) {
  return (
    <div className="space-y-6">
      {/* Comparison Selection Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Compare Two Firms</CardTitle>
          <CardDescription>Select two different firms to compare their financial performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Firm 1</label>
              <TickerSearchDIV 
                onSelect={onSymbol1Change} 
                placeholder="Select first firm..."
                value={compareSymbol1}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Firm 2</label>
              <TickerSearchDIV 
                onSelect={onSymbol2Change} 
                placeholder="Select second firm..."
                value={compareSymbol2}
              />
            </div>
          </div>

          <Button 
            onClick={onFetchComparison} 
            disabled={!compareSymbol1 || !compareSymbol2 || loading} 
            className="w-full md:w-auto"
          >
            {loading ? "Loading Comparison..." : "Compare Firms"}
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Data Display */}
      {comparisonData1 && comparisonData2 && (
        <div className="space-y-4">
          {/* Comparison Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Performance Comparison - {comparisonSelectedMetric}</CardTitle>
              <CardDescription>Compare financial ratios for {comparisonSelectedMetric} between {comparisonData1.firm} and {comparisonData2.firm}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metric Selection as Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "Revenue", label: "Profit Margin" },
                  { key: "EBIT", label: "EBIT Margin" },
                  { key: "Profit After Tax", label: "ROE %" },
                  { key: "Dividends Paid", label: "Dividend Payout Ratio" },
                  { key: "Total Equity", label: "Debt-to-Equity" },
                  { key: "Net Cash from Operating Activities", label: "OCF Ratio" },
                ].map((metric) => (
                  <Button
                    key={metric.key}
                    variant={comparisonSelectedMetric === metric.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => onMetricSelect(metric.key)}
                  >
                    {metric.label}
                  </Button>
                ))}
              </div>

              {/* Bar Chart for selected ratio */}
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      (() => {
                        const years1 = new Set(comparisonData1.records.map(r => r.Year))
                        const years2 = new Set(comparisonData2.records.map(r => r.Year))
                        const allYears = Array.from(new Set([...years1, ...years2])).sort((a, b) => a - b)

                        return allYears.map((year) => {
                          const record1 = comparisonData1.records.find(r => r.Year === year)
                          const record2 = comparisonData2.records.find(r => r.Year === year)

                          const getRatioValue = (record: any, metric: string) => {
                            if (!record) return null
                            switch (metric) {
                              case "Revenue": 
                                return record.Revenue !== 0 
                                  ? (record["Profit After Tax"] / record.Revenue) * 100 
                                  : 0
                              case "EBIT": 
                                return record.Revenue !== 0 
                                  ? (record.EBIT / record.Revenue) * 100 
                                  : 0
                              case "Profit After Tax": 
                                return record["Total Equity"] !== 0 && record["Total Equity"] > 0
                                  ? (record["Profit After Tax"] / record["Total Equity"]) * 100 
                                  : 0
                              case "Dividends Paid": 
                                return record["Profit After Tax"] !== 0 && record["Profit After Tax"] > 0
                                  ? (record["Dividends Paid"] / record["Profit After Tax"]) * 100 
                                  : 0
                              case "Total Equity": 
                                const totalLiabilities = record["Current Liabilities"] + record["Non-Current Liabilities"]
                                return record["Total Equity"] !== 0 && record["Total Equity"] > 0
                                  ? totalLiabilities / record["Total Equity"] 
                                  : 0
                              case "Net Cash from Operating Activities": 
                                return record.Revenue !== 0 
                                  ? (record["Net Cash from Operating Activities"] / record.Revenue) * 100 
                                  : 0
                              default: return null
                            }
                          }

                          return {
                            Year: year,
                            [comparisonData1.firm]: getRatioValue(record1, comparisonSelectedMetric),
                            [comparisonData2.firm]: getRatioValue(record2, comparisonSelectedMetric),
                          }
                        })
                      })()
                    }
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid />
                    <XAxis dataKey="Year" />
                    <YAxis label={{ value: comparisonSelectedMetric === "Total Equity" ? "Ratio" : "Percentage (%)", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip 
                      formatter={(value) => {
                        if (typeof value === 'number') {
                          return comparisonSelectedMetric === "Total Equity" 
                            ? `${value.toFixed(2)}`
                            : `${value.toFixed(2)}%`
                        }
                        return value
                      }}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey={comparisonData1.firm} fill="#3b82f6" />
                    <Bar dataKey={comparisonData2.firm} fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Comparison - Key Ratios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">{comparisonData1.firm}</CardTitle>
                <CardDescription>Latest Financial Year: {comparisonData1.records[0].Year}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/* Dividend Metrics Section */}
                <div className="border-b pb-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground font-medium">Last Dividend Payment:</span>
                    <span className="font-semibold">{getLastDividendPaymentYear(comparisonData1) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground font-medium">Dividend Streak:</span>
                    <span className="font-semibold text-green-600">{calculateDividendStreak(comparisonData1)} years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground font-medium">Sustainability Score:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Dividend Sustainability Score</p>
                            <p>Calculated based on:</p>
                            <ul className="text-xs list-disc list-inside">
                              <li>Payout ratio (30-60% ideal)</li>
                              <li>Profit margin</li>
                              <li>Return on Equity (ROE)</li>
                              <li>Debt-to-Equity ratio</li>
                              <li>Dividend payment streak</li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">{calculateDividendSustainabilityScore(comparisonData1)}/100</span>
                  </div>
                </div>

                {/* Financial Ratios Section */}
                <TooltipProvider>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Profit Margin:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Profit Margin %</p>
                            <p>(Profit After Tax / Revenue) × 100</p>
                            <p className="text-muted-foreground">Shows profitability as % of revenue</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">{((comparisonData1.records[0]["Profit After Tax"] / comparisonData1.records[0].Revenue) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">ROE:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Return on Equity %</p>
                            <p>(Profit After Tax / Total Equity) × 100</p>
                            <p className="text-muted-foreground">Returns generated from shareholder investments</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">{comparisonData1.records[0]["Total Equity"] > 0 ? ((comparisonData1.records[0]["Profit After Tax"] / comparisonData1.records[0]["Total Equity"]) * 100).toFixed(2) : "0"}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Dividend Payout:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Dividend Payout Ratio %</p>
                            <p>(Dividends Paid / Profit After Tax) × 100</p>
                            <p className="text-muted-foreground">% of profits distributed as dividends</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">{comparisonData1.records[0]["Profit After Tax"] > 0 ? ((comparisonData1.records[0]["Dividends Paid"] / comparisonData1.records[0]["Profit After Tax"]) * 100).toFixed(2) : "0"}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Debt-to-Equity:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Debt-to-Equity Ratio</p>
                            <p>Total Liabilities / Total Equity</p>
                            <p className="text-muted-foreground">Leverage: higher = more debt financed</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">
                      {comparisonData1.records[0]["Total Equity"] > 0 
                        ? (((comparisonData1.records[0]["Current Liabilities"] + comparisonData1.records[0]["Non-Current Liabilities"]) / comparisonData1.records[0]["Total Equity"])).toFixed(2)
                        : "0"}
                    </span>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">{comparisonData2.firm}</CardTitle>
                <CardDescription>Latest Financial Year: {comparisonData2.records[0].Year}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/* Dividend Metrics Section */}
                <div className="border-b pb-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground font-medium">Last Dividend Payment:</span>
                    <span className="font-semibold">{getLastDividendPaymentYear(comparisonData2) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground font-medium">Dividend Streak:</span>
                    <span className="font-semibold text-green-600">{calculateDividendStreak(comparisonData2)} years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground font-medium">Sustainability Score:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Dividend Sustainability Score</p>
                            <p>Calculated based on:</p>
                            <ul className="text-xs list-disc list-inside">
                              <li>Payout ratio (30-60% ideal)</li>
                              <li>Profit margin</li>
                              <li>Return on Equity (ROE)</li>
                              <li>Debt-to-Equity ratio</li>
                              <li>Dividend payment streak</li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">{calculateDividendSustainabilityScore(comparisonData2)}/100</span>
                  </div>
                </div>

                {/* Financial Ratios Section */}
                <TooltipProvider>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Profit Margin:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Profit Margin %</p>
                            <p>(Profit After Tax / Revenue) × 100</p>
                            <p className="text-muted-foreground">Shows profitability as % of revenue</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">{((comparisonData2.records[0]["Profit After Tax"] / comparisonData2.records[0].Revenue) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">ROE:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Return on Equity %</p>
                            <p>(Profit After Tax / Total Equity) × 100</p>
                            <p className="text-muted-foreground">Returns generated from shareholder investments</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">{comparisonData2.records[0]["Total Equity"] > 0 ? ((comparisonData2.records[0]["Profit After Tax"] / comparisonData2.records[0]["Total Equity"]) * 100).toFixed(2) : "0"}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Dividend Payout:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Dividend Payout Ratio %</p>
                            <p>(Dividends Paid / Profit After Tax) × 100</p>
                            <p className="text-muted-foreground">% of profits distributed as dividends</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">{comparisonData2.records[0]["Profit After Tax"] > 0 ? ((comparisonData2.records[0]["Dividends Paid"] / comparisonData2.records[0]["Profit After Tax"]) * 100).toFixed(2) : "0"}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Debt-to-Equity:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Debt-to-Equity Ratio</p>
                            <p>Total Liabilities / Total Equity</p>
                            <p className="text-muted-foreground">Leverage: higher = more debt financed</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-semibold">
                      {comparisonData2.records[0]["Total Equity"] > 0 
                        ? (((comparisonData2.records[0]["Current Liabilities"] + comparisonData2.records[0]["Non-Current Liabilities"]) / comparisonData2.records[0]["Total Equity"])).toFixed(2)
                        : "0"}
                    </span>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!comparisonData1 || !comparisonData2) && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">Select two firms and click "Compare Firms" to view comparison data</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
