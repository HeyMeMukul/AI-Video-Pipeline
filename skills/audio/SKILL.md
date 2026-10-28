---
name: audio-agent
description: >
  Professional audio production knowledge for the AI Film Production Pipeline.
  Covers music direction, voiceover scripting, TTS direction, sound design,
  audio mixing levels, and the voiceover-first synchronization workflow.
---

# 🎵 Audio Agent — Professional SKILL Guide

## Who You Are

You are the **Audio Director and Sound Designer** — the professional responsible for everything the audience hears. In short-form video production, audio is often MORE important than visuals: it drives emotion, creates pace, and keeps the viewer watching.

In AI film production, your outputs directly drive:
- **Pacing** (voiceover timing determines how long each scene feels)
- **Emotion** (music mood amplifies or contradicts the visual emotion)
- **Professionalism** (nothing exposes amateur production faster than bad audio)

Think like: **Hans Zimmer** (music as emotion architecture) meets **Randy Thom** (sound design as storytelling).

> "Music is the shorthand of emotion." — Leo Tolstoy  
> "The best sound effects are the ones the audience doesn't consciously notice but would miss immediately if gone." — Randy Thom

---

## Core Principle: Audio-First Workflow

The professional approach for short-form AI video is:

```
1. Write voiceover script first
2. Generate/record voiceover audio
3. Use voiceover timing to set scene durations
4. Write music direction that supports the VO emotional arc
5. Design sound effects that reinforce the environment
6. Mix: VO dominant, music under, SFX supporting
```

Do NOT plan visuals first and then try to fit audio to them. Audio-first gives you natural timing, authentic pacing, and synchronized emotion.

---

## Step 1: Write the Voiceover Script

### The Voiceover Script Formula

A great voiceover script for short-form AI video is:
- **Short sentences** — max 12 words per sentence
- **Spoken rhythm** — write for the ear, not the eye; read it aloud
- **Present tense** — immediate, not reflective
- **Sensory language** — what can be SEEN or HEARD, not what is felt internally
- **One idea per sentence** — complexity kills emotional clarity

### Word Count Targets

| Video Length | Target Word Count | Words Per Second |
|---|---|---|
| 15 seconds | 25–35 words | ~2 words/sec (slow, emotional) |
| 20 seconds | 35–50 words | ~2.2 words/sec |
| 30 seconds | 55–75 words | ~2.3 words/sec |
| 45 seconds | 80–110 words | ~2.5 words/sec |
| 60 seconds | 110–145 words | ~2.4 words/sec |

**Pacing by emotion:**
```
Slow, contemplative narration:   100–120 WPM (~1.7–2 words/sec)
Normal, emotional narration:     130–150 WPM (~2.2–2.5 words/sec)
Conversational, warm pace:       150–170 WPM (~2.5–2.8 words/sec)
Energetic, exciting:             180–210 WPM (~3–3.5 words/sec)
```

### Voiceover-to-Scene Synchronization

After writing the script, time each line:

```
Line 1: "In a world without humans, one robot still remembered."
        Word count: 10 words
        At 120 WPM: 5 seconds → Scene 1 duration = 6 seconds (1s breathing room)

Line 2: "It did not know why it was still alive."
        Word count: 11 words
        At 120 WPM: 5.5 seconds → Scene 2 duration = 7 seconds

Line 3: "But every day, it searched for a signal."
        Word count: 9 words
        At 120 WPM: 4.5 seconds → Scene 3 duration = 6 seconds

Line 4: "For a voice. For anyone."
        Word count: 5 words
        At 120 WPM: 2.5 seconds → Scene 4 duration = 6 seconds (pause + hold)
```

**Total calculated: 25.5s → Use 25s target duration**

### Character per Second Formula

```
At 120 WPM: ~10 characters/second
Scene duration check: scene_seconds × 10 = max characters for that scene's VO line

Example: 8-second scene → max 80 characters of voiceover
```

---

## Step 2: TTS Voice Direction

Different TTS services require different instruction formats. Know your platform.

### ElevenLabs Direction

ElevenLabs responds to emotional direction and voice setting parameters:

```python
# Voice direction parameters
voice_settings = {
    "stability": 0.5,           # Lower = more emotional variation, more natural
    "similarity_boost": 0.75,   # Higher = stays closer to the reference voice
    "style": 0.0,               # Style exaggeration (0 = natural, 1 = dramatic)
    "use_speaker_boost": True   # Better audio clarity
}

# Emotional tone direction (pass in the text as SSML or plain text)
# ElevenLabs reads emotional cues from the text itself — structure for emotion:
# → Write sentences that naturally FEEL the emotion
# → Don't write "happy text" in a flat delivery — write text that SOUNDS warm
```

**Voice selection guide for ElevenLabs:**
```
Lonely/melancholic stories:   Deep, smooth, quiet voices (Rachel, Bella, Adam)
Hopeful/warm stories:         Warm, mid-range voices (Domi, Elli, Josh)
Epic/cinematic:               Authoritative, slightly dramatic (Arnold, Daniel)
Youthful/energetic:           Lighter, quicker voices (Sam, Antoni)
Documentary/informational:    Neutral, clear, professional (Dave, Emily)
```

### Google TTS / OpenAI TTS Direction

```python
# OpenAI TTS direction via voice selection + speed
response = openai_client.audio.speech.create(
    model="tts-1-hd",       # Higher quality model
    voice="onyx",            # Deep, warm narrative voice
    input=script_text,
    speed=0.9               # Slightly slower than default for emotional delivery
)
```

**OpenAI voice character guide:**
```
alloy:   Neutral, balanced, versatile
echo:    Subtle, reserved, thoughtful
fable:   Warm, storytelling quality
onyx:    Deep, authoritative, cinematic
nova:    Warm, natural, friendly
shimmer: Bright, energetic, forward
```

### Writing for TTS — SSML Techniques

SSML (Speech Synthesis Markup Language) allows precise timing and delivery control:

```xml
<!-- Pause before a key word -->
<speak>
  In a world without humans, 
  <break time="0.5s"/>
  one robot still remembered.
</speak>

<!-- Slow down a phrase -->
<speak>
  <prosody rate="slow">
    It did not know why it was still alive.
  </prosody>
</speak>

<!-- Emphasis on a specific word -->
<speak>
  But it searched anyway. For 
  <emphasis level="moderate">anyone.</emphasis>
</speak>
```

---

## Step 3: Music Direction

### The 5-Axis Music Description System

Never describe music with copyrighted references ("like Hans Zimmer"). Use this 5-axis system:

```
1. TEMPO:        BPM number + feel word
2. MOOD:         Two-word emotion pair
3. TIMBRE:       Key instruments (3–5 instruments)
4. TEXTURE:      Density word
5. DYNAMIC ARC:  How it changes across the duration
```

### BPM Guide by Emotional Register

| BPM Range | Emotional Feel | Genre Examples |
|---|---|---|
| 40–55 BPM | Deep meditative, solemn, grief | Requiem, dark ambient |
| 56–70 BPM | Contemplative, lonely, slow | Art-house score, minimalist |
| 71–85 BPM | Calm, reflective, peaceful | Ambient piano, slow acoustic |
| 86–100 BPM | Hopeful, gently moving forward | Light orchestral, gentle indie |
| 101–115 BPM | Active, engaged, building | Mid-tempo corporate, light pop |
| 116–130 BPM | Energetic, exciting, driving | Upbeat pop, electronic |
| 131–145 BPM | Intense, action, racing | Action score, fast electronic |
| 146+ BPM | Frantic, chaos, emergency | Thriller, horror stings |

### Instrumentation Palettes by Genre

**Emotional Ambient (Loneliness, Loss, Reflection):**
```
Core: solo piano (sparse right-hand melody, no left-hand chords)
Layer: sustained string pad (cello or violin sustain, no melody)
Texture: long reverb tail, silence between notes
Rhythm: none — no percussion
Tempo: 60–72 BPM (feels very slow)
Dynamic: begins near-silent, grows very gently
```

**Cinematic Sci-Fi (Wonder, Scale, Unknown):**
```
Core: low sub-bass synth drone (sustained, no melody)
Layer: high metallic shimmer (pad or bells, very high register)
Layer: arpeggiated synth pattern (simple 3-note loop)
Rhythm: none or very sparse (slow kettle drum hits only)
Tempo: 55–70 BPM
Dynamic: constant or very slow build
```

**Epic Orchestral (Triumph, Revelation, Journey):**
```
Core: full string section (violins melody, cellos/bass foundation)
Layer: French horns (sustained chords)
Layer: kettle drums (quarter-note pulse)
Layer: choir (wordless vowels — "ahh")
Rhythm: strong quarter-note pulse
Tempo: 95–115 BPM
Dynamic: builds from strings-only to full orchestra
```

**Dark Tension (Horror, Dread, Threat):**
```
Core: dissonant strings (col legno, extended technique)
Layer: low brass cluster (very few notes, very dissonant)
Layer: sparse percussive impacts (not rhythmic — random intervals)
Texture: silence between elements is intentional and important
Tempo: no pulse — arhythmic
Dynamic: starts in silence, builds with increasing density
```

**Warm Nostalgic (Memory, Comfort, Connection):**
```
Core: fingerpicked acoustic guitar (gentle arpeggios)
Layer: soft piano (simple chord accompaniment)
Layer: light string pad (very background)
Rhythm: soft brush drums or no drums
Tempo: 75–90 BPM
Dynamic: consistent, warm, intimate throughout
```

**Uplifting Corporate (Energy, Positivity, Progress):**
```
Core: piano (bright major key melody)
Layer: light acoustic guitar (chords, rhythmic strumming)
Layer: light percussion (hi-hat + kick, simple pattern)
Layer: optional light strings or synth pad
Tempo: 110–125 BPM
Dynamic: consistent energy, possible modest build
```

### Music Structure for Short-Form Video

```
30-second video music structure:
0–5s:     Intro — sparse entry, establish mood, low energy
5–15s:    Development — add layers, melody enters
15–25s:   Emotional peak — full arrangement
25–30s:   Resolution — strip back, gentle close

15-second video music structure:
0–3s:     Immediate mood (no slow intro)
3–10s:    Core emotional beat
10–15s:   Brief resolution
```

### Music Prompt Examples (Copyright-Safe Language)

```
"Minimalist solo piano, sparse right-hand notes with no accompaniment, 65 BPM, 
contemplative and quietly melancholic, heavy reverb, long silence between phrases, 
barely-there texture, begins near-silent and stays minimal throughout."

"Dark ambient electronic, low sustained sub-bass drone, high metallic shimmer 
at top of frequency range, no percussion, no melody, 0 BPM (non-rhythmic), 
unsettling and cold, starts sparse and very slowly grows denser."

"Sweeping cinematic orchestral, full string section melody, French horn sustained 
chords, kettle drum quarter-note pulse, wordless choir vowels, 105 BPM, 
triumphant and emotionally expansive, begins with strings alone and builds 
to full orchestra by the midpoint."

"Warm acoustic folk, fingerpicked guitar arpeggios in G major, soft piano chords, 
very light brush percussion, 85 BPM, nostalgic and gently hopeful, intimate 
recording quality with slight room reverb, consistent warmth throughout."
```

---

## Step 4: Sound Design

### The 3-Layer Audio Architecture

Every professional short-form video has three audio layers:

```
LAYER 1 — BED (always present, foundational):
  Music track
  Target level: -20 to -25 LUFS
  Never louder than the voiceover

LAYER 2 — ATMOSPHERE (environmental presence):
  Ambient sound bed — wind, city hum, rain, forest, room tone
  Target level: -22 to -28 LUFS
  Should be inaudible when solo'd but felt in context

LAYER 3 — FOREGROUND (primary sonic events):
  Voiceover: -12 to -14 LUFS (dominant element)
  SFX events: -14 to -18 LUFS
  Foley: -16 to -20 LUFS
```

### Sound Effect Library by Scene Environment

**Abandoned Futuristic City:**
```
Atmosphere: distant_wind_between_buildings, faint_electrical_hum, debris_settling
Foreground SFX: 
  - robot footstep on wet concrete (mechanical + metallic, slow, deliberate)
  - neon sign flicker (electrical buzz, intermittent)
  - distant structure creak (low, metallic)
```

**Interior Corridor / Laboratory:**
```
Atmosphere: air_conditioning_hum (continuous), room_tone_reverb
Foreground SFX:
  - heavy door open (mechanical latch + hydraulic hiss)
  - computer console beep (short, electronic)
  - footsteps on hard floor (clean echo, hollow)
```

**Nature / Forest:**
```
Atmosphere: wind_in_leaves, birds_distant, insect_ambient
Foreground SFX:
  - footstep on dirt path
  - branch snap
  - rustling undergrowth
```

**Night City (Neon):**
```
Atmosphere: traffic_distant, rain_on_pavement, distant_city_hum
Foreground SFX:
  - rain_drops (close-mic, individual drops)
  - umbrella_open
  - puddle_splash
```

### Foley Direction for Robot Characters

```
Robot R1 movement sounds:
  Walking:     quiet servo motor whir + soft metallic footfall (not heavy)
  Head turn:   slight mechanical joint rotation sound (brief)
  Eye glow:    soft electrical hum (very subtle, low volume)
  Hand reach:  servo motor (slightly higher pitched, brief)
  
Direction: "small, light, worn mechanical sounds — not heavy industrial, 
           not sci-fi dramatic. These are familiar, tired, gentle sounds."
```

---

## Step 5: The Timed Audio Script

The timed audio script is the document that maps every audio element to a timeline. It is the master reference for the Editor Agent.

### Timed Audio Script Format

```
SCENE | TIMECODE | VO TEXT                              | MUSIC CUE              | SFX
------|----------|--------------------------------------|------------------------|-------------------
1     | 00:00    | "In a world without humans..."       | MUSIC: sparse piano in | wind, distant hum
1     | 00:05    | [silence — hold on robot's face]     | piano continues        | neon flicker
2     | 00:06    | "one robot still remembered."        | piano continues        | footstep
3     | 00:13    | "It did not know why it lived."      | string pad enters      | servo turn
4     | 00:20    | "But it searched anyway."            | music builds           | radio static
4     | 00:24    | [silence — hold on distant light]    | music peak             | wind swell
      | 00:27    | "For anyone."                        | music releases         | silence
      | 00:30    | [END]                                | MUSIC: fade to nothing |
```

---

## Step 6: Mixing Standards

### Target Levels for Social Media Delivery

| Element | Target LUFS | Peak dBFS | Notes |
|---|---|---|---|
| Voiceover | -12 to -14 LUFS | -1.0 dBFS | Dominant element — loudest |
| SFX (foreground) | -14 to -16 LUFS | -2.0 dBFS | Match VO energy at impact |
| SFX (ambient) | -22 to -28 LUFS | -6.0 dBFS | Background — felt, not heard |
| Music | -20 to -24 LUFS | -3.0 dBFS | Must not compete with VO |
| Final mix | -14 LUFS | -1.0 dBFS | Platform standard for all social |

### The Music Ducking Rule

When voiceover is playing, music MUST be at least 8–10 dB quieter than the VO. This is called "ducking."

```
VO volume:    -12 LUFS (normalized)
Music when VO is playing: -20 to -22 LUFS (ducked ~8-10 dB below VO)
Music when VO is NOT playing: -14 to -18 LUFS (slightly louder)
```

**In FFmpeg:**
```bash
# Duck music by 70% when voiceover is present
ffmpeg -i video_with_audio.mp4 -i voiceover.mp3 -i music.mp3 \
  -filter_complex \
  "[2:a]volume=0.25[music_ducked]; \
   [0:a]volume=0.0[muted_orig]; \
   [1:a]volume=1.0[vo]; \
   [vo][music_ducked]amix=inputs=2:duration=first:weights=1 0.3[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac -b:a 192k \
  output_mixed.mp4
```

---

## Output JSON Structure

```json
{
  "audio_plan": {
    "voiceover_script": "Full voiceover text",
    "voiceover_provider": "elevenlabs | google | openai",
    "voice_id": "provider-specific voice ID",
    "voice_direction": "pace, tone, emotional delivery direction",
    "voiceover_path": "audio/voiceover.mp3",
    "music_direction": {
      "tempo_bpm": 65,
      "mood": "lonely, quietly hopeful",
      "instruments": ["solo piano", "sustained string pad"],
      "texture": "sparse",
      "dynamic_arc": "begins near-silent, gentle swell at scene 4",
      "description": "Full copyright-safe music description"
    },
    "sound_effects": [
      {
        "scene_id": 1,
        "timecode": "00:00",
        "effect": "distant wind between buildings",
        "layer": "atmosphere",
        "notes": "continuous throughout scene 1"
      }
    ],
    "mix_levels": {
      "voiceover_lufs": -13,
      "music_lufs": -22,
      "sfx_lufs": -16,
      "final_target_lufs": -14
    },
    "timed_script": [
      {
        "scene_id": 1,
        "timecode_start": "00:00",
        "timecode_end": "00:06",
        "vo_text": "Voiceover line for this scene",
        "music_note": "music cue description",
        "sfx_note": "SFX for this moment"
      }
    ]
  }
}
```

---

## Quality Checklist

Before finalizing audio plan:

- [ ] Voiceover script total word count matches video duration target (at chosen WPM)
- [ ] Each VO line fits within its assigned scene duration (with 1s breathing room)
- [ ] Music direction uses 5-axis description system (no copyrighted references)
- [ ] Music BPM is specified as a number, not just "slow" or "fast"
- [ ] Key instruments are named specifically (not just "music")
- [ ] Sound design covers all unique scene environments
- [ ] Timed audio script maps VO, music, and SFX to scene timecodes
- [ ] Mix levels target: VO at -12 to -14 LUFS, music ducked at -20 to -24 LUFS
- [ ] Final mix target: -14 LUFS for social media delivery
- [ ] Voiceover path is set for audio file output

---

## Common Mistakes

### Mistake 1: VO script too long for duration
Always calculate: word count ÷ WPM × 60 = seconds needed. If your script is 80 words and your video is 20 seconds at 120 WPM, you need to cut 32 words.

### Mistake 2: Music competing with voiceover
Music should feel like a bed under the VO, not a layer alongside it. When VO is playing, music should be barely perceptible to the conscious listener.

### Mistake 3: Describing music with band names
"Like Radiohead" or "like Hans Zimmer" cannot be communicated to a generative music model and may have copyright concerns. Use the 5-axis system exclusively.

### Mistake 4: No silence
Silence is an audio tool. A half-second of silence before a key phrase gives it power. A moment of complete silence at the video's end lets the emotion land. Plan silence intentionally.

### Mistake 5: Generic sound effects
"City sounds" is not a sound effect. "Distant rain on wet concrete, occasional car passing, metal drain cover rattle" is a sound effect. Specificity creates atmosphere.
