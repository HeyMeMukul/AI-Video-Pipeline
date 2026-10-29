import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  Cpu,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RotateCw,
  Activity,
  Clapperboard,
} from 'lucide-react';
import { SectionHeader, EmptyState } from '../ui/primitives';
import { cn } from '../ui/cn';

function RubricBar({ label, value }: { label: string; value: number }) {
  const good = value >= 70;
  return (
    <div>
      <div className="flex justify-between text-cinema-mist mb-1.5">
        <span>{label}</span>
        <span className={cn('font-mono font-bold text-[13px]', good ? 'text-emerald-400' : 'text-cinema-error')}>
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', good ? 'bg-emerald-500' : 'bg-cinema-error')}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

const SceneViewport: React.FC<{ sceneId: number; storyBeat: string; clipUrl?: string; frameUrl?: string }> = ({
  sceneId,
  storyBeat,
  clipUrl,
  frameUrl,
}) => {
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

  if (clipUrl) {
    return (
      <video
        src={clipUrl}
        className="block w-full aspect-video bg-black"
        controls
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }
  if (frameUrl) {
    return <img src={frameUrl} alt={`Rendered frame for scene ${sceneId}`} className="block w-full aspect-video object-cover bg-black" loading="lazy" />;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', aspectRatio: '16/9' }} role="img" aria-label={`Placeholder frame for scene ${sceneId}`}>
      <defs>
        <linearGradient id={`qc-fg-${sceneId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal[0]} />
          <stop offset="50%" stopColor={pal[1]} />
          <stop offset="100%" stopColor={pal[2]} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#qc-fg-${sceneId})`} />
      <ellipse cx={w * 0.5} cy={h * 0.65} rx={w * 0.35} ry={h * 0.28} fill="rgba(0,0,0,0.4)" />
      <rect width={w} height={lbH} fill="#000" />
      <rect y={h - lbH} width={w} height={lbH} fill="#000" />
      <text x={w / 2} y={h / 2 - 10} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.7)" fontSize="18" fontWeight="600">
        Scene {sceneId} · awaiting render
      </text>
      <text x={w / 2} y={h / 2 + 18} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.4)" fontSize="12">
        {storyBeat.slice(0, 64)}
      </text>
    </svg>
  );
};

export const RenderQCView: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const setSelectedSceneId = useStudioStore((s) => s.setSelectedSceneId);
  const runStage = useStudioStore((s) => s.runStage);
  const systemStatus = useStudioStore((s) => s.systemStatus);
  const [dispatching, setDispatching] = useState(false);

  if (project.scenes.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-cinema-bg p-8">
        <div className="max-w-3xl mx-auto space-y-6 view-enter">
          <SectionHeader
            kicker="Render and QC · idle"
            title="Render Deck"
            sub="Clips and auditor scores land here once the pipeline reaches the render farm."
          />
          <EmptyState
            icon={<Clapperboard className="w-5 h-5" />}
            title="Nothing on the render farm yet"
            body="Load a production from the vault, or pitch a new film to dispatch the GPU engine."
          />
        </div>
      </div>
    );
  }

  const scene = project.scenes.find((s) => s.sceneId === selectedSceneId) || project.scenes[0];
  const qc = scene.qc ?? { anatomicalStability: 0, cameraStability: 0, opticalClarity: 0, promptConformity: 0, characterConsistency: 0, overallScore: 0, passed: false, issues: [], flaggedTimestamps: [] };
  const statusTip = systemStatus
    ? `Render farm · ${systemStatus.kaggle} (${systemStatus.gpuModel})\nKnowledge · ${systemStatus.rea}\nMedia · ${systemStatus.ffmpeg}\nVoice · ${systemStatus.tts}`
    : 'Probing studio engine…';
  const shortFarm = !systemStatus?.kaggle ? 'probing…'
    : /ERROR/i.test(systemStatus.kaggle) ? 'error'
    : /RUNNING/i.test(systemStatus.kaggle) ? 'rendering'
    : /QUEU|PEND/i.test(systemStatus.kaggle) ? 'queued'
    : /COMPLETE|SUCCESS/i.test(systemStatus.kaggle) ? 'idle'
    : systemStatus.kaggle.length > 24 ? `${systemStatus.kaggle.slice(0, 24)}…` : systemStatus.kaggle;

  const handleRedispatch = async () => {
    setDispatching(true);
    try {
      await runStage('video');
    } finally {
      setTimeout(() => setDispatching(false), 1500);
    }
  };
  const pendingCount = project.scenes.filter((s) => !s.clipUrl).length;

  return (
    <div className="flex-1 overflow-y-auto bg-cinema-bg p-8">
      <div className="max-w-7xl mx-auto space-y-6 view-enter">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-4">
          <SectionHeader
            kicker={`Render and QC · scene ${scene.sceneId} of ${project.scenes.length}`}
            title="Render Deck"
            sub="Farm telemetry on the left of every card, Auditor Vesper's 100-point verdict on the right."
          />
          <div className="flex items-center gap-2 surface-card px-3 py-2 timecode text-[12px] shrink-0 max-w-[300px]" title={statusTip}>
            <span className={cn('w-2 h-2 rounded-full', systemStatus ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse')} />
            <span className="text-cinema-mist truncate">{systemStatus?.gpuModel || 'Render farm'}</span>
            <span className="text-cinema-faint shrink-0">·</span>
            <span className="text-cinema-gold truncate">{shortFarm}</span>
          </div>
        </div>

        {/* Batch status strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {project.scenes.map((s) => {
            const score = s.qc?.overallScore ?? 0;
            const passed = s.qc?.passed ?? false;
            const active = selectedSceneId === s.sceneId;
            return (
              <button
                key={s.sceneId}
                onClick={() => setSelectedSceneId(s.sceneId)}
                aria-pressed={active}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all',
                  active
                    ? 'bg-cinema-raised border-cinema-gold shadow-glow-gold'
                    : 'bg-cinema-surface border-white/[0.08] hover:border-white/20'
                )}
              >
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-semibold text-cinema-paper">Scene {s.sceneId}</span>
                  <span className={cn('flex items-center gap-1 text-[12px] font-bold', passed ? 'text-emerald-400' : 'text-cinema-faint')}>
                    {passed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{passed ? `Pass ${score}/100` : s.clipUrl ? `Scored ${score}` : 'Queued'}</span>
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', passed ? 'bg-gradient-to-r from-cinema-gpu to-cinema-gold' : 'bg-cinema-faint/40')}
                    style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between timecode text-[12px]">
                  <span>{s.durationSeconds}s clip</span>
                  <span>{s.clipUrl ? 'Rendered' : 'Pending'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Deep QC deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-6 surface-card p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="kicker flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Auditor Vesper · 100-point rubric
                </p>
                <h3 className="text-xl font-playfair font-bold text-cinema-paper mt-1">
                  Scene {scene.sceneId} verification
                </h3>
              </div>

              <div className="text-right shrink-0">
                <span className={cn('text-3xl font-mono font-bold', qc.passed ? 'text-emerald-400' : 'text-cinema-faint')}>
                  {qc.overallScore}
                </span>
                <span className="timecode text-[12px] block">/ 100 points</span>
              </div>
            </div>

            <div className="space-y-4 text-[14px]">
              <RubricBar label="Anatomical stability — hands and limbs" value={qc.anatomicalStability} />
              <RubricBar label="6DoF camera trajectory smoothness" value={qc.cameraStability} />
              <RubricBar label="Optical and aesthetic clarity" value={qc.opticalClarity} />
              <RubricBar label="Multimodal prompt conformity" value={qc.promptConformity} />
              <RubricBar label="Cross-scene character identity" value={qc.characterConsistency} />
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[13px]">
              <span className="text-cinema-mist">Auditor decision</span>
              <span className={cn('font-bold text-[12px]', qc.passed ? 'text-emerald-400' : 'text-cinema-faint')}>
                {qc.passed ? 'Approved for master conform' : 'Awaiting audit'}
              </span>
            </div>
            {!qc.passed && qc.issues.length > 0 && (
              <ul className="space-y-1 text-[12.5px] text-cinema-error">
                {qc.issues.map((issue) => (
                  <li key={issue}>× {issue}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-6 surface-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="kicker flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  Generation viewport
                </p>
                <span className="timecode text-[12px]">1920×1080 · 30fps</span>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lift">
                <SceneViewport sceneId={scene.sceneId} storyBeat={scene.storyBeat} clipUrl={scene.clipUrl} frameUrl={scene.keyframeUrl} />
                {!scene.clipUrl && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="timecode text-[11.5px] text-cinema-paper bg-black/60 px-2.5 py-1 rounded backdrop-blur max-w-[70%] truncate">
                      {scene.storyBeat}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cinema-gold/20 border border-cinema-gold/40 text-[11px] font-mono text-cinema-gold shrink-0">
                      Scene {scene.sceneId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[14px]">
              <span className="text-cinema-mist">Need adjustments?</span>
              <button onClick={handleRedispatch} disabled={dispatching || pendingCount === 0} className="btn-ghost px-3.5 py-2">
                <RotateCw className={cn('w-3.5 h-3.5 text-cinema-gold', dispatching && 'animate-spin')} />
                <span>{dispatching ? 'Dispatching…' : pendingCount === 0 ? 'All scenes rendered' : `Render ${pendingCount} pending scene${pendingCount > 1 ? 's' : ''}`}</span>
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-cinema-faint">
              <Cpu className="w-3.5 h-3.5" />
              Dispatches the full video stage — every scene without a clip renders, finished ones are skipped.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
