# Screenshot Capture Guide — Frontend

> [!NOTE]
> **All screenshots in this folder have been captured** (2026-07-26) from the running app against the live backend — real CSE filings, real model outputs, real Gemini extraction. This guide documents how they were produced and how to refresh them.
>
> They were captured with a Playwright script rather than by hand: viewport 1600×1000 at `deviceScaleFactor: 2`, session injected into `localStorage` (`cse_auth_token` + `cse_user`), and each ML flow driven to completion before shooting. Admin emails were programmatically redacted before capture.
>
> **Two deviations from the original plan, both deliberate:**
> - The app's `ThemeProvider` sets `defaultTheme="dark"` with `storageKey="theme-preference"`, so **dark is the authentic default**. The main set is therefore dark, and `16-light-mode.png` is the light *variant* (the reverse of what this guide originally specified).
> - `08-dividend-formula-modal.png` was **dropped** — the KaTeX modal it was meant to show is unreachable (`FeatureCard` is never rendered). Replaced with `08-dividend-feature-contributions.png`, which shows the explainability surface that does exist. See Known Issues in the main README.

Every filename below is wired into [`../../README.md`](../../README.md). Drop a PNG here with the exact name and it renders immediately — no README edit needed.

## Before you start

| Setting | Value | Why |
|---|---|---|
| Browser window | **1600 × 1000** | Wide enough for two-column layouts, not so wide that text looks tiny in a README table |
| Device pixel ratio | 2× if available | Crisp on high-DPI displays |
| Zoom | 100 % | Consistent scale across shots |
| Theme | **Light**, except where noted | Light reads better on GitHub's default theme |
| Sidebar | Expanded | Shows the navigation structure |
| Format | **PNG** | Lossless; charts and text stay sharp |
| Target file size | < 500 KB each | Keeps clone size reasonable — run them through [TinyPNG](https://tinypng.com) or `pngquant` |
| Data | **Real analysis results** | Empty states and spinners undersell the product |

> Sign in and run each analysis to completion *before* capturing. A dashboard full of real numbers is the single biggest difference between a README that looks finished and one that doesn't.

**Privacy check before committing:** crop or blank out any real email address, JWT in a devtools panel, PayHere merchant ID, or personal name that isn't a team member's.

## Shot list

### Dashboard

| # | Filename | Page | Capture |
|--:|---|---|---|
| 01 | `01-dashboard.png` | `/` | Full dashboard with live data loaded — ASPI and S&P SL20 cards, sector performance grid, gainers/losers, news ticker. Wait for the market-status badge to resolve before shooting. |

### Risk Analysis

| # | Filename | Page | Capture |
|--:|---|---|---|
| 02 | `02-risk-analysis-result.png` | `/risk` | A **completed** analysis: Z-Score gauge, risk-zone verdict card, confidence badge. Pick a ticker whose result lands in the Grey or Distress zone — more visually interesting than Safe, and it shows the colour system working. |
| 03 | `03-risk-analysis-streaming.png` | `/risk` | Mid-stream, around **step 4 of 6**. Several stages done, one in progress. This is the money shot for the SSE pipeline — time it so the spinner is visible on the active step. |
| 04 | `04-shap-feature-impact.png` | `/risk` | Scrolled to **Feature Impact Analysis** — positive and negative driver cards side by side, plus the ranked SHAP bars. Crop tight to the section. |

### Price Prediction

| # | Filename | Page | Capture |
|--:|---|---|---|
| 05 | `05-price-prediction.png` | `/predict` | Prediction tab with a resolved forecast: KPI row, forecast line chart, delta bar chart, confidence badge. |
| 06 | `06-price-historical.png` | `/predict` | Historical tab — latest trading day snapshot plus at least two charts visible (open price trend and OHLC, or volume/turnover). |

### Dividend Prediction

| # | Filename | Page | Capture |
|--:|---|---|---|
| 07 | `07-dividend-prediction.png` | `/dividend` | Prediction tab with the P(cut) verdict and a grid of feature cards visible. Prefer a company where the probability sits near the 0.822 threshold so the verdict styling is meaningful. |
| 08 | `08-dividend-formula-modal.png` | `/dividend` | A **feature explanation modal open**, KaTeX formula rendered. `ROA_x_leverage` or `efficiency_score` show the formatting off better than a plain ratio. |
| 09 | `09-dividend-comparison.png` | `/dividend` | Comparison tab with year-over-year feature deltas populated. |

### News & Sentiment

| # | Filename | Page | Capture |
|--:|---|---|---|
| 10 | `10-news-feed.png` | `/news` | Article list with real scraped articles, tag filters visible, search box in shot. |
| 11 | `11-news-sentiment-analysis.png` | `/news` | A **completed analysis** showing the full decision tree: Stage 1 score bar against the 0.30 threshold, Stage 2 direction, lexicon score, and the fusion weight bar. Use an article that comes back `impactful` — a `not_impactful` result renders only one stage. |
| 12 | `12-ai-terminal-stream.png` | `/news` | The `AITerminalStream` component mid-run, with several reasoning lines printed. |

### Platform

| # | Filename | Page | Capture |
|--:|---|---|---|
| 13 | `13-pricing.png` | `/pricing` | All subscription tiers with feature comparison. |
| 14 | `14-sign-in.png` | `/auth/sign-in` | Sign-in form. Leave the fields empty or use a placeholder address — never a real one. |
| 15 | `15-admin-users.png` | `/admin/users` | Admin user table. **Blank out real email addresses** before committing. |

### Presentation

| # | Filename | Page | Capture |
|--:|---|---|---|
| 16 | `16-light-mode.png` | `/` | **Light theme** — the variant, since the app defaults to dark. Force it with `localStorage['theme-preference'] = 'light'`. |
| 17 | `17-mobile-responsive.png` | `/` | **390 × 844** viewport via devtools device mode. |

### Extra shots captured beyond the original list

| Filename | Contents |
|---|---|
| `02b-risk-zscore-gauge.png` | The Z-Score prediction card in isolation — cleaner for a slide than the full page |
| `18-dividend-ai-narrative.png` | The LLM rationale section on `/dividend` |
| `19-risk-financial-ratios.png` | Financial ratios extracted from the quarterly PDF by Gemini |

## Capturing

**Windows** — `Win + Shift + S` for a region, or Snipping Tool with a delay for hover/modal states.

**Full-page shots** (dashboard, risk results) — Chrome devtools: `Ctrl + Shift + P` → type `screenshot` → **Capture full size screenshot**. Gets the whole scrollable page in one image.

**Timing-sensitive shots** (the streaming states, #03 and #12) — either:
- Throttle the network in devtools (*Network → Slow 4G*) so stages hold longer, or
- Screen-record the run and export a single frame.

**Consistent framing** — capture all shots in one session without resizing the window. Mismatched crops are the most noticeable flaw in a README gallery.

## After capturing

```bash
# Compress everything in place (pngquant, or use tinypng.com)
pngquant --quality=70-90 --ext .png --force docs/screenshots/*.png

# Verify the names match exactly — a typo shows as a broken image
ls docs/screenshots/
```

Then commit and check the rendered README on GitHub. Broken links show as the alt text, which makes them easy to spot.
