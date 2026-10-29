"""
agents/video_generator.py
──────────────────────────
Video Generation Agent — sends each scene's canonical prompt and optional
reference keyframe (for Image-to-Video continuity) to the video client,
saves the rendered clip, and updates ProjectState.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from core.project import ProjectState, Scene
from core.utils import banner, ok, warn, scene_clip_path
from core.video_client import VideoClient


class VideoGeneratorAgent:
    """Generates video clips for every scene that doesn't yet have one."""

    def run(self, state: ProjectState, *, force_regenerate: bool = False) -> ProjectState:
        banner("🎬 Video Generator Agent")

        assert state.agents.prompt_builder, "Prompt Builder Agent must run before Video Generation."

        client = VideoClient()
        generated = 0
        skipped = 0

        # Compile master negative prompt
        master_negatives = []
        if state.director_notes and state.director_notes.avoid:
            master_negatives.extend(state.director_notes.avoid)
        master_negatives.extend([
            "morphing anatomy", "distorted limbs", "extra fingers",
            "camera shake", "text", "subtitles", "watermark", "logo", "blurry"
        ])
        negative_prompt_str = ", ".join(dict.fromkeys(master_negatives))

        # Check if Kaggle batch cloud rendering is enabled
        if getattr(client, "provider", "") == "kaggle":
            from core.kaggle_client import KaggleVideoClient
            k_client = KaggleVideoClient()
            if k_client.is_configured():
                print("   ⚡ Batch rendering all scenes on Kaggle Cloud GPU (16GB Tesla T4)…")
                scenes_to_render = []
                for s in state.scenes:
                    if not s.clip_path or not Path(s.clip_path).exists() or force_regenerate:
                        ref_img = self._resolve_reference_image(state, s)
                        sfx_prompt = ""
                        if state.audio_plan and state.audio_plan.sound_effects:
                            for fx in state.audio_plan.sound_effects:
                                if fx.get("scene_id") == s.scene_id:
                                    sfx_prompt = fx.get("type", "")
                                    break
                        if not sfx_prompt:
                            sfx_prompt = f"Cinematic sound design, luxury commercial sound effect, {s.story_beat[:60]}, high fidelity"

                        # Build dedicated SDXL-Lightning image prompt for keyframe plate
                        img_prompt = self._build_keyframe_prompt(state, s)
                        asp = getattr(state, "aspect_ratio", "") or ("16:9" if ("16:9" in state.platform or state.platform == "cinematic") else "9:16")

                        scenes_to_render.append({
                            "scene_id": s.scene_id,
                            "prompt": s.video_prompt,
                            "image_prompt": img_prompt,
                            "duration": s.duration_seconds,
                            "aspect_ratio": asp,
                            "motion_score": s.camera.motion_score if s.camera else 0.45,
                            "camera_vector": s.camera.camera_vector if s.camera else {},
                            "negative_prompt": negative_prompt_str,
                            "reference_image": str(ref_img) if ref_img else "",
                            "sfx_prompt": sfx_prompt,
                        })
                if scenes_to_render:
                    k_client.render_scenes(scenes_to_render, Path(state.clips_dir))
                    for s in state.scenes:
                        s_clip = scene_clip_path(state.clips_dir, s.scene_id)
                        if s_clip.exists():
                            s.clip_path = str(s_clip)
                            s.regeneration_count += 1
                            generated += 1
                            ok(f"   ✅ Scene {s.scene_id:02d} clip received from Kaggle -> {s_clip.name}")
                        s_frame = Path(state.storyboards_dir) / f"scene_{s.scene_id:02d}_frame.png"
                        if s_frame.exists():
                            s.reference_image_path = str(s_frame)
                    state.agents.video_generation = True
                    state.save()
                    return state

        for scene in state.scenes:
            clip_path = scene_clip_path(state.clips_dir, scene.scene_id)

            # Skip if already generated and not forcing regeneration
            if clip_path.exists() and not force_regenerate and scene.clip_path:
                print(f"   🎬 Scene {scene.scene_id:02d} — clip already exists, skipping.")
                skipped += 1
                continue

            if not scene.video_prompt:
                warn(f"Scene {scene.scene_id:02d} has no prompt — skipping.")
                continue

            # Check for starting reference keyframe for Image-to-Video
            ref_img = self._resolve_reference_image(state, scene)
            i2v_tag = f" [I2V Anchor: {Path(ref_img).name}]" if ref_img else " [T2V Direct]"
            print(f"   🎬 Scene {scene.scene_id:02d} — rendering ({scene.duration_seconds}s){i2v_tag}…")

            try:
                result_path = client.generate(
                    prompt=scene.video_prompt,
                    output_path=clip_path,
                    duration_seconds=scene.duration_seconds,
                    aspect_ratio=state.aspect_ratio,
                    reference_image_path=ref_img,
                    negative_prompt=negative_prompt_str,
                )
                scene.clip_path = str(result_path)
                scene.regeneration_count += 1
                generated += 1
                ok(f"   ✅ Scene {scene.scene_id:02d} clip rendered -> {Path(result_path).name}")
            except Exception as e:
                warn(f"Scene {scene.scene_id:02d} generation failed: {e}")

            state.save()

        state.agents.video_generation = True
        state.save()

        ok(f"Video generation stage complete. Generated: {generated}, Skipped: {skipped}.")
        return state

    def regenerate_scene(self, state: ProjectState, scene_id: int) -> ProjectState:
        """Regenerate a specific scene (e.g., after QC failure)."""
        scene = state.get_scene(scene_id)
        if not scene:
            warn(f"Scene {scene_id} not found.")
            return state

        client = VideoClient()
        clip_path = scene_clip_path(state.clips_dir, scene.scene_id)

        # Master negative prompt
        master_negatives = []
        if state.director_notes and state.director_notes.avoid:
            master_negatives.extend(state.director_notes.avoid)
        master_negatives.extend([
            "morphing anatomy", "distorted limbs", "extra fingers",
            "camera shake", "text", "watermark", "blurry"
        ])
        negative_prompt_str = ", ".join(dict.fromkeys(master_negatives))

        ref_img = self._resolve_reference_image(state, scene)
        print(f"   🔄 Regenerating scene {scene_id:02d} (attempt {scene.regeneration_count + 1})…")

        try:
            result_path = client.generate(
                prompt=scene.video_prompt,
                output_path=clip_path,
                duration_seconds=scene.duration_seconds,
                aspect_ratio=state.aspect_ratio,
                reference_image_path=ref_img,
                negative_prompt=negative_prompt_str,
            )
            scene.clip_path = str(result_path)
            scene.regeneration_count += 1
            scene.qc_passed = None  # Reset QC status for re-evaluation
            scene.qc_score = None
            scene.qc_issues = []
            state.save()
            ok(f"Scene {scene_id:02d} regenerated successfully.")
        except Exception as e:
            warn(f"Regeneration of scene {scene_id:02d} failed: {e}")

        return state

    def _resolve_reference_image(self, state: ProjectState, scene: Scene) -> Optional[str]:
        """Find keyframe starting image for I2V if present."""
        if scene.reference_image_path and Path(scene.reference_image_path).exists():
            return scene.reference_image_path

        # Check default storyboards path
        candidate = Path(state.storyboards_dir) / f"scene_{scene.scene_id:02d}_frame.png"
        if candidate.exists():
            scene.reference_image_path = str(candidate)
            return str(candidate)

        return None

    def _build_keyframe_prompt(self, state: ProjectState, scene: Scene) -> str:
        """Constructs an ultra-crisp master plate prompt for SDXL-Lightning on GPU.

        SDXL's CLIP encoders only read the first ~77 tokens, so the prompt
        is budgeted to ~55 words with subject, style and composition first —
        lighting and finish details that used to be silently truncated now
        survive. (The video stage uses Wan's T5 encoder and is unaffected.)
        """
        char_desc = ""
        for cid in scene.character_ids:
            char = state.get_character(cid)
            if char:
                clothing_snippet = " ".join(char.clothing_or_accessories.split()[:8]) if char.clothing_or_accessories else ""
                char_desc = f"{char.name}, {char.type}, wearing {clothing_snippet}" if clothing_snippet else f"{char.name}, {char.type}"
                break
        cam_desc = f"{scene.camera.shot_type}, {scene.camera.lens}" if scene.camera else "medium shot, 35mm prime"
        lighting = scene.camera.lighting if (scene.camera and scene.camera.lighting) else "motivated atmospheric lighting"

        comp_str = "16:9 widescreen composition" if state.aspect_ratio == "16:9" else "9:16 vertical composition"
        style_context = state.director_notes.style_lock if (state.director_notes and state.director_notes.style_lock) else state.style

        prompt_elements = [
            style_context,
            comp_str,
            f"Physical action: {scene.story_beat}",
        ]
        if char_desc:
            prompt_elements.append(char_desc)
        prompt_elements.extend([
            f"{cam_desc}",
            f"{lighting}",
            "pristine keyframe plate, high fidelity, sharp focus, cinema grade finish"
        ])

        full = ". ".join(p.strip().rstrip(".") for p in prompt_elements if p) + "."
        # CLIP budget: ~55 words so nothing important is truncated away
        words = full.split()
        if len(words) > 55:
            full = " ".join(words[:55]).rstrip(".") + "."
        return full

