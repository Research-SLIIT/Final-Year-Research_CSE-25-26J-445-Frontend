"use client"

import { Info, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AnalysisDisclaimer() {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          How This Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          This sentiment analysis model uses a hierarchical approach combining 
          machine learning embeddings and specialized financial lexicons. 
          It evaluates market impact by comparing current news against historical 
          CSE data patterns to forecast potential short-term price reactions.
        </p>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-600 dark:text-amber-400 leading-relaxed flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>
            <strong>Important Disclaimer:</strong> This is NOT financial advice. 
            Predictions are based on historical linguistic patterns and may not 
            reflect future market volatility or unforeseen events. CSE data 
            integration is for research purposes. Always consult with a 
            qualified financial advisor before making investment decisions.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
