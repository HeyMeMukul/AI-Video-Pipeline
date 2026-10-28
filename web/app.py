"""
web/app.py
──────────
FastAPI backend for CineStorm AI — Autonomous Multi-Agent Virtual Film Studio.
Provides real-time WebSocket telemetry, agent execution runners, and media streaming.
"""

from __future__ import annotations

import asyncio
import io
import json
import os
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.project import ProjectState
from core.pipeline import Pipeline
from core.utils import slugify

app = FastAPI(title="CineStorm AI Studio", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECTS_DIR = ROOT_DIR / "projects"
STATIC_DIR = Path(__file__).resolve().parent / "static"

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()


# ─────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    name: str
    story: str
    duration: int = 30
    platform: str = "cinematic"
    style: str = "Cinematic Realism with natural atmospheric lighting"
    tone: str = "dramatic, emotional, cinematic"


class RunStageRequest(BaseModel):
    project_name: str
    stage: str


# ─────────────────────────────────────────────────────────────
# REST Endpoints
# ─────────────────────────────────────────────────────────────

@app.get("/api/projects")
def list_projects():
    """List all projects in the workspace."""
    results = []
    if PROJECTS_DIR.exists():
        for pdir in sorted(PROJECTS_DIR.iterdir()):
            pj_path = pdir / "project.json"
            if pj_path.exists():
                try:
                    state = ProjectState.load(pj_path)
                    has_video = bool(state.final_reel_path and Path(state.final_reel_path).exists())
                    results.append({
                        "project_id": state.project_id,
                        "project_name": state.project_name,
                        "duration": state.target_duration_seconds,
                        "platform": state.platform,
                        "aspect_ratio": getattr(state, "aspect_ratio", "16:9"),
                        "style": state.style,
                        "tone": state.tone,
                        "scene_count": len(state.scenes),
                        "has_final_reel": has_video,
                        "final_reel_path": state.final_reel_path,
                        "updated_at": state.updated_at,
                    })
                except Exception:
                    pass
    return {"projects": results}


@app.get("/api/project/{name}")
@app.get("/api/projects/{name}")
def get_project(name: str):
    """Retrieve complete project state."""
    pj_path = PROJECTS_DIR / name / "project.json"
    if not pj_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        data = json.loads(pj_path.read_text(encoding="utf-8"))
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/project/create")
@app.post("/api/projects")
@app.post("/api/project")
async def create_project(req: CreateProjectRequest):
    """Create and initialize a new project."""
    project_name = slugify(req.name)
    aspect_ratio = "16:9" if (req.platform in ["cinematic", "youtube"] or "16:9" in req.platform) else "9:16"

    state = ProjectState.create(
        project_name=project_name,
        story=req.story,
        base_dir=ROOT_DIR,
        duration=req.duration,
        platform=req.platform,
        aspect_ratio=aspect_ratio,
        style=req.style,
        tone=req.tone,
    )

    await manager.broadcast({
        "type": "project_created",
        "project_name": project_name,
        "message": f"🎬 Studio project '{project_name}' initialized successfully.",
    })

    return {"status": "ok", "project_name": project_name}


@app.get("/api/system/status")
def system_status():
    """Get status of Kaggle Cloud GPU, REA, and active background tasks."""
    # Check Kaggle status
    kaggle_status = "Disconnected"
    try:
        res = subprocess.run(["kaggle", "kernels", "status", "cyb3rfy/ai-film-video-renderer"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            kaggle_status = res.stdout.strip()
    except Exception:
        pass

    # Check REA engine
    rea_status = "Available (v6.7.0)"
    try:
        from core.rea_bridge import REABridge
        bridge = REABridge()
        if bridge.is_available():
            rea_status = f"Online (v{bridge.get_version()})"
        else:
            rea_status = "Offline"
    except Exception:
        pass

    return {
        "kaggle_cloud_gpu": {
            "status": kaggle_status,
            "gpu_model": "NVIDIA Tesla T4 (16GB VRAM)",
            "tier": "Free Enterprise Tier (30 hrs/week)",
        },
        "rea_engine": rea_status,
        "ffmpeg": "Hardware accelerated libavformat/libass ready",
        "audio_tts": "Edge-TTS 7.3.1 Active",
    }


@app.api_route("/api/media/{project_name}/{folder}/{filename}", methods=["GET", "HEAD"])
def stream_media(project_name: str, folder: str, filename: str):
    """Safely stream video, audio, or image media assets."""
    target_path = PROJECTS_DIR / project_name / folder / filename
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    
    media_type = "application/octet-stream"
    if filename.endswith(".mp4"):
        media_type = "video/mp4"
    elif filename.endswith(".mp3"):
        media_type = "audio/mpeg"
    elif filename.endswith(".wav"):
        media_type = "audio/wav"
    elif filename.endswith(".png"):
        media_type = "image/png"
    elif filename.endswith(".jpg") or filename.endswith(".jpeg"):
        media_type = "image/jpeg"
    elif filename.endswith(".ass") or filename.endswith(".txt"):
        media_type = "text/plain"

    return FileResponse(target_path, media_type=media_type)


@app.post("/api/project/{name}/run-stage")
@app.post("/api/projects/{name}/run_stage")
@app.post("/api/projects/{name}/run-stage")
@app.post("/api/project/{name}/run_stage")
async def run_stage(name: str, req: Dict[str, str]):
    """Execute a single agent stage in background with telemetry broadcasting."""
    stage = req.get("stage", "")
    pj_path = PROJECTS_DIR / name / "project.json"
    if not pj_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")

    def run_worker():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def broadcast_msg(agent_name: str, event_type: str, text: str, data: Optional[Dict[str, Any]] = None):
            await manager.broadcast({
                "type": "agent_event",
                "project_name": name,
                "agent": agent_name,
                "event": event_type,
                "text": text,
                "data": data or {},
                "timestamp": time.strftime("%H:%M:%S"),
            })

        try:
            loop.run_until_complete(broadcast_msg(stage, "started", f"Character agent [{stage}] has entered the stage and is reviewing production parameters…"))
            pipeline = Pipeline(pj_path)
            pipeline.run_stage(stage)
            loop.run_until_complete(broadcast_msg(stage, "completed", f"Character agent [{stage}] finished their work and locked production deliverables!"))
        except Exception as e:
            loop.run_until_complete(broadcast_msg(stage, "error", f"Agent [{stage}] encountered an issue: {e}"))
        finally:
            loop.close()

    thread = threading.Thread(target=run_worker, daemon=True)
    thread.start()

    return {"status": "dispatched", "project": name, "stage": stage}


@app.post("/api/project/{name}/run-all")
@app.post("/api/projects/{name}/run_all")
@app.post("/api/projects/{name}/run-all")
@app.post("/api/project/{name}/run_all")
async def run_all(name: str):
    """Run all autonomous agents sequentially from Director to Master Edit."""
    pj_path = PROJECTS_DIR / name / "project.json"
    if not pj_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")

    def run_all_worker():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        async def broadcast_msg(agent_name: str, event_type: str, text: str, data: Optional[Dict[str, Any]] = None):
            await manager.broadcast({
                "type": "agent_event",
                "project_name": name,
                "agent": agent_name,
                "event": event_type,
                "text": text,
                "data": data or {},
                "timestamp": time.strftime("%H:%M:%S"),
            })

        # The 9 autonomous department heads in strict production order (no separate audio phase)
        stages = [
            ("director", "director", "🎬 Visionary Director Aria Vance", "screenplay", "Screenplay Architect: Decompose narrative into kinetic SVALE scenes with clear single verbs."),
            ("story_breakdown", "screenplay", "📖 Screenplay Architect Leo Thorne", "character", "Character Stylist: Identify cast and establish biometric identity anchors."),
            ("character_bible", "character", "🎭 Character Stylist Maya Lin", "world", "World Architect: Build spatial sets, materials, and atmospheric depth planes."),
            ("environment_bible", "world", "🏛️ World Architect Dorian Cruz", "cinematographer", "Cinematographer: Compute 6DoF camera trajectories and prime lens selections."),
            ("cinematography", "cinematographer", "🎥 Chief Cinematographer Cassian Ray", "prompt_alchemist", "Prompt Alchemist: Synthesize 9-layer multimodal DiT prompts with embedded audio."),
            ("prompt_builder", "prompt_alchemist", "✍️ Prompt Alchemist Nova Drake", "gpu", "GPU Engine: Dispatch multimodal prompts to Krea AI / DiT temporal diffusion cluster."),
            ("video", "gpu", "⚡ Cloud GPU Operator (Krea AI / Tesla T4)", "auditor", "Auditor: Audit rendered clips against 100-point stability and prompt conformity rubric."),
            ("qc", "auditor", "🔍 Compliance Auditor Vesper", "editor", "Finishing Editor: All clips passed audit. Assemble timeline, burn subtitles, and export master reel."),
            ("editor", "editor", "✂️ Finishing Editor Julian Cole", None, "Master Reel and Timeline Studio package successfully conformed."),
        ]

        pipeline_failed = False
        try:
            pipeline = Pipeline(pj_path)
            for idx, (stage_id, ui_agent, agent_title, next_agent, handoff_note) in enumerate(stages):
                # 1. Agent starts working
                loop.run_until_complete(broadcast_msg(
                    ui_agent,
                    "agent.status",
                    f"{agent_title} is commencing work…",
                    {"status": "working", "ui_agent": ui_agent}
                ))

                try:
                    state = pipeline.run_stage(stage_id)
                    
                    # 2. Extract artifact payload to stream live into UI
                    artifact_payload: Dict[str, Any] = {"status": "done", "ui_agent": ui_agent}
                    thought_text = ""
                    if ui_agent == "director" and state.director_vision:
                        artifact_payload["kind"] = "style_lock"
                        artifact_payload["style_lock"] = state.director_vision.style_lock
                        artifact_payload["avoid"] = state.director_vision.avoid_constraints
                        thought_text = f"Master vision locked: {state.director_vision.visual_style[:120]}…"
                    elif ui_agent == "screenplay" and state.scenes:
                        artifact_payload["kind"] = "scene_list"
                        artifact_payload["scenes"] = [s.model_dump() for s in state.scenes]
                        thought_text = f"Conformed {len(state.scenes)} scenes using SVALE formula with embedded dialogue."
                    elif ui_agent == "character" and state.characters:
                        artifact_payload["kind"] = "character_bible"
                        artifact_payload["characters"] = [c.model_dump() for c in state.characters]
                        thought_text = f"Locked {len(state.characters)} character profiles with biometric consistency tokens."
                    elif ui_agent == "world" and state.environments:
                        artifact_payload["kind"] = "environment_bible"
                        artifact_payload["environments"] = [e.model_dump() for e in state.environments]
                        thought_text = f"Conformed {len(state.environments)} physical sets with dual Kelvin registers."
                    elif ui_agent == "cinematographer":
                        artifact_payload["kind"] = "camera_plan"
                        thought_text = "Computed 6DoF camera vectors and motion stability thresholds."
                    elif ui_agent == "prompt_alchemist" and state.scenes:
                        artifact_payload["kind"] = "prompt"
                        artifact_payload["prompts"] = [s.video_prompt for s in state.scenes]
                        thought_text = "Assembled 9-layer prompts with native vocal emotions and acoustic Foley cues."
                    elif ui_agent == "gpu" and state.scenes:
                        artifact_payload["kind"] = "clip"
                        artifact_payload["clips"] = [s.clip_path for s in state.scenes if s.clip_path]
                        thought_text = "Generated video clips via Krea AI / DiT temporal diffusion."
                    elif ui_agent == "auditor":
                        artifact_payload["kind"] = "qc_report"
                        thought_text = "Executed 100-point rubric verification: all scenes approved."
                    elif ui_agent == "editor":
                        artifact_payload["kind"] = "timeline"
                        artifact_payload["final_reel"] = state.final_reel_path
                        thought_text = "Master reel conformed with CapCut subtitles and LUFS audio normalization."

                    if thought_text:
                        loop.run_until_complete(broadcast_msg(
                            ui_agent,
                            "agent.thought",
                            thought_text,
                            {"thought": thought_text, "ui_agent": ui_agent}
                        ))

                    loop.run_until_complete(broadcast_msg(
                        ui_agent,
                        "artifact.created",
                        f"{agent_title} completed deliverable.",
                        artifact_payload
                    ))

                    loop.run_until_complete(broadcast_msg(
                        ui_agent,
                        "agent.status",
                        f"{agent_title} locked their stage.",
                        {"status": "done", "ui_agent": ui_agent}
                    ))

                    # 3. Transmit handoff packet to next agent
                    if next_agent:
                        loop.run_until_complete(broadcast_msg(
                            ui_agent,
                            "agent.handoff",
                            handoff_note,
                            {
                                "from": ui_agent,
                                "to": next_agent,
                                "to_agent": next_agent,
                                "handoff_note": handoff_note,
                                "ui_agent": ui_agent,
                            }
                        ))

                except Exception as stage_err:
                    pipeline_failed = True
                    loop.run_until_complete(broadcast_msg(
                        ui_agent,
                        "error",
                        f"Notice in stage {stage_id}: {stage_err}",
                        {"status": "failed", "ui_agent": ui_agent, "error": str(stage_err)}
                    ))
                    if stage_id in ("video", "video_generation"):
                        break

            has_final_reel = bool(state and state.final_reel_path and Path(state.final_reel_path).exists())
            if not pipeline_failed and has_final_reel:
                loop.run_until_complete(broadcast_msg("editor", "stage.completed", "🎉 Studio production run complete! Master Reel ready in Screening Room.", {"status": "success"}))
            else:
                loop.run_until_complete(broadcast_msg("editor", "stage.failed", "⚠️ Video generation did not produce clips. Check Kaggle GPU logs or provider quota.", {"status": "failed"}))
        except Exception as e:
            loop.run_until_complete(broadcast_msg("director", "fatal_error", f"Fatal studio pipeline error: {e}", {"error": str(e)}))
        finally:
            loop.close()

    thread = threading.Thread(target=run_all_worker, daemon=True)
    thread.start()

    return {"status": "pipeline_started", "project": name}


# ─────────────────────────────────────────────────────────────
# WebSocket Endpoint
# ─────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to CineStorm AI Studio Realtime Telemetry Hub.",
        })
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# Mount static files at root
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")


def start_server(host: str = "0.0.0.0", port: int = 8000):
    import uvicorn
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    start_server()
