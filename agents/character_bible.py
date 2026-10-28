"""
agents/character_bible.py
──────────────────────────
Character Bible Agent — creates immutable, 7-layer visual character specifications
for every character in the production. Governs character continuity across all scenes.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

from core.llm import get_llm_for_agent
from core.project import CharacterBible, ProjectState
from core.utils import banner, ok, warn, load_prompt_file, slugify


class CharacterBibleAgent:
    """Builds and locks the characters dictionary in ProjectState."""

    def run(self, state: ProjectState) -> ProjectState:
        banner("🎭 Character Design Director")

        assert state.agents.story_breakdown, "Story Breakdown Agent must run first."

        prompt = load_prompt_file("character_bible")
        if not prompt:
            raise FileNotFoundError("Master character bible prompt not found at prompts/character_bible.md")

        llm = get_llm_for_agent("character_bible")

        # Collect all character IDs required by scenes
        required_char_ids = set()
        for scene in state.scenes:
            required_char_ids.update(scene.character_ids)
        if not required_char_ids:
            required_char_ids.add("protagonist")

        user_message = f"""
PRODUCTION SPECIFICATIONS:
- Project Name: {state.project_name}
- Target Platform: {state.platform}
- Visual Style: {state.director_notes.visual_style}
- Master Directorial Style Lock: \"{state.director_notes.style_lock}\"

CHARACTERS REQUIRED IN PRODUCTION (by slug ID):
{sorted(required_char_ids)}

FULL SCREENPLAY / STORY CONTEXT:
\"\"\"{state.story}\"\"\"

SCENE BREAKDOWN CONTEXT:
{self._format_scene_context(state)}

TASK:
Author the complete 7-layer character bible for EVERY character listed above.
Every character must possess a distinct silhouette, concrete materials, and a canonical `prompt_block` starting with "same [type] named [name],".
Output ONLY the raw JSON object conforming strictly to the master schema.
"""

        print(f"   Engineering immutable character bibles for: {', '.join(sorted(required_char_ids))}…")
        raw_result = llm.complete_json(prompt, user_message)
        characters = self._validate_and_build_characters(raw_result, required_char_ids, state)

        for char in characters:
            state.characters[char.character_id] = char

        state.agents.character_bible = True
        state.save()

        ok(f"Character Bible locked for {len(state.characters)} character(s).")
        for cid, c in state.characters.items():
            print(f"   👤 [{cid}] {c.name} ({c.type})")
            print(f"      Anchor: \"{c.prompt_block[:90]}…\"")
            print(f"      Negatives: {len(c.negative_constraints)} rules active")

        return state

    def _format_scene_context(self, state: ProjectState) -> str:
        lines = []
        for s in state.scenes:
            lines.append(f"Scene {s.scene_id:02d} ({s.location_id}): chars={s.character_ids} -> \"{s.story_beat}\"")
        return "\n".join(lines)

    def _validate_and_build_characters(
        self,
        data: Dict[str, Any],
        required_ids: set,
        state: ProjectState,
    ) -> List[CharacterBible]:
        """Validate, sanitize, and complete character bibles against required scene IDs."""
        if not isinstance(data, dict):
            data = {}

        raw_list = data.get("characters", [])
        parsed_by_id = {}
        if isinstance(raw_list, list):
            for entry in raw_list:
                if isinstance(entry, dict) and entry.get("character_id"):
                    clean_id = slugify(str(entry["character_id"]))
                    parsed_by_id[clean_id] = entry

        final_characters: List[CharacterBible] = []

        for cid in sorted(required_ids):
            entry = parsed_by_id.get(cid)
            if not entry:
                # Try matching by relaxed slug
                for k, v in parsed_by_id.items():
                    if k in cid or cid in k:
                        entry = v
                        break

            if not entry:
                warn(f"Character '{cid}' was not returned by LLM. Synthesizing consistent fallback bible.")
                entry = self._synthesize_fallback_entry(cid, state)

            name = str(entry.get("name") or cid.replace("_", " ").title()).strip()
            char_type = str(entry.get("type") or "cinematic character").strip()
            body = str(entry.get("body") or "proportional, detailed visual form").strip()
            height = str(entry.get("height") or "average adult height").strip()
            face = str(entry.get("face") or "distinctive facial structure, expressive eyes").strip()
            clothing = str(entry.get("clothing_or_accessories") or "functional textured clothing").strip()
            personality = str(entry.get("personality") or "deliberate and expressive").strip()

            # Keywords
            raw_kw = entry.get("visual_keywords", [])
            visual_keywords = [str(k).strip() for k in raw_kw if str(k).strip()] if isinstance(raw_kw, list) else []
            if not visual_keywords:
                visual_keywords = [name, char_type, "photorealistic textures"]

            # Negative Constraints
            raw_neg = entry.get("negative_constraints", [])
            negative_constraints = [str(n).strip() for n in raw_neg if str(n).strip()] if isinstance(raw_neg, list) else []
            default_negs = [
                f"no changing appearance of {name}",
                "no extra limbs or floating anatomy",
                "no distorted facial features",
            ]
            for dn in default_negs:
                if dn not in negative_constraints:
                    negative_constraints.append(dn)

            # Master Prompt Block validation & repair
            prompt_block = str(entry.get("prompt_block") or "").strip()
            prompt_block = re.sub(r'["`*]', '', prompt_block).strip()

            expected_prefix = f"same {char_type} named {name},"
            if not prompt_block.lower().startswith("same ") or len(prompt_block) < 30:
                prompt_block = f"same {char_type} named {name}, {height}, {body}, {face}, {clothing}, {personality} posture, photorealistic textures."

            final_characters.append(
                CharacterBible(
                    character_id=cid,
                    name=name,
                    type=char_type,
                    body=body,
                    height=height,
                    face=face,
                    clothing_or_accessories=clothing,
                    personality=personality,
                    visual_keywords=visual_keywords,
                    negative_constraints=negative_constraints,
                    prompt_block=prompt_block,
                )
            )

        return final_characters

    def _synthesize_fallback_entry(self, cid: str, state: ProjectState) -> Dict[str, Any]:
        """Synthesize a robust character entry if LLM missed an ID."""
        title_name = cid.replace("_", " ").title()
        return {
            "character_id": cid,
            "name": title_name,
            "type": f"protagonist character {title_name}",
            "body": "compact and deliberate physical proportions with realistic tactile surface textures",
            "height": "standard human scale",
            "face": "distinctive focal features, sharp detailed eye reflection",
            "clothing_or_accessories": "weathered functional gear with fine seam details",
            "personality": "focused and observant",
            "visual_keywords": [cid, title_name, "photorealistic"],
            "negative_constraints": ["no morphing features", "no extra limbs"],
            "prompt_block": f"same character named {title_name}, detailed visual proportions, distinctive features, textured clothing, photorealistic grade.",
        }
