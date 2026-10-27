import React, { useState, useMemo } from 'react';
import { TimeSeriesPoint, MarketingChannel } from '../types/marketing';
import { Calendar, Layers, Eye, TrendingUp } from 'lucide-react';

interface InteractiveTrendChartProps {
  timeSeries: TimeSeriesPoint[];
  selectedMetric: 'revenue_spend' | 'roas' | 'conversions' | 'clicks_impressions';
  onSelectMetric: (metric: 'revenue_spend' | 'roas' | 'conversions' | 'clicks_impressions') => void;
}

export const InteractiveTrendChart: React.FC<InteractiveTrendChartProps> = ({
  timeSeries,
  selectedMetric,
  onSelectMetric,
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [channelFilter, setChannelFilter] = useState<MarketingChannel | 'all'>('all');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter time series data based on chosen timeframe
  const filteredData = useMemo(() => {
    if (timeframe === '7d') {
      return timeSeries.slice(-7);
    }
    return timeSeries; // Default 30 points
  }, [timeSeries, timeframe]);

  // Chart dimensions
  const width = 840;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Compute values based on selected metric and channel filter
  const chartPoints = useMemo(() => {
    return filteredData.map((d, index) => {
      let val1 = 0; // Primary series
      let val2 = 0; // Secondary series (if dual)

      if (channelFilter === 'all') {
        if (selectedMetric === 'revenue_spend') {
          val1 = d.revenue;
          val2 = d.spend;
        } else if (selectedMetric === 'roas') {
          val1 = d.roas;
          val2 = 3.8; // Target benchmark line
        } else if (selectedMetric === 'conversions') {
          val1 = d.conversions;
          val2 = d.spend > 0 ? d.spend / (d.conversions || 1) : 0; // CPA
        } else {
          val1 = d.clicks;
          val2 = d.impressions / 100; // Scaled impressions
        }
      } else {
        const chData = d.channelBreakdown[channelFilter] || { spend: 0, revenue: 0 };
        if (selectedMetric === 'revenue_spend') {
          val1 = chData.revenue;
          val2 = chData.spend;
        } else if (selectedMetric === 'roas') {
          val1 = chData.spend > 0 ? Number((chData.revenue / chData.spend).toFixed(2)) : 0;
          val2 = 3.8;
        } else if (selectedMetric === 'conversions') {
          val1 = Math.round(chData.revenue / 65);
          val2 = chData.spend / (val1 || 1);
        } else {
          val1 = Math.round(chData.spend / 0.6);
          val2 = val1 * 30 / 100;
        }
      }

      return {
        ...d,
        index,
        val1,
        val2,
      };
    });
  }, [filteredData, selectedMetric, channelFilter]);

  // Min and max bounds for scaling
  const maxVal1 = Math.max(...chartPoints.map((p) => p.val1), 10);
  const minVal1 = 0;
  const maxVal2 = Math.max(...chartPoints.map((p) => p.val2), 10);

  // SVG coordinate builders
  const getX = (index: number) => {
    if (chartPoints.length <= 1) return padding.left;
    return padding.left + (index / (chartPoints.length - 1)) * innerWidth;
  };

  const getY1 = (val: number) => {
    const range = maxVal1 - minVal1 || 1;
    return padding.top + innerHeight - ((val - minVal1) / range) * innerHeight;
  };

  const getY2 = (val: number) => {
    // For dual scale or same scale
    const maxVal = selectedMetric === 'roas' ? Math.max(maxVal1, 6) : maxVal2;
    return padding.top + innerHeight - (val / (maxVal || 1)) * innerHeight;
  };

  // Generate smooth cubic bezier SVG path
  const makeSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const pointsSeries1 = chartPoints.map((p) => ({ x: getX(p.index), y: getY1(p.val1) }));
  const pathSeries1 = makeSmoothPath(pointsSeries1);

  // Area path for primary series
  const areaSeries1 =
    pointsSeries1.length > 0
      ? `${pathSeries1} L ${pointsSeries1[pointsSeries1.length - 1].x} ${padding.top + innerHeight} L ${pointsSeries1[0].x} ${padding.top + innerHeight} Z`
      : '';

  const pointsSeries2 = chartPoints.map((p) => ({ x: getX(p.index), y: getY2(p.val2) }));
  const pathSeries2 = makeSmoothPath(pointsSeries2);

  // Active hover point
  const activePoint = hoverIndex !== null && chartPoints[hoverIndex] ? chartPoints[hoverIndex] : null;

  // Metric color config
  const metricConfigs = {
    revenue_spend: {
      label1: 'Attributed Revenue',
      label2: 'Ad Spend',
      color1: '#2563eb', // Blue
      color2: '#64748b', // Slate
      format1: (v: number) => `$${Math.round(v).toLocaleString()}`,
      format2: (v: number) => `$${Math.round(v).toLocaleString()}`,
    },
    roas: {
      label1: 'Realized ROAS',
      label2: 'Target ROAS (3.80x)',
      color1: '#10b981', // Emerald
      color2: '#f59e0b', // Amber target
      format1: (v: number) => `${v.toFixed(2)}x`,
      format2: (v: number) => `${v.toFixed(2)}x`,
    },
    conversions: {
      label1: 'Conversions',
      label2: 'Cost Per Acquisition (CPA)',
      color1: '#f59e0b', // Amber
      color2: '#8b5cf6', // Violet
      format1: (v: number) => Math.round(v).toLocaleString(),
      format2: (v: number) => `$${v.toFixed(2)}`,
    },
    clicks_impressions: {
      label1: 'Inbound Clicks',
      label2: 'Impressions (scaled /100)',
      color1: '#06b6d4', // Cyan
      color2: '#3b82f6', // Blue
      format1: (v: number) => Math.round(v).toLocaleString(),
      format2: (v: number) => `${Math.round(v * 100).toLocaleString()}`,
    },
  };

  const currentCfg = metricConfigs[selectedMetric];

  // Grid tick lines
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map((t) => {
    const val = minVal1 + t * (maxVal1 - minVal1);
    const y = padding.top + innerHeight - t * innerHeight;
    return { val, y };
  });

  return (
    <div className="w-full neu-flat rounded-3xl p-6 transition-colors">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Campaign Trajectory & Efficiency Engine
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time interactive telemetry <span>·</span> Cross-channel econometric modeling
          </div>
        </div>

        {/* Segmented Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Selector Buttons */}
          <div className="flex items-center p-1 rounded-xl neu-sunken-sm">
            <button
              onClick={() => onSelectMetric('revenue_spend')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedMetric === 'revenue_spend'
                  ? 'neu-flat text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Revenue / Spend
            </button>
            <button
              onClick={() => onSelectMetric('roas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedMetric === 'roas'
                  ? 'neu-flat text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              ROAS
            </button>
            <button
              onClick={() => onSelectMetric('conversions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedMetric === 'conversions'
                  ? 'neu-flat text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Conversions & CPA
            </button>
            <button
              onClick={() => onSelectMetric('clicks_impressions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedMetric === 'clicks_impressions'
                  ? 'neu-flat text-cyan-600 dark:text-cyan-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Engagement
            </button>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center p-1 rounded-xl neu-sunken-sm">
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                timeframe === '7d'
                  ? 'neu-flat text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                timeframe === '30d'
                  ? 'neu-flat text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              30D
            </button>
          </div>

          {/* Channel Filter Dropdown */}
          <div className="relative">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as MarketingChannel | 'all')}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent cursor-pointer focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Meta">Meta</option>
              <option value="TikTok">TikTok</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="YouTube">YouTube</option>
              <option value="Email">Email</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recessed Neumorphic Chart Area */}
      <div className="relative neu-sunken rounded-2xl p-4 overflow-hidden">
        {/* Active Legends */}
        <div className="flex items-center gap-6 mb-2 px-2 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentCfg.color1 }}
            />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {currentCfg.label1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-1.5 rounded-sm"
              style={{ backgroundColor: currentCfg.color2 }}
            />
            <span className="text-slate-500 dark:text-slate-400">
              {currentCfg.label2}
            </span>
          </div>
          {channelFilter !== 'all' && (
            <span className="text-blue-600 dark:text-blue-400 font-semibold ml-auto text-xs">
              Filtered: {channelFilter}
            </span>
          )}
        </div>

        {/* SVG Chart Canvas */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[280px] sm:h-[320px] select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              {/* Primary Area Fill Gradient */}
              <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentCfg.color1} stopOpacity="0.28" />
                <stop offset="90%" stopColor={currentCfg.color1} stopOpacity="0.01" />
              </linearGradient>

              {/* Neumorphic Grid Line Filter */}
              <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid Lines & Y-Axis Labels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={width - padding.right}
                  y2={tick.y}
                  stroke="currentColor"
                  className="text-slate-300/40 dark:text-slate-700/50"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono tabular-nums"
                >
                  {currentCfg.format1(tick.val)}
                </text>
              </g>
            ))}

            {/* Benchmark target line for ROAS */}
            {selectedMetric === 'roas' && (
              <line
                x1={padding.left}
                y1={getY2(3.8)}
                x2={width - padding.right}
                y2={getY2(3.8)}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                className="opacity-70"
              />
            )}

            {/* Primary Area Fill */}
            {areaSeries1 && (
              <path d={areaSeries1} fill="url(#areaGradientPrimary)" />
            )}

            {/* Secondary Line Series */}
            {pathSeries2 && (
              <path
                d={pathSeries2}
                fill="none"
                stroke={currentCfg.color2}
                strokeWidth="2"
                strokeDasharray={selectedMetric === 'roas' ? '5 5' : undefined}
                className="opacity-75"
              />
            )}

            {/* Primary Line Series */}
            {pathSeries1 && (
              <path
                d={pathSeries1}
                fill="none"
                stroke={currentCfg.color1}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* X-Axis Labels (Date strings) */}
            {chartPoints.map((p, i) => {
              // Only display some labels to avoid crowding
              const step = Math.ceil(chartPoints.length / 8);
              if (i % step !== 0 && i !== chartPoints.length - 1) return null;
              const x = getX(i);
              return (
                <text
                  key={i}
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium font-mono"
                >
                  {p.label}
                </text>
              );
            })}

            {/* Interactive Hover Columns (invisible hit targets) */}
            {chartPoints.map((p, i) => {
              const x = getX(i);
              const colWidth = innerWidth / chartPoints.length;

              return (
                <rect
                  key={i}
                  x={x - colWidth / 2}
                  y={padding.top}
                  width={colWidth}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              );
            })}

            {/* Active Hover Crosshair & Indicators */}
            {activePoint && hoverIndex !== null && (
              <g>
                {/* Vertical Hairline */}
                <line
                  x1={getX(hoverIndex)}
                  y1={padding.top}
                  x2={getX(hoverIndex)}
                  y2={padding.top + innerHeight}
                  stroke={currentCfg.color1}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="opacity-90"
                />

                {/* Point 1 Indicator Dot */}
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY1(activePoint.val1)}
                  r="6"
                  fill={currentCfg.color1}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />

                {/* Point 2 Indicator Dot */}
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY2(activePoint.val2)}
                  r="4.5"
                  fill={currentCfg.color2}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="drop-shadow-sm"
                />
              </g>
            )}
          </svg>

          {/* Floating Neumorphic Tooltip Card */}
          {activePoint && hoverIndex !== null && (
            <div
              className="absolute z-20 pointer-events-none neu-flat rounded-xl p-3 border border-slate-300/60 dark:border-slate-700/60 shadow-xl min-w-[210px] transition-all duration-75"
              style={{
                left: `${Math.min(
                  Math.max(20, (getX(hoverIndex) / width) * 100),
                  75
                )}%`,
                top: '15px',
              }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {activePoint.label}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {activePoint.dateStr}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">
                    {currentCfg.label1}:
                  </span>
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: currentCfg.color1 }}
                  >
                    {currentCfg.format1(activePoint.val1)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">
                    {currentCfg.label2}:
                  </span>
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: currentCfg.color2 }}
                  >
                    {currentCfg.format2(activePoint.val2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-200/40 dark:border-slate-800/60 text-[11px]">
                  <span className="text-slate-500">Day Conversions:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                    {activePoint.conversions}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Econometric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/60 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            Peak Daily Revenue
          </span>
          <span className="font-bold font-mono text-slate-800 dark:text-white text-sm tabular-nums">
            ${Math.max(...chartPoints.map((p) => p.revenue)).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            Period Avg ROAS
          </span>
          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
            {(
              chartPoints.reduce((acc, p) => acc + p.roas, 0) /
              (chartPoints.length || 1)
            ).toFixed(2)}
            x
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            Total Period Spend
          </span>
          <span className="font-bold font-mono text-slate-800 dark:text-white text-sm tabular-nums">
            ${Math.round(chartPoints.reduce((acc, p) => acc + p.spend, 0)).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            Attribution Confidence
          </span>
          <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm tabular-nums">
            99.4% (Multi-Pixel)
          </span>
        </div>
      </div>
    </div>
  );
};
