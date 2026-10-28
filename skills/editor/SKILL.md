---
name: editor-agent
description: >
  Professional video editing and FFmpeg technical knowledge for the
  AI Film Production Pipeline. Covers editorial workflow, transition
  design, color grading, audio mixing, and platform export specifications
  with complete FFmpeg command references.
---

# ✂️ Editor Agent — Professional SKILL Guide

## Who You Are

You are the **Post-Production Supervisor** — the professional who takes all generated clips, audio tracks, and project assets and assembles them into the final, polished deliverable.

In film production, the editor is the last creative voice. They have the power to change the entire feel of a film through pacing, transition choices, and audio-visual relationship. But in this pipeline, your job is disciplined assembly — the creative decisions were already made upstream. Your job is to execute them precisely and technically.

Think like: **Walter Murch** (surgical precision, audio-first thinking) meets **a senior colorist** (technically exacting, visually consistent).

> "The first cut is the one that hurts." — Walter Murch  
> (meaning: your first attempt will have problems — expect to iterate)

---

## Core Principle: Technical Precision Before Creativity

Every clip must be normalized to identical technical specs before assembly. A single clip with a different frame rate, resolution, or codec will corrupt the entire output. Do NOT attempt to concatenate clips without pre-normalization.

**The Pre-Assembly Normalization Checklist:**
```
✅ All clips are the same resolution
✅ All clips are the same frame rate  
✅ All clips are the same codec (H.264 or H.265)
✅ All clips have no corrupted frames (validated by ffprobe)
✅ Audio tracks are normalized to consistent levels
```

---

## Step 1: Pre-Normalization (Run on Every Clip)

Before any editing operation, normalize every clip to the project's technical spec.

### Probe Clip Before Processing

Always probe a clip before touching it. Never assume it's valid:

```bash
# Full clip inspection
ffprobe -v quiet -print_format json -show_streams -show_format input.mp4

# Quick check: resolution, fps, codec, duration
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,codec_name,duration \
  -of csv=p=0 input.mp4

# Check audio loudness
ffmpeg -i input.mp4 -af loudnorm=print_format=summary -f null - 2>&1
```

**What to look for in ffprobe output:**
```
width/height:     Must match target (e.g., 1080×1920 for 9:16)
r_frame_rate:     Must match target (e.g., "30/1" for 30fps)
codec_name:       Should be h264 or h265
duration:         Must be within ±1.5 seconds of scene target
```

### Normalize a Single Clip

```bash
# Normalize to 1080×1920 (9:16 portrait), 30fps, H.264
ffmpeg -y -i input.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,\
       pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,\
       fps=30" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -c:a aac -b:a 192k \
  output_normalized.mp4

# Normalize to 1920×1080 (16:9 landscape), 24fps, H.264
ffmpeg -y -i input.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,\
       pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,\
       fps=24" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.2 \
  -c:a aac -b:a 192k \
  output_normalized.mp4
```

**CRF Quality Guide:**
```
CRF 14–16:   Near-lossless, very large file — for archiving only
CRF 17–18:   Very high quality — use for intermediate files
CRF 18–23:   Good quality — standard for delivery
CRF 24–28:   Lower quality — acceptable for preview drafts only
CRF 28+:     Poor quality — never use for final delivery
```

### Batch Normalize All Clips

```python
# In editor.py — normalize all clips before assembly
def normalize_clips(self) -> list[Path]:
    normalized = []
    for scene in self.state.scenes:
        if not scene.clip_path or not Path(scene.clip_path).exists():
            continue
        
        output_path = Path(self.state.project_dir) / "clips" / f"scene_{scene.scene_id}_norm.mp4"
        
        cmd = [
            "ffmpeg", "-y", "-i", scene.clip_path,
            "-vf", f"scale={self.width}:{self.height}:force_original_aspect_ratio=decrease,"
                   f"pad={self.width}:{self.height}:(ow-iw)/2:(oh-ih)/2:color=black,"
                   f"fps={self.fps}",
            "-c:v", "libx264", "-preset", "slow", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k",
            str(output_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            normalized.append(output_path)
        else:
            log_error(f"Normalization failed for scene {scene.scene_id}: {result.stderr}")
    
    return normalized
```

---

## Step 2: Assembly — Concatenation

### Method 1: Concat Demuxer (Fastest — No Re-encode)

Use when all clips are already identical spec (after normalization):

```bash
# Create file list
echo "file '/absolute/path/to/scene_1_norm.mp4'" > /tmp/filelist.txt
echo "file '/absolute/path/to/scene_2_norm.mp4'" >> /tmp/filelist.txt
echo "file '/absolute/path/to/scene_3_norm.mp4'" >> /tmp/filelist.txt

# Concatenate without re-encoding (ultra fast)
ffmpeg -y -f concat -safe 0 -i /tmp/filelist.txt -c copy assembled.mp4
```

**Use this method when:**
- All clips are exactly the same codec, resolution, frame rate (guaranteed after normalization)
- You don't need transitions between clips (hard cuts only)
- Speed matters

### Method 2: Re-encode Concatenation (With Filter Complex)

Use when you need transitions or are not certain of identical specs:

```bash
# Hard cuts with re-encode (most compatible)
ffmpeg -y -f concat -safe 0 -i filelist.txt \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,\
       pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,fps=30" \
  -c:v libx264 -preset slow -crf 18 \
  -c:a aac -b:a 192k \
  assembled.mp4
```

---

## Step 3: Transitions

### Transition Type Guide

**Hard Cut (no transition)**
- Instant — zero duration
- Use when: energy is high, clear visual match between clips, fast-paced narrative
- AI video use: when consecutive clips share similar framing/color, hard cuts work well
- When to avoid: significant visual discontinuity between clips (color, framing, character position)

**Cross-Dissolve / Fade-Crossfade**
- Gradual blend from outgoing to incoming clip
- Duration: 0.3–1.5 seconds (short = snappy; long = dreamy)
- Use when: time passes, emotional shift, slight location change, mood transition
- **Best default for AI video** — hides visual inconsistency at the cut point
- AI video use: ALWAYS use crossfade when consecutive clips have different lighting or camera angle

**Fade to Black / Fade from Black**
- Gradual to/from pure black
- Duration: 0.5–1.5 seconds
- Use when: major act break, chapter change, video opening, video ending
- AI video use: at the very start and very end of the reel

**L-Cut (audio leads video)**
- Incoming audio starts before incoming video appears
- Creates: seamless, professional feel, continuity
- AI video use: start next scene's ambient sound 0.5–1s before video switch

**J-Cut (audio trails video)**
- Outgoing audio continues after incoming video begins
- Creates: continuity, prevents jarring silence, bridges emotional gap
- AI video use: let the voiceover or music tail naturally into the next scene

### Implementing Crossfade in FFmpeg

**Two clips with 1-second crossfade:**
```bash
ffmpeg -y -i clip1.mp4 -i clip2.mp4 \
  -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=1.0:offset=6[v];\
   [0:a][1:a]acrossfade=d=1.0[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -crf 18 -c:a aac -b:a 192k \
  output.mp4
```

**Three clips with 0.5-second crossfade each:**
```bash
# clip1=8s, clip2=8s, clip3=8s, 0.5s overlap
# offset for second xfade = (8 - 0.5) + (8 - 0.5) = 15.0
ffmpeg -y -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 \
  -filter_complex "
    [0:v][1:v]xfade=transition=fade:duration=0.5:offset=7.5[v01];
    [v01][2:v]xfade=transition=fade:duration=0.5:offset=15.0[vout];
    [0:a][1:a]acrossfade=d=0.5[a01];
    [a01][2:a]acrossfade=d=0.5[aout]
  " \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -crf 18 -c:a aac -b:a 192k \
  output.mp4
```

**Fade in from black (opening):**
```bash
ffmpeg -y -i input.mp4 \
  -vf "fade=t=in:st=0:d=1.0" \
  -c:v libx264 -crf 18 -c:a copy \
  output_fadein.mp4
```

**Fade out to black (ending):**
```bash
# For a 30s video, start fade at 28.5s for 1.5s fade
ffmpeg -y -i input.mp4 \
  -vf "fade=t=out:st=28.5:d=1.5" \
  -c:v libx264 -crf 18 -c:a copy \
  output_fadeout.mp4
```

---

## Step 4: Audio Mixing

### Add Voiceover Over Video

```bash
# Replace or add voiceover to video (VO + original ambient audio)
ffmpeg -y -i video.mp4 -i voiceover.mp3 \
  -filter_complex \
  "[0:a]volume=0.15[orig];
   [1:a]volume=1.0[vo];
   [orig][vo]amix=inputs=2:duration=first:weights=0.15 1[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac -b:a 192k \
  output_with_vo.mp4
```

### Add Background Music Under VO

```bash
# Video has VO already — add music underneath (ducked)
ffmpeg -y -i video_with_vo.mp4 -i background_music.mp3 \
  -filter_complex \
  "[0:a]volume=1.0[vo_channel];
   [1:a]volume=0.25[music_ducked];
   [vo_channel][music_ducked]amix=inputs=2:duration=first[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac -b:a 192k \
  output_mixed.mp4
```

### Three-Track Mix (VO + Music + SFX)

```bash
ffmpeg -y -i video.mp4 -i voiceover.mp3 -i music.mp3 -i sfx_ambient.mp3 \
  -filter_complex \
  "[1:a]volume=1.0[vo];
   [2:a]volume=0.22[music];
   [3:a]volume=0.4[sfx];
   [vo][music][sfx]amix=inputs=3:duration=first:weights=1 0.22 0.4[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac -b:a 192k \
  output_3track.mp4
```

---

## Step 5: Audio Normalization to -14 LUFS

**Social media standard: -14 LUFS integrated, -1 dBFS peak.**

### Single-Pass (Fast — Good for Social Media)

```bash
ffmpeg -y -i input.mp4 \
  -af "loudnorm=I=-14:TP=-1.0:LRA=11" \
  -c:v copy -c:a aac -b:a 192k \
  output_normalized.mp4
```

### Two-Pass (Accurate — Recommended for Final Output)

```bash
# Pass 1: Measure current loudness
ffmpeg -y -i input.mp4 \
  -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json \
  -f null - 2>&1 | tail -20
# Note the output: measured_I, measured_TP, measured_LRA, measured_thresh, offset

# Pass 2: Apply correction with measured values
ffmpeg -y -i input.mp4 \
  -af loudnorm=I=-14:TP=-1:LRA=11:\
measured_I=-18.2:measured_TP=-4.5:measured_LRA=8.3:measured_thresh=-28.1:offset=0.5:linear=true \
  -c:v copy -c:a aac -b:a 192k \
  output_final_normalized.mp4
```

---

## Step 6: Final Export by Platform

### Instagram Reels / TikTok (9:16, 30fps, H.264)

```bash
ffmpeg -y -i assembled_with_audio.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,\
       pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,fps=30" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -c:a aac -b:a 192k \
  -af "loudnorm=I=-14:TP=-1:LRA=11" \
  -movflags +faststart \
  final_reel.mp4
```

**`-movflags +faststart`** — moves MOOV atom to the start of the file so video starts playing immediately on upload. **Always include this.**

### YouTube Shorts (9:16, 30fps, H.264)

```bash
ffmpeg -y -i assembled_with_audio.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,\
       pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,fps=30" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.1 \
  -c:a aac -b:a 192k \
  -af "loudnorm=I=-14:TP=-1:LRA=11" \
  -movflags +faststart \
  final_shorts.mp4
```

### Cinematic 1080p (16:9, 24fps)

```bash
ffmpeg -y -i assembled_with_audio.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,\
       pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,fps=24" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.2 \
  -c:a aac -b:a 192k \
  -af "loudnorm=I=-14:TP=-1:LRA=11" \
  -movflags +faststart \
  final_cinematic.mp4
```

### Near-Lossless Archive (for post-production storage)

```bash
ffmpeg -y -i assembled_with_audio.mp4 \
  -c:v libx264 -preset veryslow -crf 14 \
  -c:a aac -b:a 320k \
  archive_master.mp4
```

---

## Step 7: Common FFmpeg Errors and Fixes

| Error Message | Root Cause | Fix |
|---|---|---|
| `Invalid data found when processing input` | Corrupted input file or wrong format assumed | Run `ffprobe input.mp4` — if it fails, regenerate the clip |
| `Trailing option(s) found in the command` | Options placed after output file | All `-flags` must come BEFORE the output filename |
| `width not divisible by 2` | Scale filter produced odd dimension | Add `scale=trunc(iw/2)*2:trunc(ih/2)*2` to vf chain |
| `Stream specifier matches no streams` | Input has no audio track | Add `-an` to skip audio, or check with ffprobe |
| `Moov atom not found` | Incomplete MP4 — file wasn't fully written | Regenerate the clip — it's corrupted |
| `Non monotonous DTS in output stream` | Timestamp inconsistency in concat | Add `-vsync vfr` flag |
| `Too many packets buffered` | Buffer overflow during concat | Add `-max_muxing_queue_size 9999` |
| `Audio and video have different timestamps` | A/V sync drift in source | Add `-async 1` for audio resync |
| `Error while opening encoder` | Codec not available | Check with `ffmpeg -codecs \| grep libx264` |
| `Conversion failed!` (generic) | Multiple possible causes | Read the stderr above this line for the real error |

---

## Editorial Decision Framework

### When to Use Each Transition

```
RULE 1: Default to crossfade (0.5s) between all AI video clips
  → AI clips have inherent visual inconsistency; crossfade smooths the seam

RULE 2: Use hard cut only when:
  → Both clips have very similar framing/color/camera angle
  → The story demands a sudden shift (shock, surprise, time jump)
  → Music has a strong beat at the exact cut point

RULE 3: Use fade to black:
  → At the very start (fade in from black) — 1.0s
  → At the very end (fade to black) — 1.5s
  → Between major story chapters (if video is over 45 seconds)

RULE 4: Never use more than one transition TYPE per video
  → Mixing crossfades and wipes and spins = amateur
  → Pick one and use it consistently
```

### Pacing by Director's Editing Style

```
Editing style from director_notes.editing:

"Slow cuts, 2.5–4 seconds per clip":
  → Total clip duration should be 2.5–4s visible (between transitions)
  → Crossfade duration: 0.5–1.0s
  → Total scene: 3–5s including transition

"Medium cuts, 1.5–3 seconds per clip":
  → Crossfade: 0.3–0.5s
  → Total scene with transition: 2–3.5s

"Fast cuts, <1 second":
  → Hard cuts only — no transitions
  → Music beat-sync cutting if possible
```

---

## Quality Checklist

Before exporting final reel:

- [ ] All input clips validated with ffprobe (no corruption)
- [ ] All clips normalized to identical resolution, fps, codec
- [ ] Assembly order matches scene order in project state
- [ ] Transitions match director's editing style
- [ ] Opening has fade-in from black (1.0s)
- [ ] Ending has fade-to-black (1.5s)
- [ ] Voiceover is mixed at -12 to -14 LUFS
- [ ] Music is ducked at -20 to -24 LUFS when VO is playing
- [ ] Final loudnorm applied: -14 LUFS integrated, -1 dBFS peak
- [ ] `-movflags +faststart` included in final export command
- [ ] CRF is 18 or lower for final delivery
- [ ] Output file plays from beginning without buffering delay
- [ ] `state.final_reel_path` updated with correct output path
- [ ] `state.save()` called after successful export

---

## The Editor's Pipeline Integration

```python
# editor.py workflow summary
def run(self, state: ProjectState) -> ProjectState:
    
    # 1. Collect all QC-passed clips in scene order
    clips = [s.clip_path for s in state.scenes 
             if s.qc_passed and s.clip_path and Path(s.clip_path).exists()]
    
    # 2. Normalize all clips to identical spec
    normalized = self.normalize_clips(clips)
    
    # 3. Assemble with transitions
    assembled = self.assemble(normalized, transition_type="crossfade", duration=0.5)
    
    # 4. Mix audio (VO + music)
    mixed = self.mix_audio(assembled, state.audio_plan)
    
    # 5. Apply final loudnorm
    normalized_audio = self.normalize_loudness(mixed, target_lufs=-14)
    
    # 6. Export for target platform
    final = self.export(normalized_audio, state.config.platform)
    
    # 7. Update state
    state.final_reel_path = str(final)
    state.agents.editor = True
    state.save()
    
    return state
```
