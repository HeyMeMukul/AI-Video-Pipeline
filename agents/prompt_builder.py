"""
agents/prompt_builder.py
─────────────────────────
Prompt Builder Agent — synthesizes all upstream production bibles into exact,
canonical 8-section video generation prompts for every scene.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

from core.llm import get_llm_for_agent
from core.project import ProjectState
from core.utils import banner, ok, warn, save_scene_prompt, load_prompt_file


def _build_deterministic_canonical_prompt(state: ProjectState, scene_id: int) -> str:
    """
    Action-First Prompt Architecture for Diffusion Video Transformers (LTX-Video, Wan2.1, Kling).
    
    Ensures:
      1. [PRIMARY FRAMING & PHYSICAL VERB] in the first 20 words (heaviest cross-attention weight).
      2. [CONCISE CHARACTER ANCHOR] focused on silhouette & key wardrobe.
      3. [SETTING & KEY PROPS] concrete physical objects (desk, pen, folder).
      4. [CINEMATOGRAPHY & LIGHTING] motivated Kelvin register, prime lens, and 9:16 safe-zone framing.
      5. ZERO NEGATIVES in positive prompt to prevent token overflow.
    """
    scene = state.get_scene(scene_id)
    if not scene:
        return ""

    sections = []

    # 1. Primary Framing & Action (First 20 words — Heaviest DiT Attention)
    cam_intro = ""
    if scene.camera:
        cam_intro = f"{scene.camera.shot_type}, {scene.camera.camera_movement}."

    action = scene.story_beat.strip().rstrip(".")
    if cam_intro:
        sections.append(f"{cam_intro} {action}.")
    else:
        sections.append(f"{action}.")

    # 2. Character Dialogue & Vocal Emotion (Native Multimodal Audio-Visual Generation)
    spoken_dialogue = getattr(scene, "dialogue", "")
    voice_emotion = getattr(scene, "voice_emotion", "")
    if not spoken_dialogue and state.audio_plan and state.audio_plan.voiceover_lines:
        cumulative_start = sum(s.duration_seconds for s in state.scenes if s.scene_id < scene_id)
        cumulative_end = cumulative_start + scene.duration_seconds
        for line in state.audio_plan.voiceover_lines:
            s_start = line.get("start_second", 0)
            if cumulative_start <= s_start < cumulative_end:
                spoken_dialogue = line.get("text", "")
                break

    if spoken_dialogue:
        char_name = state.get_character(scene.character_ids[0]).name if scene.character_ids and state.get_character(scene.character_ids[0]) else "Lead voice"
        emotion_str = voice_emotion or scene.emotion or "intense heroic conviction"
        sections.append(f'{char_name} speaks with {emotion_str}: "{spoken_dialogue.strip()}".')

    # 3. Soundscape, Environmental Acoustics & Kinetic Foley
    audio_cues = getattr(scene, "audio_cues", "")
    if not audio_cues and state.audio_plan and state.audio_plan.sound_effects:
        scene_sfx = [sfx.get("type", "") for sfx in state.audio_plan.sound_effects if sfx.get("scene_id") == scene_id]
        if scene_sfx:
            audio_cues = "; ".join(scene_sfx[:2])

    if audio_cues:
        clean_audio = audio_cues.strip().rstrip(".")
        sections.append(f"Sound design: {clean_audio}.")

    # 4. Concise Character Anchor
    char_descs = []
    for cid in scene.character_ids:
        char = state.get_character(cid)
        if char:
            parts = [char.name]
            if char.type:
                parts.append(f"({char.type})")
            if char.clothing_or_accessories:
                clothing_brief = " ".join(char.clothing_or_accessories.split()[:8])
                parts.append(f"wearing {clothing_brief}")
            char_descs.append(" ".join(parts))
    if char_descs:
        sections.append(f"{'; '.join(char_descs)}.")

    # 5. Setting & Key Props
    loc = state.get_location(scene.location_id)
    if loc:
        loc_name = loc.name.strip().rstrip(".")
        sections.append(f"Setting: {loc_name}.")

    # 4. Motivated Lighting
    if scene.camera and scene.camera.lighting:
        sections.append(f"Lighting: {scene.camera.lighting.strip().rstrip('.')}.")
    elif loc and loc.lighting:
        sections.append(f"Lighting: {loc.lighting.strip().rstrip('.')}.")

    # 5. Cinema Optics & Directorial Style Finish (Runway Gen-3 / Kling 1.5 Architecture)
    lens_str = scene.camera.lens if (scene.camera and scene.camera.lens) else "35mm prime lens"
    comp_str = "16:9 widescreen cinematic composition" if state.aspect_ratio == "16:9" else "9:16 vertical composition"
    
    style_suffix = ""
    if state.director_notes and state.director_notes.style_lock:
        style_suffix = state.director_notes.style_lock.strip().rstrip(".")
    elif state.style:
        style_suffix = state.style.strip().rstrip(".")

    finish_parts = [lens_str, "shallow depth of field", comp_str]
    if style_suffix:
        finish_parts.append(style_suffix)
    else:
        finish_parts.append("ultra-fine motion texture, cinematic film finish")

    sections.append(f"{', '.join(finish_parts)}.")

    return " ".join(s.strip() for s in sections if s.strip())


# Alias for backward compatibility with unit tests
_build_fallback_prompt = _build_deterministic_canonical_prompt


class PromptBuilderAgent:
    """Synthesizes, validates, and stores the final video_prompt for each Scene."""

    def run(self, state: ProjectState) -> ProjectState:
        banner("✍️ Prompt Builder & Prompt Engineering")

        assert state.agents.cinematography, "Cinematography Agent must run before Prompt Builder."

        prompt_sys = load_prompt_file("prompt_builder")
        if not prompt_sys:
            raise FileNotFoundError("Master prompt builder prompt not found at prompts/prompt_builder.md")

        llm = get_llm_for_agent("prompt_builder")

        # Prepare rich context payload
        scenes_payload = []
        for s in state.scenes:
            char_blocks = {
                cid: state.characters[cid].prompt_block
                for cid in s.character_ids
                if cid in state.characters
            }
            loc = state.locations.get(s.location_id)
            cam = s.camera.model_dump() if s.camera else {}
            scenes_payload.append({
                "scene_id": s.scene_id,
                "story_beat": s.story_beat,
                "emotion": s.emotion,
                "character_blocks": char_blocks,
                "location_block": loc.prompt_block if loc else "",
                "camera": cam,
            })

        user_message = f"""
MASTER DIRECTORIAL STYLE LOCK:
\"{state.director_notes.style_lock if state.director_notes else ''}\"

DIRECTOR AVOID CONSTRAINTS:
{state.director_notes.avoid if state.director_notes else []}

SCENES WITH LOCKED PRODUCTION DATA:
{scenes_payload}

TASK:
Assemble the canonical 8-section video generation prompt for EVERY scene.
1. Style Lock (Verbatim)
2. Character Block (Verbatim)
3. Location Block (Verbatim)
4. Action (Single active sentence)
5. Camera (Lens, angle, movement)
6. Motivated Lighting
7. Mood
8. Negative Constraints
Output ONLY the raw JSON object conforming strictly to the master schema.
"""

        print(f"   Synthesizing 8-section prompt architectures for {len(state.scenes)} scenes…")
        prompt_map = {}
        try:
            raw_result = llm.complete_json(prompt_sys, user_message)
            if isinstance(raw_result, dict):
                for p in raw_result.get("scene_prompts", []):
                    if isinstance(p, dict) and p.get("scene_id") is not None and p.get("prompt"):
                        prompt_map[int(p["scene_id"])] = str(p["prompt"]).strip()
        except Exception as e:
            warn(f"LLM prompt synthesis warning ({e}) — activating deterministic canonical builder.")
            prompt_map = {}

        # Apply and validate prompts for every scene
        for scene in state.scenes:
            candidate = prompt_map.get(scene.scene_id)

            # Action-First Quality Check:
            # Diffusion video transformers (LTX, Wan) require action-first prompts under 110 words
            needs_fallback = False
            if not candidate or len(candidate.split()) < 15 or len(candidate.split()) > 110:
                needs_fallback = True

            if needs_fallback:
                final_prompt = _build_deterministic_canonical_prompt(state, scene.scene_id)
            else:
                final_prompt = candidate

            # Strip any accidental 'Negative:' text from positive prompt
            if "Negative:" in final_prompt:
                final_prompt = final_prompt.split("Negative:")[0].strip()

            scene.video_prompt = final_prompt
            save_scene_prompt(state.project_dir, scene.scene_id, final_prompt)
            print(f"   ✅ Scene {scene.scene_id:02d} ({len(final_prompt.split())} words): \"{final_prompt[:85]}…\"")

        state.agents.prompt_builder = True
        state.save()

        ok(f"Prompt Builder complete. All {len(state.scenes)} scene prompts locked and saved to scene_prompts/.")
        return state
