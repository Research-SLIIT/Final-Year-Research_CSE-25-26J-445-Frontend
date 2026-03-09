"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TickerSearchDIV } from "@/components/ticker-search_div"
import PredictionDashboard from '@/components/dividend/PredictionDashboard'
import { GlossaryMap } from "@/lib/types/dividend/glossary"

interface DividendPredictionTabProps {
  loading: boolean
  inputs: { symbol: string }
  results: any
  glossary: GlossaryMap
  onSearch: (company: any) => void
  onPredict: () => void
}

export function DividendPredictionTab({
  loading,
  inputs,
  results,
  glossary,
  onSearch,
  onPredict,
}: DividendPredictionTabProps) {
  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Dividend Analysis Configuration</CardTitle>
          <CardDescription>Select a stock to analyze dividend history and predictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Stock Selection</label>
            <TickerSearchDIV onSelect={onSearch} placeholder="Search for a stock..." value={inputs.symbol} />
          </div>

          <Button onClick={onPredict} disabled={!inputs.symbol || loading} className="w-full md:w-auto">
            {loading ? "Analyzing Dividend..." : "Analyze Dividend"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && <PredictionDashboard data={results.data} firm={inputs.symbol} year={2026} glossary={glossary} />}

      {/* Empty State */}
      {!results && !loading && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">Select a stock and run the analysis to see dividend predictions</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
