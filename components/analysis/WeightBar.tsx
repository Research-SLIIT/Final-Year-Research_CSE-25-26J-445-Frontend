"use client"

interface WeightBarProps {
  weights?: Record<string, number> | null
  finalScore: number
  finalDecision?: string
}

export function WeightBar({ weights, finalScore, finalDecision }: WeightBarProps) {
  const decision = (finalDecision ?? "").toLowerCase()
  const isPositive = decision === "positive"
  const isNegative = decision === "negative"
  const weightEntries = weights ? Object.entries(weights) : []

  if (!weights || weightEntries.length === 0) {
    return null
  }

  return (
    <div className="weight-visualization">
      {weightEntries.map(([source, weight]) => (
        <div key={source} className="weight-item">
          <span className="weight-label">{source}</span>
          <div className="weight-bar">
            <div
              className={`weight-fill ${isNegative ? "weight-fill-negative" : isPositive ? "weight-fill-positive" : ""}`}
              style={{ width: `${Math.min(weight * 100, 100)}%` }}
            />
          </div>
          <span className="weight-percent">{(weight * 100).toFixed(0)}%</span>
        </div>
      ))}
      <div className="weight-result">
        <span className="weight-result-label">Combined Score</span>
        <span className={`weight-result-value ${
          isNegative ? "text-red-400" : isPositive ? "text-green-400" : "text-gray-400"
        }`}>
          {finalScore.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
