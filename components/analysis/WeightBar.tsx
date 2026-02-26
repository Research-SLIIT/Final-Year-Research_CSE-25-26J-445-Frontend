"use client"

interface WeightBarProps {
  weights?: Record<string, number> | null
  finalScore: number
}

export function WeightBar({ weights, finalScore }: WeightBarProps) {
  const isPositive = finalScore >= 0
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
              className="weight-fill"
              style={{ width: `${Math.min(weight * 100, 100)}%` }}
            />
          </div>
          <span className="weight-percent">{(weight * 100).toFixed(0)}%</span>
        </div>
      ))}
      <div className="weight-result">
        <span className={isPositive ? "text-green-400" : "text-red-400"}>
          {isPositive ? "✅ Positive" : "❌ Negative"}
        </span>
        <span className="ml-2 text-gray-300">({finalScore.toFixed(2)})</span>
      </div>
    </div>
  )
}
