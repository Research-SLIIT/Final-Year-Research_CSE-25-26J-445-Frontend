"use client"

import { ScoreBar } from "./ScoreBar"
import { WeightBar } from "./WeightBar"
import { TagList } from "./TagList"
import { StatusBadge } from "./StatusBadge"
import { DirectionBadge } from "./DirectionBadge"
import { ConfidenceBadge } from "./ConfidenceBadge"
import { MetricRow } from "./MetricRow"

interface DecisionTreeStage {
  passed?: boolean
  description: string
  score?: number
  threshold?: number
  direction?: string
  raw_score?: number
  confidence?: number
  source?: string
  triggered_rules?: string
}

interface ExplanationData {
  decision_tree: DecisionTreeStage[]
  final_decision: string
  final_score: number
  model_confidence: number
}

interface AnalysisBreakdownProps {
  explanation: ExplanationData
}

export function AnalysisBreakdown({ explanation }: AnalysisBreakdownProps) {
  const stage1 = explanation.decision_tree[0] || {}
  const stage2a = explanation.decision_tree[1] || {}
  const stage2b = explanation.decision_tree[2] || {}
  const stage3 = explanation.decision_tree[3] || {}

  return (
    <div className="analysis-breakdown">
      <h3 className="analysis-title">📊 Prediction Analysis Breakdown</h3>

      {/* ================= STAGE 1: Impact Detection ================= */}
      <div className="stage stage-1">
        <div className="stage-header">
          <span className="stage-number">1</span>
          <span className="stage-title">Market Impact Detection</span>
          {stage1.passed !== undefined && (
            <StatusBadge passed={stage1.passed} />
          )}
        </div>
        <p className="stage-description">{stage1.description}</p>

        {stage1.score !== undefined && stage1.threshold !== undefined && (
          <div className="score-bar">
            <ScoreBar
              score={stage1.score}
              threshold={stage1.threshold}
              label={`Score: ${stage1.score.toFixed(2)} (Threshold: ${stage1.threshold.toFixed(2)})`}
            />
          </div>
        )}
      </div>

      {/* Connecting arrow */}
      <div className="stage-arrow">↓</div>

      {/* ================= STAGE 2A: ML Prediction ================= */}
      <div className="stage stage-2a">
        <div className="stage-header">
          <span className="stage-number">2A</span>
          <span className="stage-title">ML Direction Prediction</span>
          {stage2a.direction && (
            <DirectionBadge direction={stage2a.direction} />
          )}
        </div>
        <p className="stage-description">{stage2a.description}</p>

        {(stage2a.raw_score !== undefined || stage2a.confidence !== undefined) && (
          <div className="metrics">
            {stage2a.raw_score !== undefined && (
              <MetricRow
                label="Raw Score"
                value={stage2a.raw_score}
              />
            )}
            {stage2a.confidence !== undefined && (
              <MetricRow
                label="Confidence"
                value={`${(stage2a.confidence * 100).toFixed(0)}%`}
              />
            )}
          </div>
        )}

        {stage2a.source && (
          <p className="source">
            <strong>Source:</strong> {stage2a.source}
          </p>
        )}
      </div>

      {/* Stage arrow */}
      <div className="stage-arrow">↓</div>

      {/* ================= STAGE 2B: Lexicon Analysis ================= */}
      <div className="stage stage-2b">
        <div className="stage-header">
          <span className="stage-number">2B</span>
          <span className="stage-title">Lexicon Sentiment Analysis</span>
          <DirectionBadge 
            direction={
              stage2b.score !== undefined && stage2b.score > 0 
                ? "positive" 
                : stage2b.score !== undefined && stage2b.score < 0 
                ? "negative" 
                : "neutral"
            } 
          />
          {stage2b.confidence !== undefined && (
            <ConfidenceBadge confidence={stage2b.confidence} />
          )}
        </div>
        <p className="stage-description">{stage2b.description}</p>

        {(stage2b.score !== undefined || stage2b.confidence !== undefined) && (
          <div className="metrics">
            {stage2b.score !== undefined && (
              <MetricRow
                label="Sentiment Score"
                value={stage2b.score}
              />
            )}
            {stage2b.confidence !== undefined && (
              <MetricRow
                label="Lexicon Confidence"
                value={`${(stage2b.confidence * 100).toFixed(0)}%`}
              />
            )}
          </div>
        )}

        {stage2b.triggered_rules && (
          <div className="triggered-rules">
            <strong>Detected Keywords:</strong>
            <TagList tags={stage2b.triggered_rules.split(", ")} />
          </div>
        )}
      </div>

      {/* Stage arrow */}
      <div className="stage-arrow">↓</div>

      {/* ================= STAGE 3: Fusion Logic ================= */}
      <div className={`stage stage-3 final final-${explanation.final_decision.toLowerCase()}`}>
        <div className="stage-header">
          <span className="stage-number">3</span>
          <span className="stage-title">Fusion & Final Decision</span>
        </div>
        <p className="stage-description">{stage3.description}</p>

        {stage3.weights && Object.keys(stage3.weights).length > 0 && (
          <div className="fusion-weights">
            <WeightBar
              weights={stage3.weights}
              finalScore={explanation.final_score}
              finalDecision={explanation.final_decision}
            />
          </div>
        )}

        <div className={`final-result final-result-${explanation.final_decision.toLowerCase()}`}>
          <h4>Final Prediction: {explanation.final_decision}</h4>
          <p className="final-metrics">
            Score: <strong>{explanation.final_score.toFixed(2)}</strong> | 
            Confidence: <strong>{(explanation.model_confidence * 100).toFixed(0)}%</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
