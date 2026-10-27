import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KpiMetricsGrid } from './components/KpiMetricsGrid';
import { InteractiveTrendChart } from './components/InteractiveTrendChart';
import { ChannelAttributionChart } from './components/ChannelAttributionChart';
import { FunnelAnalysis } from './components/FunnelAnalysis';
import { CampaignsTable } from './components/CampaignsTable';
import { LiveStreamPanel } from './components/LiveStreamPanel';
import { NewCampaignModal } from './components/NewCampaignModal';
import { CampaignDetailModal } from './components/CampaignDetailModal';
import { realtimeDb, DatabaseSyncStatus } from './services/realtimeDatabase';
import { Campaign, TimeSeriesPoint, FunnelStage, LiveEvent } from './types/marketing';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'funnel' | 'database'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'revenue_spend' | 'roas' | 'conversions' | 'clicks_impressions'>('revenue_spend');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Real-time Database State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [syncStatus, setSyncStatus] = useState<DatabaseSyncStatus>({
    status: 'connected',
    mode: 'Realtime Webhook',
    latencyMs: 14,
    totalEventsIngested: 14280,
    lastSyncTimestamp: Date.now(),
  });
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);

  // Modals
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState<boolean>(false);
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] = useState<Campaign | null>(null);
  const [isLiveDrawerOpen, setIsLiveDrawerOpen] = useState<boolean>(false);

  // Dark mode init
  useEffect(() => {
    const savedDark = localStorage.getItem('adpulse_dark_mode');
    if (savedDark === 'true' || (!savedDark && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('adpulse_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('adpulse_dark_mode', 'false');
    }
  };

  // Subscriptions to Realtime Database
  useEffect(() => {
    const unsubCamp = realtimeDb.subscribeCampaigns(setCampaigns);
    const unsubTS = realtimeDb.subscribeTimeSeries(setTimeSeries);
    const unsubFunnel = realtimeDb.subscribeFunnel(setFunnel);
    const unsubEvents = realtimeDb.subscribeLiveEvents(setLiveEvents);
    const unsubSync = realtimeDb.subscribeSyncStatus(setSyncStatus);
    const unsubStream = realtimeDb.subscribeStreaming(setIsStreaming);
    const unsubSpeed = realtimeDb.subscribeSpeed(setStreamSpeed);

    return () => {
      unsubCamp();
      unsubTS();
      unsubFunnel();
      unsubEvents();
      unsubSync();
      unsubStream();
      unsubSpeed();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#eef2f7] dark:bg-[#161a22] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        syncStatus={syncStatus}
        isStreaming={isStreaming}
        onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
        onOpenLiveDrawer={() => setIsLiveDrawerOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Metrics Strip - Always accessible */}
        <KpiMetricsGrid
          campaigns={campaigns}
          timeSeries={timeSeries}
          selectedMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
        />

        {/* Dynamic View Sections */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Focal Anchor: Interactive Neumorphic Trend Engine */}
            <InteractiveTrendChart
              timeSeries={timeSeries}
              selectedMetric={selectedMetric}
              onSelectMetric={setSelectedMetric}
            />

            {/* Split Section: Channel Attribution & Funnel Drop-off */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <ChannelAttributionChart campaigns={campaigns} />
              <FunnelAnalysis funnel={funnel} />
            </div>

            {/* Campaign Performance Matrix Quick Preview */}
            <CampaignsTable
              campaigns={campaigns}
              onSelectCampaign={(c) => setSelectedCampaignForDetail(c)}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
            />
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <CampaignsTable
              campaigns={campaigns}
              onSelectCampaign={(c) => setSelectedCampaignForDetail(c)}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
            />

            {/* Attribution distribution companion */}
            <ChannelAttributionChart campaigns={campaigns} />
          </div>
        )}

        {activeTab === 'funnel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <FunnelAnalysis funnel={funnel} />
              <ChannelAttributionChart campaigns={campaigns} />
            </div>

            {/* Trajectory comparison */}
            <InteractiveTrendChart
              timeSeries={timeSeries}
              selectedMetric={selectedMetric}
              onSelectMetric={setSelectedMetric}
            />
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6">
            <LiveStreamPanel
              liveEvents={liveEvents}
              syncStatus={syncStatus}
              isStreaming={isStreaming}
              streamSpeed={streamSpeed}
            />
          </div>
        )}
      </main>

      {/* Live Event Drawer Modal */}
      {isLiveDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <LiveStreamPanel
              liveEvents={liveEvents}
              syncStatus={syncStatus}
              isStreaming={isStreaming}
              streamSpeed={streamSpeed}
              onClose={() => setIsLiveDrawerOpen(false)}
            />
            <div className="text-center mt-3">
              <button
                onClick={() => setIsLiveDrawerOpen(false)}
                className="neu-btn px-6 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close Real-Time Monitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Creation Modal */}
      <NewCampaignModal
        isOpen={isNewCampaignOpen}
        onClose={() => setIsNewCampaignOpen(false)}
      />

      {/* Campaign Detail Drill-Down Modal */}
      <CampaignDetailModal
        campaign={selectedCampaignForDetail}
        onClose={() => setSelectedCampaignForDetail(null)}
      />

      {/* Quiet Editorial Footer */}
      <footer className="w-full border-t border-slate-300/40 dark:border-slate-800/80 py-6 px-6 mt-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              AdPulse Econometrics
            </span>
            <span>·</span>
            <span>Marketing Analyst KPI Dashboard</span>
            <span>·</span>
            <span>Neumorphic Interface</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Real-Time Ingestion Sync Active</span>
            </span>
            <span>·</span>
            <button
              onClick={() => realtimeDb.resetToDefaults()}
              className="hover:text-rose-500 transition-colors"
            >
              Reset Seed Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
