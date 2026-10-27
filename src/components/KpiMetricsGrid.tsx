import React from 'react';
import { DollarSign, TrendingUp, Target, Users, MousePointerClick, Zap } from 'lucide-react';
import { Campaign, TimeSeriesPoint } from '../types/marketing';

interface KpiMetricsGridProps {
  campaigns: Campaign[];
  timeSeries: TimeSeriesPoint[];
  selectedMetric: 'revenue_spend' | 'roas' | 'conversions' | 'clicks_impressions';
  onSelectMetric: (metric: 'revenue_spend' | 'roas' | 'conversions' | 'clicks_impressions') => void;
}

export const KpiMetricsGrid: React.FC<KpiMetricsGridProps> = ({
  campaigns,
  timeSeries,
  selectedMetric,
  onSelectMetric,
}) => {
  // Aggregate live metrics
  const totalSpend = campaigns.reduce((acc, c) => acc + c.spent, 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
  const blendedRoas = totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : 0;
  const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const blendedCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const blendedCvr = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(2)) : 0;
  const blendedCac = totalConversions > 0 ? Number((totalSpend / totalConversions).toFixed(2)) : 0;
  const targetLtv = 175; // average LTV benchmark
  const ltvCacRatio = blendedCac > 0 ? Number((targetLtv / blendedCac).toFixed(1)) : 0;

  // Mini sparkline data generator for the last 7 time series points
  const last7 = timeSeries.slice(-7);
  const makeSparkline = (dataKey: 'spend' | 'revenue' | 'roas' | 'conversions' | 'clicks') => {
    if (last7.length < 2) return '';
    const values = last7.map((p) => p[dataKey]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = values.map((val, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const cards = [
    {
      id: 'revenue_spend',
      metricGroup: 'revenue_spend' as const,
      title: 'Attributed Revenue',
      value: `$${Math.round(totalRevenue).toLocaleString()}`,
      subValue: `Spend: $${Math.round(totalSpend).toLocaleString()}`,
      delta: '+18.4%',
      deltaPositive: true,
      context: 'Budget pacing 94% on target',
      sparkline: makeSparkline('revenue'),
      color: '#2563eb', // Blue
      icon: DollarSign,
    },
    {
      id: 'roas',
      metricGroup: 'roas' as const,
      title: 'Blended ROAS',
      value: `${blendedRoas}x`,
      subValue: 'Target: 3.80x benchmark',
      delta: '+0.73x',
      deltaPositive: true,
      context: 'Efficiency surplus +19.2%',
      sparkline: makeSparkline('roas'),
      color: '#10b981', // Emerald
      icon: TrendingUp,
    },
    {
      id: 'cac',
      metricGroup: 'conversions' as const,
      title: 'Blended CAC',
      value: `$${blendedCac.toFixed(2)}`,
      subValue: `LTV:CAC ratio ${ltvCacRatio}x`,
      delta: '-12.8%',
      deltaPositive: true, // Lower CAC is positive
      context: `Estimated LTV $${targetLtv}`,
      sparkline: makeSparkline('spend'),
      color: '#8b5cf6', // Violet
      icon: Target,
    },
    {
      id: 'conversions',
      metricGroup: 'conversions' as const,
      title: 'Total Conversions',
      value: totalConversions.toLocaleString(),
      subValue: `CVR: ${blendedCvr}% from clicks`,
      delta: '+14.2%',
      deltaPositive: true,
      context: `${totalClicks.toLocaleString()} inbound clicks`,
      sparkline: makeSparkline('conversions'),
      color: '#f59e0b', // Amber
      icon: Users,
    },
    {
      id: 'clicks_impressions',
      metricGroup: 'clicks_impressions' as const,
      title: 'Ad Engagement',
      value: `${(totalImpressions / 1000000).toFixed(2)}M Impr`,
      subValue: `CTR: ${blendedCtr}% (${totalClicks.toLocaleString()} clicks)`,
      delta: '+8.6%',
      deltaPositive: true,
      context: 'Avg CPC $0.58',
      sparkline: makeSparkline('clicks'),
      color: '#06b6d4', // Cyan
      icon: MousePointerClick,
    },
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => {
          const isSelected = selectedMetric === c.metricGroup;
          const Icon = c.icon;

          return (
            <button
              key={c.id}
              onClick={() => onSelectMetric(c.metricGroup)}
              className={`text-left p-4 rounded-2xl transition-all duration-200 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'neu-sunken border-2 border-blue-500/30 dark:border-blue-400/30'
                  : 'neu-flat hover:-translate-y-0.5'
              }`}
            >
              {/* Card Header: Icon & Title */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {c.title}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'neu-flat' : 'neu-flat-sm'
                  }`}
                  style={{ color: c.color }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Primary Value */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
                  {c.value}
                </span>
              </div>

              {/* Sub Value */}
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono tabular-nums mb-2.5">
                {c.subValue}
              </div>

              {/* Sparkline & Metadata row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/60 text-[11px]">
                <div className="text-slate-500 dark:text-slate-400">
                  <span className={`font-semibold ${c.deltaPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {c.delta}
                  </span>
                  <span className="mx-1">·</span>
                  <span className="truncate inline-block max-w-[90px] align-bottom" title={c.context}>
                    {c.context}
                  </span>
                </div>

                {/* Micro SVG Sparkline */}
                {c.sparkline && (
                  <svg className="w-16 h-6 overflow-visible shrink-0 ml-1" viewBox="0 0 80 24">
                    <path
                      d={c.sparkline}
                      fill="none"
                      stroke={c.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-80"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
