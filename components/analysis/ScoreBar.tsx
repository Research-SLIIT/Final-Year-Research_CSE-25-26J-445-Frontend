"use client"

interface ScoreBarProps {
  score: number
  threshold: number
  label: string
}

export function ScoreBar({ score, threshold, label }: ScoreBarProps) {
  const percentage = Math.min(Math.max(score, 0) * 100, 100)
  const thresholdPercentage = Math.min(Math.max(threshold, 0) * 100, 100)
  const passed = score >= threshold

  return (
    <div className="score-bar-container">
      <div className="bar-background">
        <div
          className="bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: passed ? "#10b981" : "#ef4444",
          }}
        />
        <div
          className="threshold-line"
          style={{ left: `${thresholdPercentage}%` }}
          title={`Threshold: ${threshold.toFixed(2)}`}
        />
      </div>
      <span className="bar-label">{label}</span>
    </div>
  )
}
