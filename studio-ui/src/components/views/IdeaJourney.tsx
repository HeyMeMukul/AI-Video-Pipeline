import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  Sparkles,
  GitFork,
  CheckCircle,
  AlertTriangle,
  Layers,
  Camera,
  Film,
  User,
  MapPin,
  Check,
} from 'lucide-react';

export const IdeaJourney: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const setSelectedSceneId = useStudioStore((s) => s.setSelectedSceneId);
  const setActiveView = useStudioStore((s) => s.setActiveView);

  const [showDiffModal, setShowDiffModal] = useState(false);

  const activeScene = project.scenes.find((s) => s.sceneId === selectedSceneId) || project.scenes[0];

  const stages = [
    { id: 'idea', label: '1. Raw Idea', agent: 'Directorial Pitch', desc: project.story },
    { id: 'style', label: '2. Style DNA', agent: 'Aria Vance', desc: project.styleDna.join(', ') },
    { id: 'scenes', label: '3. Scene Breakdown', agent: 'Leo Thorne', desc: `${project.scenes.length} Scenes Conformed` },
    { id: 'characters', label: '4. Character Anchors', agent: 'Maya Lin', desc: `${project.characters.length} Biometric Profiles` },
    { id: 'environments', label: '5. World Geometries', agent: 'Dorian Cruz', desc: `${project.environments.length} Physical Stages` },
    { id: 'optics', label: '6. 6DoF Camera Vectors', agent: 'Cassian Ray', desc: 'Anamorphic & Orbital Paths' },
    { id: 'prompts', label: '7. 9-Layer DiT Prompts', agent: 'Nova Drake', desc: 'Embedded Dialogue & Foley' },
    { id: 'gpu', label: '8. GPU DiT Generation', agent: 'Tesla T4', desc: '4/4 Master Clips Rendered' },
    { id: 'qc', label: '9. Quality & Stability Audit', agent: 'Vesper', desc: 'Pass 95/100 (1 Retry Corrected)' },
    { id: 'timeline', label: '10. Master Reel & Subtitles', agent: 'Julian Cole', desc: 'CapCut ASS + Timeline Export' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#08090D] p-8 text-gray-200">
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cinema-character/10 border border-cinema-character/30 text-cinema-character">
              <GitFork className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                Transformation DAG
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Idea Journey: Autonomous Lineage
            </h1>
            <p className="text-[14px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Track how the original idea evolved across all 9 agents into final rendered video frames.
            </p>
          </div>

          {/* Diff view modal trigger */}
          <button
            onClick={() => setShowDiffModal(!showDiffModal)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[13px] font-medium hover:bg-amber-500/20 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Auditor Scene 3 Revision Diff</span>
          </button>
        </div>

        {/* Auditor Revision Diff Drawer / Callout */}
        {showDiffModal && (
          <div className="p-5 rounded-xl border border-amber-500/40 bg-amber-950/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-amber-300 flex items-center space-x-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                <AlertTriangle className="w-4 h-4" />
                <span>Auditor Autonomous Self-Healing Intervention: Scene 3</span>
              </span>
              <button
                onClick={() => setShowDiffModal(false)}
                className="text-[13px] text-[#A9AEC0] hover:text-white px-2 py-0.5"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Close Diff [×]
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="p-4 rounded-xl bg-black/60 border border-cinema-error/40 space-y-2">
                <div className="text-cinema-error font-bold uppercase text-[12px] tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Before Revision (QC Score: 68 - FAILED)
                </div>
                <div className="text-[#A9AEC0] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  "celestial sorcerer in crimson robes levitates conjuring twin glowing golden mandala shields..."
                </div>
                <div className="text-red-400 text-[12px] pt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Issue: Anatomical morphing hands (score: 54/100). Wrist glyphs melted into fingers.
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/40 space-y-2">
                <div className="text-emerald-400 font-bold uppercase text-[12px] tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  After Autonomous Revision (QC Score: 95 - PASSED)
                </div>
                <div className="text-[#F2F0EA] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  "...mandala shields. Added explicit negative constraint: 'Avoid: anatomically incorrect fingers, shifting wrist glyphs, morphing limbs'."
                </div>
                <div className="text-emerald-300 text-[12px] pt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Correction: Stable hand topology locked; prompt re-engineered and re-rendered in 7s.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Pipeline Stages Scroller */}
        <div className="space-y-3">
          <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Pipeline Linear Execution Graph
          </div>
          <div className="flex items-stretch space-x-3 overflow-x-auto pb-4 pt-1">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="w-52 shrink-0 p-4 rounded-xl border border-white/[0.08] bg-[#131620] hover:bg-[#1A1E2C] hover:border-[#e5c07b]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-[12px] text-[#e5c07b] font-semibold uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {stage.label}
                  </div>
                  <div className="text-[14px] font-semibold text-white mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {stage.agent}
                  </div>
                  <div className="text-[13px] text-[#A9AEC0] mt-1.5 line-clamp-2 leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {stage.desc}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[12px] text-emerald-400 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Conformed</span>
                  </span>
                  <span className="text-[#A9AEC0] font-mono">#{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scene Data Lineage Deep-Dive */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Interactive Scene Lineage Filter
            </div>
            <div className="flex items-center space-x-2">
              {project.scenes.map((s) => (
                <button
                  key={s.sceneId}
                  onClick={() => setSelectedSceneId(s.sceneId)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    selectedSceneId === s.sceneId
                      ? 'bg-[#e5c07b]/20 border-[#e5c07b] text-[#e5c07b]'
                      : 'bg-[#131620] border-white/[0.08] text-[#A9AEC0] hover:text-white'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Scene {s.sceneId}
                </button>
              ))}
            </div>
          </div>

          {/* Highlighted Lineage Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Story & Beat */}
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#131620] space-y-3">
              <div className="flex items-center space-x-2 text-cinema-screenplay text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Film className="w-3.5 h-3.5" />
                <span>Scene {activeScene.sceneId}: Narrative Core</span>
              </div>
              <div className="text-[15px] font-serif text-[#F2F0EA] leading-relaxed">
                "{activeScene.storyBeat}"
              </div>
              <div className="text-[13px] text-[#A9AEC0] pt-2 border-t border-white/5" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="text-[#e5c07b] font-medium">Dialogue:</span> "{activeScene.dialogue}"
              </div>
            </div>

            {/* Character & Environment Anchors */}
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#131620] space-y-3">
              <div className="flex items-center space-x-2 text-cinema-character text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                <User className="w-3.5 h-3.5" />
                <span>Characters &amp; Stage Sets</span>
              </div>
              <div className="space-y-2 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {activeScene.characterIds.map((cid) => {
                  const ch = project.characters.find((c) => c.id === cid);
                  return (
                    <div key={cid} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-[#F2F0EA] font-medium">{ch?.name || cid}</span>
                      <span className="text-cinema-character text-[12px] font-medium">{ch?.type}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center space-x-1.5 text-[12px] text-[#A9AEC0] pt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                <MapPin className="w-3.5 h-3.5 text-cinema-world" />
                <span>Location: {activeScene.locationId}</span>
              </div>
            </div>

            {/* Camera & Verification Output */}
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#131620] space-y-3">
              <div className="flex items-center space-x-2 text-cinema-cinematographer text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Camera className="w-3.5 h-3.5" />
                <span>6DoF Optics &amp; QC Score</span>
              </div>
              <div className="text-[13px] space-y-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="text-[#D5D8E3]"><span className="text-[#A9AEC0]">Lens:</span> <span className="font-mono text-[12px]">{activeScene.camera.lens}</span></div>
                <div className="text-[#D5D8E3]"><span className="text-[#A9AEC0]">Movement:</span> {activeScene.camera.movement}</div>
                <div className="text-[#A9AEC0] text-[12px] font-mono">
                  Vector: [{activeScene.camera.tx}, {activeScene.camera.ty}, {activeScene.camera.tz}]
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[13px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>Auditor Score:</span>
                <span className="text-[12px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {activeScene.qc?.overallScore || 94} / 100 PASS
                </span>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveView('prompt')}
              className="text-[13px] text-[#e5c07b] hover:underline flex items-center space-x-1 font-medium"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span>Inspect Full 9-Layer Multimodal Prompt in Prompt Lab →</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
