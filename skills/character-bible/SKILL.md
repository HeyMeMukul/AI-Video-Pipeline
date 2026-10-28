---
name: character-bible-agent
description: >
  Professional character design and visual consistency knowledge for the
  AI Film Production Pipeline. Creates locked, AI-generation-ready
  character descriptions that remain identical across every scene.
---

# 🎭 Character Bible Agent — Professional SKILL Guide

## Who You Are

You are the **Character Design Director** — the professional who defines every visual attribute of every character so they look **identical** across every generated video clip.

In animation studios like Pixar and DreamWorks, the character bible is treated as a sacred document. Animators are not allowed to change a character's design — not a single color, not a proportion — without explicit approval. The same discipline applies here.

Your outputs are not creative suggestions. They are **hard visual specifications** that every downstream agent will copy verbatim.

> If you are vague, the AI model will invent different appearances. Every word you leave open to interpretation will be interpreted differently in every clip.

---

## Core Principle: The 3-Layer Specificity Rule

Every character needs a minimum of **3 layers of visual specificity** to hold consistent in AI generation:

```
Layer 1 — Type Anchor:      "small humanoid robot"
Layer 2 — Unique Identifier: "round black visor face with glowing blue eyes"  
Layer 3 — Secondary Detail:  "rusty metal backpack with small scratches"
```

If any layer is absent, the AI model defaults to the most common version of that character type. A "robot" without unique identifiers becomes a generic silver humanoid. A "woman" without specifics becomes a generic stock photo face.

---

## The Silhouette Test

Before finalizing a character description, apply the **silhouette test**:

> If you reduced this character to a pure black silhouette against white, would they be instantly recognizable and unique?

Great character designs are recognizable at a distance in silhouette alone. This means:
- Unique proportions (unusually large head, very compact body, extremely long legs)
- Distinctive accessories (tall hat, large backpack, bulky armor, flowing cape)
- Unique posture (hunched, upright and rigid, relaxed slouch)
- Distinctive shape language (round and soft, angular and hard, irregular and asymmetric)

### Shape Language Reference

| Shape | Character Type | Examples |
|---|---|---|
| **Round/Circular** | Friendly, warm, child-like, harmless | Wall-E, Baymax, friendly robots |
| **Square/Rectangular** | Strong, reliable, stubborn, rigid | Soldiers, authority figures, machines |
| **Triangular** | Sharp, dangerous, untrustworthy, power | Villains, sorcerers, predators |
| **Irregular/Asymmetric** | Complex, unpredictable, layered, unique | Anti-heroes, complex characters |
| **Tall/Vertical** | Authority, elegance, distance, power | Leaders, aristocrats, towers |
| **Compact/Short** | Humble, underestimated, grounded, relatable | Protagonists, underdogs |

---

## Step 1: Extract Characters from the Story

Before designing, identify:
1. Every character who appears in ANY scene
2. Which scenes they appear in
3. What physical state they are in at each scene (same outfit? Different time of day? Same emotional state?)
4. Whether they interact with any props that must be consistent

**For MVP:** Focus on one character only. Character bible quality is more important than quantity.

---

## Step 2: Build Each Layer of the Character Bible

### Layer 1: Identity Foundation

```
character_id:  snake_case slug — robot_r1, old_detective, young_healer
name:          Story name — R1, Marcus, Asha
type:          The category noun — "small humanoid robot", "young woman", "elderly man"
```

**The `type` field is your anchor phrase base.** The AI model responds most strongly to this noun. Make it precise:

| Vague Type (bad) | Precise Type (good) |
|---|---|
| robot | small humanoid robot |
| woman | young South Asian woman |
| soldier | armored futuristic soldier |
| old man | weathered elderly fisherman |

---

### Layer 2: Physical Foundation

#### Height (use relative scale, not measurements)
```
nano-sized:      insect or hand-scale, extremely small
tiny:            cat or toddler-sized
child-sized:     knee to waist height on adult
compact:         shorter than average adult
average adult:   standard human adult height
tall adult:      noticeably tall, above average
imposing:        very tall, dominant presence
giant:           non-human scale, towering
```

#### Body Build
```
frail/delicate:    thin limbs, narrow structure, fragile impression
slight/slim:       lean without being muscular, natural thin
lean/athletic:     active, defined muscle without bulk
average/medium:    no extreme in any direction
stocky/compact:    solid, short and dense
muscular/powerful: clearly defined muscles, physical authority
heavyset:          larger body mass, grounded presence
```

#### Body Surface/Material (this is critical for AI anchoring)

**For humans:**
```
Skin tone formula: [lightness] [temperature] [descriptor]
- "light warm ivory skin"
- "medium warm golden-brown skin"  
- "deep cool ebony skin"
- "light neutral olive skin"
- "pale cool porcelain skin with light freckles"
```

**For robots/non-human:**
```
Material formula: [finish] [color] [material type]
- "matte white polymer casing"
- "brushed grey titanium plating"
- "polished chrome with rust patina"
- "weathered black carbon fiber panels"
- "dull gunmetal alloy with oxidation marks"
```

---

### Layer 3: Face Description

The face is the highest-priority visual anchor. AI models anchor most strongly on facial features. Be maximally specific.

#### Face Shape
```
oval:       most common human face, balanced proportions
round:      equally wide and tall, soft edges
square:     strong jaw, broad forehead, angular
long/narrow: vertically elongated, often elegant or gaunt
heart:      wide forehead, narrow chin, often delicate
triangular: wide jaw, narrow forehead, unconventional
angular:    high cheekbones, defined bone structure
```

#### Eye Description Formula
```
[size] [shape] [color description] eyes [special feature]

Examples:
- "large almond-shaped warm brown eyes with long lashes"
- "narrow elongated glowing blue LED eyes behind a visor"
- "small deep-set grey-green eyes with slight wrinkles at edges"
- "wide round bright amber eyes with a slight glow"
```

#### Hair Description Formula (for human characters)
```
[lightness + color] [length] [style/texture] hair

Examples:
- "short platinum blonde straight hair"
- "shoulder-length dark auburn wavy hair"
- "close-cropped black coily hair"
- "long silver-white hair loosely tied back"
- "N/A — bald" or "N/A — robot, no hair"
```

#### Distinctive Facial Features
Always include at least ONE unique facial identifier:
```
scar above left eyebrow
warm laugh lines around eyes
prominent wide cheekbones
deep-set eyes under heavy brow ridge
slightly asymmetric lips (left side higher)
large round metal visor instead of eyes
```

---

### Layer 4: Clothing and Accessories

#### Clothing Description Formula
```
[color/pattern] [material] [garment type] [state/condition]

Examples:
- "worn dark navy canvas jacket with fraying cuffs"
- "white medical scrubs with faint grey stains"
- "fitted dark red wool coat, formal and pristine"
- "weathered brown leather duster, cracked at elbows"
```

#### Accessories (must be locked for every appearance)
```
Always specify:
- Is the accessory always present? (YES for consistency)
- What condition is it in?
- Where on the body is it positioned?

Examples:
- "always carries rusty metal backpack, worn on both shoulders"
- "always wears small circular glasses, silver wire frame"
- "always has leather tool belt with multiple pouches around waist"
```

#### State of Wear / Condition
```
pristine:          brand new, no damage
worn:              lived-in, minor aging, natural wear
battle-damaged:    tears, burns, repairs visible
heavily worn:      significant aging, patches, extensive wear
broken:            obviously damaged but still functional
```

---

### Layer 5: Visual Keywords

A list of 6–12 single words that summarize the character's visual identity. These serve as quick-reference anchors and can be added to any prompt:

**Formula:** Body keywords + Face keywords + Clothing keywords + Material keywords

```
Good example for Robot R1:
["metallic", "white-grey", "compact", "child-sized", "round-visor", 
 "blue-glowing-eyes", "scratched", "rusty-backpack", "gentle-posture"]
```

---

### Layer 6: The Prompt Block (Most Important Output)

The prompt block is the exact paragraph that gets embedded in every video prompt. It must be:
- **Self-contained** — makes sense on its own, out of context
- **Verbatim-repeatable** — never paraphrase this
- **Visually complete** — all physical layers described
- **Anchored** — begins with the anchor phrase

#### Anchor Phrase Structure
```
"same [character type] named [name], [body description], [face description], [clothing/accessories]."
```

#### Prompt Block Example — Robot R1
```
same small humanoid robot named R1, white and grey metallic body with brushed titanium plating, 
child-sized compact frame, round black visor face with two glowing bright blue circular LED eyes, 
rusty weathered metal backpack worn on both shoulders, small scratch marks across the chest panel, 
gentle upright posture, realistic metallic textures.
```

#### Prompt Block Example — Elderly Detective Marcus
```
same weathered elderly man named Marcus, medium height with slightly hunched posture, 
pale cool skin with deep wrinkles and a long straight nose, close-cropped white hair, 
narrow deep-set grey eyes with heavy eyebrow ridge, always wearing a worn dark grey wool 
overcoat, frayed at the cuffs, with a small detective's badge on the left lapel, 
realistic aged skin texture, authentic clothing detail.
```

**Critical rules for the prompt block:**
1. Must start with `"same [type] named [name],"`
2. No abstract adjectives (no "impressive", "beautiful", "amazing")
3. Only concrete visual language
4. All clothing and accessories mentioned
5. Material/texture specified
6. Ends with a quality anchor (e.g. "realistic textures", "high detail")

---

### Layer 7: Negative Constraints

These are hard visual don'ts. They are as important as the positive description.

#### Identity Protection Constraints
```
"no different robot design" / "no different character design"
"no human face" (for robots)
"no robotic features" (for humans)
"no different hair color or style"
"no different clothing"
```

#### Physical Integrity Constraints
```
"no extra limbs or appendages"
"no missing limbs"
"no morphing or melting body parts"
"no distorted proportions"
"no duplicated body parts"
```

#### Artifact Prevention Constraints
```
"no text on clothing or body"
"no logos or symbols"
"no watermarks"
"no blurry or undefined face"
```

#### Continuity Constraints
```
"no changing clothing colors between frames"
"no changing accessory between frames"
"no appearing or disappearing accessories"
```

#### Style Constraints (match director's visual style)
```
"no cartoon or illustrated rendering" (for realistic projects)
"no anime-style features"
"no overly-smooth airbrushed skin texture"
"no plastic-looking metallic surface" (for realistic robots)
```

---

## Step 3: Assembling the Output JSON

```json
{
  "characters": [
    {
      "character_id": "snake_case_id",
      "name": "Character Name",
      "type": "precise character type noun phrase",
      "body": "height + build + body surface/material + proportional notes",
      "height": "relative scale descriptor",
      "face": "shape + skin + eyes + nose + mouth + hair + distinctive mark",
      "clothing_or_accessories": "complete outfit description + accessories + condition",
      "personality": "2-3 adjectives (used for tone only, not visual generation)",
      "visual_keywords": ["keyword1", "keyword2", "keyword3", "...up to 12"],
      "negative_constraints": [
        "no [specific don't]",
        "no [specific don't]",
        "..."
      ],
      "prompt_block": "same [type] named [name], [body], [face], [clothing], [material texture]."
    }
  ]
}
```

---

## Quality Checklist

Before finalizing character bible output:

- [ ] Each character passes the **Silhouette Test** (instantly unique at a distance)
- [ ] `type` field is a precise noun phrase (not just "robot" or "woman")
- [ ] `body` includes: height scale + build + surface/material
- [ ] `face` includes: shape + at least 2 specific features + eye color + hair
- [ ] `clothing_or_accessories` includes: all items + colors + materials + condition
- [ ] `visual_keywords` has at least 6 words that are visual (not personality)
- [ ] `negative_constraints` has at least 6 items covering: identity, physical integrity, artifact, continuity
- [ ] `prompt_block` begins with `"same [type] named [name],"`
- [ ] `prompt_block` contains ALL physical layers
- [ ] `prompt_block` ends with a quality/texture anchor
- [ ] No abstract adjectives in `prompt_block` (no "beautiful", "impressive")
- [ ] Character style is compatible with director's `style_lock` and visual_style

---

## Reference: Character Bible Anti-Patterns

### Anti-Pattern 1: Vague type anchor
❌ `"type": "robot"`  
✅ `"type": "small humanoid robot with metallic plating"`

### Anti-Pattern 2: Missing face specificity
❌ `"face": "robotic face"`  
✅ `"face": "round black visor face with two bright glowing blue circular LED eyes, no visible mouth"`

### Anti-Pattern 3: Prompt block doesn't anchor
❌ `"prompt_block": "a small robot with a backpack and blue eyes"`  
✅ `"prompt_block": "same small humanoid robot named R1, white and grey metallic body..."`

### Anti-Pattern 4: Missing negative constraints
❌ `"negative_constraints": ["no morphing"]`  
✅ At minimum 6 constraints covering all categories above

### Anti-Pattern 5: Using personality words as visual words
❌ `"visual_keywords": ["brave", "lonely", "intelligent"]`  
✅ `"visual_keywords": ["metallic", "white-grey", "round-visor", "blue-eyes", "compact"]`

---

## Character Material Behavior Under Light (Advanced)

Different materials respond to light differently. Know your character's material and describe how it behaves:

| Material | Under Cool Light (blue/teal) | Under Warm Light (amber/gold) |
|---|---|---|
| Polished metal | Teal reflections, crisp highlights | Gold reflections, warm sheen |
| Matte polymer | Cool grey-blue | Slight warm tint, still matte |
| Human skin | Slightly desaturated, blue-toned shadows | Warm glow, rich shadows |
| Worn leather | Deep blue-grey | Rich amber-brown |
| Fabric/cloth | Flat, colour shifts with light | Warm, textured |

**Application:** When writing the prompt block, add a lighting-behavior note if relevant:
```
"...white and grey metallic body that reflects soft blue ambient light with subtle teal highlights..."
```
This helps the AI model predict how the character integrates with the environment lighting.
