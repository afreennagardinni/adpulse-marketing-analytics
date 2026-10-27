import React from 'react';
import { Sun, Moon, Database, Plus, Activity, FolderDown } from 'lucide-react';
import { DatabaseSyncStatus } from '../services/realtimeDatabase';

interface HeaderProps {
  activeTab: 'overview' | 'campaigns' | 'funnel' | 'database';
  setActiveTab: (tab: 'overview' | 'campaigns' | 'funnel' | 'database') => void;
  isDark: boolean;
  toggleTheme: () => void;
  syncStatus: DatabaseSyncStatus;
  isStreaming: boolean;
  onOpenNewCampaign: () => void;
  onOpenLiveDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  syncStatus,
  isStreaming,
  onOpenNewCampaign,
  onOpenLiveDrawer,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full px-6 py-4 bg-[#eef2f7] dark:bg-[#181d26] border-b border-slate-300/40 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Zone - Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl neu-flat flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
            ▲
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white whitespace-nowrap shrink-0">
            AdPulse Analytics
          </span>
        </div>

        {/* Zone 2: Navigation Links - Single-line text navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'overview'
                ? 'text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            KPI Overview
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'campaigns'
                ? 'text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Campaign Performance
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'funnel'
                ? 'text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Funnel & Attribution
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Real-Time Database</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isStreaming ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              title={isStreaming ? 'Live Streaming' : 'Stream Paused'}
            />
          </button>
        </nav>

        {/* Zone 3: Primary Action & Essential Utility */}
        <div className="flex items-center gap-3 shrink-0">
          {/* GitHub ZIP Download Action */}
          <a
            href="/adpulse-marketing-dashboard.zip"
            download="adpulse-marketing-dashboard.zip"
            title="Download clean project ZIP ready to upload to GitHub"
            className="neu-btn px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
          >
            <FolderDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">GitHub ZIP</span>
          </a>

          {/* Live Stream Quick Drawer Trigger */}
          <button
            onClick={onOpenLiveDrawer}
            title="Real-Time Event Stream Monitor"
            className="neu-btn px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Live Stream</span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {syncStatus.latencyMs}ms
            </span>
          </button>

          {/* New Campaign Primary Button */}
          <button
            onClick={onOpenNewCampaign}
            className="neu-btn px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>

          {/* Neumorphic Dark/Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
