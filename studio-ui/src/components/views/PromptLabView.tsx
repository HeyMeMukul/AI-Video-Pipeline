import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { AGENT_PERSONAS } from '../../mock/personas';
import { Copy, Check, ScrollText } from 'lucide-react';
import { SectionHeader, EmptyState } from '../ui/primitives';

// Top-down camera SVG visualizer
const CameraVisualizerSVG: React.FC<{ lens: string; movement: string }> = ({ lens, movement }) => {
  return (
    <div className="space-y-2">
      <svg viewBox="0 0 200 160" className="w-full" style={{ maxHeight: 160 }} role="img" aria-label={`Camera plan: ${lens}, ${movement}`}>
        {/* Grid */}
        {[40, 80, 120, 160, 200].map((x) => (
          <line key={`vg-${x}`} x1={x} y1="0" x2={x} y2="160" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {[40, 80, 120].map((y) => (
          <line key={`hg-${y}`} x1="0" y1={y} x2="200" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {/* Subject (the scene center) */}
        <circle cx="100" cy="40" r="10" fill="rgba(229,192,123,0.2)" stroke="#e5c07b" strokeWidth="1.5" />
        <text x="100" y="43" textAnchor="middle" fill="#e5c07b" fontSize="7">SUBJ</text>
        {/* FOV cone */}
        <path d="M 100 115 L 68 50 Q 100 35 132 50 Z" fill="rgba(187,154,247,0.08)" stroke="rgba(187,154,247,0.4)" strokeWidth="1" />
        {/* Camera body */}
        <rect x="87" y="110" width="26" height="16" rx="3" fill="#1a1e2c" stroke="#bb9af7" strokeWidth="1.5" />
        <circle cx="100" cy="118" r="4" fill="none" stroke="#bb9af7" strokeWidth="1.5" />
        {/* Movement arc */}
        <path d="M 72 118 Q 100 135 128 118" fill="none" stroke="#bb9af7" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Arrow on arc */}
        <polygon points="128,118 122,113 124,120" fill="#bb9af7" />
      </svg>
      <div className="px-3 py-2 rounded-lg bg-cinema-raised border border-white/[0.06]">
        <p className="text-[13px] text-cinema-mist">
          <span className="text-cinema-cinematographer font-medium">{lens}</span>
          {' — '}{movement}
        </p>
      </div>
    </div>
  );
};

export const PromptLabView: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const setSelectedSceneId = useStudioStore((s) => s.setSelectedSceneId);
  const [copied, setCopied] = useState(false);

  if (project.scenes.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-cinema-bg p-8">
        <div className="max-w-3xl mx-auto space-y-6 view-enter">
          <SectionHeader
            kicker="Prompt lab · no scenes yet"
            title="Prompt Assembly"
            sub="Scene prompts land here once Story Breakdown and Prompt Builder have run."
          />
          <EmptyState
            icon={<ScrollText className="w-5 h-5" />}
            title="No prompts to inspect"
            body="Load a production from the vault, or pitch a new film to synthesize the 9-layer assembly stack."
          />
        </div>
      </div>
    );
  }

  const scene = project.scenes.find((s) => s.sceneId === selectedSceneId) || project.scenes[0];

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(scene.videoPrompt || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalTokens = scene.promptLayers?.reduce((acc, l) => acc + l.tokenCount, 0) || 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-cinema-bg">
      {/* Header row */}
      <div className="shrink-0 px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
        <SectionHeader
          kicker={`Prompt lab · scene ${scene.sceneId} of ${project.scenes.length}`}
          title="Prompt Assembly"
          sub="The 9-layer audio-visual formula, verbatim from the Character and Environment bibles."
        />
        <div className="flex items-center gap-3 shrink-0">
          {totalTokens > 0 && <span className="timecode text-[13px]">~{totalTokens} tokens</span>}
          <button
            onClick={handleCopyPrompt}
            disabled={!scene.videoPrompt}
            className="btn-gold px-3 py-1.5 text-[14px]"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy prompt'}
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: scene tabs + camera */}
        <div className="w-[38%] shrink-0 border-r border-white/[0.06] flex flex-col overflow-y-auto">
          <div className="p-4 space-y-2">
            <p className="kicker">Scene</p>
            <div className="flex flex-col gap-1">
              {project.scenes.map((s) => (
                <button
                  key={s.sceneId}
                  onClick={() => setSelectedSceneId(s.sceneId)}
                  aria-pressed={selectedSceneId === s.sceneId}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                    selectedSceneId === s.sceneId
                      ? 'bg-cinema-cinematographer/15 text-cinema-cinematographer border border-cinema-cinematographer/30'
                      : 'text-cinema-faint hover:text-cinema-mist hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  Scene {s.sceneId} — <span className="text-[13px] font-normal opacity-75 line-clamp-1">{s.storyBeat?.slice(0, 40)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-4 border-t border-white/[0.06]" />

          <div className="p-4 space-y-3">
            <p className="kicker">Camera · Cassian Ray</p>
            <CameraVisualizerSVG lens={scene.camera?.lens || '50mm Anamorphic'} movement={scene.camera?.movement || 'Slow push-in'} />
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="p-2 rounded-lg bg-cinema-surface border border-white/[0.06]">
                <span className="text-cinema-faint">Vector</span>
                <p className="font-mono text-cinema-mist text-[11px]">[{scene.camera?.tx},{scene.camera?.ty},{scene.camera?.tz}]</p>
              </div>
              <div className="p-2 rounded-lg bg-cinema-surface border border-white/[0.06]">
                <span className="text-cinema-faint">Emotion</span>
                <p className="text-cinema-mist font-medium">{scene.voiceEmotion || '—'}</p>
              </div>
            </div>
          </div>

          {scene.dialogue && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-cinema-surface border border-white/[0.06] space-y-1">
              <p className="kicker">Dialogue</p>
              <p className="text-[14px] text-cinema-paper">“{scene.dialogue}”</p>
            </div>
          )}
        </div>

        {/* RIGHT: layer stack */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-2">
          <p className="kicker mb-3">Assembly stack · {scene.promptLayers?.length ?? 0} layers</p>
          {(!scene.promptLayers || scene.promptLayers.length === 0) && (
            <EmptyState
              icon={<ScrollText className="w-5 h-5" />}
              title="Layers not synthesized yet"
              body={scene.videoPrompt || 'Run the Prompt Builder stage to decompose this scene into the 9-layer formula.'}
            />
          )}
          {scene.promptLayers?.map((layer) => {
            const persona = AGENT_PERSONAS[layer.agentId];
            const attentionColor = layer.attentionWeight === 'high' ? '#f7768e' : layer.attentionWeight === 'medium' ? '#e5c07b' : '#4a5568';
            return (
              <div
                key={layer.index}
                className="flex gap-0 rounded-xl overflow-hidden border border-white/[0.06] bg-cinema-surface hover:bg-cinema-raised transition-colors"
              >
                <div className="w-1 shrink-0 self-stretch" style={{ backgroundColor: persona.color }} />

                <div className="flex-1 min-w-0 px-3 py-2.5 flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 border"
                    style={{ borderColor: persona.color, color: persona.color, backgroundColor: `${persona.color}20` }}
                  >
                    {layer.index}
                  </span>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-cinema-paper">{layer.name}</span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full border font-medium"
                        style={{ color: persona.color, borderColor: `${persona.color}40`, backgroundColor: `${persona.color}12` }}
                      >
                        {persona.name}
                      </span>
                    </div>
                    <p className="text-[13px] text-cinema-mist leading-relaxed">{layer.text}</p>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1.5 text-right ml-2">
                    <span className="timecode text-[11px]">{layer.tokenCount}t</span>
                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: attentionColor, opacity: 0.7 }} title={`${layer.attentionWeight} attention weight`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
