"use client";

import { useState } from "react";
import {
  getOhlcvSnapshot,
  type OhlcvSnapshot,
} from "@/lib/fakeApi";
import { predictOpenPrice } from "@/lib/api/open-price-prediction.api";
import { usePredictStore } from "@/stores/usePredictStore";
import { TickerSearch } from "@/components/ticker-search";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, ArrowUpRight, ArrowDownRight, TrendingDown, Minus, Info, BarChart3 } from "lucide-react";

// Mock data generator for historical monthly open prices
const generateMonthlyOpenPrices = (currentPrice: number) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((month, index) => ({
    month,
    openPrice: currentPrice + (Math.random() * 200 - 100) + index * 5,
  }));
};

export default function PredictPage() {
  const { inputs, output, loading, setInputs, setOutput, setLoading } =
    usePredictStore();
  const [snapshot, setSnapshot] = useState<OhlcvSnapshot | null>(null);
  const [timeRange, setTimeRange] = useState<string>("12months");
  const { toast } = useToast();

  const handleSearch = (company: any) => {
    setInputs({ symbol: company.symbol });
    setSnapshot(null);
    setOutput(null);
  };

  const handlePredict = async () => {
    if (!inputs.symbol) {
      toast({
        title: "Error",
        description: "Please select a stock",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get OHLCV snapshot (still using mock data)
      const snap = await getOhlcvSnapshot(inputs.symbol);
      setSnapshot(snap);

      // Run prediction using API — pass today's date so backend fetches current real data
      const result = await predictOpenPrice(
        inputs.symbol,
        new Date().toISOString().split('T')[0]
      );
      setOutput(result);

      toast({
        title: "Success",
        description: `Prediction generated for ${inputs.symbol}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to generate prediction";

      toast({
        title: "Prediction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Next Week Open Price Prediction
        </h1>
        <p className="text-muted-foreground">
          AI-powered forecast for opening price after 5 trading days
        </p>
      </div>

      {/* Input Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Prediction Configuration</CardTitle>
          <CardDescription>
            Select a stock to generate a prediction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Stock Selection
            </label>
            <TickerSearch
              onSelect={handleSearch}
              placeholder="Search for a stock..."
            />
          </div>

          {/* Market Snapshot */}
          {snapshot && (
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium">Latest Market Snapshot</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-xs text-muted-foreground">Open</p>
                  <p className="text-sm font-semibold">
                    {snapshot.open.toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-xs text-muted-foreground">High</p>
                  <p className="text-sm font-semibold">
                    {snapshot.high.toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-xs text-muted-foreground">Low</p>
                  <p className="text-sm font-semibold">
                    {snapshot.low.toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-xs text-muted-foreground">Close</p>
                  <p className="text-sm font-semibold">
                    {snapshot.close.toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="text-sm font-semibold">
                    {(snapshot.volume / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handlePredict}
            disabled={!inputs.symbol || loading}
            className="w-full md:w-auto"
          >
            {loading ? "Generating Prediction..." : "Predict Next Week Open"}
          </Button>
        </CardContent>
      </Card>

      {/* Prediction Results */}
      {output && (
        <>
          {/* Prediction Summary Card */}
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                {output.symbol}
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </CardTitle>
              <CardDescription>
                AI Prediction for Next Week's Opening (After 5 Trading Days)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 p-5 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Today's Open Price
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {output.openToday.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">LKR</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-5 rounded-lg border border-green-500/30">
                  <p className="text-sm text-muted-foreground mb-2">
                    Predicted Open (Day 5)
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {output.predOpenTplus5.toFixed(2)}
                  </p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                    {output.predOpenTplus5 > output.openToday ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(output.predOpenTplus5 - output.openToday).toFixed(
                      2
                    )}{" "}
                    LKR (
                    {Math.abs(
                      ((output.predOpenTplus5 - output.openToday) /
                        output.openToday) *
                        100
                    ).toFixed(2)}
                    %)
                  </p>
                </div>
                <div className="bg-card/50 p-5 rounded-lg border border-border flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Confidence Level
                    </p>
                    <ConfidenceBadge confidence={output.confidence} />
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on ML Model
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today vs Next Week Comparison Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Price Comparison</CardTitle>
              <CardDescription>
                Today's open price vs. predicted next week's open price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { label: "Today's Open", value: output.openToday },
                      {
                        label: "Next Week Predicted",
                        value: output.predOpenTplus5,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-muted)"
                    />
                    <XAxis
                      dataKey="label"
                      stroke="var(--color-muted-foreground)"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      label={{
                        value: "Price (LKR)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                      }}
                      formatter={(value: number) => [
                        `LKR ${value.toFixed(2)}`,
                        "Price",
                      ]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#22c55e" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Prediction Reasoning (XAI) */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Prediction Reasoning
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>
                    Key factors influencing the T+5 open price forecast for{" "}
                    {output.symbol}
                  </CardDescription>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                  SHAP Explainability
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {output.explanation ? (
                <>
                  {/* AI-generated summary */}
                  <div className="bg-muted/40 rounded-lg p-4 border border-border text-sm text-muted-foreground leading-relaxed">
                    {output.explanation.summary}
                  </div>

                  {/* Top driving factors */}
                  <div>
                    <p className="text-sm font-medium mb-3">Top Driving Factors</p>
                    <div className="space-y-3">
                      {(() => {
                        const maxShap = Math.max(
                          ...output.explanation!.top_drivers.map((d) => Math.abs(d.shap_value)),
                          0.001
                        );
                        return output.explanation!.top_drivers.map((driver) => (
                          <div
                            key={driver.feature}
                            className="bg-muted/30 rounded-lg p-4 border border-border space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {driver.direction === "bullish" ? (
                                  <ArrowUpRight className="h-4 w-4 text-green-500 shrink-0" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  {driver.display_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span
                                  className={`text-xs font-medium ${
                                    driver.direction === "bullish"
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {driver.direction === "bullish" ? "+" : ""}
                                  {driver.shap_value.toFixed(4)}
                                </span>
                                {/* Impact bar */}
                                <div className="flex items-center gap-1">
                                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        driver.direction === "bullish"
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{
                                        width: `${(Math.abs(driver.shap_value) / maxShap) * 100}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              {driver.description}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Signal counts */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    {[
                      {
                        label: "Bullish Signals",
                        count: output.explanation.top_drivers.filter(
                          (d) => d.direction === "bullish"
                        ).length,
                        color: "text-green-600 dark:text-green-400",
                        bg: "bg-green-500/10",
                      },
                      {
                        label: "Bearish Signals",
                        count: output.explanation.top_drivers.filter(
                          (d) => d.direction === "bearish"
                        ).length,
                        color: "text-red-600 dark:text-red-400",
                        bg: "bg-red-500/10",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className={`${s.bg} rounded-lg p-3 text-center`}
                      >
                        <p className={`text-2xl font-bold ${s.color}`}>
                          {s.count}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Category Impacts */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Category Impact Breakdown
                    </p>
                    <div className="space-y-2">
                      {(() => {
                        const categories = Object.entries(output.explanation!.category_impacts);
                        const maxCatShap = Math.max(
                          ...categories.map(([, c]) => Math.abs(c.total_shap)),
                          0.001
                        );
                        return categories.map(([category, impact]) => (
                          <div key={category} className="flex items-center gap-3">
                            <span className="text-xs font-medium w-28 shrink-0 text-right">
                              {category}
                            </span>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                                <div
                                  className={`h-full rounded-full ${
                                    impact.direction === "bullish"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${(Math.abs(impact.total_shap) / maxCatShap) * 100}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={`text-xs font-medium w-16 shrink-0 ${
                                  impact.direction === "bullish"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {impact.direction === "bullish" ? "+" : ""}
                                {impact.total_shap.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Model Agreement */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-medium mb-3">Model Agreement</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          Agreement Score
                        </p>
                        <p
                          className={`text-xl font-bold ${
                            output.explanation.model_agreement.agreement_score >= 0.85
                              ? "text-green-600 dark:text-green-400"
                              : output.explanation.model_agreement.agreement_score >= 0.65
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {(output.explanation.model_agreement.agreement_score * 100).toFixed(1)}%
                        </p>
                      </div>
                      {Object.entries(
                        output.explanation.model_agreement.per_model_predictions
                      ).map(([model, pred]) => (
                        <div
                          key={model}
                          className="bg-muted/50 p-3 rounded-lg text-center"
                        >
                          <p className="text-xs text-muted-foreground mb-1 capitalize">
                            {model}
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              pred > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {pred > 0 ? "+" : ""}
                            {(pred * 100).toFixed(2)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Explanation unavailable for this prediction.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Open Price Trend */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Historical Open Price Trend</CardTitle>
              <CardDescription>
                Monthly open price changes over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Range Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Time Period
                </label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="12months">Last 12 Months</SelectItem>
                    <SelectItem value="24months">Last 24 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Line Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={generateMonthlyOpenPrices(output.openToday)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-muted)"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="var(--color-muted-foreground)"
                      label={{
                        value: "Month",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      label={{
                        value: "Open Price (LKR)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                      }}
                      formatter={(value: number) => [
                        `LKR ${value.toFixed(2)}`,
                        "Open Price",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="openPrice"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Open Price"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Prediction Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Prediction Details</CardTitle>
              <CardDescription>
                Forecast for opening price after 5 trading days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Data As Of
                  </p>
                  <p className="text-sm font-semibold">{output.asofDate}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Predicted For
                  </p>
                  <p className="text-sm font-semibold">{output.predictedForDate}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Price Change
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      output.predOpenTplus5 > output.openToday
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {output.predOpenTplus5 > output.openToday ? "+" : ""}
                    {(output.predOpenTplus5 - output.openToday).toFixed(2)} LKR
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Percentage Change
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      output.predOpenTplus5 > output.openToday
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {output.predOpenTplus5 > output.openToday ? "+" : ""}
                    {(
                      ((output.predOpenTplus5 - output.openToday) /
                        output.openToday) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How This Works */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">How This Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This prediction model uses machine learning trained on
                  historical CSE stock data. It analyzes patterns in opening
                  prices, trading volume, volatility, and market returns to
                  forecast the most likely opening price after 5 trading days
                  (next week).
                </p>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  <strong>Important Disclaimer:</strong> This is NOT financial
                  advice. Predictions are based on historical patterns and may
                  not reflect future market conditions. CSE data is delayed.
                  Always consult with a qualified financial advisor before
                  making investment decisions.
                </p>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="features">
                  <AccordionTrigger>
                    Model Features (Collapsible)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">
                        The model uses the following features:
                      </p>
                      <ul className="grid grid-cols-2 gap-2 text-muted-foreground">
                        {[
                          "high_low_range",
                          "close_open_ratio",
                          "overnight_gap",
                          "return_1d",
                          "return_5d",
                          "log_return_5d",
                          "rsi_14",
                          "macd",
                          "macd_histogram",
                          "stoch_k",
                          "roc_5",
                          "price_to_sma_20",
                          "price_to_ema_10",
                          "price_position_20d",
                          "volatility_5d",
                          "volatility_20d",
                          "volatility_ratio",
                          "volume_ratio_5",
                          "volume_ratio_20",
                          "log_volume",
                          "day_of_week",
                          "month",
                          "price_vs_company_avg",
                          "volume_vs_company_avg",
                          "company_volatility",
                          "company_price_level",
                          "sector_N",
                        ].map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!output && !loading && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">
              Select a stock and click "Predict Next Week Open" to see the
              forecast
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
