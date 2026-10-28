import React, { useMemo } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { AGENT_PERSONAS } from '../../mock/personas';
import { AgentId } from '../../types/events';
import { Terminal, Filter, ChevronDown, ChevronUp, Search, XCircle, ArrowRightCircle } from 'lucide-react';

export const EventLogConsole: React.FC = () => {
  const consoleOpen = useStudioStore((s) => s.consoleOpen);
  const setConsoleOpen = useStudioStore((s) => s.setConsoleOpen);
  const events = useStudioStore((s) => s.events);
  const currentStep = useStudioStore((s) => s.currentStep);
  const setCurrentStep = useStudioStore((s) => s.setCurrentStep);
  const setSelectedAgent = useStudioStore((s) => s.setSelectedAgent);
  const filters = useStudioStore((s) => s.consoleFilters);
  const setConsoleFilter = useStudioStore((s) => s.setConsoleFilter);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (filters.agent !== 'all' && evt.agent !== filters.agent) return false;
      if (filters.severity !== 'all') {
        if (filters.severity === 'handoff' && evt.type !== 'agent.handoff') return false;
        if (filters.severity === 'qc' && evt.type !== 'qc.verdict') return false;
        if (filters.severity === 'thought' && evt.type !== 'agent.thought') return false;
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const msg = (evt.message || '').toLowerCase();
        const payloadStr = JSON.stringify(evt.payload || {}).toLowerCase();
        const agentName = (AGENT_PERSONAS[evt.agent]?.name || '').toLowerCase();
        if (!msg.includes(query) && !payloadStr.includes(query) && !agentName.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [events, filters]);

  if (!consoleOpen) return null;

  return (
    <div className="h-64 border-t border-cinema-border bg-cinema-surface/95 backdrop-blur-md flex flex-col z-30 transition-all duration-300">
      {/* Console Top Bar */}
      <div className="px-4 py-2 border-b border-cinema-border flex items-center justify-between text-xs bg-cinema-raised/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-cinema-gold font-mono font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Event stream</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-cinema-faint font-mono text-[10px]">
            {filteredEvents.length} / {events.length} events
          </span>
          <span className="text-cinema-faint/60 text-[11px]">|</span>
          <span className="text-cinema-faint font-mono text-[11px]">
            Step {currentStep + 1} of {events.length}
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          {/* Agent Filter */}
          <div className="flex items-center space-x-1">
            <Filter className="w-3 h-3 text-cinema-faint" />
            <select
              value={filters.agent}
              onChange={(e) => setConsoleFilter('agent', e.target.value)}
              className="surface-input rounded px-2 py-0.5 text-xs"
            >
              <option value="all">All Agents</option>
              {Object.entries(AGENT_PERSONAS).map(([id, p]) => (
                <option key={id} value={id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={filters.severity}
            onChange={(e) => setConsoleFilter('severity', e.target.value)}
            className="surface-input rounded px-2 py-0.5 text-xs"
          >
            <option value="all">All Event Types</option>
            <option value="handoff">Handoffs Only</option>
            <option value="thought">Agent Thoughts</option>
            <option value="qc">QC Verdicts</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-cinema-faint absolute left-2 top-1.5" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setConsoleFilter('search', e.target.value)}
              className="surface-input rounded pl-7 pr-2 py-0.5 text-xs w-36"
            />
            {filters.search && (
              <button
                onClick={() => setConsoleFilter('search', '')}
                className="absolute right-1.5 top-1.5 text-cinema-faint hover:text-cinema-paper"
              >
                <XCircle className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => setConsoleOpen(false)}
            className="text-cinema-faint hover:text-cinema-paper p-1 rounded hover:bg-white/5"
            title="Minimize Console"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Console Log List */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px] p-2 space-y-1 select-text">
        {filteredEvents.map((evt, idx) => {
          const persona = AGENT_PERSONAS[evt.agent];
          const isSelected = events.indexOf(evt) === currentStep;
          const isPassed = events.indexOf(evt) <= currentStep;
          const eventIndex = events.indexOf(evt);

          return (
            <div
              key={evt.id || idx}
              onClick={() => {
                setCurrentStep(eventIndex);
                setSelectedAgent(evt.agent);
              }}
              className={`flex items-start space-x-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-cinema-gold/15 border border-cinema-gold/30 text-cinema-paper'
                  : isPassed
                  ? 'hover:bg-white/5 text-cinema-mist'
                  : 'opacity-40 hover:opacity-80 text-cinema-faint'
              }`}
            >
              <span className="text-cinema-faint text-[10px] w-14 shrink-0 pt-0.5">
                {new Date(evt.ts * 1000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>

              {/* Agent Badge */}
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 border"
                style={{
                  color: persona.color,
                  borderColor: `${persona.color}40`,
                  backgroundColor: `${persona.color}15`,
                }}
              >
                {persona.name.split(' ')[0]}
              </span>

              {/* Event Type Tag */}
              <span className="text-cinema-faint text-[10px] shrink-0 pt-0.5">
                [{evt.type}]
              </span>

              {/* Message */}
              <span className="flex-1 truncate">
                {evt.message || JSON.stringify(evt.payload)}
              </span>

              {/* Jump button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentStep(eventIndex);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-cinema-gold text-cinema-faint shrink-0"
                title="Jump to this step in timeline"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
