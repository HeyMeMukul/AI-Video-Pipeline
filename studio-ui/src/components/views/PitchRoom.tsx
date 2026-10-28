import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Sparkles, Clapperboard, Check, X } from 'lucide-react';
import { SectionHeader } from '../ui/primitives';
import { cn } from '../ui/cn';

const STYLE_PRESETS = [
  'Cinematic Realism',
  'Atmospheric Lighting',
  'Neo-Noir High Contrast',
  '35mm Kodachrome Vintage',
  'Wes Anderson Symmetrical',
  'Cyberpunk Neon Rain',
  'Hyperrealistic IMAX 70mm',
  'Dark Moody Fantasy',
];

function toneLabel(weight: number): string {
  if (weight < 40) return 'contemplative, muted, slow-burn';
  if (weight < 75) return 'balanced, dramatic, cinematic';
  return 'hyper-kinetic, intense, propulsive';
}

const AspectCard: React.FC<{
  ratio: string; label: string; w: number; h: number;
  selected: boolean; onClick: () => void;
}> = ({ ratio, label, w, h, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
      selected
        ? 'bg-cinema-gold/10 border-cinema-gold shadow-glow-gold'
        : 'bg-cinema-surface border-white/[0.08] hover:border-white/20'
    )}
  >
    <svg viewBox={`0 0 ${w} ${h}`} width={w * 1.4} height={h * 1.4} className="overflow-visible" aria-hidden>
      <rect x="0" y="0" width={w} height={h} rx="2"
        fill={selected ? 'rgba(229,192,123,0.15)' : 'rgba(255,255,255,0.05)'}
        stroke={selected ? '#e5c07b' : 'rgba(255,255,255,0.2)'}
        strokeWidth="1.5" />
    </svg>
    <span className={cn('text-xs font-mono font-bold', selected ? 'text-cinema-gold' : 'text-cinema-faint')}>{ratio}</span>
    <span className="text-[11px] text-cinema-faint">{label}</span>
  </button>
);

export const PitchRoom: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const startProduction = useStudioStore((s) => s.startProduction);

  const [story, setStory] = useState(project.story);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(project.styleDna || ['Cinematic Realism', 'Atmospheric Lighting']);
  const [customStyle, setCustomStyle] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '2.39:1' | '9:16'>(project.aspectRatio || '16:9');
  const [avoidTags, setAvoidTags] = useState<string[]>(
    project.directorVision.avoidConstraints.length > 0
      ? project.directorVision.avoidConstraints
      : ['morphing hands', 'camera jitter', 'logo watermark', 'blurry limbs']
  );
  const [avoidInput, setAvoidInput] = useState('');
  const [toneWeight, setToneWeight] = useState(85);

  const toggleStyle = (style: string) => {
    setSelectedStyles((s) => (s.includes(style) ? s.filter((x) => x !== style) : [...s, style]));
  };

  const addAvoidTag = (val: string) => {
    const tag = val.trim();
    if (tag && !avoidTags.includes(tag)) setAvoidTags((t) => [...t, tag]);
    setAvoidInput('');
  };

  const handleRollCamera = () => {
    const finalStyles = customStyle ? [...selectedStyles, customStyle] : selectedStyles;
    startProduction(story, finalStyles, aspectRatio, toneLabel(toneWeight), avoidTags);
  };

  const canRoll = story.trim().length > 0 && selectedStyles.length > 0;

  return (
    <div className="flex flex-col h-full bg-cinema-bg overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-6 py-8 space-y-8 view-enter">

          <SectionHeader
            kicker="Pitch room · brief the 9 department heads"
            title="Directorial Vision Lock"
            sub="Write your narrative premise, lock the visual DNA, and roll cameras. Tone and avoid-tags travel with the brief into the Director."
          />

          {/* 1. Story */}
          <div className="space-y-2">
            <label htmlFor="pitch-story" className="block text-[14px] font-medium text-cinema-paper">
              Story concept
            </label>
            <textarea
              id="pitch-story"
              rows={7}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Describe your film idea in a few sentences…"
              className="surface-input w-full p-4 text-[16px] resize-none min-h-[200px]"
            />
          </div>

          {/* 2. Visual Style */}
          <div className="space-y-3">
            <p className="text-[14px] font-medium text-cinema-paper">Visual style</p>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((style) => {
                const active = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    aria-pressed={active}
                    className={cn('chip transition-all', active && 'chip-active')}
                  >
                    {active && <Check className="w-3.5 h-3.5" />}
                    {style}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Add custom style (e.g. 1980s synthwave glow)…"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              className="surface-input w-full px-3 py-2 text-[14px]"
            />
          </div>

          {/* 3. Framing */}
          <div className="space-y-3">
            <p className="text-[14px] font-medium text-cinema-paper">Framing</p>
            <div className="flex gap-4">
              <AspectCard ratio="16:9" label="Widescreen" w={48} h={27} selected={aspectRatio === '16:9'} onClick={() => setAspectRatio('16:9')} />
              <AspectCard ratio="2.39:1" label="Anamorphic" w={60} h={25} selected={aspectRatio === '2.39:1'} onClick={() => setAspectRatio('2.39:1')} />
              <AspectCard ratio="9:16" label="Vertical" w={27} h={48} selected={aspectRatio === '9:16'} onClick={() => setAspectRatio('9:16')} />
            </div>
          </div>

          {/* 4. Avoid constraints */}
          <div className="space-y-3">
            <p className="text-[14px] font-medium text-cinema-paper">
              Avoid constraints
              <span className="ml-2 text-[12px] text-cinema-faint font-normal">Enforced by Director and Auditor across all prompt layers</span>
            </p>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl bg-cinema-surface border border-white/[0.08]">
              {avoidTags.map((tag) => (
                <span key={tag} className="chip !bg-cinema-raised">
                  {tag}
                  <button onClick={() => setAvoidTags((t) => t.filter((x) => x !== tag))} className="text-cinema-faint hover:text-cinema-paper" aria-label={`Remove ${tag}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={avoidInput}
                onChange={(e) => setAvoidInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addAvoidTag(avoidInput); } }}
                placeholder="Type and press Enter…"
                className="flex-1 min-w-[140px] bg-transparent text-[13px] text-cinema-paper placeholder:text-cinema-faint/60 focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Tone */}
          <div className="surface-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-cinema-paper">Dramatic intensity</span>
              <span className="timecode text-[14px] font-bold text-cinema-gold">{toneWeight}% · {toneLabel(toneWeight).split(',')[0]}</span>
            </div>
            <input
              type="range" min={10} max={100} value={toneWeight}
              onChange={(e) => setToneWeight(Number(e.target.value))}
              className="slider-gold"
              aria-label="Dramatic intensity"
            />
            <div className="flex justify-between text-[12px] text-cinema-faint">
              <span>Contemplative</span>
              <span>Balanced</span>
              <span>Hyper-kinetic</span>
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-white/[0.06] bg-cinema-bg/95 backdrop-blur px-6 py-4">
        <div className="max-w-[760px] mx-auto">
          <button
            type="button"
            onClick={handleRollCamera}
            disabled={!canRoll}
            className="btn-gold w-full py-4 text-[16px]"
          >
            <Clapperboard className="w-5 h-5" />
            Roll Camera — Start Studio Floor
            <Sparkles className="w-5 h-5 animate-pulse" />
          </button>
          {!canRoll && (
            <p className="text-center text-[12px] text-cinema-faint mt-2">Add a story and at least one visual style to roll.</p>
          )}
        </div>
      </div>
    </div>
  );
};
