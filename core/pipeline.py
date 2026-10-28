"""
core/pipeline.py
─────────────────
Producer / Orchestrator — runs all agents in the correct order,
manages retries, and maintains project state throughout the pipeline.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from core.project import ProjectState
from core.utils import banner, ok, step, warn


class Pipeline:
    """
    Orchestrates the full Film Production Pipeline.

    Stage order:
      1. Director
      2. Story Breakdown
      3. Character Bible
      4. Environment Bible
      5. Reference Images (optional)
      6. Cinematography
      7. Prompt Builder (Multimodal: Action, Dialogue, Voice Emotion & Soundscapes)
      8. Video Generation (Diffusion Video with native audio & speech)
      9. QC (with auto-retry)
      10. Editor (Master Assembly of clips into 1 seamless video reel)
    """

    def __init__(
        self,
        project_path: str | Path,
        *,
        skip_reference_images: bool = False,
        skip_audio: bool = True,  # Audio is embedded directly into Video Prompts
        skip_editor: bool = False,
    ):
        self.state = ProjectState.load(project_path)
        self.skip_reference_images = skip_reference_images
        self.skip_audio = skip_audio
        self.skip_editor = skip_editor

    # ─────────────────────────────────────────────────────────
    # Run full pipeline
    # ─────────────────────────────────────────────────────────

    def run(self) -> ProjectState:
        """Execute every pipeline stage in order."""
        banner(f"🎬 AI Film Production Pipeline — '{self.state.project_name}'")
        print(f"  Story: {self.state.story[:100]}…\n"
              f"  Duration: {self.state.target_duration_seconds}s  "
              f"| Platform: {self.state.platform}  "
              f"| Style: {self.state.style}\n")

        # Import lazily to avoid circular imports
        from agents import (
            DirectorAgent, StoryBreakdownAgent, CharacterBibleAgent,
            EnvironmentBibleAgent, ReferenceImageAgent, CinematographyAgent,
            PromptBuilderAgent, VideoGeneratorAgent, QCAgent, AudioAgent,
            EditorAgent,
        )

        stages = [
            ("Director",         DirectorAgent(),         "director"),
            ("Story Breakdown",  StoryBreakdownAgent(),   "story_breakdown"),
            ("Character Bible",  CharacterBibleAgent(),   "character_bible"),
            ("Environment Bible",EnvironmentBibleAgent(), "environment_bible"),
        ]

        if not self.skip_reference_images:
            stages.append(("Reference Images", ReferenceImageAgent(), "reference_images"))

        stages += [
            ("Cinematography",   CinematographyAgent(),   "cinematography"),
            ("Prompt Builder",   PromptBuilderAgent(),    "prompt_builder"),
            ("Video Generation", VideoGeneratorAgent(),   "video_generation"),
            ("QC",               QCAgent(),               "qc"),
        ]

        if not self.skip_audio:
            stages.append(("Audio", AudioAgent(), "audio"))

        if not self.skip_editor:
            stages.append(("Editor", EditorAgent(), "editor"))

        for stage_name, agent, status_key in stages:
            if getattr(self.state.agents, status_key):
                step(f"{stage_name} — already complete, skipping.")
                continue
            self.state = agent.run(self.state)

        banner("✅ Pipeline Complete")
        if self.state.final_reel_path:
            ok(f"Final reel: {self.state.final_reel_path}")
        else:
            warn("Final reel not yet produced (editor may have been skipped).")

        return self.state

    # ─────────────────────────────────────────────────────────
    # Run individual stages
    # ─────────────────────────────────────────────────────────

    def run_stage(self, stage_name: str) -> ProjectState:
        """Run a single pipeline stage by name."""
        from agents import (
            DirectorAgent, StoryBreakdownAgent, CharacterBibleAgent,
            EnvironmentBibleAgent, ReferenceImageAgent, CinematographyAgent,
            PromptBuilderAgent, VideoGeneratorAgent, QCAgent, AudioAgent,
            EditorAgent,
        )

        agent_map = {
            "director":         DirectorAgent(),
            "story":            StoryBreakdownAgent(),
            "story_breakdown":  StoryBreakdownAgent(),
            "character":        CharacterBibleAgent(),
            "character_bible":  CharacterBibleAgent(),
            "environment":      EnvironmentBibleAgent(),
            "environment_bible":EnvironmentBibleAgent(),
            "references":       ReferenceImageAgent(),
            "reference_images": ReferenceImageAgent(),
            "cinematography":   CinematographyAgent(),
            "prompts":          PromptBuilderAgent(),
            "prompt_builder":   PromptBuilderAgent(),
            "video":            VideoGeneratorAgent(),
            "video_generation": VideoGeneratorAgent(),
            "qc":               QCAgent(),
            "audio":            AudioAgent(),
            "editor":           EditorAgent(),
        }

        agent = agent_map.get(stage_name.lower())
        if not agent:
            raise ValueError(
                f"Unknown stage: '{stage_name}'. "
                f"Valid: {list(agent_map.keys())}"
            )

        self.state = agent.run(self.state)
        return self.state

    # ─────────────────────────────────────────────────────────
    # Reset helpers
    # ─────────────────────────────────────────────────────────

    def reset_stage(self, stage_name: str) -> None:
        """Mark a stage as incomplete so it will re-run."""
        status_map = {
            "director": "director",
            "story": "story_breakdown",
            "character": "character_bible",
            "environment": "environment_bible",
            "references": "reference_images",
            "cinematography": "cinematography",
            "prompts": "prompt_builder",
            "video": "video_generation",
            "qc": "qc",
            "audio": "audio",
            "editor": "editor",
        }
        key = status_map.get(stage_name.lower())
        if key:
            setattr(self.state.agents, key, False)
            self.state.save()
            print(f"   Stage '{stage_name}' reset.")
