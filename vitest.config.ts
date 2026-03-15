import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "lib/api/**",
        "lib/utils.ts",
        "lib/risk-helpers.ts",
        "stores/**",
        "hooks/**",
        "components/confidence-badge.tsx",
        "components/risk-badge.tsx",
        "components/kpi-card.tsx",
        "components/chart-card.tsx",
        "components/analysis/**",
        "components/dividend/**",
        "components/news/MarketSentimentPulse.tsx",
        "components/news/AITerminalStream.tsx",
        "components/news/AnalyzeBox.tsx",
      ],
    },
  },
});
