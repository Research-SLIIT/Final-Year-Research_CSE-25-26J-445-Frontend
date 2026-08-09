"use client"

/**
 * Example headlines for the demo's sentiment box, plus the disclosure that
 * goes with them.
 *
 * Sentiment is the only analysis driven by free text rather than a company
 * symbol, so it is the only one that cannot be answered from a capture alone.
 * These chips are the headlines that were captured; anything else a visitor
 * types is matched to the nearest one, and `AnalyzeBox` says which.
 *
 * The panel also states how the set was selected. The backend was running its
 * financial-lexicon fallback rather than the XGBoost classifier when these were
 * taken, and that fallback inverts a meaningful share of headlines, so
 * candidates were kept only where it agreed with the obvious reading. Showing
 * a filtered set without saying it was filtered would turn a curation choice
 * into an implied accuracy claim.
 */

import { useEffect, useState } from "react"
import { DEMO_MODE } from "@/lib/demo/config"
import { loadSentimentIndex, type DemoSentimentIndex } from "@/lib/demo/sentiment"
import { Badge } from "@/components/ui/badge"

export function SentimentExamples({ onPick }: { onPick: (text: string) => void }) {
  const [index, setIndex] = useState<DemoSentimentIndex | null>(null)
  const [showNote, setShowNote] = useState(false)

  useEffect(() => {
    if (DEMO_MODE) loadSentimentIndex().then(setIndex)
  }, [])

  if (!DEMO_MODE || !index?.headlines.length) return null

  const curation = index.curation
  const usedFallback = index.modes.includes("lexicon-fallback")

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Try one of the captured headlines:</span>
        {index.headlines.slice(0, 8).map((headline) => {
          const ticker = headline.tickers[0]?.split(".")[0] ?? "—"
          return (
            <button
              key={headline.id}
              type="button"
              onClick={() => onPick(headline.text)}
              className="rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:bg-accent"
              title={headline.text}
            >
              {ticker}
              <Badge
                variant="outline"
                className={`ml-1.5 px-1 py-0 text-[10px] ${
                  headline.direction === "positive"
                    ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    : "border-red-500/40 text-red-600 dark:text-red-400"
                }`}
              >
                {headline.direction === "positive" ? "▲" : "▼"}
              </Badge>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowNote((open) => !open)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:no-underline"
      >
        {showNote ? "Hide note on this example set" : "How was this example set chosen?"}
      </button>

      {showNote && (
        <p className="rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          {curation && (
            <>
              These are {curation.accepted} of {curation.candidates} candidate headlines.{" "}
            </>
          )}
          {usedFallback && (
            <>
              They were captured while the sentiment service was running its financial-lexicon
              fallback — the XGBoost classifier needs OpenAI embeddings, which were not configured.
              That fallback misreads a substantial share of headlines, so candidates were kept only
              where it resolved the right company and agreed with the obvious reading.{" "}
            </>
          )}
          <strong>These are selected examples, not a measure of model accuracy.</strong> Typing your
          own text will match it to the closest headline here rather than run a fresh analysis.
        </p>
      )}
    </div>
  )
}
