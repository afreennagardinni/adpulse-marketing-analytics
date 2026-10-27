import { Campaign, TimeSeriesPoint, FunnelStage, LiveEvent, MarketingChannel } from '../types/marketing';
import { INITIAL_CAMPAIGNS, INITIAL_FUNNEL, generate30DaysTimeSeries, INITIAL_LIVE_EVENTS } from '../data/mockMarketingData';

const STORAGE_KEYS = {
  CAMPAIGNS: 'adpulse_marketing_campaigns_v1',
  TIME_SERIES: 'adpulse_marketing_timeseries_v1',
  LIVE_EVENTS: 'adpulse_marketing_live_events_v1',
  FUNNEL: 'adpulse_marketing_funnel_v1',
  STREAMING_SPEED: 'adpulse_streaming_speed_v1',
};

export interface DatabaseSyncStatus {
  status: 'connected' | 'syncing' | 'paused' | 'error';
  mode: 'Realtime Webhook' | 'Firestore Stream' | 'Cloud SQL Replica' | 'REST Polling';
  latencyMs: number;
  totalEventsIngested: number;
  lastSyncTimestamp: number;
}

type Listener<T> = (data: T) => void;

class RealtimeMarketingDatabase {
  private campaigns: Campaign[] = [];
  private timeSeries: TimeSeriesPoint[] = [];
  private funnel: FunnelStage[] = [];
  private liveEvents: LiveEvent[] = [];
  private isStreaming: boolean = true;
  private streamSpeed: number = 1; // 1 = every 4s, 2 = every 2s, 5 = every 800ms
  private timerId: number | null = null;
  private syncStatus: DatabaseSyncStatus = {
    status: 'connected',
    mode: 'Realtime Webhook',
    latencyMs: 14,
    totalEventsIngested: 14280,
    lastSyncTimestamp: Date.now(),
  };

  private listeners: {
    campaigns: Listener<Campaign[]>[];
    timeSeries: Listener<TimeSeriesPoint[]>[];
    liveEvents: Listener<LiveEvent[]>[];
    funnel: Listener<FunnelStage[]>[];
    syncStatus: Listener<DatabaseSyncStatus>[];
    streaming: Listener<boolean>[];
    speed: Listener<number>[];
  } = {
    campaigns: [],
    timeSeries: [],
    liveEvents: [],
    funnel: [],
    syncStatus: [],
    streaming: [],
    speed: [],
  };

  constructor() {
    this.loadState();
    this.startStreaming();
  }

  private loadState() {
    try {
      const savedCampaigns = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      this.campaigns = savedCampaigns ? JSON.parse(savedCampaigns) : INITIAL_CAMPAIGNS;

      const savedTimeSeries = localStorage.getItem(STORAGE_KEYS.TIME_SERIES);
      this.timeSeries = savedTimeSeries ? JSON.parse(savedTimeSeries) : generate30DaysTimeSeries();

      const savedFunnel = localStorage.getItem(STORAGE_KEYS.FUNNEL);
      this.funnel = savedFunnel ? JSON.parse(savedFunnel) : INITIAL_FUNNEL;

      const savedEvents = localStorage.getItem(STORAGE_KEYS.LIVE_EVENTS);
      this.liveEvents = savedEvents ? JSON.parse(savedEvents) : INITIAL_LIVE_EVENTS;

      const savedSpeed = localStorage.getItem(STORAGE_KEYS.STREAMING_SPEED);
      if (savedSpeed) {
        this.streamSpeed = Number(savedSpeed) || 1;
      }
    } catch {
      this.campaigns = INITIAL_CAMPAIGNS;
      this.timeSeries = generate30DaysTimeSeries();
      this.funnel = INITIAL_FUNNEL;
      this.liveEvents = INITIAL_LIVE_EVENTS;
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(this.campaigns));
      localStorage.setItem(STORAGE_KEYS.TIME_SERIES, JSON.stringify(this.timeSeries));
      localStorage.setItem(STORAGE_KEYS.FUNNEL, JSON.stringify(this.funnel));
      localStorage.setItem(STORAGE_KEYS.LIVE_EVENTS, JSON.stringify(this.liveEvents.slice(0, 50)));
      localStorage.setItem(STORAGE_KEYS.STREAMING_SPEED, String(this.streamSpeed));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  public subscribeCampaigns(cb: Listener<Campaign[]>): () => void {
    this.listeners.campaigns.push(cb);
    cb([...this.campaigns]);
    return () => {
      this.listeners.campaigns = this.listeners.campaigns.filter((l) => l !== cb);
    };
  }

  public subscribeTimeSeries(cb: Listener<TimeSeriesPoint[]>): () => void {
    this.listeners.timeSeries.push(cb);
    cb([...this.timeSeries]);
    return () => {
      this.listeners.timeSeries = this.listeners.timeSeries.filter((l) => l !== cb);
    };
  }

  public subscribeLiveEvents(cb: Listener<LiveEvent[]>): () => void {
    this.listeners.liveEvents.push(cb);
    cb([...this.liveEvents]);
    return () => {
      this.listeners.liveEvents = this.listeners.liveEvents.filter((l) => l !== cb);
    };
  }

  public subscribeFunnel(cb: Listener<FunnelStage[]>): () => void {
    this.listeners.funnel.push(cb);
    cb([...this.funnel]);
    return () => {
      this.listeners.funnel = this.listeners.funnel.filter((l) => l !== cb);
    };
  }

  public subscribeSyncStatus(cb: Listener<DatabaseSyncStatus>): () => void {
    this.listeners.syncStatus.push(cb);
    cb({ ...this.syncStatus });
    return () => {
      this.listeners.syncStatus = this.listeners.syncStatus.filter((l) => l !== cb);
    };
  }

  public subscribeStreaming(cb: Listener<boolean>): () => void {
    this.listeners.streaming.push(cb);
    cb(this.isStreaming);
    return () => {
      this.listeners.streaming = this.listeners.streaming.filter((l) => l !== cb);
    };
  }

  public subscribeSpeed(cb: Listener<number>): () => void {
    this.listeners.speed.push(cb);
    cb(this.streamSpeed);
    return () => {
      this.listeners.speed = this.listeners.speed.filter((l) => l !== cb);
    };
  }

  public setStreaming(active: boolean) {
    this.isStreaming = active;
    this.syncStatus.status = active ? 'connected' : 'paused';
    this.notifySync();
    this.listeners.streaming.forEach((l) => l(this.isStreaming));
    if (active) {
      this.startStreaming();
    } else if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public setSpeed(speed: number) {
    this.streamSpeed = speed;
    this.saveState();
    this.listeners.speed.forEach((l) => l(this.streamSpeed));
    if (this.isStreaming) {
      this.startStreaming();
    }
  }

  private startStreaming() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }
    if (!this.isStreaming) return;

    const baseInterval = 3500;
    const interval = Math.max(500, Math.round(baseInterval / this.streamSpeed));

    this.timerId = window.setInterval(() => {
      this.simulateIncomingEvent();
    }, interval);
  }

  public simulateIncomingEvent(forcedEvent?: Partial<LiveEvent>) {
    if (this.campaigns.length === 0) return;

    const activeCampaigns = this.campaigns.filter((c) => c.status === 'active');
    const targetCampaign =
      activeCampaigns.length > 0
        ? activeCampaigns[Math.floor(Math.random() * activeCampaigns.length)]
        : this.campaigns[0];

    const eventTypes: Array<'conversion' | 'click' | 'impression' | 'spend_sync'> = [
      'conversion',
      'click',
      'click',
      'click',
      'spend_sync',
    ];
    const chosenType = forcedEvent?.type || eventTypes[Math.floor(Math.random() * eventTypes.length)];

    let value = 0;
    let customerSegment = 'Direct Inbound';
    const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'London, UK', 'Berlin, DE', 'Toronto, CA'];
    const location = locations[Math.floor(Math.random() * locations.length)];

    if (chosenType === 'conversion') {
      const conversionValues = [49.0, 75.0, 120.0, 185.0, 240.0, 399.0, 520.0];
      value = forcedEvent?.value ?? conversionValues[Math.floor(Math.random() * conversionValues.length)];
      customerSegment = 'New Customer Acquisition';
    } else if (chosenType === 'click') {
      value = forcedEvent?.value ?? Number((0.45 + Math.random() * 0.95).toFixed(2));
      customerSegment = 'Audience Lookalike';
    } else if (chosenType === 'spend_sync') {
      value = forcedEvent?.value ?? Number((15 + Math.random() * 35).toFixed(2));
      customerSegment = 'Batch Ledger Ingest';
    }

    const newEvent: LiveEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      type: chosenType,
      campaignId: targetCampaign.id,
      campaignName: targetCampaign.name,
      channel: targetCampaign.channel,
      value,
      customerSegment,
      location,
      ...forcedEvent,
    };

    // Update Live Events Buffer
    this.liveEvents = [newEvent, ...this.liveEvents.slice(0, 49)];
    this.listeners.liveEvents.forEach((l) => l([...this.liveEvents]));

    // Update Campaign Metrics
    this.campaigns = this.campaigns.map((camp) => {
      if (camp.id === targetCampaign.id) {
        let updatedSpent = camp.spent;
        let updatedRevenue = camp.revenue;
        let updatedConversions = camp.conversions;
        let updatedClicks = camp.clicks;
        let updatedImpressions = camp.impressions;

        if (chosenType === 'conversion') {
          updatedRevenue += value;
          updatedConversions += 1;
        } else if (chosenType === 'click') {
          updatedClicks += 1;
          updatedSpent += value;
        } else if (chosenType === 'spend_sync') {
          updatedSpent += value;
          updatedImpressions += Math.round(value * 28);
        }

        const newRoas = updatedSpent > 0 ? Number((updatedRevenue / updatedSpent).toFixed(2)) : camp.roas;
        const newCtr = updatedImpressions > 0 ? Number(((updatedClicks / updatedImpressions) * 100).toFixed(2)) : camp.ctr;
        const newCvr = updatedClicks > 0 ? Number(((updatedConversions / updatedClicks) * 100).toFixed(2)) : camp.cvr;
        const newCpa = updatedConversions > 0 ? Number((updatedSpent / updatedConversions).toFixed(2)) : camp.cpa;

        return {
          ...camp,
          spent: Math.round(updatedSpent * 100) / 100,
          revenue: Math.round(updatedRevenue * 100) / 100,
          conversions: updatedConversions,
          clicks: updatedClicks,
          impressions: updatedImpressions,
          roas: newRoas,
          ctr: newCtr,
          cvr: newCvr,
          cpa: newCpa,
        };
      }
      return camp;
    });
    this.listeners.campaigns.forEach((l) => l([...this.campaigns]));

    // Update Latest Point in TimeSeries
    if (this.timeSeries.length > 0) {
      const lastIdx = this.timeSeries.length - 1;
      const latest = { ...this.timeSeries[lastIdx] };

      if (chosenType === 'conversion') {
        latest.revenue += value;
        latest.conversions += 1;
      } else if (chosenType === 'click') {
        latest.clicks += 1;
        latest.spend += value;
      } else if (chosenType === 'spend_sync') {
        latest.spend += value;
        latest.impressions += Math.round(value * 28);
      }

      latest.roas = latest.spend > 0 ? Number((latest.revenue / latest.spend).toFixed(2)) : latest.roas;

      // Update channel specific sub-breakdown
      const ch = targetCampaign.channel;
      const currentCh = latest.channelBreakdown[ch] || { spend: 0, revenue: 0 };
      latest.channelBreakdown = {
        ...latest.channelBreakdown,
        [ch]: {
          spend: currentCh.spend + (chosenType === 'spend_sync' || chosenType === 'click' ? value : 0),
          revenue: currentCh.revenue + (chosenType === 'conversion' ? value : 0),
        },
      };

      this.timeSeries[lastIdx] = latest;
      this.listeners.timeSeries.forEach((l) => l([...this.timeSeries]));
    }

    // Update Funnel Counts
    if (chosenType === 'conversion') {
      this.funnel = this.funnel.map((stage) => {
        if (stage.id === 'purchases') return { ...stage, count: stage.count + 1 };
        return stage;
      });
      this.listeners.funnel.forEach((l) => l([...this.funnel]));
    } else if (chosenType === 'click') {
      this.funnel = this.funnel.map((stage) => {
        if (stage.id === 'clicks') return { ...stage, count: stage.count + 1 };
        return stage;
      });
      this.listeners.funnel.forEach((l) => l([...this.funnel]));
    }

    // Update Sync Status
    this.syncStatus.totalEventsIngested += 1;
    this.syncStatus.lastSyncTimestamp = Date.now();
    this.syncStatus.latencyMs = Math.round(10 + Math.random() * 12);
    this.notifySync();

    this.saveState();
  }

  public addCampaign(campaign: Omit<Campaign, 'id'>) {
    const newCamp: Campaign = {
      ...campaign,
      id: `camp-${Date.now()}`,
    };
    this.campaigns = [newCamp, ...this.campaigns];
    this.saveState();
    this.listeners.campaigns.forEach((l) => l([...this.campaigns]));

    this.simulateIncomingEvent({
      type: 'spend_sync',
      campaignId: newCamp.id,
      campaignName: newCamp.name,
      channel: newCamp.channel,
      value: newCamp.dailyBudget,
      customerSegment: 'Initial Budget Allocation',
    });
  }

  public updateCampaign(id: string, partial: Partial<Campaign>) {
    this.campaigns = this.campaigns.map((c) => {
      if (c.id === id) {
        const updated = { ...c, ...partial };
        if (updated.spent > 0) {
          updated.roas = Number((updated.revenue / updated.spent).toFixed(2));
        }
        return updated;
      }
      return c;
    });
    this.saveState();
    this.listeners.campaigns.forEach((l) => l([...this.campaigns]));
  }

  public deleteCampaign(id: string) {
    this.campaigns = this.campaigns.filter((c) => c.id !== id);
    this.saveState();
    this.listeners.campaigns.forEach((l) => l([...this.campaigns]));
  }

  public resetToDefaults() {
    this.campaigns = INITIAL_CAMPAIGNS;
    this.timeSeries = generate30DaysTimeSeries();
    this.funnel = INITIAL_FUNNEL;
    this.liveEvents = INITIAL_LIVE_EVENTS;
    this.streamSpeed = 1;
    this.saveState();
    this.listeners.campaigns.forEach((l) => l([...this.campaigns]));
    this.listeners.timeSeries.forEach((l) => l([...this.timeSeries]));
    this.listeners.funnel.forEach((l) => l([...this.funnel]));
    this.listeners.liveEvents.forEach((l) => l([...this.liveEvents]));
    this.listeners.speed.forEach((l) => l(1));
  }

  public exportJSON(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      campaigns: this.campaigns,
      timeSeries: this.timeSeries,
      funnel: this.funnel,
      liveEvents: this.liveEvents,
    };
    return JSON.stringify(data, null, 2);
  }

  public exportCSV(): string {
    const headers = [
      'Campaign ID',
      'Name',
      'Channel',
      'Status',
      'Daily Budget ($)',
      'Total Spend ($)',
      'Total Revenue ($)',
      'ROAS (x)',
      'Target ROAS (x)',
      'Impressions',
      'Clicks',
      'Conversions',
      'CTR (%)',
      'CVR (%)',
      'CPA ($)',
      'CAC ($)',
      'Start Date',
    ];

    const rows = this.campaigns.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.channel,
      c.status,
      c.dailyBudget,
      c.spent,
      c.revenue,
      c.roas,
      c.targetRoas,
      c.impressions,
      c.clicks,
      c.conversions,
      c.ctr,
      c.cvr,
      c.cpa,
      c.cac,
      c.startDate,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public importJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.campaigns && Array.isArray(data.campaigns)) {
        this.campaigns = data.campaigns;
      }
      if (data.timeSeries && Array.isArray(data.timeSeries)) {
        this.timeSeries = data.timeSeries;
      }
      if (data.funnel && Array.isArray(data.funnel)) {
        this.funnel = data.funnel;
      }
      this.saveState();
      this.listeners.campaigns.forEach((l) => l([...this.campaigns]));
      this.listeners.timeSeries.forEach((l) => l([...this.timeSeries]));
      this.listeners.funnel.forEach((l) => l([...this.funnel]));
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  private notifySync() {
    this.listeners.syncStatus.forEach((l) => l({ ...this.syncStatus }));
  }
}

export const realtimeDb = new RealtimeMarketingDatabase();
