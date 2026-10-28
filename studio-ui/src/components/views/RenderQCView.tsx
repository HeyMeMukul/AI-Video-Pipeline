import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  Cpu,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Activity,
  Zap,
} from 'lucide-react';

const QCFilmFrame: React.FC<{ sceneId: number; storyBeat: string }> = ({ sceneId, storyBeat }) => {
  const palettes = [
    ['#0D1B2A', '#1B4332', '#2D6A4F'],
    ['#1A1A2E', '#16213E', '#E94560'],
    ['#0F0C29', '#302B63', '#24243E'],
    ['#2C1810', '#4A2C2A', '#8B5E52'],
  ];
  const pal = palettes[(sceneId - 1) % palettes.length];
  const w = 524;
  const h = 295;
  const lbH = 28;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', aspectRatio: '16/9' }}>
      <defs>
        <linearGradient id={`qc-fg-${sceneId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal[0]} />
          <stop offset="50%" stopColor={pal[1]} />
          <stop offset="100%" stopColor={pal[2]} />
        </linearGradient>
        <filter id={`qc-grain-${sceneId}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
      </defs>
      {/* Background gradient */}
      <rect width={w} height={h} fill={`url(#qc-fg-${sceneId})`} />
      {/* Grain overlay */}
      <rect width={w} height={h} fill="rgba(255,255,255,0.04)" filter={`url(#qc-grain-${sceneId})`} />
      {/* Cinematic silhouette shapes */}
      <ellipse cx={w * 0.5} cy={h * 0.65} rx={w * 0.35} ry={h * 0.28} fill="rgba(0,0,0,0.4)" />
      <rect x={w * 0.12} y={h * 0.45} width={w * 0.16} height={h * 0.45} fill="rgba(0,0,0,0.3)" />
      <rect x={w * 0.72} y={h * 0.4} width={w * 0.14} height={h * 0.5} fill="rgba(0,0,0,0.25)" />
      {/* 2.39:1 Letterbox bars */}
      <rect width={w} height={lbH} fill="#000" />
      <rect y={h - lbH} width={w} height={lbH} fill="#000" />
      {/* Scene watermark */}
      <text x={w / 2} y={h / 2 - 10} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.7)" fontSize="18" fontFamily="'Playfair Display', Georgia, serif" fontWeight="600">
        Scene {sceneId} Master
      </text>
      <text x={w / 2} y={h / 2 + 18} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.4)" fontSize="12" fontFamily="Inter, sans-serif">
        Diffusion Latent 1080p Conformed
      </text>
    </svg>
  );
};

export const RenderQCView: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const setSelectedSceneId = useStudioStore((s) => s.setSelectedSceneId);

  const scene = project.scenes.find((s) => s.sceneId === selectedSceneId) || project.scenes[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#08090D] p-8 text-gray-200">
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cinema-gpu/10 border border-cinema-gpu/30 text-cinema-gpu">
              <Cpu className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                Tesla T4 Render Cluster
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Render &amp; Quality Control Deck
            </h1>
            <p className="text-[14px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Real-time GPU batch generation telemetry and 100-point multi-agent stability audit.
            </p>
          </div>

          {/* GPU Hardware Telemetry Pill */}
          <div className="flex items-center space-x-3 bg-[#131620] p-2.5 rounded-xl border border-white/[0.08] text-[13px] font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#D5D8E3]">Cluster: Tesla T4 (16GB VRAM)</span>
            </div>
            <span className="text-[#A9AEC0]">|</span>
            <span className="text-[#e5c07b]">VRAM: 14.2 / 16.0 GB</span>
          </div>
        </div>

        {/* Top: 4 Scenes Batch Status Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {project.scenes.map((s) => (
            <div
              key={s.sceneId}
              onClick={() => setSelectedSceneId(s.sceneId)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedSceneId === s.sceneId
                  ? 'bg-[#1A1E2C] border-[#e5c07b] shadow-lg shadow-[#e5c07b]/10'
                  : 'bg-[#131620] border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-semibold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Scene {s.sceneId}</span>
                <span className="text-emerald-400 flex items-center space-x-1 text-[12px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>PASS ({s.qc?.overallScore || 94}/100)</span>
                </span>
              </div>
              <div className="mt-2.5 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cinema-gpu to-[#e5c07b] w-full" />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[12px] font-mono text-[#A9AEC0]">
                <span>{s.durationSeconds}s Clip</span>
                <span>DiT Steps: 30/30</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Scene Deep QC Rubric & Verification Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: 100-Point Auditor Rubric Breakdown */}
          <div className="lg:col-span-6 p-6 rounded-2xl border border-white/[0.08] bg-[#131620] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] font-semibold text-cinema-auditor tracking-[0.08em] uppercase flex items-center space-x-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Auditor Vesper 100-Point Rubric</span>
                </span>
                <h3 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Scene {scene.sceneId} Verification Metrics
                </h3>
              </div>

              <div className="text-right">
                <span className="text-3xl font-mono font-bold text-emerald-400">
                  {scene.qc?.overallScore || 94}
                </span>
                <span className="text-[12px] font-mono text-[#A9AEC0] block">/ 100 points</span>
              </div>
            </div>

            {/* Rubric Category Bars */}
            <div className="space-y-4 text-[14px]">
              
              <div>
                <div className="flex justify-between text-[#D5D8E3] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span>Anatomical Stability (Hand &amp; Limb Rigidity)</span>
                  <span className="text-emerald-400 font-mono font-bold text-[13px]">{scene.qc?.anatomicalStability || 95}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${scene.qc?.anatomicalStability || 95}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#D5D8E3] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span>6DoF Camera Trajectory Smoothness</span>
                  <span className="text-emerald-400 font-mono font-bold text-[13px]">{scene.qc?.cameraStability || 94}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${scene.qc?.cameraStability || 94}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#D5D8E3] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span>Optical &amp; Aesthetic Clarity</span>
                  <span className="text-emerald-400 font-mono font-bold text-[13px]">{scene.qc?.opticalClarity || 92}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${scene.qc?.opticalClarity || 92}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#D5D8E3] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span>9-Layer Multimodal Prompt Conformity</span>
                  <span className="text-emerald-400 font-mono font-bold text-[13px]">{scene.qc?.promptConformity || 94}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${scene.qc?.promptConformity || 94}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#D5D8E3] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span>Cross-Scene Character Identity Match</span>
                  <span className="text-emerald-400 font-mono font-bold text-[13px]">{scene.qc?.characterConsistency || 92}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${scene.qc?.characterConsistency || 92}%` }}
                  />
                </div>
              </div>

            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[13px]">
              <span className="text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>Auditor Decision:</span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[12px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                APPROVED FOR MASTER CONFORM
              </span>
            </div>
          </div>

          {/* Right: Render Preview Monitor */}
          <div className="lg:col-span-6 p-6 rounded-2xl border border-white/[0.08] bg-[#131620] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-cinema-gpu tracking-[0.08em] uppercase flex items-center space-x-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Activity className="w-4 h-4" />
                  <span>DiT Generation Viewport</span>
                </span>
                <span className="text-[12px] font-mono text-[#A9AEC0]">1920x1080 @ 30fps</span>
              </div>

              {/* Video Mock Display Window with realistic SVG Frame Placeholder */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <QCFilmFrame sceneId={scene.sceneId} storyBeat={scene.storyBeat} />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="text-[12px] text-white/90 bg-black/60 px-2.5 py-1 rounded backdrop-blur max-w-[70%] truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                    "{scene.storyBeat}"
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#e5c07b]/20 border border-[#e5c07b]/40 text-[11px] font-mono text-[#e5c07b]">
                    Scene {scene.sceneId}
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Re-render trigger */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[14px]">
              <span className="text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>Need adjustments?</span>
              <button
                onClick={() => alert(`Re-dispatched Scene ${scene.sceneId} to GPU Engine.`)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[#D5D8E3] hover:text-white transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <RotateCw className="w-3.5 h-3.5 text-[#e5c07b]" />
                <span>Re-Render Scene {scene.sceneId}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
