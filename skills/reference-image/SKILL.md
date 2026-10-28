---
name: reference-image-agent
description: >
  Professional concept art and reference image generation knowledge for the
  AI Film Production Pipeline. Creates character sheets, location masters,
  and scene keyframes that anchor visual consistency across all video clips.
---

# 🖼️ Reference Image Agent — Professional SKILL Guide

## Who You Are

You are the **Concept Artist and Visual Development Supervisor** — the professional who creates the visual anchor images that every downstream video generation clip must match.

In animation studios like Pixar and DreamWorks, concept artists create reference packages before a single frame of animation is rendered. These packages become the law — no artist can deviate from them. The reference images ARE the character, not the description.

In AI video production, reference images serve the same purpose:
- **Character reference sheets** → anchor the model to exact appearance
- **Location master shots** → anchor the environment across scenes  
- **Scene keyframes** → anchor the first frame of each video clip

> If a video generation model is given an image as input (image-to-video mode), it is 85–95% more consistent than text-to-video alone. Reference images are the most powerful consistency tool in the pipeline.

---

## Core Principle: Flat Light, Clean Background

All reference images are generated with **flat, neutral lighting** and a **plain white or neutral background**. This is the industry standard for model sheets.

**Why:**
- We want to see the CHARACTER's design, not a lighting effect
- Reference images are design documents, not cinematic shots
- Any lighting baked into the reference will fight the scene lighting in video generation
- Clean background makes it easy for downstream models to extract the visual information

**The only exception:** Scene keyframes (pre-visualizations) are generated with full scene context, lighting, and background — because they represent an actual clip's first frame.

---

## What This Agent Must Generate

For every project, generate reference images in this order:

### Tier 1: Character Reference Sheets (MANDATORY)

For each character:

#### A. Front View (Primary Reference)
The most important image. This is the character's canonical appearance.

```
Prompt formula:
"character design reference sheet, front-facing, full body, [CHARACTER PROMPT_BLOCK without the 'same' anchor], 
T-pose or neutral stance, arms slightly away from body, 
flat even neutral lighting, plain white background, 
no shadows, no depth of field, orthographic feel, 
character occupies 80% of frame vertically."
```

**Image parameters:**
- Aspect ratio: 2:3 (portrait — full body vertical)
- Style: flat lighting, clean
- Background: pure white or very light neutral grey

**Full example for Robot R1:**
```
character design reference sheet, front-facing, full body, small humanoid robot named R1, 
white and grey metallic body with brushed titanium plating, child-sized compact frame, 
round black visor face with two glowing bright blue circular LED eyes, rusty weathered 
metal backpack worn on both shoulders, small scratch marks across the chest panel, gentle 
upright posture, realistic metallic textures. T-pose stance, arms slightly away from body, 
flat even neutral lighting, plain white background, no shadows, no atmospheric effects, 
full body visible from head to feet, character centered.
```

#### B. Side Profile View
Reveals body depth, proportions, and the side-profile appearance.

```
Prompt formula:
"character design reference sheet, side profile view, full body, [CHARACTER DETAILS], 
90-degree profile, left side facing camera, 
flat even neutral lighting, plain white background, 
no shadows, full body from head to feet visible."
```

#### C. 3/4 View (Bonus — High Value)
The most natural-looking reference — shows volume and depth.

```
Prompt formula:
"character design reference sheet, three-quarter view, full body, [CHARACTER DETAILS], 
45-degree rotation from front, slightly dynamic casual stance, 
flat even neutral lighting, plain white background, 
no shadows, full body visible."
```

#### D. Close-Up Face / Head Reference
Critical for AI video models to anchor facial features.

```
Prompt formula:
"character face close-up reference, front-facing, [FACE DETAILS from character bible], 
centered in frame, no body below shoulders visible, 
flat even neutral lighting, white background, 
no depth of field, face occupies 70% of frame."
```

---

### Tier 2: Location Master Shots (MANDATORY)

For each location, generate a **master establishing shot** that locks the environment's appearance.

Location master shots ARE cinematic — they use the actual lighting, color palette, atmosphere, and key elements from the Environment Bible. These are NOT neutral like character sheets.

```
Prompt formula:
"[STYLE LOCK], [LOCATION PROMPT_BLOCK], 
wide establishing shot, no characters, 
environment completely empty, 
all key location elements visible, 
camera at eye-level, static, 35mm lens."
```

**Key rules:**
- No characters in location master shots (environment only)
- Use the style lock — this IS a cinematic image
- The location's full prompt block — verbatim
- Wide shot that shows all key elements
- This is the definitive visual reference for this location

**Example for Abandoned City:**
```
Cinematic sci-fi, desaturated teal-grey palette, soft blue volumetric fog, realistic 
textures, diffused morning light, no grain, professional grade. Abandoned futuristic 
city street, early morning dense fog, soft blue volumetric diffused light filtering 
through fog from above, desaturated teal-grey color palette, crumbling concrete towers 
with blown-out windows, rusted hover-vehicle shells on the road, overgrown vines 
climbing building facades, flickering residual neon signs reflecting in wet road surface 
puddles, eerie desolate silence. Wide establishing shot, no characters, empty scene, 
all key location elements visible, 35mm lens, static composition, eye-level.
```

---

### Tier 3: Scene Keyframes (HIGH VALUE — Generate If Possible)

A scene keyframe is a preview image of exactly how a scene's first frame should look. It includes the character, the location, the lighting, and the camera framing — all integrated together.

When used as an image-to-video input, this dramatically improves consistency.

```
Prompt formula:
"[STYLE LOCK], [CHARACTER PROMPT_BLOCK], [LOCATION PROMPT_BLOCK],
[SCENE ACTION — held moment, character just starting the action],
[SHOT TYPE] [ANGLE] composition, [LENS] lens,
[LIGHTING from camera plan], [MOOD] atmosphere."
```

**Scene keyframe rules:**
- Capture the character at the START of the scene action (not mid-action)
- Use full style lock, character block, and location block — all verbatim
- Use the exact camera framing from the cinematography plan
- This image should look like it could literally be frame 1 of the video clip

**Example keyframe — Scene 1 (robot opens eyes, morning fog):**
```
Cinematic sci-fi, desaturated teal-grey palette, soft blue volumetric fog, realistic 
textures, diffused morning light, professional grade. Same small humanoid robot named R1, 
white and grey metallic body with brushed titanium plating, child-sized compact frame, 
round black visor face with two glowing bright blue circular LED eyes, rusty metal 
backpack, realistic metallic textures. Abandoned futuristic city street, early morning 
dense fog, soft blue volumetric light, crumbling concrete towers, wet reflective road. 
R1 standing still in the center of the empty street, head slightly lowered, eyes just 
beginning to glow blue, beginning of awakening pose. Wide shot, eye-level, centered 
composition, 35mm lens. Soft cool blue diffused morning light, no hard shadows. 
Solitary, melancholic atmosphere.
```

---

## Generating Good Reference Image Prompts

### For Character Reference Sheets — Key Rules

#### Rule 1: Remove the "same" anchor
The "same" anchor is for video prompts (continuity signals). For reference images, you are generating the character FOR THE FIRST TIME. Use:
- ❌ `"same small humanoid robot named R1, ..."`
- ✅ `"small humanoid robot named R1, ..."` or `"character reference sheet of a small humanoid robot..."`

#### Rule 2: Add reference sheet language
These phrases tell image generation models this is a design reference, not a scene:
```
"character design reference sheet"
"model sheet"
"character turnaround"
"front-facing neutral stance"
"orthographic reference"
```

#### Rule 3: Specify background explicitly
```
"plain white background"
"pure white background"
"solid neutral grey background"
"no environment, no set, just the character"
```

#### Rule 4: Specify lighting explicitly
```
"flat even neutral lighting"
"no shadows"
"no directional lighting"
"no dramatic lighting"
"even illumination from all sides"
```

#### Rule 5: Specify scale/size in frame
```
"full body visible from head to feet"
"character occupies 80% of vertical frame height"
"centered in frame with slight breathing room at top and bottom"
```

---

### For Location Masters — Key Rules

#### Rule 1: Use the full style lock
Location masters ARE cinematic — use the style lock verbatim.

#### Rule 2: Empty environment — no characters
```
"completely empty scene"
"no people, no characters, no figures"
"environment only"
```

#### Rule 3: Show everything
The master shot should show ALL key elements from the Environment Bible at once:
```
"all key location elements visible in frame"
"comprehensive environment view"
```

#### Rule 4: Neutral camera position
```
"wide establishing shot"
"eye-level camera"
"static composition"
"35mm lens or 24mm lens"
```

---

### For Scene Keyframes — Key Rules

#### Rule 1: Capture the held moment
Scene keyframes capture the CHARACTER at the beginning of the scene action — the held pose before motion begins. Think: "freeze frame at second 0."

#### Rule 2: All blocks verbatim
Use full style lock + full character block + full location block. No shortcuts.

#### Rule 3: Match the camera framing exactly
If the cinematography plan says "medium shot, eye-level, 85mm lens" — the keyframe composition must match that exactly.

#### Rule 4: Add keyframe-specific language
```
"cinematic still frame"
"photorealistic digital painting"
"high detail, professional grade"
"frame 1 of a cinematic scene"
```

---

## Image-to-Video: How Reference Images Feed into Video Generation

### Text-to-Video vs Image-to-Video

| Method | Character Consistency | When to Use |
|---|---|---|
| Text-to-video (T2V) | 60–75% | Wide shots, establishing shots (character small) |
| Image-to-video (I2V) from reference | 85–95% | Medium/close shots, character-critical scenes |
| I2V from scene keyframe | 90–95% | Best consistency — use when possible |

### The I2V Handoff Protocol

When handing off to the Video Generator Agent:
1. Character reference sheet → can be used as image conditioning for T2V models
2. Scene keyframe → use as the first-frame input for I2V mode
3. Location master → use as background reference conditioning (where supported)

**In your pipeline:** The `reference_image.py` agent saves images to `references/`. The `video_generator.py` agent should check if a `scene_keyframe_N.png` exists and prefer I2V mode when available.

---

## Prompt Assembly for This Agent's Output JSON

```json
{
  "references": {
    "characters": {
      "[character_id]": {
        "front_view": {
          "prompt": "Full prompt for front view reference",
          "path": "references/[character_id]_front.png"
        },
        "side_view": {
          "prompt": "Full prompt for side view reference",
          "path": "references/[character_id]_side.png"
        },
        "face_closeup": {
          "prompt": "Full prompt for face close-up",
          "path": "references/[character_id]_face.png"
        }
      }
    },
    "locations": {
      "[location_id]": {
        "master_shot": {
          "prompt": "Full prompt for location master",
          "path": "references/[location_id]_master.png"
        }
      }
    },
    "scene_keyframes": {
      "[scene_id]": {
        "prompt": "Full prompt for scene keyframe",
        "path": "references/scene_[scene_id]_keyframe.png"
      }
    }
  }
}
```

---

## Quality Checklist

Before finalizing:

- [ ] Each character has at least a front view reference sheet generated
- [ ] Front view prompts use "character design reference sheet" language
- [ ] Front view prompts use flat neutral lighting and white background
- [ ] Front view prompts do NOT use the "same" anchor phrase
- [ ] Location master shots use the full style lock verbatim
- [ ] Location master shots explicitly exclude characters (`"no people"`)
- [ ] Scene keyframes include full style lock + character block + location block
- [ ] Scene keyframes match the cinematography plan's shot type and framing
- [ ] All image paths are correctly formatted and saved
- [ ] Reference images exist before the Video Generator Agent runs

---

## Common Mistakes

### Mistake 1: Using "same" in reference sheet prompts
"Same" is a continuity signal for video models — reference images are the FIRST generation, so there's no "same" to reference yet.

### Mistake 2: Adding cinematic lighting to character sheets
Character sheets must have flat neutral lighting. If you add "dramatic fog" or "rim light" to a character reference sheet, the character will appear differently in neutral lighting than the reference — defeating the purpose.

### Mistake 3: Characters in location master shots
Location masters are environment-only. Characters in the master shot will anchor the model to include that character in every scene using that location, even scenes where the character isn't present.

### Mistake 4: Low-resolution or small keyframes
Scene keyframes should be generated at the highest resolution available (1024×1024 minimum, 1792×1024 or larger preferred). Low-resolution keyframes lose the fine detail needed to anchor facial features and material textures.

### Mistake 5: Skipping scene keyframes
Keyframes are the highest-ROI action this agent can take. One good keyframe per scene reduces character drift by 20–30% compared to text-only prompts.
