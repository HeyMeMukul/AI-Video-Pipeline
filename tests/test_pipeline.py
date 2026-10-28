"""
tests/test_pipeline.py
──────────────────────
Integration tests for the AI Film Production Pipeline.
Runs all agents against the example robot story project using mock clients
(no API keys required).

Run with:
    python -m pytest tests/test_pipeline.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import shutil
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from core.project import ProjectState, CharacterBible, LocationBible, DirectorNotes, Scene, CameraInstruction
from core.utils import slugify


# ─────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────

STORY = """
A lonely robot named R1 wakes up in an abandoned futuristic city.
The city has been empty for years. Neon signs flicker in the fog.
R1 slowly opens its eyes and looks around at the empty world.
In the distance, a faint light blinks through the fog.
"""

@pytest.fixture
def tmp_project(tmp_path):
    """Create a fresh project in a temp directory."""
    state = ProjectState.create(
        project_name="test_robot",
        story=STORY,
        base_dir=tmp_path,
        duration=30,
        platform="instagram_reel",
        style="cinematic sci-fi",
        tone="lonely, hopeful",
    )
    return state


# ─────────────────────────────────────────────────────────────
# Core tests
# ─────────────────────────────────────────────────────────────

class TestProjectState:
    def test_create_and_load(self, tmp_project, tmp_path):
        project_path = Path(tmp_project.project_dir) / "project.json"
        assert project_path.exists()

        loaded = ProjectState.load(project_path)
        assert loaded.project_name == "test_robot"
        assert loaded.target_duration_seconds == 30
        assert loaded.platform == "instagram_reel"

    def test_directories_created(self, tmp_project):
        for d in [
            tmp_project.references_dir,
            tmp_project.storyboards_dir,
            tmp_project.clips_dir,
            tmp_project.audio_dir,
            tmp_project.output_dir,
        ]:
            assert Path(d).exists(), f"Directory not created: {d}"

    def test_story_txt_created(self, tmp_project):
        story_path = Path(tmp_project.project_dir) / "story.txt"
        assert story_path.exists()
        assert "robot" in story_path.read_text().lower()

    def test_save_and_reload_preserves_data(self, tmp_project):
        # Add a character
        tmp_project.characters["robot_r1"] = CharacterBible(
            character_id="robot_r1",
            name="R1",
            type="small humanoid robot",
            body="white and grey metallic body",
            height="child-sized",
            face="round black visor with glowing blue eyes",
            clothing_or_accessories="rusty metal backpack",
            personality="curious, lonely",
            visual_keywords=["white robot", "blue eyes", "visor"],
            negative_constraints=["no human face"],
            prompt_block="same small humanoid robot named R1, white and grey metallic body.",
        )
        tmp_project.save()

        # Reload and check
        loaded = ProjectState.load(Path(tmp_project.project_dir) / "project.json")
        assert "robot_r1" in loaded.characters
        assert loaded.characters["robot_r1"].name == "R1"

    def test_get_scene(self, tmp_project):
        tmp_project.scenes = [
            Scene(scene_id=1, duration_seconds=8, story_beat="Robot wakes up", emotion="mysterious", location_id="city"),
            Scene(scene_id=2, duration_seconds=8, story_beat="Robot looks around", emotion="lonely", location_id="city"),
        ]
        assert tmp_project.get_scene(1).story_beat == "Robot wakes up"
        assert tmp_project.get_scene(99) is None


class TestUtils:
    def test_slugify(self):
        assert slugify("The Last Message!") == "the_last_message"
        assert slugify("My Project 2025") == "my_project_2025"
        assert " " not in slugify("hello world")


# ─────────────────────────────────────────────────────────────
# Agent unit tests (with mocked LLM)
# ─────────────────────────────────────────────────────────────

MOCK_DIRECTOR_RESPONSE = {
    "visual_style": "cinematic sci-fi, realistic textures",
    "camera_style": "slow and smooth",
    "lighting": "soft blue morning light with fog",
    "editing": "slow cuts, dreamy atmosphere",
    "music": "emotional ambient synth, 70 BPM",
    "style_lock": "Cinematic sci-fi, realistic textures, soft blue fog, high detail.",
    "avoid": ["fast chaotic motion", "text overlays", "morphing"],
}

MOCK_STORY_RESPONSE = {
    "story_title": "The Last Signal",
    "total_duration_seconds": 30,
    "number_of_clips": 4,
    "scenes": [
        {"scene_id": 1, "duration_seconds": 8, "story_beat": "Robot opens its eyes in dark street", "emotion": "mysterious", "location_id": "abandoned_city", "character_ids": ["robot_r1"]},
        {"scene_id": 2, "duration_seconds": 8, "story_beat": "Robot slowly looks around", "emotion": "lonely", "location_id": "abandoned_city", "character_ids": ["robot_r1"]},
        {"scene_id": 3, "duration_seconds": 7, "story_beat": "Robot picks up broken radio", "emotion": "hopeful", "location_id": "abandoned_city", "character_ids": ["robot_r1"]},
        {"scene_id": 4, "duration_seconds": 7, "story_beat": "A faint light blinks in the fog", "emotion": "wonder", "location_id": "abandoned_city", "character_ids": ["robot_r1"]},
    ],
}

MOCK_CHARACTER_RESPONSE = {
    "characters": [
        {
            "character_id": "robot_r1",
            "name": "R1",
            "type": "small humanoid robot",
            "body": "white and grey metallic body",
            "height": "child-sized",
            "face": "round black visor face with glowing blue eyes",
            "clothing_or_accessories": "rusty metal backpack",
            "personality": "curious, lonely, gentle",
            "visual_keywords": ["white robot", "black visor", "blue eyes", "rusty backpack"],
            "negative_constraints": ["no human face", "no extra limbs", "no changing colors"],
            "prompt_block": "same small humanoid robot named R1, white and grey metallic body, child-sized, round black visor face with glowing blue eyes, rusty metal backpack.",
        }
    ]
}

MOCK_ENVIRONMENT_RESPONSE = {
    "locations": [
        {
            "location_id": "abandoned_city",
            "name": "Abandoned Futuristic City",
            "time_of_day": "early morning",
            "weather": "foggy",
            "lighting": "soft blue volumetric light, gentle rim light",
            "color_palette": "teal, grey, soft blue",
            "key_elements": ["broken neon signs", "empty streets", "overgrown plants"],
            "style_keywords": ["cinematic sci-fi", "fog", "abandoned"],
            "prompt_block": "abandoned futuristic city street, early morning fog, broken neon signs, wet road reflections, overgrown plants, soft blue volumetric lighting.",
        }
    ]
}

MOCK_CAMERA_RESPONSE = {
    "camera_plans": [
        {"scene_id": 1, "shot_type": "wide shot", "camera_angle": "low angle", "camera_movement": "slow push-in", "lens": "35mm", "lighting": "soft blue foggy light", "composition": "robot centered in empty street", "focus": "robot face", "motion_intensity": "low"},
        {"scene_id": 2, "shot_type": "medium shot", "camera_angle": "eye-level", "camera_movement": "static", "lens": "50mm", "lighting": "soft blue foggy light", "composition": "robot looking around", "focus": "robot eyes", "motion_intensity": "low"},
        {"scene_id": 3, "shot_type": "close-up", "camera_angle": "low angle", "camera_movement": "slow pull-back", "lens": "85mm", "lighting": "soft blue foggy light", "composition": "robot hands holding radio", "focus": "broken radio", "motion_intensity": "low"},
        {"scene_id": 4, "shot_type": "wide shot", "camera_angle": "eye-level", "camera_movement": "slow pan right", "lens": "35mm", "lighting": "soft blue foggy light with distant glow", "composition": "distant blinking light in fog", "focus": "blinking light", "motion_intensity": "low"},
    ]
}

MOCK_PROMPT_RESPONSE = {
    "scene_prompts": [
        {"scene_id": i, "prompt": f"Cinematic sci-fi test prompt for scene {i}."}
        for i in range(1, 5)
    ]
}

MOCK_QC_RESPONSE = {
    "scene_id": 1,
    "passed": True,
    "score": 88,
    "issues": [],
    "recommended_action": "",
}

MOCK_AUDIO_RESPONSE = {
    "music_style": "emotional ambient sci-fi",
    "music_bpm": 70,
    "music_mood": "lonely, hopeful",
    "voiceover_lines": [
        {"start_second": 0, "end_second": 8, "text": "In a silent city, one robot woke up.", "voice_direction": "calm and slow"},
    ],
    "sound_effects": [
        {"start_second": 0, "end_second": 30, "type": "soft wind", "volume": "soft"},
    ],
}


class TestAgentsWithMockedLLM:
    """Test each agent with a mocked LLM client."""

    def _mock_llm(self, response: dict):
        mock = MagicMock()
        mock.complete_json.return_value = response
        return mock

    def test_director_agent(self, tmp_project):
        from agents.director import DirectorAgent
        with patch("agents.director.get_llm_for_agent", return_value=self._mock_llm(MOCK_DIRECTOR_RESPONSE)):
            state = DirectorAgent().run(tmp_project)
        assert state.agents.director
        assert state.director_notes.style_lock
        assert "fog" in state.director_notes.style_lock.lower() or state.director_notes.visual_style

    def test_story_breakdown_agent(self, tmp_project):
        # Pre-fill director
        tmp_project.director_notes = DirectorNotes(**MOCK_DIRECTOR_RESPONSE)
        tmp_project.agents.director = True

        from agents.story_breakdown import StoryBreakdownAgent
        with patch("agents.story_breakdown.get_llm_for_agent", return_value=self._mock_llm(MOCK_STORY_RESPONSE)):
            state = StoryBreakdownAgent().run(tmp_project)

        assert state.agents.story_breakdown
        assert len(state.scenes) == 4
        assert state.scenes[0].scene_id == 1

    def test_character_bible_agent(self, tmp_project):
        tmp_project.director_notes = DirectorNotes(**MOCK_DIRECTOR_RESPONSE)
        tmp_project.agents.director = True
        tmp_project.scenes = [Scene(**s) for s in MOCK_STORY_RESPONSE["scenes"]]
        tmp_project.agents.story_breakdown = True

        from agents.character_bible import CharacterBibleAgent
        with patch("agents.character_bible.get_llm_for_agent", return_value=self._mock_llm(MOCK_CHARACTER_RESPONSE)):
            state = CharacterBibleAgent().run(tmp_project)

        assert state.agents.character_bible
        assert "robot_r1" in state.characters
        assert "prompt_block" in state.characters["robot_r1"].model_dump()

    def test_environment_bible_agent(self, tmp_project):
        tmp_project.director_notes = DirectorNotes(**MOCK_DIRECTOR_RESPONSE)
        tmp_project.agents.director = True
        tmp_project.scenes = [Scene(**s) for s in MOCK_STORY_RESPONSE["scenes"]]
        tmp_project.agents.story_breakdown = True

        from agents.environment_bible import EnvironmentBibleAgent
        with patch("agents.environment_bible.get_llm_for_agent", return_value=self._mock_llm(MOCK_ENVIRONMENT_RESPONSE)):
            state = EnvironmentBibleAgent().run(tmp_project)

        assert state.agents.environment_bible
        assert "abandoned_city" in state.locations

    def test_prompt_builder_deterministic_fallback(self, tmp_project):
        """Prompt builder should work without LLM using deterministic assembly."""
        # Set up full state
        tmp_project.director_notes = DirectorNotes(**MOCK_DIRECTOR_RESPONSE)
        tmp_project.agents.director = True
        tmp_project.scenes = [Scene(**s) for s in MOCK_STORY_RESPONSE["scenes"]]
        tmp_project.agents.story_breakdown = True
        tmp_project.characters = {
            c["character_id"]: CharacterBible(**c)
            for c in MOCK_CHARACTER_RESPONSE["characters"]
        }
        tmp_project.agents.character_bible = True
        tmp_project.locations = {
            l["location_id"]: LocationBible(**l)
            for l in MOCK_ENVIRONMENT_RESPONSE["locations"]
        }
        tmp_project.agents.environment_bible = True
        for s in tmp_project.scenes:
            cam = MOCK_CAMERA_RESPONSE["camera_plans"][s.scene_id - 1]
            s.camera = CameraInstruction(**cam)
        tmp_project.agents.cinematography = True

        from agents.prompt_builder import PromptBuilderAgent, _build_fallback_prompt
        # Test deterministic builder directly
        prompt = _build_fallback_prompt(tmp_project, 1)
        assert len(prompt) > 50
        assert "R1" in prompt or "robot" in prompt.lower()

    def test_full_pipeline_smoke(self, tmp_project):
        """Full pipeline smoke test with all agents mocked."""
        from core.pipeline import Pipeline

        # Build a pipeline with a pre-loaded state
        pipeline = Pipeline.__new__(Pipeline)
        pipeline.state = tmp_project
        pipeline.skip_reference_images = True
        pipeline.skip_audio = True
        pipeline.skip_editor = True

        responses = {
            "agents.director.get_llm_for_agent": self._mock_llm(MOCK_DIRECTOR_RESPONSE),
            "agents.story_breakdown.get_llm_for_agent": self._mock_llm(MOCK_STORY_RESPONSE),
            "agents.character_bible.get_llm_for_agent": self._mock_llm(MOCK_CHARACTER_RESPONSE),
            "agents.environment_bible.get_llm_for_agent": self._mock_llm(MOCK_ENVIRONMENT_RESPONSE),
            "agents.cinematography.get_llm_for_agent": self._mock_llm(MOCK_CAMERA_RESPONSE),
            "agents.prompt_builder.get_llm_for_agent": self._mock_llm(MOCK_PROMPT_RESPONSE),
            "agents.qc.get_llm_for_agent": self._mock_llm(MOCK_QC_RESPONSE),
        }

        with (
            patch("agents.director.get_llm_for_agent", return_value=responses["agents.director.get_llm_for_agent"]),
            patch("agents.story_breakdown.get_llm_for_agent", return_value=responses["agents.story_breakdown.get_llm_for_agent"]),
            patch("agents.character_bible.get_llm_for_agent", return_value=responses["agents.character_bible.get_llm_for_agent"]),
            patch("agents.environment_bible.get_llm_for_agent", return_value=responses["agents.environment_bible.get_llm_for_agent"]),
            patch("agents.cinematography.get_llm_for_agent", return_value=responses["agents.cinematography.get_llm_for_agent"]),
            patch("agents.prompt_builder.get_llm_for_agent", return_value=responses["agents.prompt_builder.get_llm_for_agent"]),
            patch("agents.qc.get_llm_for_agent", return_value=responses["agents.qc.get_llm_for_agent"]),
            patch("core.video_client.VideoClient.generate", return_value="/tmp/mock_clip.mp4"),
        ):
            state = pipeline.run()

        # Check all non-skipped stages completed
        assert state.agents.director
        assert state.agents.story_breakdown
        assert state.agents.character_bible
        assert state.agents.environment_bible
        assert state.agents.cinematography
        assert state.agents.prompt_builder


# Allow running directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
