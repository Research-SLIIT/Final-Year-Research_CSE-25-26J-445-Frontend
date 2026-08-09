"use client"

import { useEffect, useState } from "react"
import { fetchHistoricalDividendData, type HistoricalDividendData } from "@/lib/api/dividend_api"
import { useToast } from "@/hooks/use-toast"
import { cachedRequest } from "@/lib/request-cache"
import { ComparisonTab } from "@/components/dividend/ComparisonTab"

/** See DividendWorkspace — same rationale for a floor under the skeleton. */
const MIN_SKELETON_MS = 700
const skeletonFloor = () => new Promise((resolve) => setTimeout(resolve, MIN_SKELETON_MS))

export interface CompareWorkspaceProps {
  /** Company from the route, pre-loaded as the left-hand side of the comparison. */
  symbol: string
}

/**
 * Side-by-side comparison of two firms.
 *
 * This is the one view that cannot be driven by the route alone — it needs a
 * second company — which is why it sits beside the single-company tabs rather
 * than inside the dividend workspace, where it used to be a third tab.
 */
export function CompareWorkspace({ symbol }: CompareWorkspaceProps) {
  const { toast } = useToast()

  const [compareSymbol1, setCompareSymbol1] = useState(symbol)
  const [compareSymbol2, setCompareSymbol2] = useState("")
  const [comparisonData1, setComparisonData1] = useState<HistoricalDividendData | null>(null)
  const [comparisonData2, setComparisonData2] = useState<HistoricalDividendData | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonSelectedMetric, setComparisonSelectedMetric] = useState("Revenue")

  // Following the header search to a different company re-seeds the left side.
  useEffect(() => {
    setCompareSymbol1(symbol)
    setComparisonData1(null)
  }, [symbol])

  const handleFetchComparison = async () => {
    if (!compareSymbol1 || !compareSymbol2) {
      toast({ title: "Error", description: "Please select both firms to compare", variant: "destructive" })
      return
    }

    if (compareSymbol1 === compareSymbol2) {
      toast({ title: "Error", description: "Please select different firms", variant: "destructive" })
      return
    }

    setComparisonLoading(true)
    try {
      // Same cache keys the dividend tab uses, so a firm already looked at
      // there costs nothing to pull into a comparison.
      const [data1, data2] = await Promise.all([
        cachedRequest(`dividend:history:${compareSymbol1}`, () =>
          fetchHistoricalDividendData(compareSymbol1),
        ),
        cachedRequest(`dividend:history:${compareSymbol2}`, () =>
          fetchHistoricalDividendData(compareSymbol2),
        ),
        skeletonFloor(),
      ])
      setComparisonData1(data1)
      setComparisonData2(data2)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch comparison data",
        variant: "destructive",
      })
    } finally {
      setComparisonLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Compare Firms</h2>
        <p className="text-muted-foreground">
          Put two firms side by side on revenue, profitability and dividend track record
        </p>
      </div>

      <ComparisonTab
        loading={comparisonLoading}
        compareSymbol1={compareSymbol1}
        compareSymbol2={compareSymbol2}
        comparisonData1={comparisonData1}
        comparisonData2={comparisonData2}
        comparisonSelectedMetric={comparisonSelectedMetric}
        onSymbol1Change={(company) => setCompareSymbol1(company.symbol)}
        onSymbol2Change={(company) => setCompareSymbol2(company.symbol)}
        onFetchComparison={handleFetchComparison}
        onMetricSelect={setComparisonSelectedMetric}
        getLastDividendPaymentYear={getLastDividendPaymentYear}
        calculateDividendStreak={calculateDividendStreak}
        calculateDividendSustainabilityScore={calculateDividendSustainabilityScore}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- *
 * Derived dividend statistics. Records arrive newest-first, which is
 * what lets the streak and last-payment scans stop at the first gap.
 * ---------------------------------------------------------------- */

function getLastDividendPaymentYear(data: HistoricalDividendData): number | null {
  for (const record of data.records) {
    if (record["Dividends Paid"] > 0) {
      return record.Year
    }
  }
  return null
}

function calculateDividendStreak(data: HistoricalDividendData): number {
  let streak = 0
  for (const record of data.records) {
    if (record["Dividends Paid"] > 0) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function calculateDividendSustainabilityScore(data: HistoricalDividendData): number {
  if (data.records.length === 0) return 0

  const latest = data.records[0]
  let score = 50

  if (latest["Profit After Tax"] > 0) {
    const payoutRatio = (latest["Dividends Paid"] / latest["Profit After Tax"]) * 100
    if (payoutRatio <= 60) {
      score += Math.min(25, payoutRatio * 0.416)
    } else if (payoutRatio <= 100) {
      score += Math.max(0, 25 - (payoutRatio - 60) * 0.5)
    }
  }

  const profitMargin = (latest["Profit After Tax"] / latest.Revenue) * 100
  score += Math.min(15, profitMargin * 0.5)

  if (latest["Total Equity"] > 0) {
    const roe = (latest["Profit After Tax"] / latest["Total Equity"]) * 100
    score += Math.min(15, roe * 0.5)
  }

  if (latest["Total Equity"] > 0) {
    const totalLiabilities = latest["Current Liabilities"] + latest["Non-Current Liabilities"]
    const dse = totalLiabilities / latest["Total Equity"]
    if (dse < 1) {
      score += Math.min(10, 10 - dse * 5)
    }
  }

  const streak = calculateDividendStreak(data)
  score += Math.min(10, streak * 2)

  return Math.min(100, Math.max(0, Math.round(score)))
}
