import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { SceneModel } from '../../types/pipeline';
import {
  Film,
  Camera,
  Layers,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Sparkles,
  Volume2,
} from 'lucide-react';

const SceneFilmFrame: React.FC<{ sceneId: number }> = ({ sceneId }) => {
  const palettes = [
    ['#0D1B2A','#1B4332'],
    ['#1A1A2E','#16213E'],
    ['#0F0C29','#302B63'],
    ['#2C1810','#4A2C2A'],
  ];
  const pal = palettes[(sceneId - 1) % palettes.length];
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

  return (
    <div className="flex-1 overflow-y-auto bg-[#08090d] p-8 text-gray-200">
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cinema-border pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cinema-cinematographer/10 border border-cinema-cinematographer/30 text-cinema-cinematographer">
              <Film className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Scene Board</span>
            </div>
            <h1 className="text-3xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Scene Board (SVALE Storyboard)
            </h1>
            <p className="text-[14px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Structured cinematic shots conforming Subject · Verb · Atmosphere · Location · Emotion.
            </p>
          </div>

          <div className="text-right text-[13px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div>Total Runtime: <span className="text-[#e5c07b] font-bold">26 Seconds</span></div>
            <div>Aspect Ratio: <span className="text-white font-mono">{project.aspectRatio}</span></div>
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
                className={`rounded-2xl border transition-all duration-200 p-5 space-y-4 flex flex-col justify-between cursor-pointer ${
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
                      <span className="text-sm font-semibold text-white">
                        Scene {scene.sceneId}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[12px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <Clock className="w-3 h-3 text-cinema-gold" />
                        <span>{scene.durationSeconds}s</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                        {scene.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* SVALE Colored Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded text-[12px] bg-blue-950/60 text-blue-300 border border-blue-500/30" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Subject: {scene.svale.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[12px] bg-purple-950/60 text-purple-300 border border-purple-500/30" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Verb: {scene.svale.verb}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[12px] bg-teal-950/60 text-teal-300 border border-teal-500/30" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Atmosphere: {scene.svale.atmosphere}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[12px] bg-amber-950/60 text-amber-300 border border-amber-500/30" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Location: {scene.svale.location}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[12px] bg-rose-950/60 text-rose-300 border border-rose-500/30" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  {currentTab === 'overview' && (
                    <div className="space-y-2">
                      <SceneFilmFrame sceneId={scene.sceneId} />
                      <p className="text-[14px] text-[#D5D8E3] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                        "{scene.storyBeat}"
                      </p>
                      {scene.dialogue && (
                        <div className="p-2 rounded bg-black/40 border border-cinema-gold/20 flex items-start space-x-2">
                          <Volume2 className="w-3.5 h-3.5 text-cinema-gold shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[12px] text-cinema-gold font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Dialogue ({scene.voiceEmotion}):</span>
                            <span className="text-[13px] text-gray-300 ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>"{scene.dialogue}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentTab === 'camera' && (
                    <div className="space-y-2 text-[13px] text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-black/40 border border-white/5">
                          <span className="text-[12px] text-[#A9AEC0] font-semibold block" style={{ fontFamily: 'Inter, sans-serif' }}>Lens &amp; Optics</span>
                          <span className="text-cinema-cinematographer font-mono text-[12px]">{scene.camera.lens}</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/5">
                          <span className="text-[12px] text-[#A9AEC0] font-semibold block" style={{ fontFamily: 'Inter, sans-serif' }}>Movement path</span>
                          <span className="text-gray-200">{scene.camera.movement}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-black/40 border border-white/5 text-[12px] font-mono text-gray-400">
                        Vector Matrix: [{scene.camera.tx}, {scene.camera.ty}, {scene.camera.tz}] · Pitch {scene.camera.pitch}° · Yaw {scene.camera.yaw}°
                      </div>
                    </div>
                  )}

                  {currentTab === 'prompt' && (
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-black/50 border border-white/5 font-mono text-[11px] text-gray-300 line-clamp-4 leading-relaxed">
                        {scene.videoPrompt}
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
                        <span>Inspect in 9-Layer Prompt Lab →</span>
                      </button>
                    </div>
                  )}

                  {currentTab === 'qc' && (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                          <span className="text-gray-400">Anatomical:</span>
                          <span className="text-emerald-400 font-bold">{scene.qc?.anatomicalStability || 95}%</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                          <span className="text-gray-400">Camera 6DoF:</span>
                          <span className="text-emerald-400 font-bold">{scene.qc?.cameraStability || 94}%</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                          <span className="text-gray-400">Optical Clarity:</span>
                          <span className="text-emerald-400 font-bold">{scene.qc?.opticalClarity || 92}%</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                          <span className="text-gray-400">Conformity:</span>
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
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-cinema-character" />
                    <span>{scene.characterIds.join(', ')}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-cinema-editor">
                    <Film className="w-3 h-3" />
                    <span>Clip Chain 100%</span>
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
