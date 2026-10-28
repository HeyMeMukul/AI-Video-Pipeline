import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { SceneModel } from '../../types/pipeline';
import {
  Film,
  Layers,
  Clock,
  User,
  Volume2,
} from 'lucide-react';

import { SectionHeader } from '../ui/primitives';

const SceneFilmFrame: React.FC<{ sceneId: number; frameUrl?: string }> = ({ sceneId, frameUrl }) => {
  const palettes = [
    ['#0D1B2A','#1B4332'],
    ['#1A1A2E','#16213E'],
    ['#0F0C29','#302B63'],
    ['#2C1810','#4A2C2A'],
  ];
  const pal = palettes[(sceneId - 1) % palettes.length];
  if (frameUrl) {
    return (
      <span className="block overflow-hidden rounded-lg border border-white/[0.08]">
        <img src={frameUrl} alt={`Storyboard frame for scene ${sceneId}`} className="w-full block aspect-[32/13.5] object-cover" loading="lazy" />
      </span>
    );
  }
  return (
    <svg viewBox="0 0 320 135" className="w-full" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sfg-${sceneId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal[0]} />
          <stop offset="100%" stopColor={pal[1]} />
        </linearGradient>
      </defs>
      <rect width="320" height="135" fill={`url(#sfg-${sceneId})`} />
      <ellipse cx="160" cy="95" rx="80" ry="45" fill="rgba(0,0,0,0.35)" />
      <rect x="40" y="70" width="40" height="55" fill="rgba(0,0,0,0.25)" />
      <rect x="240" y="65" width="35" height="60" fill="rgba(0,0,0,0.2)" />
      {/* Letterbox */}
      <rect width="320" height="14" fill="black" />
      <rect y="121" width="320" height="14" fill="black" />
      <text x="160" y="72" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="11" fontFamily="Inter, sans-serif">Scene {sceneId}</text>
    </svg>
  );
};

export const SceneBoardView: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const setSelectedSceneId = useStudioStore((s) => s.setSelectedSceneId);
  const setActiveView = useStudioStore((s) => s.setActiveView);

  const [activeTabPerScene, setActiveTabPerScene] = useState<Record<number, string>>({
    1: 'overview',
    2: 'overview',
    3: 'overview',
    4: 'overview',
  });

  const setTab = (sceneId: number, tab: string) => {
    setActiveTabPerScene((prev) => ({ ...prev, [sceneId]: tab }));
  };

  const totalRuntime = project.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-cinema-bg p-8">
      <div className="max-w-7xl mx-auto space-y-6 view-enter">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
          <SectionHeader
            kicker={`Scene board · ${project.scenes.length} scenes · SVALE structure`}
            title="Shot Conformance"
            sub="Structured cinematic shots conforming Subject, Verb, Atmosphere, Location, Emotion."
          />

          <div className="text-right timecode text-[12px] shrink-0 pt-1">
            <div>Total runtime · <span className="text-cinema-gold font-bold">{totalRuntime}s</span></div>
            <div>Aspect · <span className="text-cinema-paper">{project.aspectRatio}</span></div>
          </div>
        </div>

        {/* Storyboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {project.scenes.map((scene) => {
            const currentTab = activeTabPerScene[scene.sceneId] || 'overview';
            const isSelected = selectedSceneId === scene.sceneId;

            return (
              <div
                key={scene.sceneId}
                onClick={() => setSelectedSceneId(scene.sceneId)}
                className={`rounded-xl border transition-all duration-200 p-5 space-y-4 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-cinema-surface border-cinema-gold/70 shadow-xl shadow-cinema-gold/5'
                    : 'bg-cinema-surface/70 border-cinema-border hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Scene Number + Duration + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-lg bg-cinema-gold/20 border border-cinema-gold/40 text-cinema-gold font-mono font-bold text-xs flex items-center justify-center">
                        S{scene.sceneId}
                      </span>
                      <span className="text-sm font-semibold text-cinema-paper">
                        Scene {scene.sceneId}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[12px]">
                        <Clock className="w-3 h-3 text-cinema-gold" />
                        <span>{scene.durationSeconds}s</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                        {scene.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* SVALE Colored Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded text-[12px] bg-blue-950/60 text-blue-300 border border-blue-500/30">
                      Subject: {scene.svale.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[12px] bg-purple-950/60 text-purple-300 border border-purple-500/30">
                      Verb: {scene.svale.verb}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[12px] bg-teal-950/60 text-teal-300 border border-teal-500/30">
                      Atmosphere: {scene.svale.atmosphere}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[12px] bg-amber-950/60 text-amber-300 border border-amber-500/30">
                      Location: {scene.svale.location}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[12px] bg-rose-950/60 text-rose-300 border border-rose-500/30">
                      Emotion: {scene.svale.emotion}
                    </span>
                  </div>

                  {/* Scene Tabs */}
                  <div className="flex items-center space-x-1 border-b border-white/5 pt-2">
                    {['overview', 'camera', 'prompt', 'qc'].map((t) => (
                      <button
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTab(scene.sceneId, t);
                        }}
                        className={`px-2.5 py-1 rounded-t font-medium transition-colors text-[13px] ${
                          currentTab === t
                            ? 'text-cinema-gold border-b-2 border-cinema-gold bg-white/5'
                            : 'text-cinema-faint hover:text-cinema-mist'
                        }`}
                       
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  {currentTab === 'overview' && (
                    <div className="space-y-2">
                      <SceneFilmFrame sceneId={scene.sceneId} frameUrl={scene.keyframeUrl} />
                      <p className="text-[14px] text-cinema-mist leading-relaxed">
                        "{scene.storyBeat}"
                      </p>
                      {scene.dialogue && (
                        <div className="p-2 rounded bg-black/40 border border-cinema-gold/20 flex items-start space-x-2">
                          <Volume2 className="w-3.5 h-3.5 text-cinema-gold shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[12px] text-cinema-gold font-semibold">Dialogue ({scene.voiceEmotion}):</span>
                            <span className="text-[13px] text-cinema-mist ml-1">"{scene.dialogue}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentTab === 'camera' && (
                    <div className="space-y-2 text-[13px] text-cinema-mist">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-black/40 border border-white/5">
                          <span className="text-[12px] text-cinema-mist font-semibold block">Lens &amp; Optics</span>
                          <span className="text-cinema-cinematographer font-mono text-[12px]">{scene.camera.lens}</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/5">
                          <span className="text-[12px] text-cinema-mist font-semibold block">Movement path</span>
                          <span className="text-cinema-paper">{scene.camera.movement}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-black/40 border border-white/5 text-[12px] font-mono text-cinema-faint">
                        Vector Matrix: [{scene.camera.tx}, {scene.camera.ty}, {scene.camera.tz}] · Pitch {scene.camera.pitch}° · Yaw {scene.camera.yaw}°
                      </div>
                    </div>
                  )}

                  {currentTab === 'prompt' && (
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-black/50 border border-white/5 font-mono text-[11px] text-cinema-mist line-clamp-4 leading-relaxed">
                        {scene.videoPrompt || 'Prompt not synthesized yet — run the Prompt Builder stage.'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSceneId(scene.sceneId);
                          setActiveView('prompt');
                        }}
                        className="text-[10px] font-mono text-cinema-gold hover:underline flex items-center space-x-1"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Inspect in Prompt Lab</span>
                      </button>
                    </div>
                  )}

                  {currentTab === 'qc' && (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                          <span className="text-cinema-faint">Anatomical:</span>
                          <span className="text-emerald-400 font-bold">{scene.qc?.anatomicalStability || 95}%</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                          <span className="text-cinema-faint">Camera 6DoF:</span>
                          <span className="text-emerald-400 font-bold">{scene.qc?.cameraStability || 94}%</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                          <span className="text-cinema-faint">Optical Clarity:</span>
                          <span className="text-emerald-400 font-bold">{scene.qc?.opticalClarity || 92}%</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                          <span className="text-cinema-faint">Conformity:</span>
                          <span className="text-emerald-400 font-bold">{scene.qc?.promptConformity || 94}%</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between">
                        <span>Overall Auditor Pass:</span>
                        <span className="font-bold">{scene.qc?.overallScore || 94} / 100</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Clip Chain / Characters */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-cinema-faint">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-cinema-character" />
                    <span>{scene.characterIds.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-1 text-cinema-editor">
                    <Film className="w-3 h-3" />
                    <span>{scene.clipUrl ? 'Clip rendered' : 'Awaiting render'}</span>
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
