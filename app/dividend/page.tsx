"use client"

import { useState, useEffect } from "react"
import { fetchGlossary, predictDividend, fetchHistoricalDividendData, type HistoricalDividendData } from "@/lib/api/dividend_api"
import { useDividendStore } from "@/stores/useDividendStore"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { DividendPredictionTab } from "@/components/dividend/DividendPredictionTab"
import { HistoricalDataTab } from "@/components/dividend/HistoricalDataTab"
import { ComparisonTab } from "@/components/dividend/ComparisonTab"
import { GlossaryMap } from "@/lib/types/dividend/glossary"

/** Minimum time a loading skeleton stays visible.
 *  These endpoints often answer in well under 100ms, which makes the skeleton
 *  flash on and off. Awaiting this alongside the request (never in sequence)
 *  keeps the transition readable without slowing down a genuinely slow call. */
const MIN_SKELETON_MS = 700
const skeletonFloor = () => new Promise((resolve) => setTimeout(resolve, MIN_SKELETON_MS))

export default function DividendPredictionPage() {
  const { inputs, results, loading, setInputs, setResults, setLoading } = useDividendStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("prediction")
  
  // Historical Data Tab State
  const [historicalData, setHistoricalData] = useState<HistoricalDividendData | null>(null)
  const [historicalLoading, setHistoricalLoading] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set(["Revenue", "Dividends Paid"]))
  
  // Comparison Tab State
  const [compareSymbol1, setCompareSymbol1] = useState("")
  const [compareSymbol2, setCompareSymbol2] = useState("")
  const [comparisonData1, setComparisonData1] = useState<HistoricalDividendData | null>(null)
  const [comparisonData2, setComparisonData2] = useState<HistoricalDividendData | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonSelectedMetric, setComparisonSelectedMetric] = useState("Revenue")

  // Glossary State
  const [glossary, setGlossary] = useState<GlossaryMap>({})
  


  // Auto-fetch historical data when switching to history tab with a selected firm
  useEffect(() => {
    if (activeTab === "historical" && inputs.symbol && !historicalData && !historicalLoading) {
      const fetchData = async () => {
        setHistoricalLoading(true)
        try {
          const data = await fetchHistoricalDividendData(inputs.symbol)
          setHistoricalData(data)
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to fetch historical data",
            variant: "destructive",
          })
        } finally {
          setHistoricalLoading(false)
        }
      }
      fetchData()
    }
  }, [activeTab, inputs.symbol, historicalData, historicalLoading, toast])

  // Handler for firm selection
  const handleSearch = (company: any) => {
    setInputs({ symbol: company.symbol })
    setResults(null)
    setHistoricalData(null)
  }

  // Handler for fetching historical data
  const handleFetchHistoricalData = async () => {
    if (!inputs.symbol) {
      toast({ title: "Error", description: "Please select a stock", variant: "destructive" })
      return
    }

    setHistoricalLoading(true)
    try {
      const [data] = await Promise.all([
        fetchHistoricalDividendData(inputs.symbol),
        skeletonFloor(),
      ])
      setHistoricalData(data)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch historical data",
        variant: "destructive",
      })
    } finally {
      setHistoricalLoading(false)
    }
  }

  // Handler for metric toggle in trends chart
  const handleMetricToggle = (metric: string) => {
    const newMetrics = new Set(selectedMetrics)
    if (newMetrics.has(metric)) {
      newMetrics.delete(metric)
    } else {
      newMetrics.add(metric)
    }
    setSelectedMetrics(newMetrics)
  }

  // Handler for comparison fetch
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
      const [data1, data2] = await Promise.all([
        fetchHistoricalDividendData(compareSymbol1),
        fetchHistoricalDividendData(compareSymbol2),
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

  // Handler for prediction
  const handlePredict = async () => {
    if (!inputs.symbol) {
      toast({ title: "Error", description: "Please select a stock", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const [result, glossary_res] = await Promise.all([
        predictDividend(inputs.symbol),
        fetchGlossary(),
        skeletonFloor(),
      ])

      setGlossary(glossary_res)
      setResults(result)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate prediction",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper: Get last dividend payment year
  const getLastDividendPaymentYear = (data: HistoricalDividendData): number | null => {
    for (const record of data.records) {
      if (record["Dividends Paid"] > 0) {
        return record.Year
      }
    }
    return null
  }

  // Helper: Calculate dividend streak
  const calculateDividendStreak = (data: HistoricalDividendData): number => {
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

  // Helper: Calculate dividend sustainability score
  const calculateDividendSustainabilityScore = (data: HistoricalDividendData): number => {
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dividend Prediction & Analysis</h1>
        <p className="text-muted-foreground">Forecast dividend ommission risk and analyze historical data</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prediction">Dividend Prediction</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="space-y-6">
          <DividendPredictionTab
            loading={loading}
            inputs={inputs}
            results={results}
            glossary={glossary}
            onSearch={handleSearch}
            onPredict={handlePredict}
          />
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <HistoricalDataTab
            loading={historicalLoading}
            inputs={inputs}
            historicalData={historicalData}
            selectedMetrics={selectedMetrics}
            onSearch={handleSearch}
            onFetchData={handleFetchHistoricalData}
            onMetricToggle={handleMetricToggle}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
