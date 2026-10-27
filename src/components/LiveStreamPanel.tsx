import React, { useState } from 'react';
import { LiveEvent } from '../types/marketing';
import { DatabaseSyncStatus, realtimeDb } from '../services/realtimeDatabase';
import {
  Activity,
  Play,
  Pause,
  Zap,
  Download,
  Upload,
  RotateCcw,
  Clock,
  Radio,
  Server,
  DollarSign,
  MousePointer,
  Sparkles,
} from 'lucide-react';

interface LiveStreamPanelProps {
  liveEvents: LiveEvent[];
  syncStatus: DatabaseSyncStatus;
  isStreaming: boolean;
  streamSpeed: number;
  onClose?: () => void;
}

export const LiveStreamPanel: React.FC<LiveStreamPanelProps> = ({
  liveEvents,
  syncStatus,
  isStreaming,
  streamSpeed,
  onClose,
}) => {
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSimulateBurst = () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        realtimeDb.simulateIncomingEvent({
          type: 'conversion',
          value: Number((120 + Math.random() * 280).toFixed(2)),
          customerSegment: 'Viral Campaign Spike',
        });
      }, i * 300);
    }
    showToast('Injected 5 rapid conversion webhook events');
  };

  const handleSimulateSpendSync = () => {
    realtimeDb.simulateIncomingEvent({
      type: 'spend_sync',
      value: 75.0,
      customerSegment: 'Hourly Ad API Batch Sync',
    });
    showToast('Ad spend batch synchronized from Marketing API');
  };

  const handleExportJSON = () => {
    const jsonStr = realtimeDb.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adpulse_db_snapshot_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Database snapshot exported as JSON');
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const success = realtimeDb.importJSON(importText);
    if (success) {
      showToast('Database imported successfully');
      setShowImport(false);
      setImportText('');
    } else {
      showToast('Invalid JSON schema');
    }
  };

  const handleResetData = () => {
    if (confirm('Reset marketing database to default seed state?')) {
      realtimeDb.resetToDefaults();
      showToast('Database reset to defaults');
    }
  };

  return (
    <div className="w-full neu-flat rounded-3xl p-6 transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-4 p-3 rounded-xl neu-flat text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Real-Time Ingestion & Streaming Database
            </h2>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Low-latency pixel webhook listeners <span>·</span> Event ledger buffer
          </div>
        </div>

        {/* Telemetry Chips */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="neu-sunken-sm px-3 py-1.5 rounded-xl flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Server className="w-3.5 h-3.5 text-blue-500" />
            <span>Mode: {syncStatus.mode}</span>
          </div>

          <div className="neu-sunken-sm px-3 py-1.5 rounded-xl flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Latency: {syncStatus.latencyMs}ms</span>
          </div>

          <div className="neu-sunken-sm px-3 py-1.5 rounded-xl flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Ingested: {syncStatus.totalEventsIngested.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Control Station Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Stream Play/Pause & Speed */}
        <div className="md:col-span-6 p-4 rounded-2xl neu-sunken flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => realtimeDb.setStreaming(!isStreaming)}
              className={`neu-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                isStreaming
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Stream
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume Stream
                </>
              )}
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Status: {isStreaming ? 'Streaming' : 'Halted'}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 neu-flat-sm p-1 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 px-1.5">Speed:</span>
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => realtimeDb.setSpeed(s)}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  streamSpeed === s
                    ? 'neu-sunken text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Injection Triggers & Database Tools */}
        <div className="md:col-span-6 p-4 rounded-2xl neu-sunken flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateBurst}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
              title="Simulate flash sale / viral surge"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+ Conversion Surge</span>
            </button>

            <button
              onClick={handleSimulateSpendSync}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              title="Simulate ad spend poll from Meta / Google API"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>+ Spend Sync</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300"
              title="Export Full Database JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowImport(!showImport)}
              className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300"
              title="Import Database JSON"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetData}
              className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center text-rose-500"
              title="Reset Database to Seed State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Import Box */}
      {showImport && (
        <div className="neu-sunken rounded-2xl p-4 mb-6">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            Paste Marketing Database JSON Payload:
          </label>
          <textarea
            rows={4}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"campaigns": [...], "timeSeries": [...]}'
            className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-800 focus:outline-none mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowImport(false)}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSubmit}
              className="neu-btn px-4 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              Apply Snapshot
            </button>
          </div>
        </div>
      )}

      {/* Live Event Stream Ledger */}
      <div className="neu-sunken rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span>Live Ingestion Feed (Rolling 50 events)</span>
          <span className="font-mono text-[11px]">
            Last Sync: {new Date(syncStatus.lastSyncTimestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {liveEvents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No live events received yet. Resume streaming or trigger a manual simulation above.
            </div>
          ) : (
            liveEvents.map((evt) => {
              const dateStr = new Date(evt.timestamp).toLocaleTimeString();
              const isConversion = evt.type === 'conversion';
              const isSpend = evt.type === 'spend_sync';

              return (
                <div
                  key={evt.id}
                  className="neu-flat-sm p-3 rounded-xl flex items-center justify-between gap-4 text-xs font-mono hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isConversion
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isSpend
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isConversion ? (
                        <DollarSign className="w-3.5 h-3.5" />
                      ) : isSpend ? (
                        <Zap className="w-3.5 h-3.5" />
                      ) : (
                        <MousePointer className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div>
                      <div className="font-sans font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{evt.campaignName}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          [{evt.channel}]
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                        {evt.customerSegment || evt.type} <span>·</span> {evt.location || 'Global'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold tabular-nums text-sm ${
                        isConversion
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isSpend
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isConversion
                        ? `+$${evt.value.toFixed(2)}`
                        : isSpend
                        ? `-$${evt.value.toFixed(2)}`
                        : `$${evt.value.toFixed(2)} CPC`}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
