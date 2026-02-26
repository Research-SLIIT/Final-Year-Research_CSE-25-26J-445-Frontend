"use client"

interface DirectionBadgeProps {
  direction: string
}

export function DirectionBadge({ direction }: DirectionBadgeProps) {
  const isPositive = direction?.toLowerCase() === "positive"
  const isNegative = direction?.toLowerCase() === "negative"

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        isPositive
          ? "bg-green-500/20 text-green-300"
          : isNegative
          ? "bg-red-500/20 text-red-300"
          : "bg-gray-500/20 text-gray-300"
      }`}
    >
      {isPositive ? "Positive" : isNegative ? "Negative" : "Neutral"}
    </span>
  )
}
