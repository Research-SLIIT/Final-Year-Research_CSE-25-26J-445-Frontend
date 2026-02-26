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
  }

  explanation?: ExplanationData
}

// ================= API CALL =================

export async function analyzeNews(text: string): Promise<AnalyzeResponse> {
  const res = await fetch("http://127.0.0.1:8002/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    throw new Error("Failed to analyze news")
  }

  const raw = await res.json()

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
        }
      : undefined,

    explanation: raw.explanation,
  }
}
