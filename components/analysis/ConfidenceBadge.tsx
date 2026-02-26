"use client"

interface ConfidenceBadgeProps {
  confidence: number
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percentage = Math.min(Math.max(confidence, 0) * 100, 100)
  let bgColor = "bg-red-500/20 text-red-300"

  if (percentage >= 80) {
    bgColor = "bg-green-500/20 text-green-300"
  } else if (percentage >= 60) {
    bgColor = "bg-blue-500/20 text-blue-300"
  } else if (percentage >= 40) {
    bgColor = "bg-yellow-500/20 text-yellow-300"
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${bgColor}`}>
      📊 {percentage.toFixed(0)}%
    </span>
  )
}
