#!/usr/bin/env python3
"""
scripts/agy.py
───────────────
CLI entry point for the AI Film Production Pipeline.

Usage:
    python scripts/agy.py init   --name "my_story" --story "A robot wakes up..."
    python scripts/agy.py init   --name "my_story" --story-file story.txt
    python scripts/agy.py run    --project projects/my_story/project.json
    python scripts/agy.py stage  --project projects/my_story/project.json --stage director
    python scripts/agy.py reset  --project projects/my_story/project.json --stage video
    python scripts/agy.py status --project projects/my_story/project.json
    python scripts/agy.py list
"""

from __future__ import annotations

import sys
import os

# Allow imports from parent directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

from core.project import ProjectState
from core.pipeline import Pipeline
from core.utils import slugify

app = typer.Typer(
    name="agy",
    help="🎬 AI Film Production Pipeline CLI",
    add_completion=False,
)
console = Console()


# ─────────────────────────────────────────────────────────────
# init
# ─────────────────────────────────────────────────────────────

@app.command()
def init(
    name: str = typer.Option(..., "--name", "-n", help="Project name"),
    story: str = typer.Option("", "--story", "-s", help="Story text"),
    story_file: str = typer.Option("", "--story-file", "-f", help="Path to story text file"),
    duration: int = typer.Option(30, "--duration", "-d", help="Target duration in seconds"),
    platform: str = typer.Option("instagram_reel", "--platform", "-p",
                                  help="Platform: instagram_reel | youtube_short | cinematic | ad"),
    style: str = typer.Option("cinematic", "--style", help="Visual style"),
    tone: str = typer.Option("", "--tone", help="Emotional tone"),
    base_dir: str = typer.Option(".", "--dir", help="Base directory for projects"),
):
    """Initialize a new film production project."""
    if not story and not story_file:
        console.print("[red]Error: Provide either --story or --story-file[/red]")
        raise typer.Exit(1)

    if story_file:
        story = Path(story_file).read_text(encoding="utf-8")

    project_name = slugify(name)
    base = Path(base_dir).resolve()

    console.print(Panel(
        f"[bold]Creating project:[/bold] {project_name}\n"
        f"Duration: {duration}s  |  Platform: {platform}  |  Style: {style}",
        title="🎬 AI Film Production Pipeline",
        border_style="blue",
    ))

    state = ProjectState.create(
        project_name=project_name,
        story=story,
        base_dir=base,
        duration=duration,
        platform=platform,
        style=style,
        tone=tone,
    )

    console.print(f"[green]✅ Project created:[/green] {state.project_dir}")
    console.print(f"\nNext step:")
    console.print(f"  [cyan]python scripts/agy.py run --project {state.project_dir}/project.json[/cyan]")


# ─────────────────────────────────────────────────────────────
# create / studio (interactive producer mode)
# ─────────────────────────────────────────────────────────────

@app.command(name="create")
def interactive_create(
    base_dir: str = typer.Option(".", "--dir", help="Base directory for projects"),
):
    """🎬 Interactive Producer Mode — Give a rough idea, enhance it, and auto-produce the film!"""
    from core.llm import get_llm_for_agent

    console.print(Panel.fit(
        "[bold cyan]🎬 AI Film Production Studio — Interactive Producer Mode[/bold cyan]\n"
        "[dim]Give a rough story or opening prompt, and the AI will enhance the script\n"
        "and automatically direct, generate bibles, prompt, and assemble your video.[/dim]",
        border_style="magenta",
    ))

    # 1. Ask for rough story
    console.print("\n[bold yellow]Step 1: What is your rough story or video idea?[/bold yellow]")
    rough_story = typer.prompt("💡 Story / Idea")

    if not rough_story.strip():
        console.print("[red]Story idea cannot be empty.[/red]")
        raise typer.Exit(1)

    # 2. Ask for settings with smart defaults
    console.print("\n[bold yellow]Step 2: Production Settings[/bold yellow]")
    default_name = slugify(rough_story[:30])
    project_name_input = typer.prompt("📁 Project Name", default=default_name)
    project_name = slugify(project_name_input) or default_name

    duration = typer.prompt("⏱️  Target Duration (seconds)", default=30, type=int)
    platform = typer.prompt("📱 Platform (instagram_reel / youtube_short / tiktok / cinematic)", default="instagram_reel")
    style = typer.prompt("🎨 Visual Style", default="cinematic, atmospheric, photorealistic, 8k")
    tone = typer.prompt("🎭 Emotional Tone", default="epic, melancholic, hopeful")

    # 3. Enhance story using LLM
    console.print("\n[cyan]🧠 Enhancing rough story into a cinematic screenplay…[/cyan]")
    llm = get_llm_for_agent("director")

    enhance_prompt = (
        "You are an award-winning Hollywood screenwriter and short-form video director. "
        "Take this rough story idea and enhance it into a vivid, visually compelling 3-act narrative "
        f"specifically calibrated for a {duration}-second {platform} video. "
        "Write 3-5 concise, evocative sentences packed with rich visual actions, lighting, and clear emotion. "
        "Do NOT write scene numbers or screenplay formatting — write a flowing, cinematic story paragraph."
    )

    try:
        enhanced_story = llm.complete(enhance_prompt, f"Rough Story Idea:\n{rough_story}")
    except Exception as e:
        console.print(f"[yellow]Story enhancement warning ({e}) — using original story.[/yellow]")
        enhanced_story = rough_story

    # 4. Show Enhanced Story
    console.print("\n" + "=" * 60)
    console.print(Panel(
        f"[bold green]Enhanced Cinematic Story:[/bold green]\n\n{enhanced_story}\n\n"
        f"[dim]Project: {project_name} | Duration: {duration}s | Platform: {platform} | Style: {style}[/dim]",
        title="🎬 Producer Review",
        border_style="green",
    ))
    console.print("=" * 60 + "\n")

    # 5. Confirm and Launch
    proceed = typer.confirm("🚀 Launch the full 11-agent production pipeline now?", default=True)
    if not proceed:
        console.print("[yellow]Project aborted. You can run 'agy init' manually when ready.[/yellow]")
        return

    # Create project state
    base = Path(base_dir).resolve()
    state = ProjectState.create(
        project_name=project_name,
        story=enhanced_story,
        base_dir=base,
        duration=duration,
        platform=platform,
        style=style,
        tone=tone,
    )

    console.print(f"\n[green]✅ Project initialized at: {state.project_dir}[/green]\n")

    # Launch Pipeline
    pipeline = Pipeline(state.project_file)
    pipeline.run()

    console.print(Panel.fit(
        f"[bold green]🎉 Film Production Complete![/bold green]\n"
        f"Project: {state.project_dir}\n"
        f"Final Reel: {state.final_reel_path or 'Ready in clips/ directory'}",
        border_style="green",
    ))


# ─────────────────────────────────────────────────────────────
# run (full pipeline)
# ─────────────────────────────────────────────────────────────

@app.command()
def run(
    project: str = typer.Option(..., "--project", "-p", help="Path to project.json"),
    skip_references: bool = typer.Option(False, "--skip-references", help="Skip reference image generation"),
    skip_audio: bool = typer.Option(False, "--skip-audio", help="Skip audio generation"),
    skip_editor: bool = typer.Option(False, "--skip-editor", help="Skip final assembly"),
):
    """Run the full production pipeline."""
    project_path = Path(project)
    if not project_path.exists():
        console.print(f"[red]project.json not found: {project}[/red]")
        raise typer.Exit(1)

    pipeline = Pipeline(
        project_path,
        skip_reference_images=skip_references,
        skip_audio=skip_audio,
        skip_editor=skip_editor,
    )
    pipeline.run()


# ─────────────────────────────────────────────────────────────
# stage (run one agent)
# ─────────────────────────────────────────────────────────────

@app.command()
def stage(
    project: str = typer.Option(..., "--project", "-p", help="Path to project.json"),
    name: str = typer.Option(..., "--stage", "-s",
                              help="Stage: director | story | character | environment | "
                                   "references | cinematography | prompts | video | qc | audio | editor"),
):
    """Run a single pipeline stage."""
    project_path = Path(project)
    if not project_path.exists():
        console.print(f"[red]project.json not found: {project}[/red]")
        raise typer.Exit(1)

    pipeline = Pipeline(project_path)
    pipeline.run_stage(name)


# ─────────────────────────────────────────────────────────────
# reset (mark stage as incomplete)
# ─────────────────────────────────────────────────────────────

@app.command()
def reset(
    project: str = typer.Option(..., "--project", "-p", help="Path to project.json"),
    name: str = typer.Option(..., "--stage", "-s", help="Stage name to reset"),
):
    """Reset a stage so it will re-run."""
    pipeline = Pipeline(Path(project))
    pipeline.reset_stage(name)
    console.print(f"[yellow]Stage '{name}' reset.[/yellow]")


# ─────────────────────────────────────────────────────────────
# status
# ─────────────────────────────────────────────────────────────

@app.command()
def status(
    project: str = typer.Option(..., "--project", "-p", help="Path to project.json"),
):
    """Show the current pipeline status for a project."""
    state = ProjectState.load(project)

    console.print(Panel(
        f"[bold]{state.project_name}[/bold]  (ID: {state.project_id})\n"
        f"Story: {state.story[:80]}…\n"
        f"Duration: {state.target_duration_seconds}s  |  "
        f"Platform: {state.platform}  |  "
        f"Style: {state.style}",
        title="📋 Project Status",
        border_style="blue",
    ))

    # Agent status table
    table = Table(title="Pipeline Stages", show_header=True)
    table.add_column("Stage", style="cyan")
    table.add_column("Status", justify="center")

    stages = [
        ("Director",          state.agents.director),
        ("Story Breakdown",   state.agents.story_breakdown),
        ("Character Bible",   state.agents.character_bible),
        ("Environment Bible", state.agents.environment_bible),
        ("Reference Images",  state.agents.reference_images),
        ("Cinematography",    state.agents.cinematography),
        ("Prompt Builder",    state.agents.prompt_builder),
        ("Video Generation",  state.agents.video_generation),
        ("QC",                state.agents.qc),
        ("Audio",             state.agents.audio),
        ("Editor",            state.agents.editor),
    ]

    for stage_name, done in stages:
        table.add_row(stage_name, "✅" if done else "⬜")

    console.print(table)

    # Scene status
    if state.scenes:
        scene_table = Table(title="Scenes", show_header=True)
        scene_table.add_column("ID", justify="center")
        scene_table.add_column("Duration", justify="center")
        scene_table.add_column("Emotion")
        scene_table.add_column("Location")
        scene_table.add_column("Clip")
        scene_table.add_column("QC")

        for s in state.scenes:
            scene_table.add_row(
                str(s.scene_id),
                f"{s.duration_seconds}s",
                s.emotion,
                s.location_id,
                "✅" if s.clip_path else "⬜",
                ("✅" if s.qc_passed else "❌") if s.qc_passed is not None else "⬜",
            )
        console.print(scene_table)

    if state.final_reel_path:
        console.print(f"\n[green bold]Final Reel:[/green bold] {state.final_reel_path}")


# ─────────────────────────────────────────────────────────────
# list projects
# ─────────────────────────────────────────────────────────────

@app.command(name="list")
def list_projects(
    base_dir: str = typer.Option(".", "--dir", help="Base directory to search"),
):
    """List all projects in the base directory."""
    base = Path(base_dir).resolve() / "projects"
    if not base.exists():
        console.print("[yellow]No projects directory found.[/yellow]")
        return

    table = Table(title=f"Projects in {base}")
    table.add_column("Name")
    table.add_column("Duration", justify="center")
    table.add_column("Platform")
    table.add_column("Scenes", justify="center")
    table.add_column("Final Reel")

    for project_dir in sorted(base.iterdir()):
        proj_file = project_dir / "project.json"
        if proj_file.exists():
            try:
                state = ProjectState.load(proj_file)
                table.add_row(
                    state.project_name,
                    f"{state.target_duration_seconds}s",
                    state.platform,
                    str(len(state.scenes)),
                    "✅" if state.final_reel_path else "⬜",
                )
            except Exception as e:
                table.add_row(str(project_dir.name), "—", "—", "—", f"Error: {e}")

    console.print(table)


@app.command(name="rea")
def reverse_engineer(
    list_profiles: bool = typer.Option(False, "--list-profiles", "-l", help="List all reverse-engineered tool profiles"),
    profile: str = typer.Option("", "--profile", "-p", help="Show specific profile details"),
    analyze_url: str = typer.Option("", "--analyze-url", "-u", help="Capture and analyze a web bundle/tool URL via REA"),
    status: bool = typer.Option(False, "--status", help="Check REA installation and doctor diagnostics"),
):
    """🔬 Reverse Engineer Anything (REA) integration for AI Video Studio."""
    from core.rea_bridge import REABridge

    bridge = REABridge()

    if status:
        console.print(Panel(
            f"[bold cyan]REA (Reverse Engineer Anything) Engine Diagnostics[/bold cyan]\n"
            f"Binary path: {bridge.bin_path}\n"
            f"Installed Version: {bridge.get_version()}\n"
            f"Ready: {'✅ Yes' if bridge.is_available() else '❌ No'}",
            border_style="magenta",
        ))
        return

    if list_profiles or (not profile and not analyze_url):
        profiles = bridge.list_profiles()
        table = Table(title="🔬 Reverse-Engineered Intelligence Profiles", show_header=True, header_style="bold green")
        table.add_column("Profile ID", style="cyan")
        table.add_column("Tool Name", style="bold")
        table.add_column("Category", style="dim")
        table.add_column("Key Ingested Secret", style="yellow")

        for p_name in profiles:
            p_data = bridge.load_profile(p_name) or {}
            table.add_row(
                p_name,
                p_data.get("tool_name", p_name),
                p_data.get("category", "video_model"),
                p_data.get("provenance", "Extracted architecture"),
            )

        console.print(table)
        console.print("\n[dim]View a profile with: python scripts/agy.py rea --profile <profile_id>[/dim]\n")
        return

    if profile:
        p_data = bridge.load_profile(profile)
        if not p_data:
            console.print(f"[red]Profile '{profile}' not found.[/red]")
            raise typer.Exit(1)
        console.print(Panel(
            json.dumps(p_data, indent=2),
            title=f"🔬 Reverse-Engineered Knowledge: {p_data.get('tool_name', profile)}",
            border_style="cyan",
        ))
        return

    if analyze_url:
        console.print(f"[bold cyan]🔬 Triggering REA web capture for:[/bold cyan] {analyze_url}")
        evidence_path = Path("references/reverse_engineered") / "capture_temp.json"
        res = bridge.capture_browser_target(analyze_url, evidence_path)
        console.print(res)


@app.command(name="serve")
def serve_ui(
    host: str = typer.Option("0.0.0.0", "--host", "-h", help="Bind host address"),
    port: int = typer.Option(8000, "--port", "-p", help="Server port"),
):
    """🌐 Launch the CineStorm AI Autonomous Virtual Film Studio Web UI."""
    import uvicorn
    from web.app import app as web_app

    console.print(Panel(
        f"[bold cyan]🎬 CineStorm AI — Autonomous Virtual Film Studio[/bold cyan]\n"
        f"Server running at: [bold green]http://{host}:{port}[/bold green]\n"
        f"Realtime WebSocket Telemetry: [cyan]ws://{host}:{port}/ws[/cyan]\n"
        f"[dim]Press Ctrl+C to terminate the web server.[/dim]",
        border_style="cyan",
    ))
    uvicorn.run(web_app, host=host, port=port)


@app.command()
def providers():
    """Show all detected LLM providers and which model each agent will use."""
    from core.llm import get_router, AGENT_TIERS, get_llm_for_agent

    router = get_router()

    console.print(Panel(
        "[bold cyan]🔌 LLM Provider Auto-Detection[/bold cyan]\n"
        "Providers are tried in priority order. First key found wins.",
        border_style="cyan"
    ))

    # Provider table
    provider_table = Table(title="Available Providers", show_header=True, header_style="bold magenta")
    provider_table.add_column("Priority", style="dim", width=8)
    provider_table.add_column("Provider", width=16)
    provider_table.add_column("Status", width=10)
    provider_table.add_column("Env Var", style="dim")

    env_vars = {
        "omniroute":  ["OMNIROUTE_API_KEY", "OMNIROUTE_KEY"],
        "gemini":     ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
        "openrouter": ["OPENROUTER_API_KEY", "OPENROUTER_KEY"],
        "deepseek":   ["DEEPSEEK_API_KEY"],
        "qwen":       ["QWEN_CLOUD_API_KEY", "QWEN_API_KEY", "DASHSCOPE_API_KEY"],
        "nvidia_nim": ["NVIDIA_API_KEY", "NIM_API_KEY"],
        "openai":     ["OPENAI_API_KEY"],
        "huggingface":["HF_TOKEN", "HUGGINGFACE_API_KEY"],
    }

    import os
    for i, p in enumerate(router.available, 1):
        candidates = env_vars.get(p, [])
        is_active = any(os.getenv(k) for k in candidates) or (p == "huggingface")
        display_env = candidates[0] if candidates else "—"
        status = "✅ Active" if is_active else "⚠️  No key"
        provider_table.add_row(str(i), p, status, display_env)

    console.print(provider_table)
    console.print()

    # Agent routing table
    agent_table = Table(title="Agent → Model Routing", show_header=True, header_style="bold green")
    agent_table.add_column("Agent", width=20)
    agent_table.add_column("Tier", width=12)
    agent_table.add_column("Provider", width=14)
    agent_table.add_column("Model", style="dim")

    tier_colors = {
        "director": "bold magenta",
        "heavy": "red",
        "qwen_builder": "bold cyan",
        "medium": "yellow",
        "fast": "green",
        "ultra_fast": "blue",
    }

    for agent_name, tier in sorted(AGENT_TIERS.items()):
        provider, model = router.pick(tier)
        color = tier_colors.get(tier, "white")
        agent_table.add_row(
            agent_name,
            f"[{color}]{tier}[/{color}]",
            provider,
            model,
        )

    console.print(agent_table)

    console.print()
    heavy_p, heavy_m = router.pick("heavy")
    fast_p, fast_m = router.pick("fast")
    console.print(f"[bold]Best for complex tasks:[/bold] {heavy_p} / {heavy_m}")
    console.print(f"[bold]Best for fast tasks:[/bold]    {fast_p} / {fast_m}")
    console.print()
    console.print("[dim]Set keys in .env file — see .env.example for all options[/dim]")


if __name__ == "__main__":
    app()
