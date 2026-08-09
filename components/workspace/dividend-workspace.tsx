"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchGlossary, predictDividend, fetchHistoricalDividendData, type HistoricalDividendData } from "@/lib/api/dividend_api"
import { useDividendStore } from "@/stores/useDividendStore"
import { cachedRequest, peekCache, type CacheOptions } from "@/lib/request-cache"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DividendPredictionTab } from "@/components/dividend/DividendPredictionTab"
import { HistoricalDataTab } from "@/components/dividend/HistoricalDataTab"
import { GlossaryMap } from "@/lib/types/dividend/glossary"

/** Minimum time a loading skeleton stays visible.
 *  These endpoints often answer in well under 100ms, which makes the skeleton
 *  flash on and off. Awaiting this alongside the request (never in sequence)
 *  keeps the transition readable without slowing down a genuinely slow call. */
const MIN_SKELETON_MS = 700
const skeletonFloor = () => new Promise((resolve) => setTimeout(resolve, MIN_SKELETON_MS))

export interface DividendWorkspaceProps {
  /** Canonical short code from the route — matches the backend firm code. */
  symbol: string
}

/**
 * Dividend analysis for one company.
 *
 * Comparison used to be a third tab here, each of its two pickers being yet
 * another copy of the company search. It is a two-company view, so it does not
 * belong inside a single company's workspace — it now lives in CompareWorkspace.
 */
export function DividendWorkspace({ symbol }: DividendWorkspaceProps) {
  const { results, loading, setInputs, setResults, setLoading } = useDividendStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("prediction")

  const [historicalData, setHistoricalData] = useState<HistoricalDividendData | null>(null)
  const [historicalLoading, setHistoricalLoading] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set(["Revenue", "Dividends Paid"]))

  const [glossary, setGlossary] = useState<GlossaryMap>({})

  const handlePredict = useCallback(async (options?: CacheOptions) => {
    if (!symbol) return

    // Everything already cached means there is nothing to wait for: skip both
    // the skeleton floor and the loading flag, or returning to this tab would
    // flash a skeleton over results the user already has.
    const settled =
      !options?.force &&
      peekCache(`dividend:predict:${symbol}`) !== undefined &&
      peekCache("dividend:glossary") !== undefined

    if (!settled) setLoading(true)
    try {
      const [result, glossary_res] = await Promise.all([
        cachedRequest(`dividend:predict:${symbol}`, () => predictDividend(symbol), options),
        cachedRequest("dividend:glossary", () => fetchGlossary(), options),
        settled ? Promise.resolve() : skeletonFloor(),
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
      if (!settled) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  const handleFetchHistoricalData = useCallback(async (options?: CacheOptions) => {
    if (!symbol) return

    const key = `dividend:history:${symbol}`
    const settled = !options?.force && peekCache<HistoricalDividendData>(key) !== undefined

    if (!settled) setHistoricalLoading(true)
    try {
      const [data] = await Promise.all([
        cachedRequest(key, () => fetchHistoricalDividendData(symbol), options),
        settled ? Promise.resolve() : skeletonFloor(),
      ])
      setHistoricalData(data)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch historical data",
        variant: "destructive",
      })
    } finally {
      if (!settled) setHistoricalLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  // The company comes from the route, so the prediction runs on arrival —
  // resolving from cache on a revisit. Results are cleared only on a genuine
  // company change, so switching tabs does not blank the dashboard.
  useEffect(() => {
    if (useDividendStore.getState().inputs.symbol !== symbol) {
      setResults(null)
      setHistoricalData(null)
    }
    setInputs({ symbol })
    handlePredict()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  // History is the heavier of the two calls and most visits never open the tab,
  // so it stays lazy — fetched the first time the tab is actually shown.
  useEffect(() => {
    if (activeTab === "historical" && !historicalData && !historicalLoading) {
      handleFetchHistoricalData()
    }
  }, [activeTab, historicalData, historicalLoading, handleFetchHistoricalData])

  const handleMetricToggle = (metric: string) => {
    const newMetrics = new Set(selectedMetrics)
    if (newMetrics.has(metric)) {
      newMetrics.delete(metric)
    } else {
      newMetrics.add(metric)
    }
    setSelectedMetrics(newMetrics)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Dividend Prediction & Analysis</h2>
        <p className="text-muted-foreground">
          Dividend omission risk and financial history for <span className="font-mono">{symbol}</span>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prediction">Dividend Prediction</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="space-y-6">
          <DividendPredictionTab
            loading={loading}
            symbol={symbol}
            results={results}
            glossary={glossary}
            onPredict={() => handlePredict({ force: true })}
          />
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <HistoricalDataTab
            loading={historicalLoading}
            symbol={symbol}
            historicalData={historicalData}
            selectedMetrics={selectedMetrics}
            onFetchData={() => handleFetchHistoricalData({ force: true })}
            onMetricToggle={handleMetricToggle}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
