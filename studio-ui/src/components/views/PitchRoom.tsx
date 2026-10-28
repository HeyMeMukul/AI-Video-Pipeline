import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Sparkles, Clapperboard, Check, X } from 'lucide-react';

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

const AspectCard: React.FC<{
  ratio: string; label: string; w: number; h: number;
  selected: boolean; onClick: () => void;
}> = ({ ratio, label, w, h, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
      selected
        ? 'bg-[#e5c07b]/15 border-[#e5c07b] shadow-md shadow-[#e5c07b]/10'
        : 'bg-[#131620] border-white/[0.08] hover:border-white/20'
    }`}
  >
    <svg viewBox={`0 0 ${w} ${h}`} width={w * 1.4} height={h * 1.4}
      className="overflow-visible">
      <rect x="0" y="0" width={w} height={h} rx="2"
        fill={selected ? 'rgba(229,192,123,0.15)' : 'rgba(255,255,255,0.05)'}
        stroke={selected ? '#e5c07b' : 'rgba(255,255,255,0.2)'}
        strokeWidth="1.5" />
    </svg>
    <span className={`text-xs font-mono font-bold ${selected ? 'text-[#e5c07b]' : 'text-[#A9AEC0]'}`}>{ratio}</span>
    <span className="text-[11px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
  </button>
);

export const PitchRoom: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const startProduction = useStudioStore((s) => s.startProduction);

  const PLACEHOLDER_STORY = 'Your story idea will appear here';
  const [story, setStory] = useState(project.story.startsWith(PLACEHOLDER_STORY) ? '' : project.story);
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
    setSelectedStyles(s => s.includes(style) ? s.filter(x => x !== style) : [...s, style]);
  };

  const addAvoidTag = (val: string) => {
    const tag = val.trim();
    if (tag && !avoidTags.includes(tag)) setAvoidTags(t => [...t, tag]);
    setAvoidInput('');
  };

  const handleRollCamera = () => {
    const finalStyles = customStyle ? [...selectedStyles, customStyle] : selectedStyles;
    startProduction(story, finalStyles, aspectRatio);
  };

  return (
    <div className="flex flex-col h-full bg-[#08090D] overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e5c07b]/10 border border-[#e5c07b]/30">
              <Clapperboard className="w-3.5 h-3.5 text-[#e5c07b]" />
              <span className="text-[12px] font-semibold text-[#e5c07b] tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Pitch Room</span>
            </div>
            <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Directorial Vision Lock
            </h1>
            <p className="text-[15px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Brief the 9 AI department heads. Write your narrative premise, lock the visual DNA, and roll cameras.
            </p>
          </div>

          {/* 1. Story */}
          <div className="space-y-2">
            <label className="block text-[14px] font-medium text-[#D5D8E3]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Story concept
            </label>
            <textarea
              rows={7}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Describe your film idea in a few sentences…"
              className="w-full p-4 rounded-xl bg-[#131620] border border-white/[0.08] focus:border-[#e5c07b] text-[18px] text-[#F2F0EA] placeholder-[#A9AEC0]/50 focus:outline-none transition-colors resize-none min-h-[200px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* 2. Visual Style */}
          <div className="space-y-3">
            <label className="block text-[14px] font-medium text-[#D5D8E3]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Visual style
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((style) => {
                const active = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] font-medium border transition-all ${
                      active
                        ? 'bg-[#e5c07b]/15 border-[#e5c07b] text-[#e5c07b]'
                        : 'bg-[#131620] border-white/[0.08] text-[#A9AEC0] hover:text-[#D5D8E3] hover:border-white/20'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
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
              className="w-full px-3 py-2 rounded-lg bg-[#131620] border border-white/[0.08] text-[14px] text-[#F2F0EA] placeholder-[#A9AEC0]/50 focus:outline-none focus:border-[#e5c07b] transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* 3. Framing */}
          <div className="space-y-3">
            <label className="block text-[14px] font-medium text-[#D5D8E3]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Framing
            </label>
            <div className="flex gap-4">
              <AspectCard ratio="16:9" label="Widescreen" w={48} h={27} selected={aspectRatio === '16:9'} onClick={() => setAspectRatio('16:9')} />
              <AspectCard ratio="2.39:1" label="Anamorphic" w={60} h={25} selected={aspectRatio === '2.39:1'} onClick={() => setAspectRatio('2.39:1')} />
              <AspectCard ratio="9:16" label="Vertical" w={27} h={48} selected={aspectRatio === '9:16'} onClick={() => setAspectRatio('9:16')} />
            </div>
          </div>

          {/* 4. Avoid constraints */}
          <div className="space-y-3">
            <label className="block text-[14px] font-medium text-[#D5D8E3]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Avoid constraints
              <span className="ml-2 text-[12px] text-[#A9AEC0] font-normal">Enforced by Director &amp; Auditor across all prompt layers</span>
            </label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl bg-[#131620] border border-white/[0.08]">
              {avoidTags.map((tag) => (
                <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1E2C] border border-white/10 text-[13px] text-[#D5D8E3]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {tag}
                  <button onClick={() => setAvoidTags(t => t.filter(x => x !== tag))} className="text-[#A9AEC0] hover:text-white">
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
                className="flex-1 min-w-[140px] bg-transparent text-[13px] text-[#F2F0EA] placeholder-[#A9AEC0]/50 focus:outline-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* 5. Tone slider */}
          <div className="p-4 rounded-xl bg-[#131620] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-[#D5D8E3]" style={{ fontFamily: 'Inter, sans-serif' }}>Dramatic intensity</span>
              <span className="text-[14px] font-mono font-bold text-[#e5c07b]">{toneWeight}%</span>
            </div>
            <input
              type="range" min={10} max={100} value={toneWeight}
              onChange={(e) => setToneWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#e5c07b]"
            />
            <div className="flex justify-between text-[12px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>Contemplative</span>
              <span>Balanced</span>
              <span>Hyper-kinetic</span>
            </div>
          </div>

          {/* Bottom padding for sticky footer */}
          <div className="h-4" />
        </div>
      </div>

      {/* Sticky footer with Roll Camera */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#08090D]/95 backdrop-blur px-6 py-4">
        <div className="max-w-[760px] mx-auto">
          <button
            type="button"
            onClick={handleRollCamera}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#e5c07b] via-[#f3d294] to-[#e5c07b] text-[#08090D] font-bold text-[16px] shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            <Clapperboard className="w-5 h-5" />
            Roll Camera — Start Studio Floor
            <Sparkles className="w-5 h-5 animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
};
