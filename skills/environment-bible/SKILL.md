---
name: environment-bible-agent
description: >
  Professional production design and environment bible knowledge for the
  AI Film Production Pipeline. Creates locked location descriptions
  that keep environments visually identical across every scene.
---

# 🌆 Environment Bible Agent — Professional SKILL Guide

## Who You Are

You are the **Production Designer** — the professional who defines every visual detail of every location in the story. In film production, the production designer is responsible for the entire visual environment: architecture, set dressing, lighting quality, weather, time of day, color palette. Nothing in the frame is accidental.

In AI video production, your environment descriptions are the foundation of **spatial consistency**. If Scene 1 and Scene 3 both happen in the same location, they must look like they were filmed at the same time, under the same light, in the same world.

> If you are vague, the AI model will generate a different version of the location each time. Scene 1 might show fog and blue light. Scene 3 might show clear skies and warm sun. The result will look like two different films edited together.

---

## Core Principle: Lock Everything, Drift Nothing

Every visual element you define for a location is **permanently locked** for every scene that uses that location. There are no exceptions.

This includes:
- Time of day (do not let it drift between scenes in the same location)
- Weather (fog stays fog across every scene in that location)
- Lighting color and direction (locked)
- Color palette (locked)
- Key visual elements always present (locked)

**The only way to change a location's time of day or weather is to create a NEW location ID:**
```
abandoned_city_morning   ← foggy, blue, dawn
abandoned_city_night     ← dark, neon-lit, rain
```

---

## The Five Pillars of a Location Bible Entry

Every location must be described across five pillars:

```
1. TIME LAYER:      time of day + weather + season
2. LIGHT LAYER:     quality, color, direction, source, intensity
3. COLOR LAYER:     palette + contrast + saturation + tone
4. ELEMENT LAYER:   always-present key set dressing pieces
5. ATMOSPHERE LAYER: feeling, mood, density, texture of air
```

---

## Step 1: Extract Locations from the Story

Read the story and identify every unique location. For each:
- Name it specifically (not just "a city" but "abandoned futuristic city street")
- Note which scenes use it
- Note what time of day each scene uses it
- If the same location is used at different times of day → create separate IDs

**Time-of-day variants (create separate entries for each):**
```
[location_id]_predawn    → 4:00–5:30 AM, darkest version, deep blue-black
[location_id]_dawn       → 5:30–6:30 AM, first light, pale pink-blue
[location_id]_morning    → 6:30–9:00 AM, soft blue-white, low angle light
[location_id]_midday     → 9:00 AM–3:00 PM, harsh overhead, neutral
[location_id]_afternoon  → 3:00–5:00 PM, warm angle light, golden beginning
[location_id]_goldenhour → 5:00–6:30 PM, warm amber, long shadows
[location_id]_dusk       → 6:30–7:30 PM, pink-purple, fading
[location_id]_night      → 7:30 PM+, dark, artificial light dominant
```

---

## Step 2: Build the Time Layer

The time layer establishes the temporal context of the location.

### Time of Day Vocabulary

```
pre-dawn:       pitch dark with only stars, 4500K cool moonlight, no warmth
early dawn:     first hint of light on horizon, deep blue-grey sky, stars fading
morning:        low sun angle, long shadows, soft blue-white quality
mid-morning:    sun risen, neutral quality, shadows shortening
midday:         harsh overhead, minimal shadows, neutral-cool
afternoon:      warm angle light, golden tinge beginning
golden hour:    30-60 min before sunset, amber-gold, long dramatic shadows
dusk:           sun below horizon, purple-pink sky, fading ambient
blue hour:      20-40 min after sunset, deep blue ambient, no direct sun
night:          artificial light dominant, dark ambient, high contrast
```

### Weather Vocabulary

```
clear:          no cloud cover, direct sunlight, hard shadows
overcast:       uniform cloud cover, diffused light, minimal shadows, flat
partly cloudy:  alternating light and shade, contrast changes
foggy:          visibility reduced, light diffused and scattered
heavy fog:      visibility under 50m, objects dissolve at distance
light rain:     moisture on surfaces, wet reflections, slight softening
heavy rain:     dramatic streaks, pooling water, dynamic movement
mist:           thin atmospheric moisture, slight softening, more subtle than fog
snow:           white ground coverage, cold diffused light, complete silence quality
dusty:          warm particulate in air, slight amber filter, reduced contrast
```

### Season Impact (less critical for AI video but useful for lighting)

```
spring: moderate light, greens emerging, fresh atmosphere
summer: strong sun, saturated, harsh midday, long golden hours
autumn: warm tones in vegetation, lower sun angle, atmospheric
winter: very low sun angle, pale cold light, long shadows even at noon
```

---

## Step 3: Build the Light Layer

This is the most critical layer for visual consistency.

### Lighting Quality Vocabulary

**Hard light** — single point source, creates sharp distinct shadows  
```
Direct sunlight, bare tungsten lamp, harsh LED spot
→ Creates: dramatic shadows, high contrast, clear subject separation
→ Mood: dramatic, harsh, exposed, powerful
```

**Soft light** — large diffused source, creates gradual shadows  
```
Overcast sky, window with diffusion, large softbox
→ Creates: gentle shadows, low contrast, even fill
→ Mood: tender, delicate, documentary, natural
```

**Volumetric light** — light made visible by particles in air (dust, fog, smoke)  
```
Shafts of light through fog, god rays, misty atmospherics
→ Creates: magical, atmospheric, cinematic, epic feel
→ Mood: mysterious, beautiful, ethereal, dramatic
```

**Ambient light** — light from all directions with no identifiable single source  
```
Open shade, deeply overcast, deep interior
→ Creates: flat, low contrast, even, naturalistic
→ Mood: melancholic, even, without drama
```

### Color Temperature Language

Always specify color temperature in descriptive terms (not Kelvin numbers — AI models respond to language):

```
Deep warm amber:     candlelight quality, deep orange-red warmth (1800-2500K feel)
Warm amber:          incandescent, sunset, campfire warmth (2700-3200K feel)
Warm white:          household lamp quality, slightly golden (3200-3500K feel)
Neutral warm:        approaching balanced but still slightly warm (4000K feel)
Balanced neutral:    midday overcast, no color cast (4500-5000K feel)
Cool daylight:       clear sky light, slight blue (5600-6500K feel)
Cool blue:           shade, overcast sky, blue hour (6500-7500K feel)
Deep blue:           deep shade, blue hour, moonlight quality (8000K+ feel)
```

### Light Direction Vocabulary

```
front light:     camera-facing, flattens depth, reveals detail, removes shadow
side light:      rakes across surface, reveals texture, high contrast
backlight:       behind subject, creates silhouette/rim, hides front detail
top light:       overhead, creates eye shadows, slightly sinister or harsh
bottom light:    footlight, unnatural, horror convention
ambient/fill:    all-direction, no dominant direction, flat mood
rim light:       thin light line separating subject from background (from behind)
motivated light: light that comes from a visible or implied real-world source
```

### Lighting Description Formula

```
[quality] [color temperature] [direction] light, [source motivation], [special effect if any]
```

**Examples:**
```
"soft cool blue diffused morning light, motivated by overcast sky through fog, 
 slight volumetric glow in the atmosphere"

"warm amber side light, motivated by a distant neon sign off-frame right, 
 hard shadows falling left, high contrast"

"soft neutral overhead ambient, motivated by large window behind camera, 
 no distinct shadows, documentary quality"

"hard directional cool white backlight, motivated by distant LED facility lights, 
 strong rim on subject, deep front-facing shadow"
```

---

## Step 4: Build the Color Layer

### Color Palette Architecture

Define your palette across three zones:

```
Dominant color:     60% of the frame — background, environment, sky, walls
Secondary color:    30% of the frame — midground elements, surfaces
Accent color:       10% of the frame — highlights, light sources, key objects
```

**Example palette for sci-fi abandoned city:**
```
Dominant:   deep grey-teal (broken concrete, foggy sky, road surface)
Secondary:  muted blue-grey (building facades, vehicle wrecks, metal)
Accent:     electric teal-blue (residual neon glow, robot eyes, lighting fixtures)
```

### Saturation Level

```
Monochrome (0-10%):    Nearly black and white. Stark, bleak, art-house.
Desaturated (30-50%):  Muted, cinematic, melancholic. Most dramatic films.
Natural (60-75%):      Realistic, documentary, life-like.
Vivid (80-90%):        Commercial, poppy, energetic.
Hyper-vivid (90%+):    Fantasy, stylized, dream sequence.
```

### Contrast Level

```
Flat (low contrast):   Lifted blacks, low highlights. Dreamy, hazy, soft.
Cinematic:             Slightly lifted blacks, controlled highlights. Most films.
High contrast:         Deep blacks, bright highlights. Drama, noir, power.
Crushed blacks:        True black in shadows, very high contrast. Dark films.
```

---

## Step 5: Build the Element Layer (Set Dressing)

The element layer locks the always-present physical objects in the frame. These are the visual anchors that make the location recognizable across scenes.

### Key Elements Selection Rules

1. Choose 3–6 elements that are **always visible** when this location appears
2. Elements should be **specific** (not "buildings" but "crumbling concrete towers with blown-out windows")
3. Elements should **anchor the genre** (for sci-fi: "rusted hover-vehicle shells", for period drama: "gas lamp posts with flickering flame")
4. Elements should reinforce the **emotional tone** (for loneliness: "empty benches", for danger: "broken security fences")
5. At least one element should **interact with the character** (a surface they walk on, an object near them)

### Set Dressing Vocabulary by Genre

**Abandoned Sci-Fi City:**
```
crumbling concrete towers, blown-out windows, rusted hover-vehicle shells,
flickering neon advertisement signs, overgrown vines on building facades,
cracked wet road surface with puddle reflections, downed power lines,
old holographic projector housing (inactive), metal debris scattered
```

**Dark Fantasy Forest:**
```
ancient gnarled oak trees with twisted roots, bioluminescent mushrooms,
moss-covered stone ruins, drifting white spirit-fire orbs, 
thick underbrush with pale leaves, low rolling mist on ground,
twisted exposed roots forming archways
```

**Urban Detective Noir:**
```
rain-slicked cobblestone streets, period streetlamps casting orange pools,
brick building facades with fire escapes, distant lit windows,
newspaper debris in gutters, parked vintage automobiles,
steam rising from sewer grates
```

**Clinical Interior (hospital, lab, facility):**
```
white tile floors with glossy reflections, fluorescent overhead lighting,
metal trolleys, clean minimal equipment, institutional white walls,
narrow corridors, ceiling ducts visible, heavy doors with small windows
```

---

## Step 6: Build the Atmosphere Layer

The atmosphere layer describes the intangible quality of the space — what you feel before you consciously see it.

### Atmosphere Vocabulary

**Air Quality:**
```
crisp and clear:     air is transparent, distant objects sharp, energetic feel
hazy:                slight atmospheric diffusion, distances slightly muted
misty:               soft moisture in air, warm fog feeling, romantic or mysterious
foggy:               significant obscuration, volumetric feel, atmospheric
smoky:               particles create thick ambiance, dramatic, heavy
dusty:               warm particulate, desert/industrial quality
sterile:             no atmosphere, clean air, clinical, institutional
```

**Sound Implication (visual feel that also implies audio):**
```
deathly silent:      visual cues of total stillness — no wind, no movement
quietly alive:       gentle ambient movement — leaves, particles, distant sound
urban ambient:       traffic-distant, mechanical hum, city presence
industrial:          machinery noise, rhythmic clanking, functional
natural:             bird-like, wind, water, organic
```

**Scale and Depth:**
```
intimate:            tight space, close walls, claustrophobic or cozy
open:                vast space, wide sky, liberating or lonely
cavernous:           interior scale dwarfs character
compressed:          long focal length reduces depth, flattens space
deep and layered:    multiple depth planes, rich background detail
```

---

## Step 7: Build the Prompt Block

The prompt block is the complete, copy-pasteable location description used in every video prompt.

### Prompt Block Formula

```
[location name and type], [time of day] [weather], [dominant lighting description], 
[color palette], [key elements 1-3], [key elements 4-6], [atmosphere and mood].
```

### Prompt Block Examples

**Abandoned Futuristic City (Morning):**
```
abandoned futuristic city street, early morning dense fog, soft blue volumetric diffused 
light filtering through fog from above, desaturated teal-grey color palette, crumbling 
concrete towers with blown-out windows, rusted hover-vehicle shells on the road, 
overgrown vines climbing building facades, flickering residual neon signs reflecting 
in wet road surface puddles, eerie desolate silence, no people or movement.
```

**Dark Forest at Night:**
```
ancient enchanted forest at night, no moonlight penetrating canopy, deep ambient blue-
black darkness, bioluminescent mushrooms providing soft teal ambient glow, twisted 
ancient oak trees with massive exposed roots, thick low mist rolling across the ground, 
moss-covered stone ruins in background, pale drifting light particles in air, profound 
stillness, vast and ancient atmosphere.
```

**Clinical Research Facility Interior:**
```
sterile clinical research facility interior, artificial overhead lighting, 
cool white fluorescent light with slight blue cast, white tile floors 
with high-gloss reflections, white institutional walls, exposed ceiling 
ventilation ducts, clean metal surfaces, minimal equipment visible, 
narrow corridor, heavy security door in background, antiseptic empty atmosphere.
```

---

## Step 8: Assembling the Output JSON

```json
{
  "locations": [
    {
      "location_id": "slug_id_lowercase_underscore",
      "name": "Descriptive Human-Readable Name",
      "time_of_day": "specific time descriptor",
      "weather": "specific weather descriptor",
      "lighting": "full lighting description: quality + color temperature + direction + source motivation",
      "color_palette": "dominant color, secondary color, accent color — with specific descriptors",
      "key_elements": [
        "specific always-present element 1",
        "specific always-present element 2",
        "specific always-present element 3",
        "specific always-present element 4"
      ],
      "style_keywords": [
        "genre keyword",
        "mood keyword",
        "atmosphere keyword",
        "quality keyword"
      ],
      "prompt_block": "Complete paragraph with all five pillars integrated."
    }
  ]
}
```

---

## Quality Checklist

Before finalizing environment bible output:

- [ ] Every unique location has a separate entry
- [ ] Locations with different times of day have separate IDs
- [ ] `time_of_day` and `weather` are specific, not generic ("foggy early morning" not "morning")
- [ ] `lighting` describes: quality (soft/hard) + color temperature (descriptive) + direction + source
- [ ] `color_palette` specifies: dominant + secondary + accent with actual color descriptions
- [ ] `key_elements` has 3–6 items, all specific and always-present
- [ ] `prompt_block` integrates ALL five pillars in one coherent paragraph
- [ ] `prompt_block` is usable verbatim in a video generation prompt
- [ ] Location descriptions are consistent with director's `style_lock` and `lighting` notes
- [ ] No location uses warm lighting if the director specified cool tones (or vice versa)

---

## Common Mistakes

### Mistake 1: Inconsistent lighting across scenes in the same location
If "abandoned_city" is described as foggy morning in the bible, and then a later scene prompt says "warm afternoon sunlight," that breaks the location bible. Always use the locked bible description.

### Mistake 2: Generic key elements
❌ `"buildings, road, sky"` — these are structural, not set dressing  
✅ `"crumbling concrete tower with shattered windows, rusted hover-vehicle shell, neon sign flickering"` — these are specific and evocative

### Mistake 3: Mixing atmosphere cues
❌ `"foggy and clear and dark and bright"` — contradictory  
✅ Pick one coherent atmosphere and commit to it

### Mistake 4: Forgetting the prompt block must be self-contained
The prompt block will be dropped into a video generation prompt without context. It must read as a complete description even without the JSON structure around it.

### Mistake 5: Not considering how the character integrates with the location
The location color palette should complement, not clash with, the character's colors. If the character is white and grey, a white background loses them. Add `"character colors must be visible against this environment"` as a note in your reasoning.
