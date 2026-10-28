<div align="center">

# 🎬 AI Video Pipeline

### *CineStorm AI — Autonomous Multi-Agent Virtual Film Studio*

**Turn a one-line story idea into a cinematic vertical reel — directed, shot & assembled by AI agents.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](web/app.py)
[![React](https://img.shields.io/badge/React-Studio%20UI-61DAFB?style=for-the-badge&logo=react&logoColor=black)](studio-ui/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Editor-00704A?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Features](#-features) • [Architecture](#️-architecture) • [Quick Start](#-quick-start) • [Web Studio](#-web-studio) • [CLI](#️-cli-reference) • [Agents](#-the-11-agents) • [Config](#-configuration)

</div>

---

## ✨ Features

| | What you get |
|---|---|
| 🎬 **11-agent film crew** | Director → Story → Character & Environment Bibles → References → Cinematography → Prompts → Video → QC → Editor (no separate audio/caption pass — dialogue and ambience are baked into each clip) |
| 🔒 **Consistency engine** | Locked Character Bible (7-layer) + Environment Bible (Kelvin lighting, palette, haze) + verbatim prompt reuse — no morphing faces |
| 💸 **100% free path** | Kaggle Tesla T4 for video · Gemini Flash / HuggingFace for LLM — zero paid keys required |
| 🔌 **Smart LLM router** | Auto-detects `OmniRoute → OpenRouter → Gemini → NVIDIA NIM → DeepSeek → Qwen → OpenAI → HuggingFace` and picks best model per agent tier |
| 🎥 **Multi-provider video** | `kaggle → kling → krea → huggingface → veo → fal → replicate` fallback chain + per-scene model routing |
| 📱 **Platform presets** | Instagram Reel, YouTube Shorts, TikTok (`1080×1920`) + Cinematic (`1920×1080`) |
| 🖥️ **Live studio floor** | React war-table with real-time WebSocket telemetry, production vault, per-stage dispatch — boots empty, runs only what you start |
| 🔬 **REA integration** | `agy rea` — reverse-engineer video tools into reusable intelligence profiles |
| 🧪 **Mock-tested** | `pytest` suite runs the full pipeline with zero API keys |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    S[📝 Story Input] --> P[🎬 Producer / Orchestrator<br/>core/pipeline.py]
    P --> D[🎬 Director<br/>style · tone · pacing]
    P --> SB[📖 Story Breakdown<br/>3-act beats · 6-8s scenes]
    P --> CB[🎭 Character Bible<br/>locked identity]
    P --> EB[🌆 Environment Bible<br/>locked locations]
    P --> RI[🖼️ Reference Images<br/>FLUX Schnell]
    P --> CI[🎥 Cinematography<br/>lenses · 9:16 safe zones]
    P --> PB[✍️ Prompt Builder<br/>diffusion prompts with baked-in dialogue + ambience]
    P --> VG[🎬 Video Generator<br/>Kaggle / Kling / Veo / fal]
    P --> QC[🔍 QC Supervisor<br/>100-pt rubric + retry]
    P --> ED[✂️ Master Editor<br/>joins clips via FFmpeg]
    ED --> OUT[📦 final_reel.mp4]
```

> No separate audio or caption stage by design: each clip is generated with its spoken line and soundscape baked in, and the Editor joins finished clips. This avoids the mismatch drift of post-dubbed voiceover and burned-in subtitles.

### The 5 Rules of Consistency

1. **Character Bible** — never describe the same character twice, differently.
2. **Environment Bible** — lock palette, materials, Kelvin temps (e.g. 6500K screen-blue vs 3200K tungsten).
3. **Simple Motion** — one motivated camera move per clip, low intensity.
4. **Prompt Formula** — `Style + Character + Location + Action + Camera + Lighting + Mood + Constraints`.
5. **QC Loop** — reject any clip that breaks character / environment lock (auto-retry ×3).

---

## 🚀 Quick Start

### 1. Prerequisites

- **Python 3.10+** · **ffmpeg** (`sudo apt install ffmpeg`) · **git**
- Optional: Node 18+ (only for `studio-ui/` dev mode)

### 2. Install

```bash
git clone https://github.com/HeyMeMukul/AI-Video-Pipeline.git
cd AI-Video-Pipeline

python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # ← fill in only the keys you have; free path works without
```

> 💡 **Zero-cost setup:** set just `GOOGLE_API_KEY` (Gemini free tier) + `HF_TOKEN` (optional) + Kaggle creds for video.

### 3. Open the studio (recommended)

```bash
python3 scripts/agy.py serve --port 8000
# → http://localhost:8000
```

The studio boots to a **clean empty floor** — nothing runs until you act. Either **pitch a new film** (story → style → framing → avoid-tags → Roll Camera) or **open the vault** to load an existing production. Tone and avoid-tags travel with the brief into the Director.

### 4. Or run headless via CLI

```bash
# Interactive producer: rough idea → enhanced screenplay → auto-run
python3 scripts/agy.py create

# Manual mode
python3 scripts/agy.py init --name "my_story" \
  --story "A lonely robot wakes up in an abandoned neon city." \
  --duration 30 --platform instagram_reel

python3 scripts/agy.py run --project projects/my_story/project.json

# Watch your reel
ffplay projects/my_story/output/final_reel.mp4
```

---

## 🖥️ Web Studio

One backend, one floor:

```bash
# Backend (FastAPI + WebSocket telemetry + serves the built UI)
python3 scripts/agy.py serve --host 0.0.0.0 --port 8000
# → http://localhost:8000   ·   ws://localhost:8000/ws

# Frontend dev mode (React + Tailwind + Zustand + Framer Motion)
cd studio-ui && npm install && npm run dev
# → http://localhost:5173 (proxies /api + /ws to the backend)
```

**The 8 rooms:**

| # | Room | What it does |
|---|---|---|
| 1 | Pitch Room | Brief the departments — story, visual DNA, framing, avoid-tags, dramatic intensity |
| 2 | Studio Floor | Live war-table: agent seats, handoff arcs, artifact shelf, floor chat, transport |
| 3 | Idea Journey | Data-driven lineage — execution graph, audit trail, per-scene narrative/optics/QC |
| 4 | Dossiers | Locked Character / Environment bibles + Director vision lock |
| 5 | Scene Board | SVALE shot cards with overview / camera / prompt / QC tabs |
| 6 | Prompt Lab | Layer-by-layer prompt assembly with copy + camera visualizer |
| 7 | Render Deck | Batch status, 100-pt auditor rubric, generation viewport, one-click re-render dispatch |
| 8 | Screening Room | Master reel player (mute, seek, fullscreen, filmstrip) + conform downloads |

**Live wiring:** project vault (`GET /api/projects`), full project load (`GET /api/project/{name}`), engine status (`GET /api/system/status`), single-stage dispatch (`POST /api/project/{name}/run-stage`), full run (`POST …/run-all`), media streaming (`GET /api/media/…`), realtime events (`WS /ws`). Keyboard: `1–8` rooms · `Space` play · `J/K` step · `` ` `` console · `Ctrl/⌘-K` palette.

---

## 🖥️ CLI Reference

| Command | What it does | Example |
|---|---|---|
| `init` | Scaffold a new project | `agy.py init --name x --story "..." --duration 30 --platform instagram_reel` |
| `create` | Interactive producer (enhance + auto-run) | `agy.py create` |
| `run` | Full pipeline | `agy.py run --project projects/x/project.json` |
| `stage` | Single agent only | `agy.py stage --project projects/x/project.json --stage director` |
| `status` | Project + scene + QC dashboard | `agy.py status --project projects/x/project.json` |
| `list` | All projects | `agy.py list` |
| `reset` | Re-run a stage | `agy.py reset --project projects/x/project.json --stage video` |
| `providers` | Show detected LLMs + per-agent routing | `agy.py providers` |
| `rea` | Reverse-engineer a tool / list profiles | `agy.py rea --list-profiles` |
| `serve` | Launch web studio backend | `agy.py serve --port 8000` |

**Stages:** `director · story · character · environment · references · cinematography · prompts · video · qc · editor`

**Flags:** `--skip-references` · `--skip-audio` · `--skip-editor`

---

## 🤖 The 11 Agents

| # | Agent | File | Prompt | Output |
|---|---|---|---|---|
| 1 | 🎬 **Director** | `agents/director.py` | `prompts/director.md` | Style lock, tone, pacing, negative-avoid list |
| 2 | 📖 **Story Breakdown** | `agents/story_breakdown.py` | `prompts/story_breakdown.md` | 3-act scene beats with durations |
| 3 | 🎭 **Character Bible** | `agents/character_bible.py` | `prompts/character_bible.md` | 7-layer locked identity |
| 4 | 🌆 **Environment Bible** | `agents/environment_bible.py` | `prompts/environment_bible.md` | 5-pillar space + Kelvin lighting |
| 5 | 🖼️ **Reference Images** | `agents/reference_image.py` | `prompts/reference_image.md` | Model sheets, location plates, keyframes |
| 6 | 🎥 **Cinematography** | `agents/cinematography.py` | `prompts/cinematography.md` | 35/50mm primes, 9:16 safe zones, push-ins |
| 7 | ✍️ **Prompt Builder** | `agents/prompt_builder.py` | `prompts/prompt_builder.md` | Diffusion prompts with baked-in dialogue + ambience |
| 8 | 🎬 **Video Generator** | `agents/video_generator.py` | — | `.mp4` clips via Kaggle/Kling/Krea/Veo/fal |
| 9 | 🔍 **QC Supervisor** | `agents/qc.py` | `prompts/qc.md` | 100-pt score, auto-retry ≤3 |
| 10 | 🎵 **Audio** *(library only)* | `agents/audio.py` | `prompts/audio.md` | Not in the Studio flow — sound is baked into clips |
| 11 | ✂️ **Master Editor** | `agents/editor.py` | `prompts/editor.md` | FFmpeg-joined final reel |

> 📚 Each agent's Hollywood + diffusion knowledge lives in `skills/<agent>/SKILL.md` — the pipeline reads it before every stage. Start with `MASTER_STARTER_PROMPT.md` for the full producer briefing.

---

## ⚙️ Configuration

| File | Purpose |
|---|---|
| `config.yaml` | Models, providers, fallback chains, QC thresholds, platform presets, output codec |
| `.env` *(you create, never committed)* | API keys — see `.env.example` for the full list |

**LLM auto-routing** (`config.yaml → llm.routing`):

| Tier | Agents | Default pick |
|---|---|---|
| `heavy` | director, character | best reasoning model available |
| `medium` | story, environment, cinematography | balanced |
| `fast` | prompt_builder, qc, editor, video | cheap + fast |
| `ultra_fast` | JSON transforms | smallest free model |

Check live routing anytime: `python3 scripts/agy.py providers`

**Video fallback chain:** `kaggle → kling → krea → huggingface → veo → fal → replicate`
**Free image alt:** `black-forest-labs/FLUX.1-schnell`

---

## 📁 Project Structure

```
AI-Video-Pipeline/
├── scripts/agy.py            ← CLI entry point (init/create/run/stage/status/serve)
├── core/                     ← pipeline.py · project.py · llm.py · video_client.py
│                                image_client.py · kaggle_client.py · rea_bridge.py
├── agents/                   ← 11 agent implementations
├── prompts/                  ← system prompt per agent
├── skills/                   ← Hollywood + AI knowledge base per agent
├── web/                      ← FastAPI backend + WebSocket telemetry + built UI
├── studio-ui/                ← React floor (views/ · floor/ · layout/ · ui/ · store/)
├── config.yaml               ← all knobs & fallback chains
├── projects/<name>/          ← project.json · story.txt · scene_prompts/
│                               references/ · clips/ · output/final_reel.mp4
└── tests/test_pipeline.py    ← mock-client integration tests
```

**Scope:** 1–3 paragraph story → 15–30s reel · 9:16 or 16:9 · 2–4 clips × 6–8s · locked cast and sets · clips joined as rendered, no post dubbing or caption pass.

---

## 🧪 Tests

```bash
python -m pytest tests/test_pipeline.py -v   # no API keys needed (mock clients)
```

---

## 🗺️ Roadmap

- [ ] Multi-character consistency graphs
- [ ] Real-ESRGAN upscale pass (`output.upscale: true`)
- [ ] One-click deploy for `web/` + `studio-ui/`
- [ ] More REA profiles for trending video tools

---

## 🤝 Contributing

PRs welcome! Keep agents small, prompts in `prompts/`, deep knowledge in `skills/<agent>/SKILL.md`, UI tokens in `studio-ui/tailwind.config.js` + `components/ui/`, and add a mock test in `tests/`.

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**Built like a real film studio — because consistency is a pipeline, not a prompt. 🎬**

⭐ Star this repo if it helped you ship a reel!

</div>
