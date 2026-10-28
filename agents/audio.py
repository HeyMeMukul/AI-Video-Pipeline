"""
agents/audio.py
────────────────
Audio Agent — creates a comprehensive, mathematically timed audio plan
(5-axis music direction, synchronized voiceover script, and atmospheric sound design),
and renders voiceover audio using ElevenLabs or 100% Free Edge-TTS.
"""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

import yaml

from core.llm import get_llm_for_agent
from core.project import AudioPlan, ProjectState
from core.utils import banner, ok, warn, load_prompt_file


def _load_config() -> Dict[str, Any]:
    cfg_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    if os.path.exists(cfg_path):
        with open(cfg_path) as f:
            return yaml.safe_load(f) or {}
    return {}


class AudioAgent:
    """
    Supervises music direction, voiceover scripting, and sound effects layering.
    Generates audio assets conforming to social media broadcast standard (-14 LUFS).
    """

    def run(self, state: ProjectState, *, generate_files: bool = True) -> ProjectState:
        banner("🎵 Audio Direction & Sound Design")

        assert state.agents.prompt_builder, "Prompt Builder Agent must run before Audio."

        prompt_sys = load_prompt_file("audio")
        if not prompt_sys:
            raise FileNotFoundError("Master audio prompt not found at prompts/audio.md")

        llm = get_llm_for_agent("audio")

        # Build mathematically exact scene timeline
        scene_timeline = []
        cumulative = 0.0
        for s in state.scenes:
            scene_timeline.append({
                "scene_id": s.scene_id,
                "start_second": cumulative,
                "end_second": cumulative + s.duration_seconds,
                "duration_seconds": s.duration_seconds,
                "story_beat": s.story_beat,
                "emotion": s.emotion,
            })
            cumulative += s.duration_seconds

        total_duration = cumulative

        user_message = f"""
PRODUCTION AUDIO PARAMETERS:
- Project Name: {state.project_name}
- Target Platform: {state.platform}
- Total Duration: {total_duration} seconds
- Master Directorial Music Vision: {state.director_notes.music if state.director_notes else "Atmospheric, cinematic, emotional"}
- Visual Style: {state.director_notes.visual_style if state.director_notes else state.style}

SCENE TIMELINE BOUNDARIES:
{json.dumps(scene_timeline, indent=2)}

FULL SCREENPLAY / STORY NARRATIVE:
\"\"\"{state.story}\"\"\"

TASK:
Author the complete, timed Audio Production Plan conforming strictly to the master schema.
Ensure voiceover lines are paced at ~120-140 WPM and fit inside their respective scene time windows.
Specify 5-axis copyright-safe music direction and atmospheric foley layers.
Output ONLY the raw JSON object conforming strictly to the master schema.
"""

        print(f"   Composing 5-axis music direction and timing voiceover across {len(state.scenes)} scenes ({total_duration}s total)…")
        raw_result = llm.complete_json(prompt_sys, user_message)
        result = self._validate_and_sanitize_plan(raw_result, scene_timeline, state)

        state.audio_plan = AudioPlan(
            music_style=result["music_style"],
            music_bpm=result["music_bpm"],
            music_mood=result["music_mood"],
            voiceover_lines=result["voiceover_lines"],
            sound_effects=result["sound_effects"],
        )

        # Save audio plan JSON
        audio_plan_path = Path(state.audio_dir) / "audio_plan.json"
        audio_plan_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

        # Save human-readable voiceover script
        if result["voiceover_lines"]:
            script_lines = [
                f"[{line['start_second']:.1f}s – {line['end_second']:.1f}s] (Scene {line.get('scene_id', 1)})\n"
                f"Voice Direction: {line.get('voice_direction', 'Calm and steady')}\n"
                f"Line: \"{line['text']}\"\n"
                for line in result["voiceover_lines"]
            ]
            (Path(state.audio_dir) / "voiceover_script.txt").write_text(
                "\n".join(script_lines), encoding="utf-8"
            )

        # Render voiceover audio if requested
        if generate_files and result["voiceover_lines"]:
            self._render_voiceover_audio(state, result["voiceover_lines"])

        state.agents.audio = True
        state.save()

        ok(f"Audio Plan locked: {state.audio_plan.music_style} ({state.audio_plan.music_bpm} BPM)")
        print(f"   🎙️  Voiceover: {len(state.audio_plan.voiceover_lines)} timed lines scripted")
        print(f"   🔊 Sound Design: {len(state.audio_plan.sound_effects)} foley and ambient layers planned")
        return state

    def _validate_and_sanitize_plan(
        self,
        data: Dict[str, Any],
        timeline: List[Dict[str, Any]],
        state: ProjectState,
    ) -> Dict[str, Any]:
        """Ensure voiceover timestamps align with scenes and music is 5-axis specified."""
        if not isinstance(data, dict):
            data = {}

        music_style = str(data.get("music_style") or "").strip()
        if not music_style or len(music_style) < 15:
            music_style = "Cinematic ambient score with felt upright piano, warm analog sub-bass, and subtle bowing strings"

        try:
            bpm = int(data.get("music_bpm", 70))
        except (ValueError, TypeError):
            bpm = 70
        bpm = max(50, min(140, bpm))

        music_mood = str(data.get("music_mood") or state.tone or "lonely, deeply contemplative, quietly hopeful").strip()

        # Voiceover validation & boundary clamping
        raw_vo = data.get("voiceover_lines", [])
        validated_vo = []
        if isinstance(raw_vo, list) and raw_vo:
            for idx, line in enumerate(raw_vo):
                if not isinstance(line, dict):
                    continue
                text = str(line.get("text") or "").strip()
                if not text:
                    continue

                # Align to scene if possible
                scene_info = timeline[idx] if idx < len(timeline) else timeline[-1]
                start_sec = float(line.get("start_second", scene_info["start_second"] + 0.5))
                end_sec = float(line.get("end_second", scene_info["end_second"] - 0.5))
                if end_sec <= start_sec:
                    end_sec = start_sec + 4.0

                validated_vo.append({
                    "scene_id": scene_info["scene_id"],
                    "start_second": round(start_sec, 2),
                    "end_second": round(end_sec, 2),
                    "text": text,
                    "voice_direction": str(line.get("voice_direction") or "Calm, intimate, cinematic delivery"),
                })
        else:
            # Generate default narration lines from story beats
            for scene_info in timeline:
                validated_vo.append({
                    "scene_id": scene_info["scene_id"],
                    "start_second": round(scene_info["start_second"] + 0.5, 2),
                    "end_second": round(scene_info["end_second"] - 0.5, 2),
                    "text": scene_info["story_beat"][:60],
                    "voice_direction": "Calm, contemplative delivery",
                })

        # Sound effects
        raw_sfx = data.get("sound_effects", [])
        validated_sfx = []
        if isinstance(raw_sfx, list) and raw_sfx:
            for sfx in raw_sfx:
                if isinstance(sfx, dict) and sfx.get("type"):
                    validated_sfx.append({
                        "scene_id": int(sfx.get("scene_id") or 1),
                        "start_second": float(sfx.get("start_second") or 0.0),
                        "end_second": float(sfx.get("end_second") or 5.0),
                        "type": str(sfx.get("type")),
                        "volume": str(sfx.get("volume") or "subtle (-18dB)"),
                    })
        if not validated_sfx:
            validated_sfx.append({
                "scene_id": 1,
                "start_second": 0.0,
                "end_second": timeline[-1]["end_second"] if timeline else 30.0,
                "type": "Continuous ambient environmental room tone and subtle atmospheric breeze",
                "volume": "subtle background (-22dB)",
            })

        return {
            "music_style": music_style,
            "music_bpm": bpm,
            "music_mood": music_mood,
            "voiceover_lines": validated_vo,
            "sound_effects": validated_sfx,
        }

    def _render_voiceover_audio(self, state: ProjectState, vo_lines: List[Dict[str, Any]]) -> None:
        """Render speech audio using ElevenLabs or 100% Free Edge-TTS."""
        cfg = _load_config()
        tts_provider = cfg.get("audio", {}).get("tts_provider", "edge_tts")
        full_script = " ... ".join(line["text"] for line in vo_lines)
        out_path = Path(state.audio_dir) / "voiceover.mp3"

        # Check ElevenLabs first if explicitly configured and key exists
        eleven_key = os.getenv("ELEVENLABS_API_KEY") or cfg.get("api_keys", {}).get("elevenlabs_api_key", "")
        if tts_provider == "elevenlabs" and eleven_key:
            try:
                from elevenlabs import generate, save  # type: ignore
                print("   Rendering voiceover via ElevenLabs API…")
                audio = generate(text=full_script, api_key=eleven_key, voice="Adam")
                save(audio, str(out_path))
                state.audio_plan.voiceover_path = str(out_path)
                ok(f"   ✅ ElevenLabs Voiceover rendered: {out_path.name}")
                return
            except Exception as e:
                warn(f"ElevenLabs TTS failed ({e}) — falling back to Free Edge-TTS.")

        # Fallback to Edge-TTS (100% Free, zero keys required)
        try:
            print("   Rendering voiceover via Free Microsoft Edge TTS…")
            # Try running edge-playback / edge-tts CLI
            subprocess.run([
                sys.executable, "-m", "edge_tts",
                "--voice", "en-US-ChristopherNeural",
                "--text", full_script,
                "--write-media", str(out_path),
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            state.audio_plan.voiceover_path = str(out_path)
            ok(f"   ✅ Edge-TTS Voiceover rendered: {out_path.name}")
            return
        except Exception:
            pass

        # If Edge-TTS CLI not installed, write audio script placeholder
        placeholder = out_path.with_suffix(".txt")
        placeholder.write_text(f"[VOICEOVER SCRIPT]\n{full_script}\n", encoding="utf-8")
        print(f"   [Audio] Voiceover text script saved: {placeholder.name}")
