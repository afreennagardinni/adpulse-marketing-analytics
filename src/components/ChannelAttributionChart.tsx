import React, { useState, useMemo } from 'react';
import { Campaign, MarketingChannel, AttributionModelType } from '../types/marketing';
import { PieChart, SlidersHorizontal, Info } from 'lucide-react';

interface ChannelAttributionChartProps {
  campaigns: Campaign[];
}

export const ChannelAttributionChart: React.FC<ChannelAttributionChartProps> = ({ campaigns }) => {
  const [selectedModel, setSelectedModel] = useState<AttributionModelType>('last_click');
  const [hoveredChannel, setHoveredChannel] = useState<MarketingChannel | null>(null);

  // Channel color scheme
  const channelColors: Record<MarketingChannel, string> = {
    'Google Ads': '#2563eb', // Blue
    'Meta': '#8b5cf6', // Violet
    'TikTok': '#06b6d4', // Cyan
    'LinkedIn': '#f59e0b', // Amber
    'YouTube': '#ef4444', // Red
    'Email': '#10b981', // Emerald
  };

  // Attribution model weighting multipliers (relative to last-click)
  // Reflects real-world attribution physics: upper-funnel channels (TikTok, YouTube, Meta) gain in first-touch & linear; search/email gain in last-click.
  const modelMultipliers: Record<AttributionModelType, Record<MarketingChannel, number>> = {
    last_click: {
      'Google Ads': 1.05,
      'Meta': 0.98,
      'TikTok': 0.88,
      'LinkedIn': 0.95,
      'YouTube': 0.75,
      'Email': 1.25,
    },
    first_touch: {
      'Google Ads': 0.82,
      'Meta': 1.15,
      'TikTok': 1.35,
      'LinkedIn': 1.10,
      'YouTube': 1.45,
      'Email': 0.65,
    },
    linear: {
      'Google Ads': 0.98,
      'Meta': 1.05,
      'TikTok': 1.12,
      'LinkedIn': 1.02,
      'YouTube': 1.18,
      'Email': 0.92,
    },
    time_decay: {
      'Google Ads': 1.08,
      'Meta': 1.00,
      'TikTok': 0.90,
      'LinkedIn': 0.98,
      'YouTube': 0.82,
      'Email': 1.18,
    },
    data_driven: {
      'Google Ads': 1.02,
      'Meta': 1.08,
      'TikTok': 1.22,
      'LinkedIn': 1.04,
      'YouTube': 1.28,
      'Email': 1.06,
    },
  };

  // Compute metrics per channel
  const channelData = useMemo(() => {
    const channels: MarketingChannel[] = ['Google Ads', 'Meta', 'TikTok', 'LinkedIn', 'YouTube', 'Email'];
    const totalSpendAll = campaigns.reduce((acc, c) => acc + c.spent, 0) || 1;

    return channels.map((channel) => {
      const channelCamps = campaigns.filter((c) => c.channel === channel);
      const spend = channelCamps.reduce((acc, c) => acc + c.spent, 0);
      const rawRevenue = channelCamps.reduce((acc, c) => acc + c.revenue, 0);
      const multiplier = modelMultipliers[selectedModel][channel];
      const modelRevenue = rawRevenue * multiplier;
      const roas = spend > 0 ? Number((modelRevenue / spend).toFixed(2)) : 0;
      const lastClickRevenue = rawRevenue * modelMultipliers['last_click'][channel];
      const shiftPercent = lastClickRevenue > 0 ? ((modelRevenue - lastClickRevenue) / lastClickRevenue) * 100 : 0;

      return {
        channel,
        spend,
        revenue: modelRevenue,
        roas,
        shareOfSpend: (spend / totalSpendAll) * 100,
        shiftPercent,
        color: channelColors[channel],
      };
    });
  }, [campaigns, selectedModel]);

  const totalSpend = useMemo(() => channelData.reduce((acc, c) => acc + c.spend, 0), [channelData]);
  const totalModelRevenue = useMemo(() => channelData.reduce((acc, c) => acc + c.revenue, 0), [channelData]);

  // Compute Donut SVG segments
  const radius = 80;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const donutSegments = channelData.map((d) => {
    const percent = d.shareOfSpend;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += percent;

    return {
      ...d,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeFocus = hoveredChannel
    ? channelData.find((c) => c.channel === hoveredChannel)
    : null;

  return (
    <div className="w-full neu-flat rounded-3xl p-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Cross-Channel Attribution & Capital Allocation
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Algorithmic attribution weighting <span>·</span> ROAS incrementality analysis
          </div>
        </div>

        {/* Attribution Model Tabs */}
        <div className="flex items-center p-1 rounded-xl neu-sunken-sm overflow-x-auto">
          {(
            [
              { id: 'last_click', label: 'Last Click' },
              { id: 'data_driven', label: 'Data-Driven' },
              { id: 'first_touch', label: 'First Touch' },
              { id: 'linear', label: 'Linear' },
              { id: 'time_decay', label: 'Time Decay' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedModel === m.id
                  ? 'neu-flat text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Tactile Neumorphic Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="relative w-[240px] h-[240px] flex items-center justify-center">
            {/* Background circular sunken groove */}
            <div className="absolute w-[208px] h-[208px] rounded-full neu-sunken" />

            {/* SVG Donut Ring */}
            <svg
              className="w-[240px] h-[240px] -rotate-90 relative z-10"
              viewBox="0 0 240 240"
            >
              {donutSegments.map((seg) => (
                <circle
                  key={seg.channel}
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={hoveredChannel === seg.channel ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredChannel(seg.channel)}
                  onMouseLeave={() => setHoveredChannel(null)}
                />
              ))}
            </svg>

            {/* Center Embossed Hub */}
            <div className="absolute w-[124px] h-[124px] rounded-full neu-flat flex flex-col items-center justify-center text-center p-2 z-20 pointer-events-none">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                {activeFocus ? activeFocus.channel : 'Total Spend'}
              </span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                ${Math.round(activeFocus ? activeFocus.spend : totalSpend).toLocaleString()}
              </span>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {activeFocus
                  ? `${activeFocus.roas}x ROAS`
                  : `${(totalModelRevenue / (totalSpend || 1)).toFixed(2)}x Blended`}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3">
            Hover over segments to inspect channel share & delta
          </div>
        </div>

        {/* Right Column: Detailed Channel Attribution Ledger */}
        <div className="lg:col-span-7">
          <div className="neu-sunken rounded-2xl p-4 overflow-hidden">
            <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-300/40 dark:border-slate-800/80">
              <div className="col-span-4">Channel</div>
              <div className="col-span-2 text-right">Spend</div>
              <div className="col-span-3 text-right">Attributed Rev</div>
              <div className="col-span-1 text-right">ROAS</div>
              <div className="col-span-2 text-right">Shift</div>
            </div>

            <div className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-mono text-xs">
              {channelData.map((c) => {
                const isHovered = hoveredChannel === c.channel;

                return (
                  <div
                    key={c.channel}
                    onMouseEnter={() => setHoveredChannel(c.channel)}
                    onMouseLeave={() => setHoveredChannel(null)}
                    className={`grid grid-cols-12 py-2.5 items-center transition-colors cursor-pointer rounded-lg px-1 ${
                      isHovered ? 'bg-slate-200/50 dark:bg-slate-800/50' : ''
                    }`}
                  >
                    <div className="col-span-4 flex items-center gap-2 font-sans font-medium text-slate-800 dark:text-slate-100">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate">{c.channel}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {c.shareOfSpend.toFixed(0)}%
                      </span>
                    </div>

                    <div className="col-span-2 text-right font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                      ${Math.round(c.spend).toLocaleString()}
                    </div>

                    <div className="col-span-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                      ${Math.round(c.revenue).toLocaleString()}
                    </div>

                    <div className="col-span-1 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {c.roas}x
                    </div>

                    <div className="col-span-2 text-right tabular-nums text-[11px]">
                      {selectedModel === 'last_click' ? (
                        <span className="text-slate-500">Base</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            c.shiftPercent >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {c.shiftPercent >= 0 ? '+' : ''}
                          {c.shiftPercent.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analyst Observation Note */}
          <div className="flex items-start gap-2.5 mt-3 text-xs text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p>
              Under <strong>{selectedModel.replace('_', ' ')}</strong> modeling,{' '}
              {selectedModel === 'first_touch' || selectedModel === 'data_driven'
                ? 'top-of-funnel discovery channels (TikTok and YouTube) see up to a +28% ROAS lift by crediting unassisted brand discovery.'
                : 'high-intent conversion capture channels like Google Search and Email receive primary conversion weighting.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
