"""
core/utils.py
─────────────
Shared utility functions used across agents.
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import List


def slugify(text: str) -> str:
    """Convert a string to a safe filename slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "_", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text[:60]


def load_prompt_file(agent_name: str) -> str:
    """Load a system prompt from prompts/<agent_name>.md"""
    prompts_dir = Path(__file__).parent.parent / "prompts"
    path = prompts_dir / f"{agent_name}.md"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""


def ensure_dirs(*paths: str | Path) -> None:
    """Create directories if they don't exist."""
    for p in paths:
        Path(p).mkdir(parents=True, exist_ok=True)


def scene_clip_path(clips_dir: str, scene_id: int) -> Path:
    return Path(clips_dir) / f"scene_{scene_id:02d}.mp4"


def scene_storyboard_path(storyboards_dir: str, scene_id: int) -> Path:
    return Path(storyboards_dir) / f"scene_{scene_id:02d}_frame.png"


def scene_prompt_path(project_dir: str, scene_id: int) -> Path:
    prompts_dir = Path(project_dir) / "scene_prompts"
    prompts_dir.mkdir(parents=True, exist_ok=True)
    return prompts_dir / f"scene_{scene_id:02d}_prompt.txt"


def save_scene_prompt(project_dir: str, scene_id: int, prompt: str) -> Path:
    p = scene_prompt_path(project_dir, scene_id)
    p.write_text(prompt, encoding="utf-8")
    return p


def banner(title: str) -> None:
    """Print a formatted section banner."""
    width = 60
    print(f"\n{'═' * width}")
    print(f"  🎬  {title}")
    print(f"{'═' * width}\n")


def step(msg: str) -> None:
    print(f"  ▶  {msg}")


def ok(msg: str) -> None:
    print(f"  ✅ {msg}")


def warn(msg: str) -> None:
    print(f"  ⚠️  {msg}")


def error(msg: str) -> None:
    print(f"  ❌ {msg}")
