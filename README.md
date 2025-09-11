## 🎬 GIF Meme Generator

A web application to search GIFs via the **Tenor API**, add styled text overlays, and export memes (animated GIF or static PNG). Includes adaptive optimization and selectable quality presets.

## ✨ Features

- 🔍 **Search GIFs** (Tenor)
- 📝 **Multiple Text Overlays** (drag, delete with double‑click)
- 🎨 **Styling**: Font, size, color, bold, outline width/color
- ⚖️ **Quality Presets**: High / Balanced / Economy for output size vs clarity
- 🧠 **Adaptive Optimization**: Frame sampling + dynamic scaling
- 🎬 **Animated GIF Export** (gif.js)
- 🖼️ **Static Image Fallback** (PNG) if encoding fails
- 📱 **Responsive** design
- 💾 **Local Storage** of API key + preset
- 💬 **Messenger Compatible Mode** (one‑click conservative GIF for Facebook/Messenger)

## 🚀 Getting Started

### Prerequisites
- Modern browser (Chrome / Firefox / Edge / Safari)
- Tenor API key (free) → https://tenor.com/gifapi

### Quick Run
1. Clone repository
2. Start a local server (recommended):
```bash
python -m http.server 8000
# or
npx http-server
```
3. Open http://localhost:8000
4. Enter Tenor API key & save

You can open `index.html` directly, but some cross‑origin GIFs may block full frame extraction; the app will try fallbacks.

## 🎚 Quality Presets

In the editor you can choose a preset:

| Preset    | Target FPS* | Encode Width (approx) | Quality (gif.js param)** | Intended Use |
|-----------|-------------|-----------------------|--------------------------|--------------|
| High      | 12–16       | Up to 380px           | 20 (less skipping)       | Sharper small GIFs |
| Balanced  | 8–14        | ~320–340px            | 30–35 (adaptive)         | Default mix |
| Economy   | 6–10        | 260–300px             | 40 (more skipping)       | Minimum filesize |

\* Actual FPS adapts if original is very long (many frames).  
\** In gif.js a LOWER number is higher quality (fewer pixels skipped). Higher number = smaller + faster.

What happens under the hood:
- Frame sampling reduces total encoded frames while preserving total duration.
- Dynamic scale lowers width for longer animations.
- Quality param increases for huge animations to keep encoding fast and output small.

Tips to shrink further:
1. Choose Economy.
2. Use shorter or smaller-source GIFs.
3. Limit overlays (text outlines add contrasting pixels).
4. Crop/resize source before use (not yet built‑in—could be a future enhancement).

## 📖 Basic Workflow
1. Search and click a GIF.
2. Add text; drag to position.
3. Pick Quality preset (optional).
4. Generate Animated GIF or use Quick Static Image.
5. Download result.

## 🛠 Tech Stack
- HTML5 Canvas, Vanilla JS
- Tenor API (search)
- gifuct-js / omggif (decoding fallback chain)
- gif.js (encoding)

## 🧪 Limitations
- Very large or long GIFs may still produce multi‑MB outputs (format limitation).
- Browser memory can constrain decoding for giant GIFs.
- GIF format has 256-color palette per frame—banding can appear.

## 🔐 Storage
LocalStorage keys:
- `tenorApiKey`
- `qualityPreset`

Clear them with devtools > Application > Local Storage, or manually remove.

## 🐛 Troubleshooting
| Issue | Fix |
|-------|-----|
| API key prompt keeps showing | Ensure key is valid + no leading/trailing spaces |
| Blank canvas after selecting new GIF | Fixed via state reset; refresh if persists |
| Huge output size | Switch to Economy, or shorter source GIF |
| GIF generation stalls | Wait (quantization). If >90s timeout triggers static fallback |
| Facebook / Messenger won't animate | Use Messenger Compatible GIF button; keep width ≤300px |
| Console: willReadFrequently warning | Informational; we already set the flag where decoding needs it |
| Worker SecurityError (gif.worker.js) | Host `gif.worker.js` locally or rely on inline blob fallback automatically |

## 💬 Messenger / Facebook Compatibility

Some social platforms are picky about GIF structure. The provided **Messenger Compatible GIF** button re‑encodes with:

- Max width 300px
- Uniform 80ms delay (≈12.5 FPS perceived)
- Floyd–Steinberg dithering for stable palette
- Single global loop extension (loop forever)
- Forced opaque background (no transparency) to avoid disposal quirks

If your normal GIF fails to animate in Messenger:
1. Try the compatibility button.
2. Reduce overlays (outlines increase palette churn).
3. Pick a shorter source GIF (long >150 frame sources can fragment palette).
4. Avoid ultra-fast original GIFs (<30ms frame delays) – they’ll be normalized anyway.

Behind the scenes a lightweight validator checks:
- Header + logical screen
- Global color table presence
- GCE (Graphic Control Extension) blocks
- Netscape loop extension
- Frame count reasonableness

If validation flags issues, the app attempts a fallback re-encode with simplified settings.

### Still Not Working?
Upload the output to a GIF analyzer (e.g. ezgif.com/analyze) and look for:
- “No global color table” or “many local palettes” (try compatibility mode again)
- Extremely high frame count / huge file (trim or shorten source)
- Transparent pixels you don’t need (remove transparency)

Future ideas: automatic WebM export for platforms that silently re-transcode GIFs.

## ⚙️ Performance & Warnings

The browser may log: “Canvas2D: Multiple readback operations… set willReadFrequently.” For primary decode and frame assembly contexts we already pass `{ willReadFrequently: true }`. Temporary canvases created during encoding are short‑lived; the warning is safe to ignore.

If you see a `SecurityError` constructing a GIF worker from a CDN (common with some localhost setups / CSP / mixed content), the app now:
1. Tries same‑origin `gif.worker.js` (add the file at project root for best reliability)
2. Tries CDN
3. Fetches the script text and builds a Blob URL worker inline
4. Falls back to single‑thread (no-worker) mode (slower, but deterministic)

Add a local worker file for fastest multi‑core encoding:

`gif.worker.js` (copy from gif.js distribution) → same directory as `index.html`.

## 🤝 Contributing
PRs welcome: performance tweaks, cropping tool, WebM/MP4 export, palette optimization, mobile UI.

## 📝 License
MIT

## 🙏 Credits
- Tenor (search API)
- gif.js / gifuct-js / omggif
- Browser APIs (Canvas, Fetch, Storage)

---
Enjoy making memes! 🎉