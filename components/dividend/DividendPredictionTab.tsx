"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PredictionDashboard from '@/components/dividend/PredictionDashboard'
import { PredictionDashboardSkeleton } from '@/components/dividend/PredictionDashboardSkeleton'
import { GlossaryMap } from "@/lib/types/dividend/glossary"

interface DividendPredictionTabProps {
  loading: boolean
  /** Firm code from the route — the tab no longer picks its own. */
  symbol: string
  results: any
  glossary: GlossaryMap
  onPredict: () => void
}

export function DividendPredictionTab({
  loading,
  symbol,
  results,
  glossary,
  onPredict,
}: DividendPredictionTabProps) {
  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Dividend Analysis</CardTitle>
          <CardDescription>
            Omission risk for <span className="font-mono">{symbol}</span>, from its filed financial records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onPredict} disabled={!symbol || loading} className="w-full md:w-auto">
            {loading ? "Analyzing Dividend..." : "Re-run analysis"}
          </Button>
        </CardContent>
      </Card>

      {/* Loading placeholder - takes precedence so a re-run swaps stale results
          for the skeleton rather than leaving the previous firm's numbers up */}
      {loading && <PredictionDashboardSkeleton />}

      {/* Results */}
      {!loading && results && (
        <PredictionDashboard data={results.data} firm={symbol} year={2026} glossary={glossary} />
      )}

      {/* Empty State */}
      {!results && !loading && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">
              No dividend prediction available for <span className="font-mono">{symbol}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
