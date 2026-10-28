"""
agents/environment_bible.py
────────────────────────────
Environment Bible Agent — creates locked, 5-pillar architectural and lighting
specifications for every unique location in the film. Guarantees spatial and
atmospheric consistency across all scenes.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

from core.llm import get_llm_for_agent
from core.project import LocationBible, ProjectState
from core.utils import banner, ok, warn, load_prompt_file, slugify


class EnvironmentBibleAgent:
    """Builds and locks the locations dictionary in ProjectState."""

    def run(self, state: ProjectState) -> ProjectState:
        banner("🌆 Production Design & Environment Bible")

        assert state.agents.story_breakdown, "Story Breakdown Agent must run first."

        prompt = load_prompt_file("environment_bible")
        if not prompt:
            raise FileNotFoundError("Master environment bible prompt not found at prompts/environment_bible.md")

        llm = get_llm_for_agent("environment_bible")

        # Gather unique location IDs required by scenes
        required_loc_ids = set(s.location_id for s in state.scenes if s.location_id)
        if not required_loc_ids:
            required_loc_ids.add("primary_environment")

        user_message = f"""
PRODUCTION SPECIFICATIONS:
- Project Name: {state.project_name}
- Target Platform: {state.platform}
- Visual Style: {state.director_notes.visual_style}
- Master Directorial Lighting: {state.director_notes.lighting}
- Master Directorial Style Lock: \"{state.director_notes.style_lock}\"

LOCATIONS REQUIRED IN PRODUCTION (by slug ID):
{sorted(required_loc_ids)}

SCENE CONTEXT:
{self._format_scene_context(state)}

TASK:
Author the complete 5-pillar environment bible for EVERY location listed above.
Lock the time of day, Kelvin lighting temperature, 3-color palette, and permanent key set elements.
Ensure each `prompt_block` is an evocative, self-contained physical world description.
Output ONLY the raw JSON object conforming strictly to the master schema.
"""

        print(f"   Locking production design & lighting architecture for: {', '.join(sorted(required_loc_ids))}…")
        raw_result = llm.complete_json(prompt, user_message)
        locations = self._validate_and_build_locations(raw_result, required_loc_ids, state)

        for loc in locations:
            state.locations[loc.location_id] = loc

        state.agents.environment_bible = True
        state.save()

        ok(f"Environment Bible locked for {len(state.locations)} location(s).")
        for lid, loc in state.locations.items():
            print(f"   🏛️  [{lid}] {loc.name}")
            print(f"      Lighting:  {loc.lighting[:80]}…")
            print(f"      Elements:  {', '.join(loc.key_elements[:3])}")
            print(f"      Anchor:    \"{loc.prompt_block[:90]}…\"")

        return state

    def _format_scene_context(self, state: ProjectState) -> str:
        lines = []
        for s in state.scenes:
            lines.append(f"Scene {s.scene_id:02d} -> [{s.location_id}] \"{s.story_beat}\" ({s.emotion})")
        return "\n".join(lines)

    def _validate_and_build_locations(
        self,
        data: Dict[str, Any],
        required_ids: set,
        state: ProjectState,
    ) -> List[LocationBible]:
        """Validate, normalize, and complete environment bibles against required scene IDs."""
        if not isinstance(data, dict):
            data = {}

        raw_list = data.get("locations", [])
        parsed_by_id = {}
        if isinstance(raw_list, list):
            for entry in raw_list:
                if isinstance(entry, dict) and entry.get("location_id"):
                    clean_id = slugify(str(entry["location_id"]))
                    parsed_by_id[clean_id] = entry

        final_locations: List[LocationBible] = []

        for lid in sorted(required_ids):
            entry = parsed_by_id.get(lid)
            if not entry:
                # Try relaxed slug match
                for k, v in parsed_by_id.items():
                    if k in lid or lid in k:
                        entry = v
                        break

            if not entry:
                warn(f"Location '{lid}' was not returned by LLM. Synthesizing consistent fallback environment.")
                entry = self._synthesize_fallback_entry(lid, state)

            name = str(entry.get("name") or lid.replace("_", " ").title()).strip()
            time_of_day = str(entry.get("time_of_day") or "early morning").strip()
            weather = str(entry.get("weather") or "soft volumetric mist").strip()
            lighting = str(entry.get("lighting") or state.director_notes.lighting or "diffused atmospheric light").strip()
            color_palette = str(entry.get("color_palette") or "desaturated teal, slate grey, muted warm accents").strip()

            raw_elements = entry.get("key_elements", [])
            key_elements = [str(e).strip() for e in raw_elements if str(e).strip()] if isinstance(raw_elements, list) else []
            if len(key_elements) < 2:
                key_elements = [
                    f"detailed architectural structures of {name}",
                    "reflective ground surface with fine texture",
                    "volumetric atmospheric haze in the distance",
                ]

            raw_keywords = entry.get("style_keywords", [])
            style_keywords = [str(k).strip() for k in raw_keywords if str(k).strip()] if isinstance(raw_keywords, list) else []
            if not style_keywords:
                style_keywords = ["cinematic", "photorealistic", "atmospheric", name]

            # Prompt block sanitization
            prompt_block = str(entry.get("prompt_block") or "").strip()
            prompt_block = re.sub(r'["`*]', '', prompt_block).strip()

            if len(prompt_block) < 30:
                prompt_block = (
                    f"{name}, {time_of_day}, {weather}, {lighting}, "
                    f"color palette of {color_palette}, featuring {', '.join(key_elements[:3])}, "
                    f"photorealistic spatial depth, high atmospheric realism."
                )

            final_locations.append(
                LocationBible(
                    location_id=lid,
                    name=name,
                    time_of_day=time_of_day,
                    weather=weather,
                    lighting=lighting,
                    color_palette=color_palette,
                    key_elements=key_elements,
                    style_keywords=style_keywords,
                    prompt_block=prompt_block,
                )
            )

        return final_locations

    def _synthesize_fallback_entry(self, lid: str, state: ProjectState) -> Dict[str, Any]:
        """Synthesize a robust environment entry if LLM missed an ID."""
        title_name = lid.replace("_", " ").title()
        return {
            "location_id": lid,
            "name": title_name,
            "time_of_day": "early morning dawn",
            "weather": "diffused atmospheric mist",
            "lighting": state.director_notes.lighting or "soft 5500K cool diffused skylight",
            "color_palette": "desaturated slate, atmospheric blue, muted accents",
            "key_elements": [
                f"architectural structures of {title_name}",
                "textured weathered ground plane",
                "atmospheric depth layers with soft fog",
            ],
            "style_keywords": ["cinematic", "photorealistic", "atmospheric", lid],
            "prompt_block": f"{title_name}, early morning dawn, diffused atmospheric mist, soft 5500K cool skylight, textured ground plane, photorealistic spatial depth.",
        }
