# Agent Trainer — PWA

Real-time workout coaching assistant. Phase 1: Session Coach.

---

## Deploy to iPhone in 5 steps

### 1. Install dependencies
```bash
npm install
```

### 2. Generate icons
Open `generate-icons.html` in any browser.
Download all three files → place in `public/`:
- `public/icon-512.png`
- `public/icon-192.png`
- `public/apple-touch-icon.png`

### 3. Test locally (optional)
```bash
npm run dev
```
Opens at http://localhost:5173

### 4. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Follow the prompts. Accept all defaults. Vercel auto-detects Vite.
You get a URL like: `https://agent-trainer-xyz.vercel.app`

Alternative — Netlify drag-and-drop:
```bash
npm run build
```
Drag the `dist/` folder to https://app.netlify.com/drop

### 5. Install on iPhone
1. Open the Vercel/Netlify URL in Safari on iPhone
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

App launches full-screen, no browser chrome, works offline.

---

## Project structure

```
agent-trainer/
├── public/
│   ├── icon-512.png          ← generate via generate-icons.html
│   ├── icon-192.png          ← generate via generate-icons.html
│   └── apple-touch-icon.png  ← generate via generate-icons.html
├── src/
│   ├── main.jsx              ← React entry point
│   └── AgentTrainer.jsx      ← Full app (Phase 1)
├── generate-icons.html       ← Open in browser to download icons
├── index.html                ← iOS PWA meta tags included
├── vite.config.js            ← PWA plugin configured
└── package.json
```

---

## Phase 2 (next)
- Dexie.js IndexedDB — PR persistence across sessions
- Session history store
- Exercise library screen
- PR history + trend chart
- Plate calculator standalone screen
