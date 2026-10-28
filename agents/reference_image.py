"""
agents/reference_image.py
──────────────────────────
Reference Image Agent — generates character model sheets, location master plates,
and scene keyframe first-frames. Establishes the visual anchors that condition
Image-to-Video (I2V) generation to prevent drift.
"""

from __future__ import annotations

from pathlib import Path

from core.image_client import ImageClient
from core.project import ProjectState, Scene
from core.utils import banner, ok, warn, load_prompt_file


class ReferenceImageAgent:
    """
    Generates:
    - Character model sheets (front view, side profile, 3/4 hero turn)
    - Location master establishing plates
    - Scene keyframes (first-frame anchor for I2V video models)
    """

    def run(self, state: ProjectState, *, generate_keyframes: bool = True) -> ProjectState:
        banner("🖼️ Concept Art & Reference Image Agent")

        assert state.agents.character_bible and state.agents.environment_bible, \
            "Character and Environment Bible Agents must run before Reference Images."

        client = ImageClient()

        # 1. Character Reference Sheets (Multi-View Model Sheets)
        for cid, char in state.characters.items():
            self._generate_character_references(client, state, cid, char)

        # 2. Location Master Shots
        for lid, loc in state.locations.items():
            self._generate_location_reference(client, state, lid, loc)

        # 3. Scene Keyframe First-Frames (T=0s for I2V video conditioning)
        if generate_keyframes:
            for scene in state.scenes:
                self._generate_scene_keyframe(client, state, scene)

        state.agents.reference_images = True
        state.save()

        ok(f"Reference images locked in {state.references_dir} and {state.storyboards_dir}.")
        return state

    def _generate_character_references(self, client: ImageClient, state: ProjectState, cid: str, char):
        style_lock = state.director_notes.style_lock if state.director_notes else ""

        views = {
            "front": (
                f"Character model sheet, front view, full body centered. {style_lock}. "
                f"{char.prompt_block}. Neutral studio grey background, diffused 3-point photographic lighting, "
                f"clean silhouette, photorealistic character turn."
            ),
            "side": (
                f"Character model sheet, side profile view, full body. {style_lock}. "
                f"{char.prompt_block}. Neutral studio background, clean silhouette, 8k concept art."
            ),
            "hero": (
                f"Character design concept, dynamic 3/4 hero angle. {style_lock}. "
                f"{char.prompt_block}. Soft rim lighting, cinematic depth, photorealistic textures."
            ),
        }

        for view_name, prompt in views.items():
            out_path = Path(state.references_dir) / f"{cid}_{view_name}.png"
            if out_path.exists():
                print(f"   👤 [{cid}] {view_name} view — already exists.")
                continue

            print(f"   Generating [{cid}] {view_name} reference sheet…")
            try:
                client.generate(prompt, out_path, aspect_ratio="2:3")
                ok(f"   ✅ Saved: {out_path.name}")
            except Exception as e:
                warn(f"   Failed to generate [{cid}_{view_name}]: {e}")

    def _generate_location_reference(self, client: ImageClient, state: ProjectState, lid: str, loc):
        style_lock = state.director_notes.style_lock if state.director_notes else ""
        prompt = (
            f"Location master establishing shot, wide panoramic view. {style_lock}. "
            f"{loc.prompt_block}. Architectural grand scale, photorealistic spatial depth, "
            f"atmospheric volumetric light, empty set, no characters."
        )

        aspect = "9:16" if "reel" in state.platform or "short" in state.platform else "16:9"
        out_path = Path(state.references_dir) / f"{lid}_master.png"

        if out_path.exists():
            print(f"   🏛️  [{lid}] location master — already exists.")
            return

        print(f"   Generating [{lid}] location master plate…")
        try:
            client.generate(prompt, out_path, aspect_ratio=aspect)
            ok(f"   ✅ Saved: {out_path.name}")
        except Exception as e:
            warn(f"   Failed to generate [{lid}_master]: {e}")

    def _generate_scene_keyframe(self, client: ImageClient, state: ProjectState, scene: Scene):
        out_path = Path(state.storyboards_dir) / f"scene_{scene.scene_id:02d}_frame.png"
        scene.reference_image_path = str(out_path)

        if out_path.exists():
            print(f"   🎬 Scene {scene.scene_id:02d} keyframe — already exists.")
            return

        # Build precise starting-frame prompt
        style_lock = state.director_notes.style_lock if state.director_notes else ""
        char_blocks = " ".join(
            state.characters[cid].prompt_block
            for cid in scene.character_ids
            if cid in state.characters
        )
        loc = state.locations.get(scene.location_id)
        loc_block = loc.prompt_block if loc else ""
        cam_desc = ""
        if scene.camera:
            cam_desc = f"{scene.camera.shot_type}, {scene.camera.camera_angle}, {scene.camera.lens}."
            if scene.camera.lighting:
                cam_desc += f" Lighting: {scene.camera.lighting}."

        prompt = (
            f"First frame cinema plate, scene {scene.scene_id:02d} starting moment. "
            f"{style_lock}. {char_blocks} {loc_block} "
            f"Starting posture immediately before action: {scene.story_beat}. {cam_desc} "
            f"8k photorealistic still frame, no motion blur."
        )

        aspect = "9:16" if "reel" in state.platform or "short" in state.platform else "16:9"
        print(f"   Generating scene {scene.scene_id:02d} starting keyframe (T=0s)…")
        try:
            client.generate(prompt, out_path, aspect_ratio=aspect)
            ok(f"   ✅ Saved keyframe: {out_path.name}")
        except Exception as e:
            warn(f"   Failed to generate scene {scene.scene_id:02d} keyframe: {e}")
