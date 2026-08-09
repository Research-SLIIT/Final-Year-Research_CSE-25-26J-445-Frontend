<div align="center">

# InvestWise — Web Application

### Next.js 16 Analytics Dashboard for Colombo Stock Exchange Intelligence

**Final Year Research Project · CSE-25-26J-445 · SLIIT Faculty of Computing**

<p>
<a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.0-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"></a>
<a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black"></a>
<a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white"></a>
<a href="https://tailwindcss.com/"><img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"></a>
</p>
<p>
<a href="https://zustand-demo.pmnd.rs/"><img alt="Zustand" src="https://img.shields.io/badge/Zustand-5.0-2D3748?logo=react&logoColor=white"></a>
<a href="https://ui.shadcn.com/"><img alt="shadcn/ui" src="https://img.shields.io/badge/shadcn%2Fui-58_components-000000"></a>
<a href="https://www.radix-ui.com/"><img alt="Radix" src="https://img.shields.io/badge/Radix_UI-primitives-161618?logo=radixui&logoColor=white"></a>
<a href="https://recharts.org/"><img alt="Recharts" src="https://img.shields.io/badge/Recharts-2.15-8884d8"></a>
<a href="https://www.framer.com/motion/"><img alt="Framer Motion" src="https://img.shields.io/badge/Framer_Motion-12.25-0055FF?logo=framer&logoColor=white"></a>
<a href="https://katex.org/"><img alt="KaTeX" src="https://img.shields.io/badge/KaTeX-formulas-329932"></a>
</p>
<p>
<a href="https://vitest.dev/"><img alt="Vitest" src="https://img.shields.io/badge/Vitest-40_test_files-6E9F18?logo=vitest&logoColor=white"></a>
<a href="https://testing-library.com/"><img alt="Testing Library" src="https://img.shields.io/badge/Testing_Library-React-E33332?logo=testinglibrary&logoColor=white"></a>
<img alt="Theme" src="https://img.shields.io/badge/Theme-Light_%2B_Dark-8b5cf6">
<img alt="Responsive" src="https://img.shields.io/badge/Responsive-Mobile_First-14b8a6">
</p>

**[Demo Videos](#-product-walkthrough-videos)** · **[Screenshots](#-screenshots)** · **[Architecture](#-application-architecture)** · **[Feature Deep Dives](#-feature-deep-dives)** · **[Run It Locally](#-quick-start)**

</div>

---

## 📖 Table of Contents

<table>
<tr><td valign="top" width="33%">

**Seeing the product**
1. [What This Is](#-what-this-is)
2. [Product Walkthrough Videos](#-product-walkthrough-videos)
3. [Screenshots](#-screenshots)
4. [Route Map](#-route-map)

</td><td valign="top" width="33%">

**How it's built**
5. [Application Architecture](#-application-architecture)
6. [State Management](#-state-management)
7. [Data Access Layer](#-data-access-layer)
8. [Feature Deep Dives](#-feature-deep-dives)

</td><td valign="top" width="33%">

**Working with the code**
9. [Quick Start](#-quick-start)
10. [Demo Mode](#-demo-mode)
11. [Design System](#-design-system)
12. [Testing](#-testing)
13. [Repository Layout](#-repository-layout)
14. [Known Issues](#-known-issues)
15. [Team](#-team)

</td></tr>
</table>

---

## 🎯 What This Is

InvestWise is the client half of a research platform for the **Colombo Stock Exchange**. It turns four independently trained machine learning models into something a non-technical investor can actually read, and — crucially for a research project — it shows *why* each model reached its conclusion rather than only what it concluded.

<table>
<tr><th width="18%">Feature</th><th width="24%">Route</th><th width="58%">What the user gets</th></tr>

<tr><td><b>📊 Market Dashboard</b></td><td><a href="app/page.tsx"><code>/</code></a></td><td>Live ASPI and S&P SL20 indices, all-sector performance, gainers/losers, turnover, market open/closed status and a CSE news ticker — pulled live from <code>cse.lk</code> with graceful static fallbacks when the upstream is unreachable.</td></tr>

<tr><td><b>🩺 Risk Analysis</b></td><td><a href="app/risk/page.tsx"><code>/risk</code></a></td><td>Type a ticker; watch two AI pipelines narrate themselves in real time over SSE (a 5-stage Z-Score analysis and a 3-stage report health check); get a projected 90-day Altman Z-Score on an animated gauge, a Safe/Grey/Distress verdict, a SHAP feature-impact breakdown split into positive and negative drivers, the extracted financial ratios, and a written explanation.</td></tr>

<tr><td><b>📈 Price Prediction</b></td><td><a href="app/predict/page.tsx"><code>/predict</code></a></td><td>T+5 open-price forecast from a 3-model gradient-boosting ensemble, with a forecast line chart, per-day delta bars, confidence badges, ensemble feature importance, plus a full historical tab — OHLC, volume/turnover and a raw OHLCV table.</td></tr>

<tr><td><b>💰 Dividend Prediction</b></td><td><a href="app/dividend/page.tsx"><code>/dividend</code></a></td><td>Probability that a company will <b>cut</b> its dividend, on a Very Safe → Very High risk scale, with signed per-factor contributions, a financial-strength breakdown, an LLM narrative rationale, a year-over-year comparison tab and a historical data tab.</td></tr>

<tr><td><b>📰 News Sentiment</b></td><td><a href="app/news/page.tsx"><code>/news</code></a></td><td>Browse scraped CSE news, or paste any article into the analyser. A terminal-style stream shows the two-stage cascade thinking, then renders the full decision tree — Stage 1 market-moving score vs threshold, Stage 2 ML direction, lexicon score, fusion weights — plus retrieved historical precedents.</td></tr>

<tr><td><b>💳 Subscriptions</b></td><td><a href="app/pricing/page.tsx"><code>/pricing</code></a></td><td>Tiered plans gating the premium ML features, PayHere checkout, and dedicated success/cancel return pages.</td></tr>

<tr><td><b>🛡 Admin Console</b></td><td><a href="app/admin/"><code>/admin</code></a></td><td>User management and a service-wide log viewer, on its own layout outside the main app shell.</td></tr>
</table>

> **The design thesis.** A prediction with no visible reasoning is not a research artifact — it's a number. Every ML surface in this app is built around exposing the model's intermediate state: SHAP attributions rather than a single score, decision trees carrying the actual fusion weights rather than a label, signed per-factor contributions rather than opaque feature names, and streamed pipeline stages rather than a spinner. That is what makes the four backend research components *inspectable* by an examiner instead of merely demonstrable.

---

## 🎬 Product Walkthrough Videos

> Videos live in [`docs/videos/`](docs/videos/). See the [capture guide](docs/videos/README.md) for how to record and add them.

| | Walkthrough | What you'll see | File |
|:--:|---|---|---|
| ▶️ | **Full product tour** | Sign-in → dashboard → all four ML features end to end | [`demo-full-walkthrough.mp4`](docs/videos/demo-full-walkthrough.mp4) |
| ▶️ | **Risk analysis, streaming** | The SSE pipeline narrating all 5 stages, then the Z-Score gauge and SHAP breakdown resolving | [`demo-risk-analysis.gif`](docs/videos/demo-risk-analysis.gif) |
| ▶️ | **News sentiment** | Terminal-style AI stream, then the full decision tree with fusion weights and historical precedents | [`demo-news-sentiment.gif`](docs/videos/demo-news-sentiment.gif) |
| ▶️ | **Price prediction** | Ticker search → T+5 forecast → delta bars → historical OHLCV tab | [`demo-price-prediction.gif`](docs/videos/demo-price-prediction.gif) |
| ▶️ | **Dividend prediction** | Cut probability, factor contributions, LLM narrative, comparison tab | [`demo-dividend.gif`](docs/videos/demo-dividend.gif) |
| ▶️ | **Dashboard tour** | Live market data, sidebar collapse, navigation across every page | [`demo-dashboard-tour.gif`](docs/videos/demo-dashboard-tour.gif) |

<div align="center">

<!-- Replace with the GIF once recorded; GitHub renders animated GIFs inline. -->
![Full product walkthrough](docs/videos/demo-full-walkthrough.gif)

</div>

---

## 📸 Screenshots

> Images live in [`docs/screenshots/`](docs/screenshots/). See the [capture guide](docs/screenshots/README.md) for the exact shot list.

<div align="center">

### Market Dashboard

![Market dashboard](docs/screenshots/01-dashboard.png)
*Live ASPI · S&P SL20 · all-sector performance · gainers and losers · CSE news ticker*

</div>

<table>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/03-risk-analysis-streaming.png" alt="Risk analysis streaming"><br>
<sub><b>Live SSE pipeline</b> — both analyses narrating themselves stage by stage</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/02b-risk-zscore-gauge.png" alt="Z-Score prediction"><br>
<sub><b>Z-Score verdict</b> — projected 2.7649 → Grey Zone, from the SVR model</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/04-shap-feature-impact.png" alt="SHAP feature impact"><br>
<sub><b>SHAP attribution</b> — signed per-feature impact, ranked, split into drivers</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/19-risk-financial-ratios.png" alt="Financial ratios"><br>
<sub><b>Extracted ratios</b> — pulled from the quarterly PDF by Gemini</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/05-price-prediction.png" alt="Price prediction"><br>
<sub><b>Price Prediction</b> — T+5 ensemble forecast + delta bars</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/06-price-historical.png" alt="Historical OHLCV"><br>
<sub><b>Historical tab</b> — OHLC, volume, turnover, raw data table</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/07-dividend-prediction.png" alt="Dividend prediction"><br>
<sub><b>Dividend</b> — P(cut) against the tuned decision threshold</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/08-dividend-feature-contributions.png" alt="Feature contributions"><br>
<sub><b>Feature contributions</b> — signed impact per financial factor</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/18-dividend-ai-narrative.png" alt="Dividend AI narrative"><br>
<sub><b>LLM narrative</b> — plain-language rationale for the verdict</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/09-dividend-comparison.png" alt="Dividend comparison"><br>
<sub><b>Comparison tab</b> — year-over-year feature deltas</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/10-news-feed.png" alt="News feed"><br>
<sub><b>News</b> — scraped CSE articles with tag filters and search</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/11-news-sentiment-analysis.png" alt="Sentiment decision tree"><br>
<sub><b>Sentiment decision tree</b> — stage scores, fusion weights, precedents</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/12-ai-terminal-stream.png" alt="AI terminal stream"><br>
<sub><b>AI terminal stream</b> — the cascade reasoning in real time</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/13-pricing.png" alt="Pricing"><br>
<sub><b>Pricing</b> — subscription tiers gating premium features</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/14-sign-in.png" alt="Sign in"><br>
<sub><b>Authentication</b> — sign-in with OTP verification flow</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/15-admin-users.png" alt="Admin console"><br>
<sub><b>Admin console</b> — user management and log viewer</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/16-light-mode.png" alt="Light theme"><br>
<sub><b>Light theme</b> — the app ships dark by default; light has full parity</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/17-mobile-responsive.png" alt="Mobile responsive"><br>
<sub><b>Mobile</b> — 390×844 viewport, stacked layout</sub>
</td>
</tr>
</table>

<details>
<summary><b>Also captured</b> — full-page variants</summary>

| File | Contents |
|---|---|
| [`01-dashboard.png`](docs/screenshots/01-dashboard.png) | Full-page market dashboard |
| [`02-risk-analysis-result.png`](docs/screenshots/02-risk-analysis-result.png) | Full-page completed risk analysis, top to bottom |

Every screenshot in this README was captured from the running application against the live backend — real CSE filings, real model outputs, real Gemini extraction. See the [capture guide](docs/screenshots/README.md) for how they were produced.

</details>

---

## 🗺 Route Map

Next.js **App Router**. Everything under `/` except `/auth/*` and `/admin/*` is wrapped by `AppShell`, which owns the sidebar, top bar, and the client-side auth guard.

```mermaid
graph TB
    ROOT["<b>app/layout.tsx</b><br/>ThemeProvider · AppShell · Analytics"]

    subgraph PUB["Public"]
        SI["/auth/sign-in"]
        SU["/auth/sign-up"]
    end

    subgraph APP["Authenticated · inside AppShell"]
        DASH["<b>/</b><br/>Market Dashboard"]
        RISK["<b>/risk</b><br/>Risk Analysis 💎"]
        PRED["<b>/predict</b><br/>Price Prediction 💎"]
        DIV["<b>/dividend</b><br/>Dividend Prediction 💎"]
        NEWS["<b>/news</b><br/>News + Sentiment 💎"]
        NEWSD["/news/[id]<br/>Article detail"]
        SET["/settings"]
        PROF["/profile"]
        PRICE["/pricing"]
        PS["/payments/success"]
        PC["/payments/cancel"]
    end

    subgraph ADMIN["Admin · own layout"]
        AU["/admin/users"]
        AL["/admin/logs"]
    end

    subgraph API["Server Route Handlers · CORS proxy to cse.lk"]
        A1["/api/cse/all-sectors"]
        A2["/api/cse/chart-data"]
        A3["/api/cse/market-status"]
        A4["/api/cse/news"]
        A5["/api/market-data/trade-summary"]
        A6["/api/company-profile"]
    end

    ROOT --> PUB
    ROOT --> APP
    ROOT --> ADMIN
    NEWS --> NEWSD
    PRICE --> PS
    PRICE --> PC
    DASH -.->|"fetch"| API
    PRED -.->|"fetch"| API
    RISK -.->|"fetch"| API

    classDef pub fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef app fill:#0ea5e9,stroke:#075985,color:#fff
    classDef adm fill:#ef4444,stroke:#991b1b,color:#fff
    classDef api fill:#10b981,stroke:#065f46,color:#fff
    classDef root fill:#7c3aed,stroke:#4c1d95,color:#fff
    class ROOT root
    class SI,SU pub
    class DASH,RISK,PRED,DIV,NEWS,NEWSD,SET,PROF,PRICE,PS,PC app
    class AU,AL adm
    class A1,A2,A3,A4,A5,A6 api
```

💎 = premium feature, gated by subscription tier at the API gateway.

### Auth guard state machine

`AppShell` runs the redirect logic once the store has hydrated — `mounted && !loading` is the gate that prevents a flash of the wrong screen.

```mermaid
stateDiagram-v2
    [*] --> Mounting

    Mounting: mounted = false
    Mounting --> Hydrating: useEffect runs<br/>loadSession() + refreshUser()

    Hydrating: loading = true<br/>render children bare, no shell
    Hydrating --> Anonymous: no token in localStorage
    Hydrating --> Authenticated: valid token found

    Anonymous --> RedirectSignIn: navigate to a protected route
    RedirectSignIn: router.push("/auth/sign-in")
    RedirectSignIn --> Anonymous

    Anonymous --> Anonymous: / or /auth/* allowed

    Authenticated --> RoleCheck: lands on /auth/*
    RoleCheck --> AdminHome: role === "admin"
    RoleCheck --> UserHome: otherwise
    AdminHome: router.push("/admin/users")
    UserHome: router.push("/")

    Authenticated --> Authenticated: browse freely
    Authenticated --> Anonymous: signOut() clears token
    AdminHome --> [*]
    UserHome --> [*]
```

---

## 🏛 Application Architecture

### Layered structure

A deliberate one-way dependency chain — pages compose components, components call hooks, hooks call the typed API layer, and only the API layer knows about HTTP.

```mermaid
graph TB
    subgraph L1["① Routes · app/"]
        direction LR
        P1["page.tsx files<br/>data orchestration"]
        P2["route.ts handlers<br/>server-side CSE proxy"]
        P3["layout.tsx<br/>providers"]
    end

    subgraph L2["② Composition · components/"]
        direction LR
        C1["Feature components<br/>analysis/ dividend/ news/"]
        C2["Shared chart + data components"]
        C3["shadcn/ui primitives · 58"]
    end

    subgraph L3["③ Behaviour · hooks/"]
        direction LR
        H1["use-analysis-stream · SSE"]
        H2["use-financial-health"]
        H3["use-report-health-check"]
        H4["use-company-health-history"]
        H5["use-company-profile"]
        H6["use-mobile · use-toast"]
    end

    subgraph L4["④ State · stores/"]
        direction LR
        S1["useAuthStore"]
        S2["useMarketStore"]
        S3["useRiskStore"]
        S4["usePredictStore"]
        S5["useDividendStore"]
    end

    subgraph L5["⑤ Data access · lib/"]
        direction LR
        A1["api-client.ts<br/>fetch + JWT + ApiError"]
        A2["lib/api/*.api.ts<br/>typed per-domain clients"]
        A3["lib/types/*<br/>shared contracts"]
    end

    subgraph L6["⑥ Backend"]
        direction LR
        B1["API Gateway :3400"]
        B2["cse.lk public API"]
    end

    L1 --> L2
    L1 --> L4
    L2 --> L3
    L2 --> L4
    L3 --> L5
    L4 --> L5
    L5 --> B1
    P2 --> B2

    classDef l1 fill:#ede9fe,stroke:#7c3aed,color:#2e1065
    classDef l2 fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef l3 fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef l4 fill:#fef3c7,stroke:#d97706,color:#451a03
    classDef l5 fill:#fce7f3,stroke:#db2777,color:#831843
    classDef l6 fill:#334155,stroke:#0f172a,color:#fff
    class P1,P2,P3 l1
    class C1,C2,C3 l2
    class H1,H2,H3,H4,H5,H6 l3
    class S1,S2,S3,S4,S5 l4
    class A1,A2,A3 l5
    class B1,B2 l6
```

### Why server route handlers exist

`cse.lk` does not send CORS headers, so a browser cannot call it directly. Six **server-side route handlers** proxy those requests, forwarding `Origin` and `Referer` so the upstream accepts them. This also keeps the browser bundle free of any upstream-specific header logic.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant N as Next.js Route Handler<br/>server-side
    participant C as cse.lk API

    Note over B,C: ❌ Direct call is impossible — no CORS headers on cse.lk

    B->>N: GET /api/cse/all-sectors
    N->>C: POST https://www.cse.lk/api/allSectors<br/>Origin: https://www.cse.lk<br/>Referer: https://www.cse.lk/
    C-->>N: 200 · sector index data
    N-->>B: 200 · same-origin JSON ✅

    Note over B,N: Fallback: on upstream failure the page<br/>renders static seed data and shows a<br/>"WifiOff" offline indicator rather than an error
```

| Route handler | Upstream | Feeds |
|---|---|---|
| [`/api/cse/all-sectors`](app/api/cse/all-sectors/route.ts) | `cse.lk/api/allSectors` | ASPI, S&P SL20, sector performance grid |
| [`/api/cse/chart-data`](app/api/cse/chart-data/route.ts) | `cse.lk/api/chartData` | Index trend charts |
| [`/api/cse/market-status`](app/api/cse/market-status/route.ts) | `cse.lk/api/marketStatus` | Open / closed badge |
| [`/api/cse/news`](app/api/cse/news/route.ts) | `cse.lk/api/news/web` | Dashboard news ticker |
| [`/api/market-data/trade-summary`](app/api/market-data/trade-summary/route.ts) | `cse.lk/api/tradeSummary` | Gainers, losers, turnover, ticker search |
| [`/api/company-profile`](app/api/company-profile/route.ts) | `cse.lk/api/companyProfile` | Company metadata on analysis pages |

---

## 🗃 State Management

Five focused **Zustand** stores. Nothing global that doesn't need to be global — each ML feature owns its own `{ inputs, results, loading, error }` slice, so a slow request on one page never blocks or invalidates another.

```mermaid
graph TB
    subgraph AUTH["useAuthStore — the only cross-cutting store"]
        direction TB
        AU1["user · token · isAuthenticated<br/>loading · error"]
        AU2["signIn() · signUp() · signOut()"]
        AU3["loadSession() — rehydrate from localStorage"]
        AU4["refreshUser() — re-check tier after payment redirect"]
        AU5["updateProfile() · clearError()"]
    end

    subgraph FEAT["Per-feature stores — identical shape by design"]
        direction LR
        RS["<b>useRiskStore</b><br/>inputs: symbol, dateRange,<br/>riskProfile<br/>results · loading · error"]
        PS["<b>usePredictStore</b><br/>inputs: symbol<br/>output · loading · error"]
        DS["<b>useDividendStore</b><br/>inputs: symbol<br/>results · loading · error"]
        MS["<b>useMarketStore</b><br/>watchlist · selectedSymbol<br/>searchQuery"]
    end

    subgraph LS["Browser persistence"]
        direction TB
        L1["cse_auth_token"]
        L2["cse_user"]
        L3["sidebar-collapsed"]
        L4["theme · next-themes"]
    end

    AUTH -->|"read / write"| L1
    AUTH -->|"read / write"| L2
    AUTH -->|"guards"| FEAT

    classDef auth fill:#7c3aed,stroke:#4c1d95,color:#fff
    classDef feat fill:#0ea5e9,stroke:#075985,color:#fff
    classDef ls fill:#f59e0b,stroke:#92400e,color:#fff
    class AU1,AU2,AU3,AU4,AU5 auth
    class RS,PS,DS,MS feat
    class L1,L2,L3,L4 ls
```

**Why the feature stores all look the same.** `{ inputs, results, loading, error }` plus four setters is a deliberately boring contract. Every ML page behaves identically under load, error, and empty states, and a new research track can be added by copying one 30-line file rather than inventing new state semantics.

> `refreshUser()` is called on every `AppShell` mount specifically so a user returning from a PayHere redirect sees their upgraded tier immediately, without a manual reload.

---

## 🔌 Data Access Layer

One `fetch` wrapper, then a typed client per domain. `ApiError` carries the HTTP status so callers can tell a 401 apart from a 500 — which is what lets `useAuthStore` sign a user out on token expiry instead of showing a generic failure.

```mermaid
flowchart TB
    subgraph CORE["lib/api-client.ts"]
        direction TB
        AC1["<code>apiClient&lt;T&gt;(endpoint, options)</code>"]
        AC2["Reads <code>cse_auth_token</code> from localStorage"]
        AC3["Attaches <code>Authorization: Bearer …</code>"]
        AC4["<code>credentials: 'include'</code>"]
        AC5["Throws <code>ApiError(status, body)</code> on non-2xx"]
    end

    subgraph DOM["lib/api/ — typed per-domain clients"]
        direction TB
        D1["<b>financial-health.api.ts</b><br/>→ /financial-health/*"]
        D2["<b>open-price-prediction.api.ts</b><br/>→ /open-price/*"]
        D3["<b>dividend_api.ts</b><br/>→ /dividend-prediction/*"]
        D4["<b>market-data.api.ts</b><br/>→ /api/cse/* route handlers"]
        D5["<b>sentimentApi.ts</b><br/>→ /sentiment/analyze"]
    end

    subgraph TY["lib/types/ — shared contracts"]
        direction TB
        T1["financial-health.types.ts"]
        T2["open-price-prediction.types.ts"]
        T3["company-health-history.types.ts"]
        T4["dividend/glossary.ts"]
    end

    GW["<b>API Gateway</b><br/><code>NEXT_PUBLIC_API_BASE_URL</code><br/>default http://localhost:3400/api/v1"]

    AC1 --> AC2 --> AC3 --> AC4 --> AC5
    DOM --> AC1
    TY -.->|"types"| DOM
    AC1 --> GW

    classDef core fill:#7c3aed,stroke:#4c1d95,color:#fff
    classDef dom fill:#0ea5e9,stroke:#075985,color:#fff
    classDef ty fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef gw fill:#10b981,stroke:#065f46,color:#fff
    class AC1,AC2,AC3,AC4,AC5 core
    class D1,D2,D3,D4,D5 dom
    class T1,T2,T3,T4 ty
    class GW gw
```

### Error handling

```mermaid
flowchart LR
    REQ["apiClient call"]
    OK{"response.ok?"}
    PARSE["return response.json()"]
    ERR["throw ApiError(status, body)"]
    ST{"error.status"}
    E401["<b>401</b><br/>clear token → signOut()<br/>redirect /auth/sign-in"]
    E403["<b>403</b><br/>prompt subscription upgrade<br/>link to /pricing"]
    E4XX["<b>4xx</b><br/>surface message inline"]
    E5XX["<b>5xx</b><br/>toast + retry affordance"]

    REQ --> OK
    OK -->|yes| PARSE
    OK -->|no| ERR --> ST
    ST -->|401| E401
    ST -->|403| E403
    ST -->|other 4xx| E4XX
    ST -->|5xx| E5XX

    classDef ok fill:#10b981,stroke:#065f46,color:#fff
    classDef bad fill:#ef4444,stroke:#991b1b,color:#fff
    classDef warn fill:#f59e0b,stroke:#92400e,color:#fff
    class PARSE ok
    class ERR,E401 bad
    class E403,E4XX,E5XX warn
```

---

## 🔬 Feature Deep Dives

### ① Streaming risk analysis — SSE with optimistic step replacement

`useAnalysisStream` is a generic SSE hook reused by every streaming endpoint. Its interesting behaviour is **in-place step replacement**: when a `processing` placeholder for step *N* already exists and a terminal event for step *N* arrives, the placeholder is replaced rather than appended — so the terminal log reads as a clean 6-line progression instead of 12 duplicated lines.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant P as /risk page
    participant H as useAnalysisStream
    participant ES as EventSource
    participant G as API Gateway
    participant F as Financial Health Service

    U->>P: enter ticker → Analyze
    P->>H: start(streamUrl)
    H->>H: reset events, isLoading = true
    H->>ES: new EventSource(url)
    ES->>G: GET .../analyze-cse/{symbol}/stream
    G->>F: proxy, connection held open

    loop 6 pipeline stages
        F-->>ES: data: { step, total, message, status }
        ES-->>H: onmessage
        H->>H: JSON.parse
        alt processing placeholder exists for this step
            H->>H: replace it in place
        else
            H->>H: append new event
        end
        H-->>P: re-render AnalysisProgress
        P-->>U: live stage narration
    end

    F-->>ES: data: { status: "completed", result }
    ES-->>H: onmessage
    H->>H: setResult · isLoading = false
    H->>ES: source.close()
    P-->>U: Z-Score gauge + risk zone + SHAP breakdown

    Note over H,ES: onerror → setError, close the source,<br/>reject the promise — never leaks a connection
```

**What renders when it completes:**

| Component | Shows |
|---|---|
| [`ZScoreGauge`](components/z-score-gauge.tsx) | Animated gauge with Safe / Grey / Distress bands and the projected value |
| [`RiskBadge`](components/risk-badge.tsx) | Colour-coded zone verdict |
| [`ConfidenceBadge`](components/confidence-badge.tsx) | Model confidence tier |
| [`MetricsChart`](components/metrics-chart.tsx) | Extracted financial ratios |
| Feature Impact Analysis | SHAP values split into positive and negative driver cards, ranked by magnitude |
| [`AnalysisProgress`](components/analysis-progress.tsx) | The stage log, kept visible after completion as an audit trail |

---

### ② Price prediction — ensemble forecast with a historical tab

```mermaid
flowchart TB
    U["User picks a company<br/>in the global search"]
    CS["<b>/company/[symbol]</b><br/>route param drives the tab —<br/>no picker inside the module"]

    subgraph TAB1["Tab · Prediction"]
        direction TB
        PR["GET /open-price/predict"]
        FLC["<b>ForecastLineChart</b><br/>T+5 predicted open path"]
        DBC["<b>DeltaBarChart</b><br/>per-day change vs last close"]
        KPI["<b>KpiCard</b> row<br/>predicted open · Δ · Δ%"]
        CB["<b>ConfidenceBadge</b>"]
        FI["GET /open-price/feature-importance<br/>SHAP across 28 features"]
    end

    subgraph TAB2["Tab · Historical"]
        direction TB
        HS["GET /open-price/history"]
        SNAP["Latest trading day snapshot"]
        TREND["Historical open price trend"]
        OHLC["Price history · OHLC"]
        VOL["Volume &amp; turnover"]
        RAW["<b>DataTable</b> · raw OHLCV"]
    end

    U --> CS
    CS --> PR
    CS --> HS
    PR --> FLC & DBC & KPI & CB
    PR --> FI
    HS --> SNAP & TREND & OHLC & VOL & RAW

    classDef inp fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef t1 fill:#0ea5e9,stroke:#075985,color:#fff
    classDef t2 fill:#8b5cf6,stroke:#5b21b6,color:#fff
    class U,CS inp
    class PR,FLC,DBC,KPI,CB,FI t1
    class HS,SNAP,TREND,OHLC,VOL,RAW t2
```

---

### ③ Dividend prediction — factor contributions and LLM rationale

The dividend screen turns a single probability into an auditable verdict: a Very Safe → Very High risk scale, signed per-factor contributions, a financial-strength breakdown chart, and a written LLM rationale.

> [!NOTE]
> A richer explainability layer is **implemented but not yet wired up**. `FeatureCard`, `FeatureExplanationModal` and `Latex` exist and would render each engineered feature as a clickable card with a KaTeX formula — but `FeatureCard` is imported into `PredictionDashboard` without ever being rendered, so the modal is unreachable. The glossary endpoint that feeds it also currently hangs. Both are logged in [Known Issues](#-known-issues); the diagram below shows the intended wiring, with the dead path marked.

```mermaid
flowchart LR
    subgraph IN["Input"]
        TS["<b>route symbol</b><br/>from /company/[symbol]"]
    end

    subgraph API["Fetches"]
        direction TB
        A1["/dividend-prediction/data<br/>14 engineered features"]
        A2["/dividend-prediction/info<br/>model metadata + threshold"]
        A3["/dividend-prediction/metadata/glossary<br/>feature definitions"]
        A4["/dividend-prediction/llm-explanation<br/>narrative · Redis-cached"]
        A5["/dividend-prediction/history<br/>all stored years"]
    end

    subgraph UI["Tabs — live"]
        direction TB
        T1["<b>DividendPredictionTab</b><br/>P(cut) · risk scale<br/>factor contributions<br/>financial-strength chart<br/>LLM narrative"]
        T2["<b>ComparisonTab</b><br/>year-over-year deltas"]
        T3["<b>HistoricalDataTab</b><br/>full record table"]
    end

    subgraph EXP["Explainability — implemented, NOT mounted"]
        direction TB
        E1["<b>FeatureCard</b><br/>never rendered in JSX"]
        E2["<b>FeatureExplanationModal</b>"]
        E3["<b>Latex</b> · KaTeX renderer"]
    end

    SK["<b>PredictionDashboardSkeleton</b><br/>shown while loading"]

    TS --> API
    A1 --> T1
    A2 --> T1
    A4 --> T1
    A5 --> T3
    A1 --> T2
    A3 -.->|"endpoint hangs"| E1
    E1 -.->|"unreachable"| E2 -.-> E3
    API -.->|"pending"| SK

    classDef inp fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef api fill:#10b981,stroke:#065f46,color:#fff
    classDef ui fill:#0ea5e9,stroke:#075985,color:#fff
    classDef dead fill:#94a3b8,stroke:#475569,color:#fff,stroke-dasharray: 5 4
    class TS inp
    class A1,A2,A3,A4,A5 api
    class T1,T2,T3,SK ui
    class E1,E2,E3 dead
```

> [!IMPORTANT]
> The model outputs **P(dividend cut)**, not P(dividend paid). The UI copy, badge colours, and verdict wording all assume that polarity — a high probability is rendered as a *warning*. If verdicts ever read backwards, check this inversion first before looking anywhere else.

---

### ④ News sentiment — rendering a model's reasoning

```mermaid
flowchart TB
    subgraph BROWSE["Browse mode"]
        direction TB
        NF["/news · article list<br/>search · tag filter · sort · paginate"]
        ND["/news/[id] · full article"]
        MSP["<b>MarketSentimentPulse</b><br/>aggregate sentiment indicator"]
    end

    subgraph ANALYZE["Analyse mode"]
        direction TB
        AB["<b>AnalyzeBox</b><br/>paste any article text"]
        ATS["<b>AITerminalStream</b><br/>terminal-style reasoning trace"]
    end

    subgraph RESULT["Decision rendering · components/analysis/"]
        direction TB
        R1["<b>StatusBadge</b><br/>impactful / not impactful"]
        R2["<b>DirectionBadge</b><br/>positive / negative"]
        R3["<b>AnalysisBreakdown</b><br/>the 4-step decision_tree"]
        R4["<b>ScoreBar</b><br/>stage1_prob vs 0.30 threshold"]
        R5["<b>WeightBar</b><br/>ML vs Lexicon fusion weights"]
        R6["<b>MetricRow</b><br/>raw scores and confidences"]
        R7["<b>ConfidenceBadge</b>"]
        R8["<b>TagList</b><br/>identified companies + tickers"]
        R9["Historical precedents<br/>from FAISS retrieval"]
        R10["<b>AnalysisDisclaimer</b><br/>surfaces demo_mode when active"]
    end

    NF --> ND
    NF --> MSP
    ND --> AB
    AB --> ATS --> RESULT

    classDef br fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef an fill:#0ea5e9,stroke:#075985,color:#fff
    classDef re fill:#8b5cf6,stroke:#5b21b6,color:#fff
    class NF,ND,MSP br
    class AB,ATS an
    class R1,R2,R3,R4,R5,R6,R7,R8,R9,R10 re
```

`AnalysisBreakdown` is the component that makes this a research UI rather than a demo: it renders the backend's `decision_tree` array literally — Stage 1's probability against its 0.30 threshold, Stage 2A's ML direction and raw score, Stage 2B's lexicon score with the triggered rules, and the fusion step's actual weights. Nothing is summarised away.

`AnalysisDisclaimer` reads the `demo_mode` flag and states plainly when a stage was substituted, so a demo run can never be mistaken for genuine two-stage output.

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | ≥ 20 (22 recommended — `@types/node` targets 22) |
| **Package manager** | pnpm (a `pnpm-lock.yaml` is committed) or npm |
| **Backend** | The [backend stack](https://github.com/Research-SLIIT/Final-Year-Research_CSE-25-26J-445-Backend) running on `:3400` for ML features |

### Install and run

```bash
git clone https://github.com/Research-SLIIT/Final-Year-Research_CSE-25-26J-445-Frontend.git
cd Final-Year-Research_CSE-25-26J-445-Frontend
git checkout dev

pnpm install          # or: npm install
pnpm dev              # → http://localhost:3000
```

### Environment

Create `.env.local`:

```env
# API Gateway base URL — must include the /api/v1 prefix
NEXT_PUBLIC_API_BASE_URL=http://localhost:3400/api/v1
```

> If omitted, [`lib/api-client.ts`](lib/api-client.ts) falls back to `http://localhost:3400/api/v1`.

### Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Dev server with hot reload on `:3000` |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest in watch mode |
| `pnpm test:run` | Vitest once — CI mode |
| `pnpm test:coverage` | Coverage report (v8, HTML + text) |

### What works without the backend

```mermaid
flowchart LR
    FE["Frontend on :3000"]

    subgraph NOBE["✅ Works with no backend"]
        direction TB
        W1["Market dashboard<br/>via /api/cse/* → cse.lk"]
        W2["Sector data · gainers · losers"]
        W3["Market status · news ticker"]
        W4["Theme switching · sidebar<br/>navigation shell"]
        W5["Sign-in / sign-up pages render"]
    end

    subgraph NEEDBE["🔒 Needs the gateway on :3400"]
        direction TB
        N1["Authentication · JWT issuance"]
        N2["Risk analysis · SSE pipeline"]
        N3["Price prediction"]
        N4["Dividend prediction"]
        N5["News sentiment analysis"]
        N6["Subscriptions · admin console"]
    end

    FE --> NOBE
    FE --> NEEDBE

    classDef ok fill:#10b981,stroke:#065f46,color:#fff
    classDef need fill:#f59e0b,stroke:#92400e,color:#fff
    class W1,W2,W3,W4,W5 ok
    class N1,N2,N3,N4,N5,N6 need
```

---

## 🧊 Demo Mode

The backend is a Kafka/Mongo/Postgres microservice stack with three Python ML
services and two LLM integrations. Nothing free will host it. Demo mode runs the
frontend on its own and replays **real output captured from that backend** —
so the public demo shows genuine model results rather than invented numbers.

```bash
npm run demo:dev      # local, demo mode on
npm run demo:build    # production build with NEXT_PUBLIC_DEMO_MODE=1
```

On a host like Vercel, set `NEXT_PUBLIC_DEMO_MODE=1` and deploy. No other
configuration is needed — there is no backend to point at.

### What is real, and how real

| Surface | In demo mode |
|---|---|
| Indices, movers, sectors, prices, CSE news | **Live.** These never went through the backend — the `app/api/*` routes proxy `cse.lk` directly, in demo mode too. |
| T+5 price forecast | Captured output of the LightGBM/XGBoost/CatBoost ensemble, with its real SHAP attributions. 274 companies. |
| Dividend prediction | Captured output of the dividend-cut model plus its Gemini-written investor explanation. All 15 seeded firms. |
| Financial health | Captured run of the full pipeline — latest CSE filing located, PDF parsed by Gemini, scored by the Altman Z-model, next-quarter Z-score from the SVR model. 15 companies. |
| Risk statistics (VaR, CVaR, beta, Sharpe, drawdown) | **Computed, not captured.** No backend model produces these; they were previously the same six mock numbers for every company. Now derived from ~150 sessions of real CSE closing prices, beta against ASPI. Labelled as statistics rather than predictions in the UI. |
| News sentiment | A curated set of captured analyses. See the caveat below. |
| Auth, payments, admin | No service to talk to. The demo opens signed in as a premium account; checkout reports that it is unavailable. |

### The sentiment caveat

Sentiment is the only analysis driven by free text rather than a company symbol,
so no capture can answer what a visitor types. The demo matches typed text to
the nearest captured headline and says so on screen.

More importantly, these were captured while the service was running its
**financial-lexicon fallback** — the XGBoost classifier needs OpenAI embeddings,
which were not configured. That fallback inverts a substantial share of
headlines, so the stored set was filtered to candidates where it resolved the
right company and agreed with the obvious reading (20 of 30 kept; the rejections
and their reasons are in `public/demo-data/sentiment/index.json`).

**That makes it a curated example set, not a measure of model accuracy**, and the
UI says so. Configuring an OpenAI key on `sentiment-backend` and re-running the
harvest would replace it with genuine classifier output.

### Re-capturing

Fixtures live in `public/demo-data/` and are committed. To refresh them, bring
the full backend up (`docker compose --profile core --profile ml up`) and run:

```bash
npm run demo:harvest        # everything, in order
npm run demo:harvest:news   # just the news corpus
npm run demo:compute        # recompute risk statistics from captured prices
npm run demo:manifest       # rebuild the coverage manifest
```

Every harvester is resumable — anything already on disk is skipped unless
`FORCE=1` — which matters because the financial-health sweep costs about 40
seconds and a Gemini call per company.

### How it works

Demo mode swaps the **transport**, never the contract. Each API module branches
on `DEMO_MODE` at its lowest level, so components, stores, skeletons, caching and
progress UI are untouched and behave identically in both modes.

Two details make it feel like the real thing rather than a fixture dump:

- **Latency is replayed, not faked.** Every fixture stores the latency its
  original call took, and the loader honours it. A dividend lookup still returns
  in milliseconds; a Gemini-backed health analysis still takes twenty seconds.
- **The SSE stream is replayed frame by frame.** The financial-health pipeline
  streams five steps of progress over ~21 seconds. The harvest records each
  `data:` frame with the offset it arrived at, and `lib/demo/stream.ts` replays
  them on the same clock — so the progress log a visitor watches is the log the
  backend actually emitted.

```
lib/demo/
├── config.ts      flag + coverage manifest
├── fixtures.ts    fetch with captured-latency replay
├── stream.ts      SSE frame replay
├── sentiment.ts   free-text → nearest captured headline
├── risk.ts        computed statistics + price snapshots
├── news.ts        captured article corpus
└── auth.ts        the demo account
```

Turning the flag off restores live backend calls with no other change. The real
fetch code was never removed.

---

## 🎨 Design System

### Component inventory

```mermaid
graph TB
    subgraph PRIM["shadcn/ui primitives · 58 files in components/ui/"]
        direction LR
        U1["Layout<br/>card · sheet · tabs<br/>accordion · separator<br/>resizable · scroll-area"]
        U2["Forms<br/>input · select · checkbox<br/>radio-group · switch · slider<br/>form · label · otp-input"]
        U3["Overlay<br/>dialog · alert-dialog · popover<br/>dropdown-menu · tooltip<br/>hover-card · context-menu · drawer"]
        U4["Feedback<br/>toast · sonner · progress<br/>skeleton · badge · alert"]
        U5["Data<br/>table · chart · carousel<br/>pagination · command"]
    end

    subgraph DOMAIN["Domain components"]
        direction LR
        D1["<b>Charts</b><br/>chart-card · metrics-chart<br/>forecast-line-chart<br/>delta-bar-chart<br/>z-score-gauge"]
        D2["<b>Indicators</b><br/>kpi-card · risk-badge<br/>confidence-badge<br/>analysis-progress"]
        D3["<b>Search</b><br/>company-search<br/>(CompanySearch · CompanyPicker<br/>CompanyCommandPalette)"]
        D4["<b>Data</b><br/>data-table"]
    end

    subgraph FEAT["Feature modules"]
        direction LR
        F1["<b>analysis/</b> · 9<br/>AnalysisBreakdown · ScoreBar<br/>WeightBar · MetricRow<br/>DirectionBadge · StatusBadge<br/>ConfidenceBadge · TagList<br/>AnalysisDisclaimer"]
        F2["<b>dividend/</b> · 8<br/>PredictionDashboard<br/>DividendPredictionTab<br/>ComparisonTab · HistoricalDataTab<br/>FeatureCard<br/>FeatureExplanationModal · Latex"]
        F3["<b>news/</b> · 3<br/>AnalyzeBox<br/>AITerminalStream<br/>MarketSentimentPulse"]
    end

    SHELL["<b>app-shell.tsx</b><br/>sidebar · top bar · auth guard<br/>collapse persistence"]
    THEME["<b>theme-provider.tsx</b><br/>next-themes · light + dark"]

    PRIM --> DOMAIN --> FEAT
    SHELL --> FEAT
    THEME --> SHELL

    classDef prim fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef dom fill:#0ea5e9,stroke:#075985,color:#fff
    classDef feat fill:#8b5cf6,stroke:#5b21b6,color:#fff
    classDef shell fill:#7c3aed,stroke:#4c1d95,color:#fff
    class U1,U2,U3,U4,U5 prim
    class D1,D2,D3,D4 dom
    class F1,F2,F3 feat
    class SHELL,THEME shell
```

### Conventions

| Concern | Approach |
|---|---|
| **Styling** | Tailwind CSS 4 with `@tailwindcss/postcss`; design tokens as CSS variables in [`app/globals.css`](app/globals.css) |
| **Theming** | `next-themes` with `class` strategy; every colour goes through a semantic token (`bg-background`, `text-muted-foreground`, `border-border`) so dark mode needs no per-component overrides |
| **Variants** | `class-variance-authority` + `tailwind-merge` via the `cn()` helper in [`lib/utils.ts`](lib/utils.ts) |
| **Accessibility** | Radix UI primitives underneath every interactive component — focus management, ARIA and keyboard navigation come from the library, not hand-rolled |
| **Animation** | `framer-motion` for page and result transitions; `tailwindcss-animate` for micro-interactions |
| **Charts** | Recharts, always inside `ResponsiveContainer`, wrapped by `ChartCard` for consistent titles, empty states and loading skeletons |
| **Responsive** | Mobile-first. Sidebar becomes an overlay drawer below `lg`; desktop collapse state persists in `localStorage`; charts reflow and tables scroll horizontally |
| **Math** | KaTeX via the `Latex` component for feature-engineering formulas |
| **Icons** | `lucide-react` |

---

## 🧪 Testing

**40 test files** run on Vitest with jsdom and Testing Library.

```bash
pnpm test              # watch mode
pnpm test:run          # single pass — CI
pnpm test:coverage     # v8 coverage, HTML + text reporters
```

```mermaid
graph TB
    subgraph L1["Stores · 5 files"]
        direction LR
        S1["useAuthStore"]
        S2["useMarketStore"]
        S3["useRiskStore"]
        S4["usePredictStore"]
        S5["useDividendStore"]
    end

    subgraph L2["Hooks · 5 files"]
        direction LR
        H1["use-analysis-stream · SSE"]
        H2["use-financial-health"]
        H3["use-report-health-check"]
        H4["use-company-health-history"]
        H5["use-company-profile"]
    end

    subgraph L3["API layer · 5 files"]
        direction LR
        A1["dividend_api"]
        A2["financial-health.api"]
        A3["market-data.api"]
        A4["open-price-prediction.api"]
        A5["sentimentApi"]
    end

    subgraph L4["Components · 23 files"]
        direction LR
        C1["<b>analysis/</b> · 8<br/>breakdown · badges · bars · rows"]
        C2["<b>dividend/</b> · 4<br/>dashboard · tabs"]
        C3["<b>news/</b> · 3<br/>analyze box · terminal · pulse"]
        C4["<b>openPrice/</b> · 4<br/>charts · search · progress"]
        C5["<b>shared/</b> · 4<br/>chart-card · kpi · badges"]
    end

    subgraph L5["Utilities · 2 files"]
        direction LR
        U1["lib/utils"]
        U2["lib/risk-helpers"]
    end

    subgraph FIX["Fixtures · tests/fixtures/"]
        direction LR
        F1["dividend.fixture"]
        F2["prediction.fixture"]
        F3["sentiment.fixture"]
        F4["sse-events.fixture"]
    end

    FIX -.->|"feeds"| L2
    FIX -.->|"feeds"| L3
    FIX -.->|"feeds"| L4

    classDef st fill:#fef3c7,stroke:#d97706,color:#451a03
    classDef hk fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef ap fill:#fce7f3,stroke:#db2777,color:#831843
    classDef cp fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef ut fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef fx fill:#8b5cf6,stroke:#5b21b6,color:#fff
    class S1,S2,S3,S4,S5 st
    class H1,H2,H3,H4,H5 hk
    class A1,A2,A3,A4,A5 ap
    class C1,C2,C3,C4,C5 cp
    class U1,U2 ut
    class F1,F2,F3,F4 fx
```

**What's deliberately covered.** [`vitest.config.ts`](vitest.config.ts) scopes coverage to the layers where a regression would silently produce a *wrong number* — the API clients, the stores, the hooks, and every component that renders a model output (`components/analysis/**`, `components/dividend/**`, the three news components, and the shared badge/KPI/chart primitives). Presentational shell code is intentionally out of scope; a broken sidebar is obvious on sight, a mis-scaled SHAP bar is not.

An `sse-events.fixture` lets the streaming hook be tested deterministically without a live `EventSource`.

---

## 📁 Repository Layout

```
Final-Year-Research_CSE-25-26J-445-Frontend/
│
├── app/                                  # Next.js App Router
│   ├── layout.tsx                        #   root · ThemeProvider + AppShell + Analytics
│   ├── page.tsx                          # ⭐ market dashboard · 1,154 lines
│   ├── globals.css                       #   Tailwind 4 + design tokens
│   │
│   ├── risk/page.tsx                     # ⭐ risk analysis · SSE + SHAP · 1,254 lines
│   ├── predict/page.tsx                  # ⭐ price prediction · 2 tabs · 1,129 lines
│   ├── dividend/page.tsx                 # ⭐ dividend prediction
│   ├── news/page.tsx                     # ⭐ news feed + analyser
│   ├── news/[id]/page.tsx                #   article detail + inline analysis
│   │
│   ├── auth/sign-in/  auth/sign-up/      #   authentication
│   ├── pricing/                          #   subscription tiers
│   ├── payments/success/  cancel/        #   PayHere return pages
│   ├── profile/  settings/               #   account management
│   ├── admin/                            #   own layout · users + logs
│   │
│   └── api/                              # server route handlers · CORS proxy
│       ├── cse/all-sectors/route.ts
│       ├── cse/chart-data/route.ts
│       ├── cse/market-status/route.ts
│       ├── cse/news/route.ts
│       ├── market-data/trade-summary/route.ts
│       └── company-profile/route.ts
│
├── components/
│   ├── app-shell.tsx                     # ⭐ sidebar · top bar · auth guard
│   ├── theme-provider.tsx
│   ├── analysis/                         #   9 · sentiment decision rendering
│   ├── dividend/                         #   8 · dashboard, tabs, KaTeX modal
│   ├── news/                             #   3 · analyse box, AI terminal, pulse
│   ├── ui/                               #   58 · shadcn/ui primitives
│   └── *.tsx                             #   shared charts, badges, search, tables
│
├── hooks/                                # 7 · SSE stream, financial health, mobile, toast
├── stores/                               # 5 · Zustand slices
│
├── lib/
│   ├── api-client.ts                     # ⭐ fetch wrapper · JWT · ApiError
│   ├── api/                              #   4 typed domain clients
│   ├── sentimentApi.ts                   #   sentiment client + response shaping
│   ├── types/                            #   shared contracts
│   ├── risk-helpers.ts                   #   Z-Score zone logic
│   ├── fakeApi.ts                        #   local mock data
│   └── utils.ts                          #   cn() helper
│
├── __tests__/                            # 40 test files, mirroring src layout
├── tests/                                # setup + 4 fixture modules
├── docs/                                 # screenshots · videos · capture guides
├── public/                               # icons, logos
├── vitest.config.ts  next.config.mjs  components.json
└── tsconfig.json  postcss.config.mjs
```

---

## ⚠️ Known Issues

Documented rather than hidden — each is a small, well-understood fix.

| Issue | Where | Impact | Fix |
|---|---|---|---|
| **`FeatureCard` never rendered** | [`components/dividend/PredictionDashboard.tsx`](components/dividend/PredictionDashboard.tsx) imports it; no `<FeatureCard>` exists anywhere in the repo | The whole KaTeX explainability layer — `FeatureCard` → `FeatureExplanationModal` → `Latex` — is unreachable dead code. Verified by capturing the live page: zero feature cards in the DOM. | Render `<FeatureCard>` per engineered feature inside `PredictionDashboard`, passing `featureKey`, `value` and `glossary` |
| **Glossary endpoint hangs** | Backend `apps/Dividend-prediction-ml/routes/metadata.py` — `@cache(expire=86400)` on a **synchronous** `def get_glossary()` | `GET /dividend-prediction/metadata/glossary` never returns (verified: `http=000`, connection held open), so `fetchGlossary()` falls back to `{}`. Every other cached route in that file is `async def`. | Change `def get_glossary()` to `async def` — `fastapi-cache2`'s `@cache` only supports coroutine functions |
| **Two different `API_BASE_URL` conventions** | [`lib/api-client.ts`](lib/api-client.ts) defaults to `…/api/v1`; [`lib/api/dividend_api.ts`](lib/api/dividend_api.ts) defaults to `…/api/v1/dividend-prediction/` — both read the same `NEXT_PUBLIC_API_BASE_URL` | Setting that env var satisfies one module and breaks the other, producing URLs like `/api/v1metadata/glossary` | Give the dividend client its own env var, or derive its path from the shared base |
| **Hardcoded API host** | [`lib/sentimentApi.ts`](lib/sentimentApi.ts) — `http://127.0.0.1:3400/api/v1/sentiment/analyze` | Sentiment analysis breaks in any non-local deployment; it is the one client that bypasses `apiClient` | Route it through `apiClient` so it picks up `NEXT_PUBLIC_API_BASE_URL` and the JWT header like every other domain client |
| **TypeScript errors suppressed at build** | [`next.config.mjs`](next.config.mjs) — `typescript.ignoreBuildErrors: true` | Type regressions ship silently; the compiler is not a safety net right now | Set to `false` and clear the resulting errors |
| **Image optimisation disabled** | [`next.config.mjs`](next.config.mjs) — `images.unoptimized: true` | Larger payloads than necessary | Re-enable once remote image hosts are configured |
| **Two lockfiles** | `pnpm-lock.yaml` + `package-lock.json` | Installs can resolve differently depending on which manager a contributor uses | Pick one — `pnpm-lock.yaml` is the newer of the two — and delete the other |
| **Missing test peer dependency** | `@testing-library/react@16` requires `@testing-library/dom`, which is not in `devDependencies` | Every component test suite fails to collect on a clean install — `Cannot find module '@testing-library/dom'` | Add `@testing-library/dom@^10` to `devDependencies` |
| **Company health history always 404s** | Backend `GET /financial-health/company/:code/all` | Returns `Company with code 'jkh_n0000' not found` for every company tried, including ones analysed seconds earlier — the history collection is never populated. `useCompanyHealthHistory` falls back to its empty state, and demo mode has no fixture to replay. | Write each completed analysis into the history collection, or drop the endpoint and the hook |
| **News corpus not captured** | `public/demo-data/news/corpus.json` | Not yet harvested, so `/news` in demo mode falls back to the bundled mock articles — the one fabricated surface left in the demo. | Bring the stack up and run `npm run demo:harvest:news` |
| **Demo health coverage limited to 15 companies** | `public/demo-data/financial-health/` | The harvest stopped when the Gemini key ran out of prepayment credits (`429 … prepayment credits are depleted`). Ten curated companies were left uncaptured; five more (CBH, KTH, RAF, RF, TSH) have no CSE filing under their ticker and never will. | Top up Gemini credits and re-run `node scripts/demo/harvest-financial-health.mjs` — it resumes and skips what is already on disk |

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16.0 (App Router) · React 19.2 · TypeScript 5 |
| **Styling** | Tailwind CSS 4.1 · `@tailwindcss/postcss` · `tw-animate-css` · `tailwindcss-animate` |
| **Components** | shadcn/ui (58 primitives) · Radix UI · `class-variance-authority` · `tailwind-merge` |
| **State** | Zustand 5.0 · Immer · `use-sync-external-store` |
| **Charts** | Recharts 2.15 |
| **Forms** | React Hook Form 7.60 · Zod 3.25 · `@hookform/resolvers` |
| **Animation** | Framer Motion 12.25 |
| **Math** | KaTeX 0.16 |
| **UX** | `next-themes` · Sonner · Vaul · `cmdk` · `embla-carousel-react` · `input-otp` · `react-day-picker` · `react-resizable-panels` · `date-fns` |
| **Icons** | `lucide-react` |
| **Streaming** | Native `EventSource` (SSE) |
| **Testing** | Vitest 2.1 · Testing Library (React + jest-dom + user-event) · jsdom · `@vitest/coverage-v8` |
| **Analytics** | `@vercel/analytics` |

---

## 👥 Team

**Final Year Research Project · CSE-25-26J-445**
SLIIT Faculty of Computing · 2025/26

| Research Component | Frontend Surface |
|---|---|
| Financial Risk Prediction & Explainability | `/risk` · `ZScoreGauge` · SHAP breakdown · `use-analysis-stream` |
| Open Price Forecasting | `/predict` · `ForecastLineChart` · `DeltaBarChart` |
| Dividend Cut Prediction | `/dividend` · `PredictionDashboard` · KaTeX feature explanations |
| News Sentiment & Market Impact | `/news` · `AnalyzeBox` · `AITerminalStream` · `components/analysis/*` |
| Platform, Auth & Shell | `AppShell` · `useAuthStore` · `/admin` · `/pricing` · `/payments/*` |

---

## 🔗 Related Repositories

| Repository | Description |
|---|---|
| [**Backend**](https://github.com/Research-SLIIT/Final-Year-Research_CSE-25-26J-445-Backend) | NestJS · Nx monorepo · Kafka · gRPC · FastAPI/Flask ML services · FAISS |
| [**Organization**](https://github.com/Research-SLIIT) | Project overview, demos and research context |

---

## 📄 License

MIT

---

<div align="center">

**SLIIT — Faculty of Computing · Final Year Research Project 2025/26**

<sub>Colombo Stock Exchange · Explainable Machine Learning · Next.js</sub>

</div>
