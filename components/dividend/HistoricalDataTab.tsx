"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TickerSearchDIV } from "@/components/ticker-search_div"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { type HistoricalDividendData } from "@/lib/api/dividend_api"

interface HistoricalDataTabProps {
  loading: boolean
  inputs: { symbol: string }
  historicalData: HistoricalDividendData | null
  selectedMetrics: Set<string>
  onSearch: (company: any) => void
  onFetchData: () => void
  onMetricToggle: (metric: string) => void
}

export function HistoricalDataTab({
  loading,
  inputs,
  historicalData,
  selectedMetrics,
  onSearch,
  onFetchData,
  onMetricToggle,
}: HistoricalDataTabProps) {
  return (
    <div className="space-y-6">
      {/* Historical Data Tab */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Historical Dividend Data</CardTitle>
          <CardDescription>View historical dividend information and financial metrics for selected stocks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Stock Selection</label>
              <TickerSearchDIV onSelect={onSearch} placeholder="Search for a stock..." value={inputs.symbol} />
            </div>
            
            <Button 
              onClick={onFetchData} 
              disabled={!inputs.symbol || loading} 
              className="w-full md:w-auto"
            >
              {loading ? "Loading Historical Data..." : "Fetch Historical Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historical Data Display */}
      {historicalData && historicalData.records && historicalData.records.length > 0 && (
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>{historicalData.firm}</CardTitle>
              <CardDescription>
                Financial data from {historicalData.start_year} to {historicalData.end_year}
                <br />
                All Values are in LKR Thousands
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Year</th>
                    <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold">Rev Change %</th>
                    <th className="text-right py-3 px-4 font-semibold">EBIT</th>
                    <th className="text-right py-3 px-4 font-semibold">Profit After Tax</th>
                    <th className="text-right py-3 px-4 font-semibold">PAT Change %</th>
                    <th className="text-right py-3 px-4 font-semibold">Dividends Paid</th>
                    <th className="text-right py-3 px-4 font-semibold">Div Change %</th>
                    <th className="text-right py-3 px-4 font-semibold">Total Equity</th>
                    <th className="text-right py-3 px-4 font-semibold">Operating Cash Flow</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData.records.map((record, index) => {
                    const prevRecord = index < historicalData.records.length - 1 ? historicalData.records[index + 1] : null
                    
                    const revenueChange = prevRecord 
                      ? ((record.Revenue - prevRecord.Revenue) / prevRecord.Revenue * 100) 
                      : null
                    const patChange = prevRecord 
                      ? ((record["Profit After Tax"] - prevRecord["Profit After Tax"]) / Math.abs(prevRecord["Profit After Tax"]) * 100) 
                      : null
                    const dividendChange = prevRecord && prevRecord["Dividends Paid"] !== 0
                      ? ((record["Dividends Paid"] - prevRecord["Dividends Paid"]) / prevRecord["Dividends Paid"] * 100)
                      : null

                    return (
                      <tr key={record.Year} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{record.Year}</td>
                        <td className="text-right py-3 px-4">{(record.Revenue / 1e3).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">
                          {revenueChange !== null ? (
                            <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                              {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="text-right py-3 px-4">{(record.EBIT / 1e3).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">{(record["Profit After Tax"] / 1e3).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">
                          {patChange !== null ? (
                            <span className={patChange >= 0 ? "text-green-600" : "text-red-600"}>
                              {patChange >= 0 ? "+" : ""}{patChange.toFixed(1)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="text-right py-3 px-4">{(record["Dividends Paid"] / 1e3).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">
                          {dividendChange !== null ? (
                            <span className={dividendChange >= 0 ? "text-green-600" : "text-red-600"}>
                              {dividendChange >= 0 ? "+" : ""}{dividendChange.toFixed(1)}%
                            </span>
                          ) : (
                            record["Dividends Paid"] === 0 ? "No dividend" : "-"
                          )}
                        </td>
                        <td className="text-right py-3 px-4">{(record["Total Equity"] / 1e3).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">{(record["Net Cash from Operating Activities"] / 1e3).toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Latest Year</p>
                <p className="text-2xl font-bold">{historicalData.records[0].Year}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Latest Dividends Paid</p>
                <p className="text-2xl font-bold">{(historicalData.records[0]["Dividends Paid"] / 1e3).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Latest Revenue</p>
                <p className="text-2xl font-bold">{(historicalData.records[0].Revenue / 1e3).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Latest Equity</p>
                <p className="text-2xl font-bold">{(historicalData.records[0]["Total Equity"] / 1e3).toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Trends Chart */}
      {historicalData && historicalData.records && historicalData.records.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Financial Trends Over Time</CardTitle>
            <CardDescription>Select metrics to display on the chart</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metric Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              {[
                { key: "Revenue", label: "Revenue" },
                { key: "EBIT", label: "EBIT" },
                { key: "Profit After Tax", label: "Profit After Tax" },
                { key: "Dividends Paid", label: "Dividends Paid" },
                { key: "Total Equity", label: "Total Equity" },
                { key: "Net Cash from Operating Activities", label: "Operating Cash Flow" },
                { key: "Current Assets", label: "Current Assets" },
                { key: "Non-Current Assets", label: "Non-Current Assets" },
              ].map((metric) => (
                <div key={metric.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric.key}
                    checked={selectedMetrics.has(metric.key)}
                    onCheckedChange={() => onMetricToggle(metric.key)}
                  />
                  <Label htmlFor={metric.key} className="text-sm cursor-pointer">
                    {metric.label}
                  </Label>
                </div>
              ))}
            </div>

            {/* Chart */}
            {selectedMetrics.size > 0 ? (
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={
                      historicalData.records
                        .slice()
                        .reverse()
                        .map((record) => ({
                          Year: record.Year,
                          ...(selectedMetrics.has("Revenue") && { Revenue: record.Revenue / 1e3 }),
                          ...(selectedMetrics.has("EBIT") && { EBIT: record.EBIT / 1e3 }),
                          ...(selectedMetrics.has("Profit After Tax") && { "Profit After Tax": record["Profit After Tax"] / 1e3 }),
                          ...(selectedMetrics.has("Dividends Paid") && { "Dividends Paid": record["Dividends Paid"] / 1e3 }),
                          ...(selectedMetrics.has("Total Equity") && { "Total Equity": record["Total Equity"] / 1e3 }),
                          ...(selectedMetrics.has("Net Cash from Operating Activities") && { "Operating Cash Flow": record["Net Cash from Operating Activities"] / 1e3 }),
                          ...(selectedMetrics.has("Current Assets") && { "Current Assets": record["Current Assets"] / 1e3 }),
                          ...(selectedMetrics.has("Non-Current Assets") && { "Non-Current Assets": record["Non-Current Assets"] / 1e3 }),
                        }))
                    }
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid horizontal={true} vertical={false} />
                    <XAxis dataKey="Year" />
                    <YAxis label={{ value: "", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip 
                      formatter={(value) => typeof value === 'number' ? `${value.toFixed(2)}K` : value}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    {selectedMetrics.has("Revenue") && <Line type="monotone" dataKey="Revenue" stroke="#ef4444"  />}
                    {selectedMetrics.has("EBIT") && <Line type="monotone" dataKey="EBIT" stroke="#f97316"  />}
                    {selectedMetrics.has("Profit After Tax") && <Line type="monotone" dataKey="Profit After Tax" stroke="#eab308"  />}
                    {selectedMetrics.has("Dividends Paid") && <Line type="monotone" dataKey="Dividends Paid" stroke="#22c55e"  strokeWidth={2} />}
                    {selectedMetrics.has("Total Equity") && <Line type="monotone" dataKey="Total Equity" stroke="#3b82f6"  />}
                    {selectedMetrics.has("Net Cash from Operating Activities") && <Line type="monotone" dataKey="Operating Cash Flow" stroke="#8b5cf6" />}
                    {selectedMetrics.has("Current Assets") && <Line type="monotone" dataKey="Current Assets" stroke="#06b6d4"  strokeDasharray="5 5" />}
                    {selectedMetrics.has("Non-Current Assets") && <Line type="monotone" dataKey="Non-Current Assets" stroke="#ec4899"  strokeDasharray="5 5" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select at least one metric to display the chart</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!historicalData && !loading && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">Select a stock and click "Fetch Historical Data" to view financial history</p>
          </CardContent>
        </Card>
      )}

      {/* Error State - No Records */}
      {historicalData && (!historicalData.records || historicalData.records.length === 0) && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">No historical data available for this stock</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
