"""
agents/story_breakdown.py
──────────────────────────
Story Breakdown Agent — breaks down the enhanced narrative into tightly-scoped,
cinematic scenes where each clip executes exactly ONE visual action in 6–8 seconds.
"""

from __future__ import annotations

from typing import Any, Dict, List

from core.llm import get_llm_for_agent
from core.project import ProjectState, Scene
from core.utils import banner, ok, warn, load_prompt_file, slugify


class StoryBreakdownAgent:
    """Converts story text and directorial vision into a structured list of Scenes."""

    def run(self, state: ProjectState) -> ProjectState:
        banner("📖 Story Breakdown Supervisor")

        assert state.agents.director, "Director Agent must run first before story breakdown."

        prompt = load_prompt_file("story_breakdown")
        if not prompt:
            raise FileNotFoundError("Master story breakdown prompt not found at prompts/story_breakdown.md")

        llm = get_llm_for_agent("story_breakdown")

        user_message = f"""
NARRATIVE & PRODUCTION PARAMETERS:
- Project Name: {state.project_name}
- Target Duration: {state.target_duration_seconds} seconds
- Target Platform: {state.platform}
- Visual Style: {state.director_notes.visual_style}
- Camera Movement Philosophy: {state.director_notes.camera_style}
- Emotional Tone: {state.tone or "Cinematic, deliberate"}

MASTER DIRECTORIAL STYLE LOCK:
\"{state.director_notes.style_lock}\"

FULL SCREENPLAY / STORY TEXT:
\"\"\"{state.story}\"\"\"

TASK:
Break this story into sequential, shootable scenes using the SVALE formula (Subject, Verb, Atmosphere, Location, Emotion).
Each scene MUST be achievable in 6 to 8 seconds with ONE clear visual action.
Output ONLY the raw JSON object conforming strictly to the master schema.
"""

        print("   Decomposing narrative into 3-act beats & single-action clip constraints…")
        raw_result = llm.complete_json(prompt, user_message)
        scenes = self._parse_and_validate_scenes(raw_result, state)

        state.scenes = scenes
        state.agents.story_breakdown = True
        state.save()

        total_secs = sum(s.duration_seconds for s in scenes)
        ok(f"Story broken into {len(scenes)} production scenes ({total_secs}s total).")
        for s in scenes:
            print(f"   🎬 Scene {s.scene_id:02d} [{s.duration_seconds}s] ({s.emotion}) — {s.story_beat[:70]}…")

        return state

    def _parse_and_validate_scenes(self, data: Dict[str, Any], state: ProjectState) -> List[Scene]:
        """Validate, normalize, and repair scene list against production limits."""
        if not isinstance(data, dict):
            data = {}

        raw_scenes = data.get("scenes", [])
        if not isinstance(raw_scenes, list) or len(raw_scenes) == 0:
            warn("No valid scenes returned by LLM. Generating defensive fallback breakdown.")
            return self._generate_fallback_scenes(state)

        scenes: List[Scene] = []
        for idx, raw in enumerate(raw_scenes, 1):
            if not isinstance(raw, dict):
                continue

            scene_id = int(raw.get("scene_id") or idx)
            duration = int(raw.get("duration_seconds") or 7)
            duration = max(5, min(9, duration))  # Clamp between 5s and 9s

            story_beat = str(raw.get("story_beat") or "").strip()
            if not story_beat or len(story_beat) < 10:
                story_beat = f"The protagonist performs a quiet, deliberate visual action in the scene."

            emotion = str(raw.get("emotion") or "contemplative").strip().lower()

            raw_loc = raw.get("location_id") or "main_environment"
            location_id = slugify(str(raw_loc)) or "location_01"

            raw_chars = raw.get("character_ids", [])
            character_ids = []
            if isinstance(raw_chars, list):
                for c in raw_chars:
                    clean_c = slugify(str(c))
                    if clean_c and clean_c not in character_ids:
                        character_ids.append(clean_c)
            if not character_ids:
                character_ids = ["protagonist"]

            scenes.append(
                Scene(
                    scene_id=scene_id,
                    duration_seconds=duration,
                    story_beat=story_beat,
                    emotion=emotion,
                    location_id=location_id,
                    character_ids=character_ids,
                )
            )

        if not scenes:
            return self._generate_fallback_scenes(state)

        return scenes

    def _generate_fallback_scenes(self, state: ProjectState) -> List[Scene]:
        """Defensive fallback if LLM response is corrupted."""
        count = max(2, min(5, round(state.target_duration_seconds / 7.5)))
        duration_per_clip = round(state.target_duration_seconds / count)

        fallback = []
        emotions = ["mysterious", "contemplative", "tense", "awe", "hopeful"]
        for i in range(1, count + 1):
            fallback.append(
                Scene(
                    scene_id=i,
                    duration_seconds=duration_per_clip,
                    story_beat=f"Beat {i}: Protagonist moves deliberately through the environment with focused intent.",
                    emotion=emotions[(i - 1) % len(emotions)],
                    location_id="primary_location",
                    character_ids=["protagonist"],
                )
            )
        return fallback
