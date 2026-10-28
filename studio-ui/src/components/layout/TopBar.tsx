import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore, useDerivedStudioState } from '../../store/useStudioStore';
import { AGENT_PERSONAS } from '../../mock/personas';
import { AgentId } from '../../types/events';
import { Film, Plus, ChevronDown, FolderOpen, Check, Activity } from 'lucide-react';
import { cn } from '../ui/cn';

const ORDERED_AGENTS: AgentId[] = [
  'director', 'screenplay', 'character', 'world', 'cinematographer',
  'prompt_alchemist', 'gpu', 'auditor', 'editor',
];

export const TopBar: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const isConnected = useStudioStore((s) => s.isConnected);
  const setActiveView = useStudioStore((s) => s.setActiveView);
  const activeView = useStudioStore((s) => s.activeView);
  const projects = useStudioStore((s) => s.projects);
  const projectsLoading = useStudioStore((s) => s.projectsLoading);
  const activeProjectName = useStudioStore((s) => s.activeProjectName);
  const loadProject = useStudioStore((s) => s.loadProject);
  const systemStatus = useStudioStore((s) => s.systemStatus);
  const { agentStatuses } = useDerivedStudioState();

  const [libOpen, setLibOpen] = useState(false);
  const libRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (libRef.current && !libRef.current.contains(e.target as Node)) setLibOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const showPipeline = activeView === 'floor' || activeView === 'journey' || activeView === 'render';

  // Compute which pipeline stage we're at (0–8) based on which agents are done/working
  const agentStageIndex = (() => {
    let highest = -1;
    ORDERED_AGENTS.forEach((id, idx) => {
      const s = agentStatuses[id];
      if (s === 'working' || s === 'thinking' || s === 'done' || s === 'retrying') {
        highest = idx;
      }
    });
    return highest;
  })();

  const statusTip = systemStatus
    ? `Render farm · ${systemStatus.kaggle} (${systemStatus.gpuModel})\nKnowledge · ${systemStatus.rea}\nMedia · ${systemStatus.ffmpeg}\nVoice · ${systemStatus.tts}`
    : 'Probing studio engine…';

  return (
    <header className="h-14 px-5 bg-cinema-bg/95 border-b border-white/[0.06] flex items-center justify-between z-50 backdrop-blur-xl shrink-0">
      {/* Left: Logo + Project library */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={() => setActiveView('floor')}
          className="flex items-center gap-2.5 group shrink-0"
          aria-label="CineStorm home — Studio Floor"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cinema-raised to-cinema-base border border-cinema-gold/40 flex items-center justify-center shadow-glow-gold group-hover:shadow-glow-gold-strong transition-shadow duration-300">
            <Film className="w-4 h-4 text-cinema-gold" />
          </span>
          <span className="font-playfair text-base font-bold text-white tracking-wide">
            Cine<span className="text-cinema-gold">Storm</span>
          </span>
        </button>

        <div className="h-5 w-px bg-white/[0.08] shrink-0" />

        {/* Project library switcher */}
        <div className="relative" ref={libRef}>
          <button
            onClick={() => setLibOpen((o) => !o)}
            className="flex items-center gap-2 min-w-0 px-2 py-1 rounded-md hover:bg-white/[0.04] transition-colors"
            aria-haspopup="listbox"
            aria-expanded={libOpen}
          >
            <FolderOpen className="w-3.5 h-3.5 text-cinema-faint shrink-0" />
            <span className="text-sm font-medium text-cinema-paper max-w-[200px] truncate" title={activeProjectName ?? 'No production loaded'}>
              {activeProjectName ?? 'Select production'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cinema-gold/10 text-cinema-gold border border-cinema-gold/25 shrink-0">
              {project.aspectRatio}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-cinema-faint transition-transform', libOpen && 'rotate-180')} />
          </button>

          {libOpen && (
            <div className="absolute left-0 top-full mt-2 w-[320px] surface-raised shadow-overlay p-1.5 z-50 view-enter" role="listbox">
              <p className="kicker px-2.5 pt-1.5 pb-1">
                {projectsLoading ? 'Reading vault…' : `${projects.length} productions in vault`}
              </p>
              <div className="max-h-[320px] overflow-y-auto">
                {projects.map((p) => {
                  const active = p.project_name === activeProjectName;
                  return (
                    <button
                      key={p.project_id}
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setLibOpen(false);
                        if (!active) loadProject(p.project_name);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors',
                        active ? 'bg-cinema-gold/10' : 'hover:bg-white/[0.04]'
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', p.has_final_reel ? 'bg-emerald-400' : 'bg-cinema-faint/50')} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-cinema-paper truncate">{p.project_name}</span>
                        <span className="block timecode text-[11px]">
                          {p.scene_count} scenes · {p.duration}s · {p.platform}
                        </span>
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-cinema-gold shrink-0" />}
                    </button>
                  );
                })}
                {!projectsLoading && projects.length === 0 && (
                  <p className="px-2.5 py-4 text-[13px] text-cinema-faint">
                    Vault is unreachable — start the backend, or pitch a new film.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: 9-dot pipeline progress — only on floor/journey/render */}
      {showPipeline && (
        <div className="hidden md:flex items-center gap-1" aria-label="Pipeline progress">
          {ORDERED_AGENTS.map((agentId, idx) => {
            const persona = AGENT_PERSONAS[agentId];
            const status = agentStatuses[agentId];
            const isActive = idx === agentStageIndex;
            const isDone = status === 'done';
            const isFailed = status === 'failed';
            return (
              <div key={agentId} className="flex items-center gap-1">
                <div
                  className="relative"
                  title={`${persona.name} (${persona.role}): ${status}`}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-500',
                      isActive ? 'scale-125' : isDone || isFailed ? 'opacity-90' : 'opacity-25'
                    )}
                    style={{
                      backgroundColor: isDone || isActive ? persona.color : isFailed ? '#f7768e' : '#4a5568',
                      boxShadow: isActive ? `0 0 8px ${persona.color}` : undefined,
                    }}
                  />
                </div>
                {idx < ORDERED_AGENTS.length - 1 && (
                  <div
                    className={cn('h-px w-3 transition-all duration-500', isDone ? 'opacity-60' : 'opacity-10')}
                    style={{ backgroundColor: persona.color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Right: engine status + new pitch */}
      <div className="flex items-center gap-3 shrink-0">
        {showPipeline && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium border hidden lg:flex max-w-[220px]',
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            )}
            title={statusTip}
          >
            <Activity className="w-3 h-3 shrink-0" />
            <span>{isConnected ? 'LIVE' : 'LINKING'}</span>
          </div>
        )}

        <button onClick={() => setActiveView('pitch')} className="btn-gold px-3 py-1.5 text-sm">
          <Plus className="w-3.5 h-3.5" />
          <span>New Pitch</span>
        </button>
      </div>
    </header>
  );
};
