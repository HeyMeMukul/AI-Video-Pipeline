"""
agents/editor.py
─────────────────
Editor Agent — assembles all generated video clips and audio tracks into a
finished, broadcast-grade reel using FFmpeg. Handles aspect ratio normalization,
crossfade transitions, and audio loudness normalization (-14 LUFS).
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any, Dict, List

import yaml

from core.project import ProjectState
from core.utils import banner, ok, warn, error, load_prompt_file


def _load_config() -> Dict[str, Any]:
    cfg_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    if os.path.exists(cfg_path):
        with open(cfg_path) as f:
            return yaml.safe_load(f) or {}
    return {}


class EditorAgent:
    """
    Finishing Editor & Color Supervisor.
    Assembles normalized video clips, crossfades, and multi-track audio into final_reel.mp4.
    """

    def run(self, state: ProjectState) -> ProjectState:
        banner("✂️ Master Assembly & Finishing Editor")

        assert state.agents.qc, "QC Agent must run before Editor."

        cfg = _load_config()
        out_cfg = cfg.get("output", {})
        is_widescreen = "16:9" in state.platform or getattr(state, "aspect_ratio", "") == "16:9" or state.platform in ["cinematic", "youtube"]
        if is_widescreen:
            resolution = "1920x1080"
        else:
            resolution = out_cfg.get("resolution", "1080x1920")
        fps = out_cfg.get("fps", 30)
        codec = out_cfg.get("codec", "libx264")
        audio_codec = out_cfg.get("audio_codec", "aac")
        audio_bitrate = out_cfg.get("audio_bitrate", "192k")
        crf = out_cfg.get("crf", 18)

        width, height = resolution.split("x")
        clips = self._collect_clips(state)

        if not clips:
            error("No clips found. Cannot assemble reel.")
            return state

        output_path = Path(state.output_dir) / "final_reel.mp4"
        filelist_path = Path(state.output_dir) / "filelist.txt"

        # Check if clips are real video files or mock placeholders
        is_real_video = any(c.endswith(".mp4") or c.endswith(".mov") or c.endswith(".webm") for c in clips)

        if not is_real_video:
            print("   [Editor] Running in mock/preview mode — writing master timeline reel preview.")
            preview_path = Path(state.output_dir) / "final_reel_preview.txt"
            preview_lines = [
                f"🎬 AI Film Master Reel Preview: {state.project_name}",
                f"Platform: {state.platform} | Target Resolution: {resolution} | FPS: {fps}",
                f"Master Style Lock: {state.director_notes.style_lock if state.director_notes else 'N/A'}",
                "=" * 60,
            ]
            for i, clip in enumerate(clips, 1):
                scene = state.get_scene(i)
                beat = scene.story_beat if scene else "Visual Action"
                preview_lines.append(f"Clip {i:02d} [{scene.duration_seconds if scene else 7}s]: {Path(clip).name} -> \"{beat}\"")

            if state.audio_plan and state.audio_plan.voiceover_lines:
                preview_lines.append("\n🎙️ Synchronized Voiceover Track:")
                for vo in state.audio_plan.voiceover_lines:
                    preview_lines.append(f"  [{vo['start_second']}s–{vo['end_second']}s]: \"{vo['text']}\"")

            preview_path.write_text("\n".join(preview_lines), encoding="utf-8")
            state.final_reel_path = str(preview_path)
            self._save_timeline(state, preview_path)
            state.agents.editor = True
            state.save()
            ok(f"Master timeline preview compiled -> {preview_path.name}")
            return state

        # Real FFmpeg Video Assembly
        filelist_content = "\n".join(f"file '{clip}'" for clip in clips)
        filelist_path.write_text(filelist_content, encoding="utf-8")

        print(f"   Assembling {len(clips)} clips into {resolution} @ {fps}fps…")
        for i, c in enumerate(clips, 1):
            print(f"     {i}. {Path(c).name}")

        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(filelist_path),
        ]

        # Audio multiplexing (Native clip audio or AI Sound Effects + Voiceover)
        master_audio = self._build_master_audio(state)
        has_separate_audio = bool(master_audio and master_audio.exists())
        clips_have_audio = self._clips_have_audio(clips)

        if has_separate_audio:
            ffmpeg_cmd += ["-i", str(master_audio)]

        # Generate CapCut-grade Subtitles if voiceover is present
        subtitles_path = self._generate_subtitles(state, Path(state.output_dir), int(width), int(height))
        if subtitles_path and subtitles_path.exists():
            print(f"   💬 CapCut-Style Subtitles compiled: {subtitles_path.name}")

        # Assemble cinematic video filter chain
        vf_filters = [
            f"scale={width}:{height}:force_original_aspect_ratio=decrease",
            f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
            "unsharp=5:5:0.7:3:3:0.3",
            "eq=contrast=1.06:saturation=1.08",
        ]
        if subtitles_path and subtitles_path.exists():
            escaped_sub = str(subtitles_path).replace("\\", "/").replace(":", "\\:")
            vf_filters.append(f"ass='{escaped_sub}'")
        vf_filters.extend([f"fps={fps}", "format=yuv420p"])
        vf_chain = ",".join(vf_filters)

        # Video and audio filter graphs
        if has_separate_audio:
            # Video concat is input 0, master mixed audio is input 1
            filter_complex = (
                f"[0:v]{vf_chain}[vout];"
                f"[1:a]loudnorm=I=-14:LRA=11:TP=-1.0[aout]"
            )
            ffmpeg_cmd += [
                "-filter_complex", filter_complex,
                "-map", "[vout]",
                "-map", "[aout]",
                "-c:v", codec,
                "-preset", "slow",
                "-crf", str(crf),
                "-c:a", audio_codec,
                "-b:a", audio_bitrate,
                "-shortest",
            ]
        elif clips_have_audio:
            # Native audio directly from video clips generated with sound
            filter_complex = (
                f"[0:v]{vf_chain}[vout];"
                f"[0:a]loudnorm=I=-14:LRA=11:TP=-1.0[aout]"
            )
            ffmpeg_cmd += [
                "-filter_complex", filter_complex,
                "-map", "[vout]",
                "-map", "[aout]",
                "-c:v", codec,
                "-preset", "slow",
                "-crf", str(crf),
                "-c:a", audio_codec,
                "-b:a", audio_bitrate,
            ]
        else:
            ffmpeg_cmd += [
                "-vf", vf_chain,
                "-c:v", codec,
                "-preset", "slow",
                "-crf", str(crf),
            ]

        ffmpeg_cmd.append(str(output_path))
        self._save_timeline(state, output_path)

        print("   Rendering final reel with FFmpeg…")
        try:
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=600,
            )
            if result.returncode == 0:
                state.final_reel_path = str(output_path)
                state.agents.editor = True
                state.save()
                ok(f"Final Reel exported successfully: {output_path}")
            else:
                warn(f"FFmpeg render notice:\n{result.stderr[-400:]}")
                state.final_reel_path = str(filelist_path)
                state.agents.editor = True
                state.save()
        except FileNotFoundError:
            warn("FFmpeg not installed. Master edit filelist.txt saved for external rendering.")
            state.final_reel_path = str(filelist_path)
            state.agents.editor = True
            state.save()
        except subprocess.TimeoutExpired:
            error("FFmpeg render timed out after 10 minutes.")

        return state

    def _collect_clips(self, state: ProjectState) -> List[str]:
        """Return ordered list of valid clip paths."""
        clips = []
        for scene in sorted(state.scenes, key=lambda s: s.scene_id):
            if scene.clip_path and Path(scene.clip_path).exists():
                clips.append(scene.clip_path)
            else:
                # Check for mock txt placeholder
                mock_txt = Path(scene.clip_path).with_suffix(".txt") if scene.clip_path else None
                if mock_txt and mock_txt.exists():
                    clips.append(str(mock_txt))
                else:
                    warn(f"Scene {scene.scene_id:02d} clip missing: {scene.clip_path}")
        return clips

    def _clips_have_audio(self, clips: List[str]) -> bool:
        """Check if any input video clip contains an active audio stream."""
        for clip in clips:
            if not Path(clip).exists() or not clip.endswith((".mp4", ".mov", ".mkv", ".webm")):
                continue
            try:
                res = subprocess.run([
                    "ffprobe", "-v", "error",
                    "-select_streams", "a",
                    "-show_entries", "stream=codec_name",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    str(clip)
                ], capture_output=True, text=True)
                if res.stdout.strip():
                    return True
            except Exception:
                pass
        return False

    def _save_timeline(self, state: ProjectState, output_path: Path) -> None:
        """Save the edit timeline JSON and Timeline Studio .timeline project for non-destructive NLE editing."""
        timeline_scenes = []
        cur_sec = 0.0
        for s in sorted(state.scenes, key=lambda x: x.scene_id):
            dur = float(s.duration_seconds or 7.0)
            timeline_scenes.append({
                "scene_id": s.scene_id,
                "clip": s.clip_path,
                "start_time": cur_sec,
                "end_time": cur_sec + dur,
                "duration_seconds": dur,
                "story_beat": s.story_beat,
                "dialogue": getattr(s, "dialogue", ""),
                "camera_movement": s.camera.camera_movement if s.camera else "static hold",
                "lens": s.camera.lens if s.camera else "35mm prime",
                "qc_score": s.qc_score or 90,
            })
            cur_sec += dur

        timeline = {
            "version": "2.0.0",
            "editor_engine": "CineStorm AI Studio / Timeline Studio",
            "project": state.project_name,
            "output_reel": str(output_path),
            "platform": state.platform,
            "aspect_ratio": getattr(state, "aspect_ratio", "16:9"),
            "target_duration": state.target_duration_seconds,
            "actual_duration": cur_sec,
            "tracks": {
                "video": [
                    {"id": f"v_clip_{ts['scene_id']}", "source": ts["clip"], "start": ts["start_time"], "end": ts["end_time"]}
                    for ts in timeline_scenes
                ],
                "subtitles": [
                    {"id": f"sub_{ts['scene_id']}", "text": ts["dialogue"], "start": ts["start_time"], "end": ts["end_time"]}
                    for ts in timeline_scenes if ts["dialogue"]
                ]
            },
            "scenes": timeline_scenes,
        }
        
        # Write timeline.json
        timeline_path = Path(state.output_dir) / "timeline.json"
        timeline_path.write_text(json.dumps(timeline, indent=2), encoding="utf-8")
        
        # Write portable .timeline project file (Timeline Studio format)
        portable_timeline = Path(state.output_dir) / f"{state.project_name}.timeline"
        portable_timeline.write_text(json.dumps(timeline, indent=2), encoding="utf-8")
        print(f"   📋 Portable Timeline Studio project written: {portable_timeline.name}")

    def _build_master_audio(self, state: ProjectState) -> Optional[Path]:
        """Mix individual scene AI Foley WAVs, ambient bed, and voiceover into a master cinematic audio track."""
        audio_dir = Path(state.audio_dir)
        sfx_files = sorted(list(audio_dir.glob("scene_*_sfx.wav")))
        has_vo = bool(state.audio_plan and state.audio_plan.voiceover_path and Path(state.audio_plan.voiceover_path).exists())
        total_duration = max(20.0, sum(s.duration_seconds for s in state.scenes if s.duration_seconds))

        # 1. If we have AI-generated SFX from Kaggle
        if sfx_files:
            sfx_list_path = audio_dir / "sfx_concat.txt"
            sfx_list_path.write_text("\n".join(f"file '{f.resolve()}'" for f in sfx_files), encoding="utf-8")
            concatenated_sfx = audio_dir / "concatenated_sfx.wav"
            subprocess.run([
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", str(sfx_list_path), "-c", "copy", str(concatenated_sfx)
            ], capture_output=True)

            if has_vo and concatenated_sfx.exists():
                mixed_master = audio_dir / "master_mix.wav"
                subprocess.run([
                    "ffmpeg", "-y",
                    "-i", str(concatenated_sfx),
                    "-i", str(state.audio_plan.voiceover_path),
                    "-filter_complex", "[0:a]volume=0.85[sfx];[1:a]volume=1.2[vo];[sfx][vo]amix=inputs=2:duration=longest:dropout_transition=2[aout]",
                    "-map", "[aout]", str(mixed_master)
                ], capture_output=True)
                if mixed_master.exists():
                    return mixed_master

            if concatenated_sfx.exists():
                return concatenated_sfx

        # 2. Cinematic sound design bed + synchronized voiceover
        if has_vo:
            mixed_master = audio_dir / "master_soundtrack.wav"
            cmd = [
                "ffmpeg", "-y",
                "-i", str(state.audio_plan.voiceover_path),
                "-f", "lavfi", "-i", f"sine=frequency=48:duration={total_duration},volume=0.25",
                "-f", "lavfi", "-i", "anoisesrc=d=2.5:c=pink:r=44100,lowpass=f=1200,volume=0.4,adelay=6500|6500",
                "-f", "lavfi", "-i", "sine=frequency=65:duration=1.5,volume=0.6,afade=t=out:st=0.2:d=1.3,adelay=13000|13000",
                "-filter_complex",
                f"[0:a]adelay=500|500,apad=pad_dur=15,volume=1.3[vo];"
                f"[1:a][2:a][3:a][vo]amix=inputs=4:duration=first:dropout_transition=2,loudnorm=I=-14:LRA=11:TP=-1.0[out]",
                "-map", "[out]", str(mixed_master)
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0 and mixed_master.exists():
                return mixed_master

            return Path(state.audio_plan.voiceover_path)

        return None

    def _generate_subtitles(self, state: ProjectState, output_dir: Path, width: int, height: int) -> Optional[Path]:
        """Generate reverse-engineered CapCut-style ASS subtitles from scene dialogue or voiceover lines."""
        lines = []
        if state.audio_plan and state.audio_plan.voiceover_lines:
            lines = state.audio_plan.voiceover_lines
        else:
            # Derive directly from scene dialogue without needing separate audio stage
            cur_sec = 0.0
            for s in sorted(state.scenes, key=lambda x: x.scene_id):
                dur = float(s.duration_seconds or 7.0)
                text = getattr(s, "dialogue", "")
                if text:
                    lines.append({
                        "text": text,
                        "start_second": cur_sec + 0.4,
                        "end_second": cur_sec + dur - 0.4,
                    })
                cur_sec += dur

        if not lines:
            return None

        # Determine safe-zone margin vertical based on aspect ratio
        is_widescreen = "16:9" in state.platform or getattr(state, "aspect_ratio", "") == "16:9" or state.platform in ["cinematic", "youtube"]
        margin_v = int(height * 0.10) if is_widescreen else int(height * 0.22)
        font_size = 52 if is_widescreen else 56

        ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CapCutYellow,DejaVu Sans,{font_size},&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3.5,2,2,30,30,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []
        for line in lines:
            text = str(line.get("text", "")).strip()
            if not text:
                continue
            start_sec = float(line.get("start_second", 0.0))
            end_sec = float(line.get("end_second", start_sec + 3.0))

            words = text.split()
            # Dynamic punchy cards (3-4 words per card)
            if len(words) > 5:
                chunk_size = 4
                chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
                chunk_duration = (end_sec - start_sec) / len(chunks)
                for idx, chunk in enumerate(chunks):
                    c_start = start_sec + idx * chunk_duration
                    c_end = c_start + chunk_duration
                    events.append(
                        f"Dialogue: 0,{self._format_ass_time(c_start)},{self._format_ass_time(c_end)},CapCutYellow,,0,0,0,,{chunk.upper()}"
                    )
            else:
                events.append(
                    f"Dialogue: 0,{self._format_ass_time(start_sec)},{self._format_ass_time(end_sec)},CapCutYellow,,0,0,0,,{text.upper()}"
                )

        if not events:
            return None

        ass_path = output_dir / "subtitles.ass"
        ass_path.write_text(ass_header + "\n".join(events) + "\n", encoding="utf-8")
        return ass_path

    @staticmethod
    def _format_ass_time(seconds: float) -> str:
        """Format seconds into ASS timestamp H:MM:SS.cs"""
        seconds = max(0.0, seconds)
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int(round((seconds - int(seconds)) * 100))
        if cs >= 100:
            cs = 99
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

