"""
agents/cinematography.py
─────────────────────────
Cinematography Agent — translates narrative beats and emotional turns into
mathematically precise camera plans, optical lens selections, and AI-safe movements.
"""

from __future__ import annotations

from typing import Any, Dict, List

from core.llm import get_llm_for_agent
from core.project import CameraInstruction, ProjectState, Scene
from core.utils import banner, ok, warn, load_prompt_file


CAMERA_VECTORS = {
    "static": ({"x": 0.0, "y": 0.0, "z": 0.0, "pitch": 0.0, "yaw": 0.0, "roll": 0.0}, 0.3),
    "static hold": ({"x": 0.0, "y": 0.0, "z": 0.0, "pitch": 0.0, "yaw": 0.0, "roll": 0.0}, 0.3),
    "slow push-in": ({"x": 0.0, "y": 0.0, "z": 0.35, "pitch": 0.0, "yaw": 0.0, "roll": 0.0}, 0.45),
    "slow pull-back": ({"x": 0.0, "y": 0.0, "z": -0.35, "pitch": 0.0, "yaw": 0.0, "roll": 0.0}, 0.45),
    "slow pan left": ({"x": -0.3, "y": 0.0, "z": 0.0, "pitch": 0.0, "yaw": -0.25, "roll": 0.0}, 0.4),
    "slow pan right": ({"x": 0.3, "y": 0.0, "z": 0.0, "pitch": 0.0, "yaw": 0.25, "roll": 0.0}, 0.4),
    "gentle orbit": ({"x": 0.25, "y": 0.0, "z": 0.1, "pitch": 0.0, "yaw": 0.3, "roll": 0.0}, 0.5),
    "handheld gentle": ({"x": 0.04, "y": 0.04, "z": 0.02, "pitch": 0.02, "yaw": 0.02, "roll": 0.01}, 0.38),
}

ALLOWED_MOVEMENTS = list(CAMERA_VECTORS.keys())

EMOTION_TO_MOVEMENT = {
    "lonely": ("static hold", "35mm prime lens", "wide shot"),
    "isolated": ("static hold", "35mm prime lens", "wide shot"),
    "tense": ("slow push-in", "50mm prime lens", "medium close-up"),
    "foreboding": ("slow push-in", "50mm prime lens", "medium shot"),
    "mysterious": ("slow push-in", "35mm prime lens", "medium shot"),
    "awe": ("slow pull-back", "24mm wide angle", "extreme wide shot"),
    "wonder": ("slow pull-back", "24mm wide angle", "wide shot"),
    "hopeful": ("slow pull-back", "50mm prime lens", "medium shot"),
    "melancholy": ("static hold", "85mm portrait lens", "close-up"),
    "contemplative": ("static hold", "50mm prime lens", "medium shot"),
    "determined": ("slow push-in", "50mm prime lens", "medium close-up"),
}


class CinematographyAgent:
    """Assigns an AI-feasible, emotion-calibrated CameraInstruction to each Scene."""

    def run(self, state: ProjectState) -> ProjectState:
        banner("🎥 Cinematography & Camera Direction")

        assert state.agents.character_bible and state.agents.environment_bible, \
            "Character and Environment Bible Agents must run before Cinematography."

        prompt = load_prompt_file("cinematography")
        if not prompt:
            raise FileNotFoundError("Master cinematography prompt not found at prompts/cinematography.md")

        llm = get_llm_for_agent("cinematography")

        scene_summaries = [
            {
                "scene_id": s.scene_id,
                "story_beat": s.story_beat,
                "emotion": s.emotion,
                "location_id": s.location_id,
                "character_ids": s.character_ids,
                "duration_seconds": s.duration_seconds,
            }
            for s in state.scenes
        ]

        user_message = f"""
PRODUCTION PARAMETERS:
- Project Name: {state.project_name}
- Target Platform: {state.platform}
- Master Camera Philosophy: {state.director_notes.camera_style}
- Master Motivated Lighting: {state.director_notes.lighting}
- Master Style Lock: \"{state.director_notes.style_lock}\"

SCENES TO BE PLANNED:
{scene_summaries}

CHARACTERS IN PRODUCTION:
{[{"id": cid, "name": c.name, "type": c.type} for cid, c in state.characters.items()]}

ENVIRONMENTS IN PRODUCTION:
{[{"id": lid, "name": loc.name, "lighting": loc.lighting} for lid, loc in state.locations.items()]}

TASK:
Author the cinematography plan for EVERY scene above.
Enforce ONE lens, ONE angle, ONE motivated movement, and motion_intensity strictly "low" or "medium".
Output ONLY the raw JSON object conforming strictly to the master schema.
"""

        print(f"   Designing prime lenses, motivated camera moves, and safe-zone compositions…")
        raw_result = llm.complete_json(prompt, user_message)
        plans_by_id = self._parse_plans(raw_result)

        for scene in state.scenes:
            cam_data = plans_by_id.get(scene.scene_id)
            if not cam_data:
                warn(f"Scene {scene.scene_id:02d} missing camera plan. Generating emotion-aligned fallback.")
                cam_data = self._generate_fallback_camera(scene, state)

            validated_instruction = self._validate_and_sanitize(cam_data, scene, state)
            scene.camera = validated_instruction

        state.agents.cinematography = True
        state.save()

        ok(f"Cinematography locked for all {len(state.scenes)} scenes.")
        for s in state.scenes:
            if s.camera:
                print(f"   🎬 Scene {s.scene_id:02d} -> {s.camera.shot_type} ({s.camera.lens}) | "
                      f"Move: \"{s.camera.camera_movement}\" | Intensity: {s.camera.motion_intensity}")

        return state

    def _parse_plans(self, data: Dict[str, Any]) -> Dict[int, Dict[str, Any]]:
        """Extract plans indexed by scene_id."""
        if not isinstance(data, dict):
            return {}
        plans = {}
        raw_list = data.get("camera_plans", [])
        if isinstance(raw_list, list):
            for entry in raw_list:
                if isinstance(entry, dict) and entry.get("scene_id") is not None:
                    try:
                        plans[int(entry["scene_id"])] = entry
                    except (ValueError, TypeError):
                        pass
        return plans

    def _validate_and_sanitize(
        self,
        entry: Dict[str, Any],
        scene: Scene,
        state: ProjectState,
    ) -> CameraInstruction:
        """Sanitize movements, clamp motion intensity, and build CameraInstruction."""
        shot_type = str(entry.get("shot_type") or "medium shot").strip()
        camera_angle = str(entry.get("camera_angle") or "eye-level").strip()

        # Movement sanitization
        movement = str(entry.get("camera_movement") or "static hold").strip().lower()
        matched_movement = "static hold"
        for allowed in ALLOWED_MOVEMENTS:
            if allowed in movement:
                matched_movement = allowed
                break
        if "push" in movement:
            matched_movement = "slow push-in"
        elif "pull" in movement:
            matched_movement = "slow pull-back"
        elif "pan" in movement:
            matched_movement = "slow pan left" if "left" in movement else "slow pan right"
        elif "orbit" in movement:
            matched_movement = "gentle orbit"
        elif "handheld" in movement or "breathing" in movement:
            matched_movement = "handheld gentle"

        # Lens normalization
        lens = str(entry.get("lens") or "35mm prime lens").strip()

        # Motion intensity — NEVER allowed to be "high"
        raw_intensity = str(entry.get("motion_intensity") or "low").strip().lower()
        motion_intensity = "medium" if "med" in raw_intensity else "low"

        # Lighting & Composition
        loc = state.locations.get(scene.location_id)
        default_lighting = loc.lighting if loc else state.director_notes.lighting
        lighting = str(entry.get("lighting") or default_lighting or "Motivated soft ambient lighting").strip()

        composition = str(entry.get("composition") or "Subject framed in center 60% vertical safe zone").strip()
        focus = str(entry.get("focus") or "Sharp focus on primary subject").strip()

        # Reverse-engineered 6DoF vector & motion stability calibration
        vector_data, default_score = CAMERA_VECTORS.get(matched_movement, ({"x": 0.0, "y": 0.0, "z": 0.0, "pitch": 0.0, "yaw": 0.0, "roll": 0.0}, 0.35))
        motion_score = default_score if motion_intensity == "low" else min(0.65, default_score + 0.15)

        return CameraInstruction(
            scene_id=scene.scene_id,
            shot_type=shot_type,
            camera_angle=camera_angle,
            camera_movement=matched_movement,
            lens=lens,
            lighting=lighting,
            composition=composition,
            focus=focus,
            motion_intensity=motion_intensity,
            motion_score=motion_score,
            camera_vector=vector_data,
        )

    def _generate_fallback_camera(self, scene: Scene, state: ProjectState) -> Dict[str, Any]:
        """Synthesize a cinematography plan aligned with the scene's emotion."""
        emotion_key = scene.emotion.lower().strip()
        default_move, default_lens, default_shot = EMOTION_TO_MOVEMENT.get(
            emotion_key, ("static hold", "35mm prime lens", "medium shot")
        )

        comp_boundary = "16:9 widescreen composition" if state.aspect_ratio == "16:9" else "9:16 vertical safe boundaries"

        return {
            "scene_id": scene.scene_id,
            "shot_type": default_shot,
            "camera_angle": "eye-level",
            "camera_movement": default_move,
            "lens": default_lens,
            "lighting": state.director_notes.lighting or "Motivated atmospheric cinema lighting",
            "composition": f"Centered framing respecting {comp_boundary}",
            "focus": "Sharp focus on main subject with gentle environmental depth roll-off",
            "motion_intensity": "low",
        }
