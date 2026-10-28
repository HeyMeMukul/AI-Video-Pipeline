import React from 'react';
import { useStudioStore, useDerivedStudioState } from '../../store/useStudioStore';
import { AGENT_PERSONAS } from '../../mock/personas';
import { AgentId } from '../../types/events';
import { Film, Radio, RotateCcw, Plus } from 'lucide-react';

const ORDERED_AGENTS: AgentId[] = [
  'director', 'screenplay', 'character', 'world', 'cinematographer',
  'prompt_alchemist', 'gpu', 'auditor', 'editor',
];

export const TopBar: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const isConnected = useStudioStore((s) => s.isConnected);
  const setActiveView = useStudioStore((s) => s.setActiveView);
  const activeView = useStudioStore((s) => s.activeView);
  const currentStep = useStudioStore((s) => s.currentStep);
  const events = useStudioStore((s) => s.events);
  const { agentStatuses } = useDerivedStudioState();

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

  return (
    <header className="h-14 px-5 bg-[#08090d]/96 border-b border-white/[0.06] flex items-center justify-between z-50 backdrop-blur-xl shrink-0">
      {/* Left: Logo + Project */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={() => setActiveView('floor')}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a1e2c] to-[#0e101a] border border-[#e5c07b]/40 flex items-center justify-center shadow-[0_0_12px_rgba(229,192,123,0.2)] group-hover:shadow-[0_0_20px_rgba(229,192,123,0.4)] transition-shadow duration-300">
            <Film className="w-4 h-4 text-[#e5c07b]" />
          </div>
          <span className="font-playfair text-base font-bold text-white tracking-wide">
            Cine<span className="text-[#e5c07b]">Storm</span>
          </span>
        </button>

        <div className="h-5 w-px bg-white/[0.08] shrink-0" />

        {showPipeline && (
          <div className="flex items-center gap-2 min-w-0" title={project.projectName}>
            <span className="text-sm font-medium text-[#F2F0EA] max-w-[200px] truncate" title={project.projectName}>
              {project.projectName}
            </span>
            <span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-[#e5c07b]/10 text-[#e5c07b] border border-[#e5c07b]/25 shrink-0">
              {project.aspectRatio}
            </span>
          </div>
        )}
      </div>

      {/* Center: 9-dot pipeline progress — only on floor/journey/render */}
      {showPipeline && (
        <div className="hidden md:flex items-center gap-1">
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
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      isActive
                        ? 'scale-125 shadow-[0_0_6px_currentColor]'
                        : isDone
                        ? 'opacity-90'
                        : isFailed
                        ? 'opacity-90'
                        : 'opacity-25'
                    }`}
                    style={{
                      backgroundColor: isDone || isActive ? persona.color : isFailed ? '#f7768e' : '#4a5568',
                      boxShadow: isActive ? `0 0 8px ${persona.color}` : undefined,
                    }}
                  />
                </div>
                {idx < ORDERED_AGENTS.length - 1 && (
                  <div
                    className={`h-px w-3 transition-all duration-500 ${isDone ? 'opacity-60' : 'opacity-10'}`}
                    style={{ backgroundColor: persona.color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Right: Live indicator + new pitch */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Engine Indicator — only on floor/journey/render */}
        {showPipeline && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
            title={isConnected ? 'Connected to live backend engine via WebSocket' : 'Connecting to backend…'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span>{isConnected ? 'LIVE' : 'CONNECTING'}</span>
          </div>
        )}

        {/* New Pitch */}
        <button
          onClick={() => setActiveView('pitch')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5c07b] text-[#08090d] text-sm font-semibold hover:brightness-110 active:scale-95 transition-all duration-150 shadow-[0_0_16px_rgba(229,192,123,0.3)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Pitch</span>
        </button>
      </div>
    </header>
  );
};
