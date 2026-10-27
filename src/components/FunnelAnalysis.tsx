import React, { useState } from 'react';
import { FunnelStage } from '../types/marketing';
import { ArrowDownRight, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface FunnelAnalysisProps {
  funnel: FunnelStage[];
}

export const FunnelAnalysis: React.FC<FunnelAnalysisProps> = ({ funnel }) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const maxCount = Math.max(...funnel.map((s) => s.count), 1);

  return (
    <div className="w-full neu-flat rounded-3xl p-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Full-Funnel Conversion & Drop-off Diagnostics
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stage velocity tracking <span>·</span> Cost per stage transition economics
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            Actual Volume
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            Benchmark Baseline
          </span>
        </div>
      </div>

      {/* Recessed Funnel Stages Container */}
      <div className="neu-sunken rounded-2xl p-6 space-y-4">
        {funnel.map((stage, idx) => {
          const widthPercent = Math.max(12, Math.round((Math.log10(stage.count + 1) / Math.log10(maxCount + 1)) * 100));
          const isSelected = selectedStage === stage.id;
          const prevStage = idx > 0 ? funnel[idx - 1] : null;

          return (
            <div
              key={stage.id}
              onClick={() => setSelectedStage(isSelected ? null : stage.id)}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                isSelected ? 'neu-flat' : 'hover:bg-slate-200/30 dark:hover:bg-slate-800/30'
              }`}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full neu-flat text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {stage.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Cost/Stage: <strong className="text-slate-800 dark:text-slate-200">${stage.costPerEvent.toFixed(2)}</strong>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                    {stage.count.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Dropoff indicator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full neu-groove relative overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>

                {idx > 0 && (
                  <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 min-w-[110px] justify-end">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {stage.conversionRate.toFixed(1)}% step
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-rose-600 dark:text-rose-400">
                      -{stage.dropoffRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Expanded Diagnostic Insight on click */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/60 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Benchmark performance: <strong>+{stage.benchmark > 0 ? (stage.conversionRate - stage.benchmark).toFixed(1) : '0'}%</strong> vs 2026 SaaS/Commerce cohort average.
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Step Velocity: ~3.4 hours avg transition
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Funnel Bottleneck Recommendation Card */}
      <div className="mt-4 p-4 rounded-2xl neu-flat-sm flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 dark:text-white">
            Analyst Bottleneck Audit:
          </span>{' '}
          Cart-to-Checkout drop-off currently sits at <strong>56.45%</strong>. Re-targeting abandoned sessions on Meta and Email within 45 minutes yields an estimated +$18,400 monthly recovered revenue at an incremental CPA of $9.20.
        </div>
      </div>
    </div>
  );
};
