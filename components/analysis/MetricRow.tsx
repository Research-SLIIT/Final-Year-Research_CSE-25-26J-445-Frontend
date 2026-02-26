"use client"

interface MetricRowProps {
  label: string
  value: string | number
}

export function MetricRow({ label, value }: MetricRowProps) {
  const formattedValue =
    typeof value === "number" ? value.toFixed(2) : String(value)

  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{formattedValue}</span>
    </div>
  )
}
