// ================= TYPES =================

export interface HistoricalExample {
  topic: string
  date: string
  direction: "positive" | "negative" | "neutral"
  reaction_label: "positive" | "negative" | "neutral"
  max_daily_up?: number
  max_daily_down?: number
  faiss_rank: number
  url?: string
  title?: string
  article_date?: string
}

export interface DecisionTreeStage {
  passed?: boolean
  description: string
  score?: number
  threshold?: number
  direction?: string
  raw_score?: number
  confidence?: number
  source?: string
  triggered_rules?: string
  weights?: Record<string, number>
}

export interface ExplanationData {
  decision_tree: DecisionTreeStage[]
  final_decision: string
  final_score: number
  model_confidence: number
}

export interface AnalyzeResponse {
  impact: "impactful" | "not_impactful"
  direction: "positive" | "negative" | null

  identified_companies: {
    company_name: string
    ticker: string
    matched_entity: string
    confidence: number
  }[]

  historical_context?: {
    narrative?: string
    examples: HistoricalExample[] // 🔹 always array
    stats?: {
      aligned_pct?: number
      positive_pct?: number
      negative_pct?: number
      neutral_pct?: number
      avg_max_up_pct?: number
      avg_max_down_pct?: number
    }
  }

  explanation?: ExplanationData

  /**
   * Demo mode only: how this result was resolved against the captured set.
   * Absent when talking to a live backend.
   */
  demoProvenance?: DemoProvenance
}

// ================= HELPERS =================

import { DEMO_MODE } from "@/lib/demo/config"
import {
  loadSentimentIndex,
  loadStoredAnalysis,
  matchHeadline,
  NO_COMPANY_RESPONSE,
} from "@/lib/demo/sentiment"

/** How this demo response was arrived at — surfaced to the user by AnalyzeBox. */
export type DemoProvenance =
  | { kind: "exact" }
  | { kind: "nearest"; matchedText: string; similarity: number }
  | { kind: "none" }

/**
 * Resolve free text against the captured headline set.
 *
 * An exact example returns its genuine stored analysis. Anything else gets the
 * closest stored headline, tagged so the UI can say which headline it is
 * actually showing. When nothing is close, the backend's own "no listed company
 * mentioned" answer is returned rather than a guess.
 *
 * The latency of the original call is replayed so the terminal-stream loading
 * UI still has something to cover.
 */
async function analyzeFromFixtures(text: string): Promise<any> {
  const startedAt = Date.now()
  const index = await loadSentimentIndex()
  const match = index ? matchHeadline(index, text) : null

  let payload: any
  let provenance: DemoProvenance

  if (match) {
    payload = await loadStoredAnalysis(match.headline.id)
    provenance = match.exact
      ? { kind: "exact" }
      : { kind: "nearest", matchedText: match.headline.text, similarity: match.similarity }
  } else {
    payload = { ...NO_COMPANY_RESPONSE }
    provenance = { kind: "none" }
  }

  // The captured calls returned in well under a second; the news page shows a
  // scripted terminal log while it waits, so hold the floor long enough for it.
  const elapsed = Date.now() - startedAt
  if (elapsed < 1800) await new Promise((resolve) => setTimeout(resolve, 1800 - elapsed))

  return { ...payload, __demoProvenance: provenance }
}

function buildExplanationFromRaw(raw: any): ExplanationData | undefined {
  if (!raw || !raw.explanation) return undefined
  
  // Just return the beautifully formatted explanation straight from the backend API
  return {
    decision_tree: raw.explanation.decision_tree || [],
    final_decision: raw.explanation.final_decision || raw.direction?.toUpperCase() || "NEUTRAL",
    final_score: raw.explanation.final_score || 0,
    model_confidence: raw.explanation.model_confidence || 0,
  }
}

// ================= API CALL =================

export async function analyzeNews(text: string): Promise<AnalyzeResponse> {
  let raw: any

  if (DEMO_MODE) {
    raw = await analyzeFromFixtures(text)
  } else {
    const res = await fetch("http://127.0.0.1:3400/api/v1/sentiment/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      throw new Error("Failed to analyze news")
    }

    raw = await res.json()
  }

  const explanation = buildExplanationFromRaw(raw)

  return {
    impact: raw.impact,
    direction: raw.direction,

    identified_companies: raw.identified_companies ?? [],

    historical_context: raw.historical_context
      ? {
          narrative: raw.historical_context.narrative,
          examples: (raw.historical_context.related_news ?? []).map(
            (n: any): HistoricalExample => ({
              topic: n.Topic,
              date: n.Date,
              reaction_label: n.reaction_label ?? "neutral",
              direction:
                n.reaction_label === "positive"
                  ? "positive"
                  : n.reaction_label === "negative"
                  ? "negative"
                  : "neutral",
              max_daily_up:
                n.max_daily_up != null && !isNaN(Number(n.max_daily_up))
                  ? Number(n.max_daily_up)
                  : undefined,
              max_daily_down:
                n.max_daily_down != null && !isNaN(Number(n.max_daily_down))
                  ? Number(n.max_daily_down)
                  : undefined,
              faiss_rank: n.faiss_rank,
              url: n.url,
              title: n.title,
              article_date: n.article_date,
            })
          ),
          stats: raw.historical_context.stats
            ? {
                aligned_pct: raw.historical_context.stats.aligned_pct,
                positive_pct: raw.historical_context.stats.positive_pct,
                negative_pct: raw.historical_context.stats.negative_pct,
                neutral_pct: raw.historical_context.stats.neutral_pct,
                avg_max_up_pct: raw.historical_context.stats.avg_max_up_pct,
                avg_max_down_pct: raw.historical_context.stats.avg_max_down_pct,
              }
            : undefined,
        }
      : undefined,

    explanation,
    demoProvenance: raw.__demoProvenance,
  }
}
