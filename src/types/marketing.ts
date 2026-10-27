export type MarketingChannel = 'Google Ads' | 'Meta' | 'TikTok' | 'LinkedIn' | 'YouTube' | 'Email';

export type CampaignStatus = 'active' | 'paused' | 'optimizing';

export interface Campaign {
  id: string;
  name: string;
  channel: MarketingChannel;
  status: CampaignStatus;
  dailyBudget: number;
  spent: number;
  revenue: number;
  roas: number;
  targetRoas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // percentage e.g. 3.2
  cvr: number; // percentage e.g. 4.8
  cpa: number; // cost per acquisition
  cac: number; // customer acquisition cost
  startDate: string;
  creativeType: 'Video' | 'Carousels' | 'Search Intent' | 'Newsletter' | 'Sponsored InMail';
  performanceHistory: {
    date: string;
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
  }[];
}

export interface TimeSeriesPoint {
  id: string;
  timestamp: number;
  label: string;
  dateStr: string;
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  channelBreakdown: Record<MarketingChannel, { spend: number; revenue: number }>;
}

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  dropoffRate: number; // percentage dropped from previous
  conversionRate: number; // percentage continuing from previous
  costPerEvent: number;
  benchmark: number;
}

export interface ChannelMetrics {
  channel: MarketingChannel;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  cpa: number;
  shareOfSpend: number;
  shareOfRevenue: number;
  color: string;
}

export interface LiveEvent {
  id: string;
  timestamp: number;
  type: 'conversion' | 'click' | 'impression' | 'spend_sync' | 'budget_shift';
  campaignId: string;
  campaignName: string;
  channel: MarketingChannel;
  value: number; // dollar revenue or spend or count
  customerSegment?: string;
  attributionSource?: string;
  location?: string;
}

export type AttributionModelType = 
  | 'last_click' 
  | 'first_touch' 
  | 'linear' 
  | 'time_decay' 
  | 'data_driven';

export interface AttributionComparison {
  channel: MarketingChannel;
  lastClickRoas: number;
  firstTouchRoas: number;
  linearRoas: number;
  timeDecayRoas: number;
  dataDrivenRoas: number;
  spend: number;
}
