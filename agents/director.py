"""
agents/director.py
──────────────────
Director Agent — creates the authoritative production plan, visual style,
motivated lighting grammar, camera philosophy, and style lock that govern
the entire downstream AI film production pipeline.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

from core.llm import get_llm_for_agent
from core.project import DirectorNotes, ProjectState
from core.utils import banner, ok, warn, load_prompt_file


DEFAULT_AVOID_LIST = [
    "fast chaotic motion or erratic camera whipping",
    "unwanted additional characters appearing in frame",
    "morphing facial anatomy, distorted eyes, or extra limbs",
    "text overlays, subtitles, watermarks, or user interface elements",
    "sudden jarring background pop-in or color flickering",
    "blown-out unnatural digital highlights and pixel noise",
]


class DirectorAgent:
    """
    Produces the director_notes block in ProjectState.
    Must run first before all other pipeline agents.
    """

    def run(self, state: ProjectState) -> ProjectState:
        banner("🎬 Creative Director Agent")

        prompt = load_prompt_file("director")
        if not prompt:
            raise FileNotFoundError("Master director prompt file not found at prompts/director.md")

        llm = get_llm_for_agent("director")

        user_message = f"""
PROJECT SPECIFICATIONS:
- Project Name: {state.project_name}
- Target Duration: {state.target_duration_seconds} seconds
- Target Platform: {state.platform} (maintain aspect ratio safe zones)
- Preferred Visual Style: {state.style or "Cinematic, photorealistic, atmospheric"}
- Emotional Tone: {state.tone or "Evocative, deliberate, grounded in narrative emotion"}

RAW SCREENPLAY / STORY NARRATIVE:
\"\"\"{state.story}\"\"\"

TASK:
Analyze the narrative and author the authoritative production plan JSON conforming strictly to the master schema.
Ensure the `style_lock` is an exact, standalone 5-part sentence that locks the visual grammar for every subsequent shot.
"""

        print("   Directing visual world, motivated lighting, and immutable style lock…")
        raw_result = llm.complete_json(prompt, user_message)
        result = self._validate_and_sanitize(raw_result, state)

        state.director_notes = DirectorNotes(
            visual_style=result["visual_style"],
            camera_style=result["camera_style"],
            lighting=result["lighting"],
            editing=result["editing"],
            music=result["music"],
            style_lock=result["style_lock"],
            avoid=result["avoid"],
        )
        state.agents.director = True
        state.save()

        ok(f"Production Plan Locked.")
        print(f"   🎥 Camera Philosophy: {state.director_notes.camera_style[:80]}…")
        print(f"   💡 Motivated Light:   {state.director_notes.lighting[:80]}…")
        print(f"   🔒 Style Lock:        \"{state.director_notes.style_lock}\"")
        print(f"   🛡️  Avoid Constraints: {len(state.director_notes.avoid)} rules active")

        return state

    def _validate_and_sanitize(self, data: Dict[str, Any], state: ProjectState) -> Dict[str, Any]:
        """Validate LLM output against directorial quality standards."""
        if not isinstance(data, dict):
            data = {}

        visual_style = str(data.get("visual_style") or "").strip()
        if not visual_style or len(visual_style) < 15:
            visual_style = f"Cinematic {state.style}, rich photographic textures, organic contrast, and balanced color saturation."

        camera_style = str(data.get("camera_style") or "").strip()
        if not camera_style or len(camera_style) < 15:
            camera_style = "Deliberate and stable camera movement, predominantly slow push-ins and static holds with 35mm and 85mm prime lenses."

        lighting = str(data.get("lighting") or "").strip()
        if not lighting or len(lighting) < 15:
            lighting = "Motivated source lighting with subtle volumetric atmospheric haze and natural shadow roll-off."

        editing = str(data.get("editing") or "").strip()
        if not editing:
            editing = "Slow cinematic pacing with 5-7 second shot holds and gentle cross-dissolves."

        music = str(data.get("music") or "").strip()
        if not music:
            music = f"Ambient cinematic score, 70 BPM, {state.tone or 'contemplative and emotional'} mood, solo acoustic layers."

        # Style Lock Sanitization
        style_lock = str(data.get("style_lock") or "").strip()
        if not style_lock or len(style_lock) < 20:
            style_lock = f"Cinematic {state.style}, {state.tone or 'grounded emotional atmosphere'}, natural photographic lighting, 35mm film grain, 8k resolution, photorealistic grade."

        # Clean style lock of any markdown or quotes
        style_lock = re.sub(r'["`*]', '', style_lock).strip()

        # Avoid List Sanitization
        avoid_raw = data.get("avoid", [])
        avoid_list: List[str] = []
        if isinstance(avoid_raw, list):
            for item in avoid_raw:
                cleaned = str(item).strip().lower()
                if cleaned and len(cleaned) > 3 and cleaned not in avoid_list:
                    avoid_list.append(cleaned)

        # Merge with baseline defaults to ensure at least 6 hard negative rules
        for baseline in DEFAULT_AVOID_LIST:
            if not any(baseline.split()[0] in a for a in avoid_list):
                avoid_list.append(baseline)

        return {
            "visual_style": visual_style,
            "camera_style": camera_style,
            "lighting": lighting,
            "editing": editing,
            "music": music,
            "style_lock": style_lock,
            "avoid": avoid_list[:12],
        }
