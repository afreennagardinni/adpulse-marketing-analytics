import React, { useState, useMemo } from 'react';
import { Campaign, MarketingChannel, CampaignStatus } from '../types/marketing';
import { Search, Download, Filter, Play, Pause, ExternalLink, Sliders } from 'lucide-react';
import { realtimeDb } from '../services/realtimeDatabase';

interface CampaignsTableProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
  onOpenNewCampaign: () => void;
}

export const CampaignsTable: React.FC<CampaignsTableProps> = ({
  campaigns,
  onSelectCampaign,
  onOpenNewCampaign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<MarketingChannel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'roas' | 'spent' | 'revenue' | 'conversions'>('roas');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  // Filter and sort
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.channel.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesChannel = selectedChannel === 'all' || c.channel === selectedChannel;
        const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
        return matchesSearch && matchesChannel && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [campaigns, searchQuery, selectedChannel, selectedStatus, sortBy, sortOrder]);

  const handleToggleStatus = (c: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: CampaignStatus = c.status === 'active' ? 'paused' : 'active';
    realtimeDb.updateCampaign(c.id, { status: newStatus });
  };

  const handleBudgetChange = (id: string, newBudget: number) => {
    realtimeDb.updateCampaign(id, { dailyBudget: newBudget });
  };

  const handleExportCSV = () => {
    const csvContent = realtimeDb.exportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adpulse_marketing_campaigns_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (col: 'roas' | 'spent' | 'revenue' | 'conversions') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  return (
    <div className="w-full neu-flat rounded-3xl p-6 transition-colors">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Campaign Performance Matrix
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active optimization <span>·</span> Granular ROAS and daily budget allocation
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Recessed Search Bar */}
          <div className="relative min-w-[200px] neu-sunken rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Filter campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none w-full"
            />
          </div>

          {/* Channel Filter */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value as MarketingChannel | 'all')}
            className="neu-btn px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent cursor-pointer focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Meta">Meta</option>
            <option value="TikTok">TikTok</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="YouTube">YouTube</option>
            <option value="Email">Email</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as CampaignStatus | 'all')}
            className="neu-btn px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="optimizing">Optimizing</option>
          </select>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            title="Download CSV for Data Analyst reporting"
            className="neu-btn px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Recessed Table Canvas */}
      <div className="neu-sunken rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-300/40 dark:border-slate-800/80 bg-slate-200/20 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Campaign & Channel</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Daily Budget</th>
                <th
                  onClick={() => toggleSort('spent')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Spend {sortBy === 'spent' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => toggleSort('revenue')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Revenue {sortBy === 'revenue' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => toggleSort('roas')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  ROAS {sortBy === 'roas' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => toggleSort('conversions')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Conversions {sortBy === 'conversions' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="py-3 px-3 text-right">CPA</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-mono">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    No campaigns matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => {
                  const roasDiff = c.roas - c.targetRoas;
                  const roasAboveTarget = roasDiff >= 0;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCampaign(c)}
                      className="hover:bg-slate-200/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Name and Channel */}
                      <td className="py-3 px-4">
                        <div className="font-sans font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {c.name}
                        </div>
                        <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {c.channel} <span>·</span> {c.creativeType} <span>·</span> Started {c.startDate}
                        </div>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleStatus(c, e)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold flex items-center gap-1.5 transition-all ${
                            c.status === 'active'
                              ? 'neu-flat text-emerald-600 dark:text-emerald-400'
                              : c.status === 'optimizing'
                              ? 'neu-flat text-amber-600 dark:text-amber-400'
                              : 'neu-sunken text-slate-400'
                          }`}
                        >
                          {c.status === 'active' ? (
                            <Play className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                          ) : c.status === 'optimizing' ? (
                            <Sliders className="w-3 h-3 text-amber-500" />
                          ) : (
                            <Pause className="w-3 h-3 text-slate-400" />
                          )}
                          <span className="capitalize">{c.status}</span>
                        </button>
                      </td>

                      {/* Daily Budget Slider / In-line control */}
                      <td
                        className="py-3 px-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            ${c.dailyBudget.toLocaleString()}/d
                          </span>
                          <input
                            type="range"
                            min="100"
                            max="5000"
                            step="50"
                            value={c.dailyBudget}
                            onChange={(e) => handleBudgetChange(c.id, Number(e.target.value))}
                            className="w-20 h-1.5 rounded-full neu-groove accent-blue-600 cursor-pointer"
                            title="Adjust daily budget live"
                          />
                        </div>
                      </td>

                      {/* Spend */}
                      <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                        ${Math.round(c.spent).toLocaleString()}
                      </td>

                      {/* Revenue */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                        ${Math.round(c.revenue).toLocaleString()}
                      </td>

                      {/* ROAS & Target Benchmark */}
                      <td className="py-3 px-3 text-right tabular-nums">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`font-bold text-sm ${
                              roasAboveTarget
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {c.roas.toFixed(2)}x
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          Target {c.targetRoas.toFixed(2)}x
                        </div>
                      </td>

                      {/* Conversions */}
                      <td className="py-3 px-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                        <span className="font-semibold">{c.conversions.toLocaleString()}</span>
                        <div className="text-[10px] text-slate-400 font-sans">
                          CVR {c.cvr.toFixed(1)}%
                        </div>
                      </td>

                      {/* CPA */}
                      <td className="py-3 px-3 text-right tabular-nums font-medium text-slate-700 dark:text-slate-300">
                        ${c.cpa.toFixed(2)}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectCampaign(c)}
                          className="neu-btn w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                          title="View campaign analytics"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
