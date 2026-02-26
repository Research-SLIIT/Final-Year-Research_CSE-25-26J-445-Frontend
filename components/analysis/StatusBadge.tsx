"use client"

interface StatusBadgeProps {
  passed: boolean
}

export function StatusBadge({ passed }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        passed
          ? "bg-green-500/20 text-green-300"
          : "bg-red-500/20 text-red-300"
      }`}
    >
      {passed ? "✅ Passed" : "❌ Failed"}
    </span>
  )
}
