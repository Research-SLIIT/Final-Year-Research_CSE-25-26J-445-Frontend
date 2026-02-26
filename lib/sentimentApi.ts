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
}

// ================= HELPERS =================

function buildExplanationFromRaw(raw: any): ExplanationData | undefined {
  if (!raw) return undefined

  const impact = raw.impact as "impactful" | "not_impactful" | undefined
  const direction = raw.direction as string | undefined

  const stage1Probability =
    typeof raw.stage1_probability === "number"
      ? raw.stage1_probability
      : undefined

  const debug = raw.debug ?? {}
  const mlDirection = debug.ml_direction as string | undefined
  const mlScore =
    typeof debug.ml_score === "number" ? debug.ml_score : undefined

  const lexicon = debug.lexicon ?? {}
  const lexScore =
    typeof lexicon.score === "number" ? lexicon.score : undefined
  const lexConfidence =
    typeof lexicon.confidence === "number" ? lexicon.confidence : undefined
  const lexSource =
    typeof lexicon.source === "string"
      ? lexicon.source
      : "Lexicon Sentiment Model"

  const finalScore =
    typeof debug.final_score === "number"
      ? debug.final_score
      : stage1Probability ?? mlScore ?? lexScore ?? 0

  const modelConfidence = lexConfidence ?? mlScore ?? 0.8

  const decision_tree: DecisionTreeStage[] = [
    {
      passed:
        impact === "impactful"
          ? true
          : impact === "not_impactful"
          ? false
          : stage1Probability !== undefined
          ? stage1Probability >= 0.5
          : undefined,
      description:
        "Model assessed whether this news is likely to be market-moving based on content, entities and historical patterns.",
      score: stage1Probability,
      threshold: 0.5,
    },
    {
      description:
        "ML model predicted the likely market direction using historical price reactions and contextual information.",
      direction: mlDirection ?? direction ?? undefined,
      raw_score: mlScore,
      confidence: mlScore,
      source: "ML Direction Model",
    },
    {
      description: `Lexicon-based sentiment model (${lexSource}) evaluated the tone of the news text.`,
      score: lexScore,
      confidence: lexConfidence,
    },
    {
      description:
        "Fusion layer combined ML and lexicon signals to produce the final prediction.",
      weights: { "ML Model": 0.6, "Lexicon Analysis": 0.4 },
    },
  ]

  return {
    decision_tree,
    final_decision: (direction ?? mlDirection ?? "neutral").toUpperCase(),
    final_score: finalScore,
    model_confidence: modelConfidence,
  }
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
  }
}
