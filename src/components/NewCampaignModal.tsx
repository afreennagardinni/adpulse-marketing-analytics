import React, { useState } from 'react';
import { MarketingChannel, Campaign } from '../types/marketing';
import { X, Plus, Sparkles } from 'lucide-react';
import { realtimeDb } from '../services/realtimeDatabase';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<MarketingChannel>('Meta');
  const [dailyBudget, setDailyBudget] = useState(850);
  const [targetRoas, setTargetRoas] = useState(4.0);
  const [creativeType, setCreativeType] = useState<Campaign['creativeType']>('Carousels');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    realtimeDb.addCampaign({
      name: name.trim(),
      channel,
      status: 'active',
      dailyBudget,
      spent: dailyBudget,
      revenue: dailyBudget * targetRoas,
      roas: targetRoas,
      targetRoas,
      impressions: Math.round(dailyBudget * 42),
      clicks: Math.round(dailyBudget * 1.5),
      conversions: Math.round((dailyBudget * targetRoas) / 65),
      ctr: 3.5,
      cvr: 4.2,
      cpa: Number((dailyBudget / Math.max(1, (dailyBudget * targetRoas) / 65)).toFixed(2)),
      cac: Number((dailyBudget / Math.max(1, (dailyBudget * targetRoas) / 65) * 1.8).toFixed(2)),
      startDate: new Date().toISOString().split('T')[0],
      creativeType,
      performanceHistory: [
        {
          date: 'Today',
          spend: dailyBudget,
          revenue: dailyBudget * targetRoas,
          roas: targetRoas,
          conversions: Math.round((dailyBudget * targetRoas) / 65),
        },
      ],
    });

    onClose();
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg neu-flat rounded-3xl p-6 border border-slate-300/40 dark:border-slate-800/80 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/80 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl neu-sunken flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Launch Marketing Campaign
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register campaign in real-time streaming database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Campaign Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Black Friday Growth Retargeting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full neu-sunken px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as MarketingChannel)}
                className="w-full neu-sunken px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="Google Ads">Google Ads</option>
                <option value="Meta">Meta</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="YouTube">YouTube</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Creative Format
              </label>
              <select
                value={creativeType}
                onChange={(e) => setCreativeType(e.target.value as Campaign['creativeType'])}
                className="w-full neu-sunken px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="Carousels">Carousels</option>
                <option value="Video">Video</option>
                <option value="Search Intent">Search Intent</option>
                <option value="Newsletter">Newsletter</option>
                <option value="Sponsored InMail">Sponsored InMail</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Daily Budget
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
                  Target ROAS
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

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200/60 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neu-btn px-5 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5"
            >
              <span>Provision & Activate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
