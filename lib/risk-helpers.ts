/**
 * Risk analysis helper functions
 * Extracted from app/risk/page.tsx for testability
 */

export const getZoneColor = (zone: string): string => {
  switch (zone) {
    case "Safe":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "Grey":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "Distress":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const getHealthStatusColor = (status: string): string => {
  switch (status) {
    case "Excellent":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "Good":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "Average":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "Poor":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "Critical":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const getScoreColor = (score: number): string => {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 30) return "#f97316";
  return "#ef4444";
};

export const formatPercentage = (value: number): string =>
  `${(value * 100).toFixed(2)}%`;

export const getZScoreZone = (zScore: number): "Safe" | "Grey" | "Distress" => {
  if (zScore > 2.99) return "Safe";
  if (zScore >= 1.81) return "Grey";
  return "Distress";
};
