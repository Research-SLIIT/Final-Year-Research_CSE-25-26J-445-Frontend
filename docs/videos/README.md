# Video Capture Guide — Frontend

> [!NOTE]
> **All clips in this folder have been recorded** (2026-07-26) from the running app against the live backend. This guide documents how, and how to refresh them.
>
> Recorded with Playwright's `recordVideo` at 1440×900, driving each flow at human pace (`pressSequentially` with a per-key delay, deliberate scroll steps) so the footage reads as live rather than scripted. Source `.webm` files were converted with a static ffmpeg binary: two-pass palette GIFs, plus H.264 MP4s concatenated into `demo-full-walkthrough.mp4` (6 min).
>
> `demo-full-walkthrough.gif` is a **hero reel** — a 6-second slice from the results portion of each clip, stitched and sped up, for the inline embed at the top of the README.
>
> One deviation: the planned `demo-responsive-theme.gif` was replaced by `demo-dashboard-tour.gif`, which covers the sidebar collapse and cross-page navigation with live market data.

Every filename below is wired into [`../../README.md`](../../README.md).

## How GitHub handles video

This trips people up, so read it first:

| Format | Embeds inline with `![](path)`? | How to use it |
|---|:--:|---|
| **GIF** | ✅ Yes | Commit to this folder. Simplest option — use this for the short clips. |
| **MP4 committed to the repo** | ❌ No | A markdown image link to an `.mp4` renders as a dead link. Only a plain hyperlink works. |
| **MP4 via GitHub user-content** | ✅ Yes | Drag the MP4 into any issue/PR comment (don't submit it), copy the generated `https://github.com/user-attachments/...` URL, and paste that **bare URL on its own line** in the README. GitHub renders a real video player with audio and controls. |

**Recommended split:**
- Short feature clips (10–25 s, silent) → **GIF**, committed here.
- The full walkthrough (1–3 min, possibly narrated) → **MP4 via user-content URL**, then replace the placeholder link in the README.

## Clip list

| Filename | Length | Format | Storyboard |
|---|---:|---|---|
| `demo-full-walkthrough.mp4` | 2–3 min | MP4 → user-content | Sign in → dashboard tour → risk analysis → price prediction → dividend → news sentiment → dark mode. The one video an interviewer watches. |
| `demo-full-walkthrough.gif` | 20–30 s | GIF | A condensed highlight reel for the inline embed at the top of the README. Cut to the 4–5 most visual moments. |
| `demo-risk-analysis.gif` | 20–25 s | GIF | Type ticker → hit Analyze → **let all 6 SSE stages play out** → gauge animates in → scroll to SHAP drivers. Do not cut the streaming; it is the point of the clip. |
| `demo-news-sentiment.gif` | 20–25 s | GIF | Paste an article → AI terminal stream prints → decision tree renders → scroll through score bar, fusion weights, and historical precedents. |
| `demo-price-prediction.gif` | 15–20 s | GIF | Symbol search with autocomplete → forecast resolves → delta bars → switch to Historical tab. |
| `demo-dividend.gif` | 15–20 s | GIF | Symbol + year → P(cut) verdict → scroll feature cards → **open a KaTeX formula modal** → comparison tab. |
| `demo-responsive-theme.gif` | 12–18 s | GIF | Collapse the sidebar → toggle dark mode → resize to mobile width → open the drawer nav. Demonstrates polish in one clip. |

## Recording

**Screen recorders**

| Tool | Notes |
|---|---|
| **ShareX** (Windows, free) | Records straight to GIF with good compression. Best single choice for the short clips. |
| **OBS Studio** | Best quality for the long MP4. Record at 1920×1080, 30 fps. |
| **Xbox Game Bar** (`Win + G`) | Built into Windows, MP4 only, zero setup. |
| **ScreenToGif** (Windows, free) | Frame-level editing — useful for trimming dead time out of a GIF. |

**Settings**

- Record at **1600 × 1000** or 1920 × 1080, then downscale GIFs to ~1200 px wide.
- **30 fps** for GIFs, 30–60 fps for the MP4.
- **Silent GIFs.** GitHub autoplays them muted and looping; audio is wasted bytes.
- Hide bookmarks bar and any personal browser extensions.
- Use a clean browser profile or an incognito window — no personal tabs or autofill dropdowns in frame.

**Direction**

- Move the cursor **slowly and deliberately**. Fast mouse movement is unreadable at GIF frame rates.
- Pause ~1 s on each result before moving on, so a viewer can actually read it.
- Trim all dead air. If a request takes 40 s, cut the middle and let the SSE stages tell the story.
- Start each clip on a settled screen, not mid-navigation.

**Privacy** — sign in with a demo account. No real email addresses, no devtools panel showing a JWT, no PayHere merchant credentials.

## Converting and compressing

```bash
# MP4 → high-quality GIF via a two-pass palette (much better than a naive convert)
ffmpeg -i demo-risk-analysis.mp4 -vf "fps=15,scale=1200:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i demo-risk-analysis.mp4 -i palette.png \
  -lavfi "fps=15,scale=1200:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  demo-risk-analysis.gif

# Shrink further if needed
gifsicle -O3 --lossy=80 demo-risk-analysis.gif -o demo-risk-analysis.gif

# Compress the MP4 before uploading to a GitHub comment
ffmpeg -i input.mp4 -vcodec libx264 -crf 26 -preset slow demo-full-walkthrough.mp4
```

**Size targets** — GIFs under **8 MB** each (they load inline on every README view, so this matters), MP4 under **50 MB** (GitHub's upload cap for comment attachments is 100 MB).

## Wiring the MP4 into the README

1. Open any issue in this repository — don't submit it.
2. Drag `demo-full-walkthrough.mp4` into the comment box and wait for upload.
3. Copy the `https://github.com/user-attachments/assets/...` URL it generates.
4. In [`../../README.md`](../../README.md), replace the `docs/videos/demo-full-walkthrough.mp4` link with that URL, placed **on its own line** with no markdown wrapping.
5. Close the issue without submitting. The uploaded asset stays valid.
