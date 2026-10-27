# AdPulse Analytics — Neumorphic Marketing KPI & Real-Time Analytics Dashboard

An executive-level data analyst dashboard built with React 19, TypeScript, Tailwind CSS, and Neumorphism (Soft UI). It visualizes marketing campaign key performance indicators (ROAS, CAC, CVR, CTR, Spend, Revenue, Funnel velocity, Multi-touch Attribution) with interactive charts and a real-time streaming database engine.

![AdPulse Neumorphic Marketing Analytics Dashboard](https://raw.githubusercontent.com/placeholder/preview.png)

---

## 🌟 Key Features

### 1. Tactile Neumorphic Design (Soft UI)
- **Embossed & Recessed Geometry**: Light (Slate Pearl) and Dark (Deep Obsidian) themes crafted with dual-directional drop shadows, sunken chart beds (`neu-sunken`), and tactile button press mechanics.
- **Strict Visual Restraint**: Zero-pill discipline, unboxed typographic metadata separators (`·`), and high-legibility tabular numerals (`tabular-nums font-mono`).

### 2. Executive Marketing KPI Gauges & Sparklines
- **Attributed Revenue & Ad Spend**: Budget pacing and target pace metrics.
- **Blended Return on Ad Spend (ROAS)**: Realized ROAS dynamically benchmarked against the 3.80x industry baseline.
- **Blended CAC & LTV:CAC Ratio**: Customer acquisition cost efficiency vs. estimated customer lifetime value.
- **Conversions & CVR**: Inbound click-to-conversion rates and volume tracking.
- **Interactive Sparklines**: 7-day micro SVG sparklines on every card; clicking any metric focuses the main trend engine on that metric group.

### 3. Interactive SVG Trend Engine & Analytics Charts
- **Smooth Bézier SVG Area Chart**: Custom interactive curves for Revenue, Spend, ROAS, Conversions, CPA, and Engagement.
- **Timeframe & Granularity Controls**: Toggle between 7-Day, 30-Day, and 90-Day views, with crosshair cursor tracking and pinned hover cards.
- **Channel Filtering**: Isolate Google Ads, Meta, TikTok, LinkedIn, YouTube, or Email performance in isolation.

### 4. Cross-Channel Attribution & Capital Allocation
- **Neumorphic Concentric Donut Chart**: Hover-responsive ring segments with an embossed center metric hub.
- **5 Multi-Touch Attribution Models**:
  - **Last Click**: Baseline capture attribution.
  - **First Touch**: Discovery weighting for top-of-funnel channels.
  - **Linear**: Equal weight across touchpoints.
  - **Time Decay**: Recency-weighted touchpoints.
  - **Data-Driven**: Algorithmic Shapley value attribution.

### 5. Full-Funnel Conversion & Drop-off Diagnostics
- Multi-stage conversion tracking:
  `Ad Impressions → Clicks → Qualified Site Visits → Added to Cart → Initiated Checkout → Completed Purchase`
- Visual illuminated progress tracks, stage-by-stage drop-off rates, conversion rates, and cost per stage event.
- Automated anomaly and bottleneck detection recommendations.

### 6. High-Density Campaign Matrix
- Filter, search, and sort campaigns across ROAS, Spend, Revenue, and Conversions.
- **Live In-line Budget Adjuster**: Sliders that update real-time revenue and ROAS projections.
- Instant play/pause toggles.
- **Export to CSV**: Formatted for data analysts and BI tools (Tableau, Looker, Excel).

### 7. Real-Time Streaming Database Engine
- Simulated pixel webhook listeners streaming incoming conversions, clicks, and ad spend syncs.
- Configurable streaming speed (1x, 2x, 5x, 10x) and event burst simulators (e.g. flash sales, batch syncs).
- Rolling 50-event live memory ledger with latency tracking (~14ms).
- LocalStorage persistence with full JSON export and import capabilities.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Fonts**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or later) installed on your system.

### Installation

1. **Clone or Extract the repository**:
   ```bash
   git clone https://github.com/your-username/adpulse-analytics.git
   cd adpulse-analytics
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Building for Production

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```
├── public/                 # Static assets & downloadable distributions
├── src/
│   ├── components/         # Neumorphic UI components
│   │   ├── CampaignDetailModal.tsx     # Drilldown campaign inspector
│   │   ├── CampaignsTable.tsx          # High-density performance matrix
│   │   ├── ChannelAttributionChart.tsx # Attribution donut & econometric models
│   │   ├── FunnelAnalysis.tsx          # Full-funnel drop-off diagnostics
│   │   ├── Header.tsx                  # 3-Zone top navigation bar
│   │   ├── InteractiveTrendChart.tsx   # Custom SVG Bézier trend chart
│   │   ├── KpiMetricsGrid.tsx          # Neumorphic metric cards & sparklines
│   │   ├── LiveStreamPanel.tsx         # Real-time event monitor & controls
│   │   └── NewCampaignModal.tsx        # Campaign launcher modal
│   ├── data/
│   │   └── mockMarketingData.ts        # Seed data, time series & campaign specs
│   ├── services/
│   │   └── realtimeDatabase.ts         # Persistent event streaming & sync engine
│   ├── types/
│   │   └── marketing.ts                # TypeScript domain schemas & interfaces
│   ├── App.tsx                         # Main layout & view coordinator
│   ├── index.css                       # Tailwind 4 & custom neumorphic shadow system
│   └── main.tsx                        # React application entry point
├── index.html              # HTML shell & font definitions
├── metadata.json           # Application metadata & capabilities
├── package.json            # Project manifest & scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

---

## 📄 License

This project is licensed under the Apache-2.0 License.
