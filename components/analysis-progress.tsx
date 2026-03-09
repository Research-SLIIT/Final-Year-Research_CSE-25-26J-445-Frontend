'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ProgressEvent } from '@/hooks/use-analysis-stream';

interface AnalysisProgressProps {
  events: ProgressEvent[];
  isLoading: boolean;
  title?: string;
  className?: string;
}

const statusIcon = (status: ProgressEvent['status']) => {
  switch (status) {
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'step-done':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'completed':
      return <PartyPopper className="h-4 w-4 text-emerald-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

const statusTextColor = (status: ProgressEvent['status']) => {
  switch (status) {
    case 'error':
      return 'text-red-500';
    case 'completed':
      return 'text-emerald-500';
    default:
      return 'text-foreground';
  }
};

export function AnalysisProgress({
  events,
  isLoading,
  title = 'Analysis Progress',
  className,
}: AnalysisProgressProps) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const lastEvent = events[events.length - 1];
  const isCompleted = !isLoading && lastEvent?.status === 'completed';

  // Show the card as soon as activity starts
  useEffect(() => {
    if (isLoading || events.length > 0) {
      setVisible(true);
      setFadeOut(false);
    }
  }, [isLoading, events.length]);

  // Auto-dismiss 2 s after success with a smooth fade-out
  useEffect(() => {
    if (!isCompleted) return;
    const startFade = setTimeout(() => setFadeOut(true), 2000);
    const hide = setTimeout(() => setVisible(false), 2700);
    return () => {
      clearTimeout(startFade);
      clearTimeout(hide);
    };
  }, [isCompleted]);

  if (!visible) return null;

  // Progress bar reflects completed steps only — don't count a currently-processing step
  const lastDoneEvent = [...events].reverse().find(
    (e) => e.status === 'step-done' || e.status === 'completed'
  );
  const total = lastEvent?.total ?? 0;
  const completedStep = isCompleted
    ? total
    : lastDoneEvent?.step ?? 0;
  const progressPercent = total > 0 ? Math.round((completedStep / total) * 100) : 0;

  return (
    <Card
      className={cn(
        'bg-card border-border transition-all duration-1000 ease-in-out',
        fadeOut ? 'opacity-0 translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0',
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          {title}
          {isCompleted && (
            <span className="text-xs text-emerald-500 font-normal animate-in fade-in-0 duration-700">— Done</span>
          )}
        </CardTitle>
        {total > 0 && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-1.5 transition-all duration-700 ease-in-out" />
            <p className="text-xs text-muted-foreground text-right transition-all duration-500">
              {completedStep} / {total}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {events.map((ev, i) => (
            <div
              key={i}
              className="flex items-start gap-2 animate-in fade-in-0 slide-in-from-bottom-3 duration-700 ease-out"
            >
              <span className="mt-0.5 shrink-0">{statusIcon(ev.status)}</span>
              <div className="flex items-center gap-2 min-w-0">
                {ev.step > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {ev.step}/{ev.total}
                  </span>
                )}
                <span className={cn('text-sm wrap-break-word', statusTextColor(ev.status))}>
                  {ev.message}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse pl-6">
              Processing…
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
