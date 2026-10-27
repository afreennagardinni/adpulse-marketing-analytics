import React, { useState } from 'react';
import { Campaign, CampaignStatus } from '../types/marketing';
import { X, Play, Pause, Trash2, TrendingUp, DollarSign, Target, Award } from 'lucide-react';
import { realtimeDb } from '../services/realtimeDatabase';

interface CampaignDetailModalProps {
  campaign: Campaign | null;
  onClose: () => void;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({ campaign, onClose }) => {
  if (!campaign) return null;

  const [dailyBudget, setDailyBudget] = useState(campaign.dailyBudget);
  const [targetRoas, setTargetRoas] = useState(campaign.targetRoas);

  const handleUpdate = () => {
    realtimeDb.updateCampaign(campaign.id, {
      dailyBudget,
      targetRoas,
    });
    onClose();
  };

  const handleToggleStatus = () => {
    const nextStatus: CampaignStatus = campaign.status === 'active' ? 'paused' : 'active';
    realtimeDb.updateCampaign(campaign.id, { status: nextStatus });
  };

  const handleDelete = () => {
    if (confirm(`Delete campaign "${campaign.name}"?`)) {
      realtimeDb.deleteCampaign(campaign.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl neu-flat rounded-3xl p-6 border border-slate-300/40 dark:border-slate-800/80 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/80 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {campaign.channel}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-sans">
                {campaign.creativeType}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-sans">
                Launched {campaign.startDate}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {campaign.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              className={`neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                campaign.status === 'active'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {campaign.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="capitalize">{campaign.status}</span>
            </button>

            <button
              onClick={onClose}
              className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="neu-sunken p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Attributed Revenue
            </span>
            <span className="font-mono font-bold text-base text-slate-900 dark:text-white tabular-nums">
              ${Math.round(campaign.revenue).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              Spend ${Math.round(campaign.spent).toLocaleString()}
            </span>
          </div>

          <div className="neu-sunken p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              ROAS Efficiency
            </span>
            <span
              className={`font-mono font-bold text-base tabular-nums ${
                campaign.roas >= campaign.targetRoas
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {campaign.roas.toFixed(2)}x
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              Target {campaign.targetRoas.toFixed(2)}x
            </span>
          </div>

          <div className="neu-sunken p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Conversions
            </span>
            <span className="font-mono font-bold text-base text-slate-900 dark:text-white tabular-nums">
              {campaign.conversions.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              CVR {campaign.cvr.toFixed(2)}%
            </span>
          </div>

          <div className="neu-sunken p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Unit Economics
            </span>
            <span className="font-mono font-bold text-base text-slate-900 dark:text-white tabular-nums">
              ${campaign.cpa.toFixed(2)} CPA
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              CAC ${campaign.cac.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 7-Day Performance History Ledger */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
            Historical 7-Day Performance Log
          </h4>
          <div className="neu-sunken rounded-2xl p-3 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-300/40 dark:border-slate-800/60 text-slate-500 text-[11px]">
                <tr>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2 text-right">Spend</th>
                  <th className="py-2 px-2 text-right">Revenue</th>
                  <th className="py-2 px-2 text-right">ROAS</th>
                  <th className="py-2 px-2 text-right">Conversions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                {campaign.performanceHistory.map((hist, i) => (
                  <tr key={i} className="hover:bg-slate-200/30 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {hist.date}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      ${Math.round(hist.spend).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                      ${Math.round(hist.revenue).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {hist.roas.toFixed(2)}x
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {hist.conversions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Budget & Target Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl neu-sunken mb-6">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Daily Budget Cap
              </label>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                ${dailyBudget}/day
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="50"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Number(e.target.value))}
              className="w-full h-2 neu-groove rounded-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target ROAS Threshold
              </label>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {targetRoas.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="1.5"
              max="10.0"
              step="0.1"
              value={targetRoas}
              onChange={(e) => setTargetRoas(Number(e.target.value))}
              className="w-full h-2 neu-groove rounded-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
          <button
            onClick={handleDelete}
            className="neu-btn px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Campaign</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="neu-btn px-5 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
