'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, Activity, CheckCircle, Zap, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartCard } from '@/components/chart-card';
import { GlossaryMap } from '@/lib/types/dividend/glossary';
import FeatureCard from './FeatureCard';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { llm_exp } from '@/lib/api/dividend_api';

interface PredictionDashboardProps {
  data: any;
  firm: string;
  year: number;
  glossary: GlossaryMap;
}

// Metric definitions for tooltips
const METRIC_DEFINITIONS = {
  Profitability: {
    title: 'Profitability (Return on Equity)',
    definition: 'Measures return on equity (ROE) using logistic scaling with 12% as the optimal threshold. Higher values indicate better profitability and earnings generation. Strong ROE is crucial for dividend sustainability.'
  },
  'Profit Trend': {
    title: 'Profit Trend',
    definition: 'Tracks year-over-year ROE change to measure operational momentum. Positive values indicate improving profitability trends, while negative values signal declining performance and potential dividend risk.'
  },
  'Liquidity Position': {
    title: 'Liquidity Position',
    definition: 'Measures short-term financial flexibility using the current ratio. The ideal range is 1.5-2.5. Higher values indicate better ability to meet short-term obligations and maintain dividend payments.'
  },
  'Investment Intensity': {
    title: 'Investment Intensity',
    definition: 'Indicates capital allocation toward growth and reinvestment. Balanced investment intensity relative to profitability ensures sustainable dividend growth and long-term competitiveness.'
  }
};

// Risk Band determination function
const getRiskBand = (probability: number) => {
  if (probability < 0.2) return { label: 'Very Safe', color: 'bg-green-500/20 border-green-500/30 text-green-700', icon: CheckCircle };
  if (probability < 0.5) return { label: 'Moderate', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-700', icon: AlertCircle };
  if (probability < 0.7) return { label: 'High', color: 'bg-orange-500/20 border-orange-500/30 text-orange-700', icon: AlertTriangle };
  return { label: 'Very High', color: 'bg-red-500/20 border-red-500/30 text-red-700', icon: Zap };
};

export default function PredictionDashboard({ data, firm, year, glossary }: PredictionDashboardProps) {
  const prediction = data.prediction;
  const score = data.financial_possition;

  const [llm_res, set_llmres] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    if (!firm) return;

    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await llm_exp(firm);
        console.log('API Response:', response);

        if (!isCancelled) {
          set_llmres(response.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [firm]);

  // Extract prediction details
  const probability = prediction?.probability || 0;
  const riskBand = getRiskBand(probability);
  const featureContributions = prediction?.feature_contributions || {};
  const investorExplanation = prediction?.investor_explanation || {};

  // Debug
  console.log('Feature Contributions:', featureContributions);
  console.log('Contributions Obj:', featureContributions?.contributions);

  // Separate macroeconomic from financial factors
  const macroeconomicFactors: { name: string; impact: number }[] = [];
  const financialFactors: { name: string; impact: number }[] = [];

  if (featureContributions?.contributions && typeof featureContributions.contributions === 'object') {
    Object.entries(featureContributions.contributions).forEach(([key, value]: [string, any]) => {
      const impact = typeof value === 'number' ? value : 0;
      const keyLower = key.toLowerCase();
      if (keyLower.includes('macro') || keyLower.includes('gdp') || keyLower.includes('economic') || keyLower.includes('environment')) {
        macroeconomicFactors.push({ name: key, impact });
      } else {
        financialFactors.push({ name: key, impact });
      }
    });
  }

  // If no factors found, create fallback showing all contributions
  let allFactors = [...macroeconomicFactors, ...financialFactors];
  if (allFactors.length === 0 && featureContributions?.contributions) {
    allFactors = Object.entries(featureContributions.contributions).map(([key, value]: [string, any]) => ({
      name: key,
      impact: typeof value === 'number' ? value : 0,
    }));
  }

  // Sort by absolute impact
  macroeconomicFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  financialFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  allFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  console.log('Separated Macro:', macroeconomicFactors);
  console.log('Separated Financial:', financialFactors);
  console.log('All Factors Fallback:', allFactors);

  // Financial health scores
  const financialHealthScores = [
    { name: 'Profitability', value: score?.profitability || 0, unit: '', icon: TrendingUp, color: 'text-blue-600' },
    { name: 'Profit Trend', value: score?.['Profit Trend'] || 0, unit: '', icon: Activity, color: 'text-purple-600' },
    { name: 'Liquidity Position', value: score?.['Liquidity Position'] || 0, unit: '', icon: Zap, color: 'text-amber-600' },
    { name: 'Investment Intensity', value: score?.['Investment Intensity'] || 0, unit: '', icon: Shield, color: 'text-rose-600' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentValue = (payload[0].value * 100).toFixed(2);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-50">
          <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
          <p className="text-sm text-gray-700">
            Impact: {percentValue}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Risk Band */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{firm.toUpperCase()}</h2>
          <p className="text-muted-foreground mt-1">{year} Dividend Forecast</p>
        </div>
        <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg border ${riskBand.color}`}>
          <riskBand.icon className="w-5 h-5" />
          <div>
            <p className="text-xs font-semibold opacity-75">Risk Level</p>
            <p className="text-lg font-bold">{riskBand.label}</p>
          </div>
        </div>
      </div>

      {/* Probability & Risk Band Visualization */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Probability Display */}
            <div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dividend decrease Probability</p>
                  <p className="text-4xl font-bold text-foreground">{(probability * 100).toFixed(1)}%</p>
                </div>
                <Badge className="mb-2" variant="outline">
                  {probability < 0.2 ? 'âœ“ Very Safe' : probability < 0.5 ? 'âš  Moderate Risk' : probability < 0.7 ? '! High Risk' : '!! Very High Risk'}
                </Badge>
              </div>

              {/* Risk Band Visual Scale */}
              <div className="space-y-3">
                <div className="relative h-4 bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-foreground/80 shadow-lg"
                    style={{ left: `${probability * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <p className="font-semibold text-green-700">Very Safe</p>
                    <p className="text-muted-foreground">&lt;20%</p>
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-700">Moderate</p>
                    <p className="text-muted-foreground">20-50%</p>
                  </div>
                  <div>
                    <p className="font-semibold text-orange-700">High</p>
                    <p className="text-muted-foreground">50-70%</p>
                  </div>
                  <div>
                    <p className="font-semibold text-red-700">Very High</p>
                    <p className="text-muted-foreground">&gt;70%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Macroeconomic Environment Impact - if exists */}
            {macroeconomicFactors.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3 uppercase font-semibold">External Economic Impact</p>
                <div className="space-y-2">
                  {macroeconomicFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{factor.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${Math.abs(factor.impact) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${factor.impact > 0 ? 'text-blue-600' : 'text-blue-400'}`}>
                            {(factor.impact * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Position & Key Metrics */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Financial Position</h2>
        <TooltipProvider>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {financialHealthScores.map((metric, idx) => {
              const Icon = metric.icon;
              // Determine health status based on metric type
              let isHealthy = false;
              if (metric.name === 'Profitability' || metric.name === 'Liquidity Position') {
                isHealthy = metric.value > 0;
              } else if (metric.name === 'Profit Trend') {
                isHealthy = metric.value > 0; // Slight negative trend is acceptable
              } else if (metric.name === 'Investment Intensity') {
                isHealthy = Math.abs(metric.value) < 0.5; // Balanced investment intensity
              }
              
              const metricDef = METRIC_DEFINITIONS[metric.name as keyof typeof METRIC_DEFINITIONS];
              return (
                <UITooltip key={idx}>
                  <TooltipTrigger asChild>
                    <Card className="bg-card border-border hover:border-foreground/20 transition-colors cursor-help">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <Icon className={`w-5 h-5 ${isHealthy ? 'text-green-600' : 'text-orange-600'}`} />
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isHealthy ? 'bg-green-500/20 text-green-700' : 'bg-orange-500/20 text-orange-700'}`}>
                            {isHealthy ? 'Healthy' : 'Alert'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{metric.name}</p>
                        <p className="text-2xl font-bold text-foreground">
                          {metric.value.toFixed(2)}{metric.unit}
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">{metricDef?.title}</p>
                      <p className="text-sm text-muted-foreground">{metricDef?.definition}</p>
                    </div>
                  </TooltipContent>
                </UITooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Feature Contributions - Separated */}
      <div className="space-y-6">
        {/* Financial Factors */}
        {financialFactors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-foreground">Financial Strength Factors</h2>
              <span className="text-xs text-muted-foreground">({financialFactors.length})</span>
            </div>
            <ChartCard
              title="Company Financial Metrics Impact"
              // description="How company financial health metrics influence dividend risk"
            >
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialFactors} layout="vertical" margin={{ left: 60, right: 30, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={10} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {financialFactors.map((entry, i) => <Cell key={i} fill={entry.impact < 0 ? '#10b981' : '#ff0000'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        )}

        {/* Fallback: Show all factors if separation didn't work */}
        {macroeconomicFactors.length === 0 && financialFactors.length === 0 && allFactors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-foreground">Key Factors Driving the Prediction</h2>
              <span className="text-xs text-muted-foreground">({allFactors.length})</span>
            </div>
            <ChartCard
              title="Impact of All Financial Metrics"
              description="Contribution of each factor to the dividend cut prediction"
            >
              <div style={{ width: '100%', height: '500px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allFactors} layout="vertical" margin={{ left: 180, right: 30, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {allFactors.map((entry, i) => <Cell key={i} fill={entry.impact > 0 ? '#8b5cf6' : '#ddd6fe'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        )}
      </div>

      {/* AI-Powered Analysis Section */}
      {isLoading ? (
        <Card className="bg-card border-border">
          <CardContent className="flex items-center justify-center h-48">
            <Spinner className="w-8 h-8" />
          </CardContent>
        </Card>
      ) : llm_res ? (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <CardTitle>AI-Powered Analysis</CardTitle>
            </div>
            <CardDescription>Powerd by OpenAI GPT 4o</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Predicted Dividend & Confidence */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-purple-500/20">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Predicted Cut %</p>
                <p className="text-3xl font-bold text-foreground">
                  {llm_res.predicted_cut_percentage || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Confidence</p>
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border ${
                  llm_res.confidence_level?.includes('HIGH')
                    ? 'bg-green-500/20 text-green-700 border-green-500/30'
                    : llm_res.confidence_level?.includes('MEDIUM')
                    ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                    : 'bg-red-500/20 text-red-700 border-red-500/30'
                }`}>
                  <Activity className="w-4 h-4" />
                  {llm_res.confidence_level || 'N/A'}
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Analysis Summary
              </p>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {llm_res.explanation || 'No explanation available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Key Strengths & Concerns */}
      {((investorExplanation.key_strengths && investorExplanation.key_strengths.length > 0) ||
        (investorExplanation.key_concerns && investorExplanation.key_concerns.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {investorExplanation.key_strengths && investorExplanation.key_strengths.length > 0 && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <CardTitle>Positive Factors</CardTitle>
                </div>
                <CardDescription>Supporting dividend maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {investorExplanation.key_strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {investorExplanation.key_concerns && investorExplanation.key_concerns.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <CardTitle>Risk Factors</CardTitle>
                </div>
                <CardDescription>Concerns for dividend maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {investorExplanation.key_concerns.map((concern: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{concern}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
