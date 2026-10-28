import React from 'react';
import { useStudioStore, useDerivedStudioState } from '../../store/useStudioStore';
import {
  CheckCircle,
  AlertTriangle,
  Camera,
  Film,
  User,
  MapPin,
  Route,
} from 'lucide-react';
import { SectionHeader, EmptyState } from '../ui/primitives';
import { cn } from '../ui/cn';

export const IdeaJourney: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const setSelectedSceneId = useStudioStore((s) => s.setSelectedSceneId);
  const setActiveView = useStudioStore((s) => s.setActiveView);
  const { agentStatuses, retryCount } = useDerivedStudioState();

  if (project.scenes.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-cinema-bg p-8">
        <div className="max-w-3xl mx-auto space-y-6 view-enter">
          <SectionHeader
            kicker="Idea journey · no lineage yet"
            title="Lineage"
            sub="Every transformation from raw idea to master reel is traced here once the pipeline runs."
          />
          <EmptyState
            icon={<Route className="w-5 h-5" />}
            title="No journey to trace yet"
            body="Load a production from the vault, or pitch a new film to start the lineage."
          />
        </div>
      </div>
    );
  }

  const activeScene = project.scenes.find((s) => s.sceneId === selectedSceneId) || project.scenes[0];
  const passedCount = project.scenes.filter((s) => s.qc?.passed).length;
  const avgScore = Math.round(
    project.scenes.reduce((sum, s) => sum + (s.qc?.overallScore ?? 0), 0) / project.scenes.length
  );
  const renderedCount = project.scenes.filter((s) => s.clipUrl).length;
  const flaggedScenes = project.scenes.filter((s) => (s.qc?.issues?.length ?? 0) > 0 || s.qc?.passed === false);

  const done = (agents: string[]) => agents.some((a) => ['done', 'working', 'thinking', 'retrying'].includes(agentStatuses[a as keyof typeof agentStatuses]));
  const mark = (ok: boolean) => ok;

  const stages = [
    { id: 'idea', step: 'Raw idea', agent: 'Directorial pitch', desc: project.story.slice(0, 90) + (project.story.length > 90 ? '…' : ''), ok: true },
    { id: 'style', step: 'Style DNA', agent: 'Aria Vance', desc: project.styleDna.join(', ') || '—', ok: done(['director']) },
    { id: 'scenes', step: 'Scene breakdown', agent: 'Leo Thorne', desc: `${project.scenes.length} scenes conformed`, ok: done(['screenplay']) },
    { id: 'characters', step: 'Character anchors', agent: 'Maya Lin', desc: `${project.characters.length} biometric profiles`, ok: done(['character']) },
    { id: 'environments', step: 'World geometries', agent: 'Dorian Cruz', desc: `${project.environments.length} physical stages`, ok: done(['world']) },
    { id: 'optics', step: 'Camera vectors', agent: 'Cassian Ray', desc: `${project.scenes.length} 6DoF plans`, ok: done(['cinematographer']) },
    { id: 'prompts', step: 'Prompt synthesis', agent: 'Nova Drake', desc: 'Dialogue and Foley embedded', ok: done(['prompt_alchemist']) },
    { id: 'gpu', step: 'GPU generation', agent: 'Render farm', desc: `${renderedCount}/${project.scenes.length} clips rendered`, ok: done(['gpu']) },
    { id: 'qc', step: 'Quality audit', agent: 'Vesper', desc: retryCount > 0 ? `Avg ${avgScore}/100 · ${retryCount} retries` : `Avg ${avgScore}/100`, ok: done(['auditor']) },
    { id: 'timeline', step: 'Master reel', agent: 'Julian Cole', desc: project.finalReelUrl ? 'Conform ready in Screening Room' : 'Awaiting conform', ok: project.finalReelUrl ? true : mark(done(['editor'])) },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-cinema-bg p-8">
      <div className="max-w-7xl mx-auto space-y-8 view-enter">

        <SectionHeader
          kicker={`Lineage · ${project.projectName} · ${passedCount}/${project.scenes.length} scenes passed`}
          title="Idea to Reel"
          sub="How the original premise evolved across the departments into rendered frames."
        />

        {/* Audit trail — real interventions only */}
        {flaggedScenes.length > 0 ? (
          <div className="surface-card p-5 space-y-3 border-amber-500/30">
            <p className="kicker flex items-center gap-1.5 !text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              Auditor interventions · {flaggedScenes.length} scene{flaggedScenes.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
              {flaggedScenes.map((s) => (
                <div key={s.sceneId} className="p-3.5 rounded-xl bg-black/50 border border-cinema-error/25 space-y-1.5">
                  <p className="font-semibold text-cinema-paper">Scene {s.sceneId} · scored {s.qc?.overallScore ?? 0}/100</p>
                  {(s.qc?.issues ?? []).map((issue) => (
                    <p key={issue} className="text-cinema-error">× {issue}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="surface-card px-5 py-3.5 flex items-center gap-2.5 text-[13.5px] text-cinema-mist">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            Clean audit trail — every scene passed conform without intervention.
          </div>
        )}

        {/* Pipeline stages */}
        <div className="space-y-3">
          <p className="kicker">Execution graph</p>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-1">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="w-52 shrink-0 p-4 rounded-xl border border-white/[0.08] bg-cinema-surface hover:bg-cinema-raised hover:border-cinema-gold/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <p className="text-[12px] text-cinema-gold font-semibold">{stage.step}</p>
                  <p className="text-[14px] font-semibold text-cinema-paper mt-1">{stage.agent}</p>
                  <p className="text-[13px] text-cinema-mist mt-1.5 line-clamp-2 leading-snug">{stage.desc}</p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[12px] font-medium">
                  <span className={cn('flex items-center gap-1.5', stage.ok ? 'text-emerald-400' : 'text-cinema-faint')}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{stage.ok ? 'Conformed' : 'Pending'}</span>
                  </span>
                  <span className="text-cinema-faint font-mono">#{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scene lineage */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="kicker">Scene lineage</p>
            <div className="flex items-center gap-2">
              {project.scenes.map((s) => (
                <button
                  key={s.sceneId}
                  onClick={() => setSelectedSceneId(s.sceneId)}
                  aria-pressed={selectedSceneId === s.sceneId}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors',
                    selectedSceneId === s.sceneId
                      ? 'bg-cinema-gold/20 border-cinema-gold text-cinema-gold'
                      : 'bg-cinema-surface border-white/[0.08] text-cinema-mist hover:text-cinema-paper'
                  )}
                >
                  Scene {s.sceneId}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="surface-card p-5 space-y-3">
              <p className="kicker flex items-center gap-1.5 !text-cinema-screenplay">
                <Film className="w-3.5 h-3.5" />
                Scene {activeScene.sceneId} · narrative core
              </p>
              <p className="text-[15px] font-playfair text-cinema-paper leading-relaxed">
                “{activeScene.storyBeat}”
              </p>
              {activeScene.dialogue && (
                <p className="text-[13px] text-cinema-mist pt-2 border-t border-white/5">
                  <span className="text-cinema-gold font-medium">Dialogue · </span>“{activeScene.dialogue}”
                </p>
              )}
            </div>

            <div className="surface-card p-5 space-y-3">
              <p className="kicker flex items-center gap-1.5 !text-cinema-character">
                <User className="w-3.5 h-3.5" />
                Cast and stage set
              </p>
              <div className="space-y-2 text-[13px]">
                {activeScene.characterIds.length === 0 && (
                  <p className="text-cinema-faint">No cast attached to this scene.</p>
                )}
                {activeScene.characterIds.map((cid) => {
                  const ch = project.characters.find((c) => c.id === cid);
                  return (
                    <div key={cid} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-cinema-paper font-medium">{ch?.name || cid}</span>
                      {ch?.type && <span className="text-cinema-character text-[12px] font-medium">{ch.type}</span>}
                    </div>
                  );
                })}
              </div>
              <p className="flex items-center gap-1.5 text-[12px] text-cinema-mist pt-1">
                <MapPin className="w-3.5 h-3.5 text-cinema-world" />
                <span>Location · {activeScene.locationId || '—'}</span>
              </p>
            </div>

            <div className="surface-card p-5 space-y-3">
              <p className="kicker flex items-center gap-1.5 !text-cinema-cinematographer">
                <Camera className="w-3.5 h-3.5" />
                Optics and QC score
              </p>
              <div className="text-[13px] space-y-1.5">
                <p className="text-cinema-mist">Lens · <span className="font-mono text-[12px]">{activeScene.camera.lens}</span></p>
                <p className="text-cinema-mist">Movement · {activeScene.camera.movement}</p>
                <p className="text-cinema-faint text-[12px] font-mono">
                  Vector · [{activeScene.camera.tx}, {activeScene.camera.ty}, {activeScene.camera.tz}]
                </p>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[13px] text-cinema-mist">Auditor score</span>
                <span className={cn(
                  'text-[12px] font-mono font-bold px-2.5 py-0.5 rounded border',
                  activeScene.qc?.passed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-white/5 text-cinema-faint border-white/10'
                )}>
                  {activeScene.qc?.overallScore ?? 0} / 100{activeScene.qc?.passed ? ' · pass' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveView('prompt')}
              className="text-[13px] text-cinema-gold hover:underline font-medium"
            >
              Inspect the full prompt in Prompt Lab
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
