import React from 'react';
import { AgentId, AgentStatus } from '../../types/events';
import { AGENT_PERSONAS } from '../../mock/personas';
import { useStudioStore } from '../../store/useStudioStore';
import {
  Check,
  AlertCircle,
  RotateCw,
  Hourglass,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  Camera,
  Film,
  Scissors,
  Eye,
} from 'lucide-react';

interface AgentDeskCardProps {
  agentId: AgentId;
  status: AgentStatus;
  thought: string;
  isHero?: boolean;
}

export const AgentDeskCard: React.FC<AgentDeskCardProps> = ({
  agentId,
  status,
  thought,
  isHero = false,
}) => {
  const persona = AGENT_PERSONAS[agentId];
  const selectedAgent = useStudioStore((s) => s.selectedAgent);
  const setSelectedAgent = useStudioStore((s) => s.setSelectedAgent);

  const isSelected = selectedAgent === agentId;

  // Status visual indicator helper
  const getStatusIcon = (st: AgentStatus) => {
    switch (st) {
      case 'done':
        return <Check className="w-3 h-3 text-cinema-gold" />;
      case 'working':
        return <Activity className="w-3 h-3 text-cinema-screenplay animate-pulse" />;
      case 'thinking':
        return <Sparkles className="w-3 h-3 text-cinema-character animate-bounce" />;
      case 'waiting':
        return <Hourglass className="w-3 h-3 text-gray-400" />;
      case 'retrying':
        return <RotateCw className="w-3 h-3 text-cinema-auditor animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-cinema-error" />;
      case 'idle':
      default:
        return <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />;
    }
  };

  // Mini artifact preview helper
  const renderMiniArtifact = () => {
    switch (agentId) {
      case 'director':
        return (
          <div className="flex items-center space-x-1 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e5c07b]" title="Kelvin Warm: 3000K" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#7aa2f7]" title="Kelvin Cool: 6500K" />
            <span className="text-[9px] font-mono text-gray-400 ml-1">Noir Halftone DNA</span>
          </div>
        );
      case 'screenplay':
        return (
          <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono text-cinema-screenplay">
            <span className="px-1 rounded bg-cinema-screenplay/10 border border-cinema-screenplay/20">4 Scenes</span>
            <span className="text-gray-400">26s Total</span>
          </div>
        );
      case 'character':
        return (
          <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono">
            <span className="px-1 rounded bg-cinema-character/15 text-cinema-character border border-cinema-character/30">
              3 Heroes Locked
            </span>
          </div>
        );
      case 'world':
        return (
          <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono text-gray-400">
            <span className="h-1.5 w-12 rounded bg-gradient-to-r from-amber-500 to-blue-500 inline-block" />
            <span>3 Sets</span>
          </div>
        );
      case 'cinematographer':
        return (
          <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono text-cinema-cinematographer">
            <Camera className="w-2.5 h-2.5" />
            <span>35mm / 6DoF Arc</span>
          </div>
        );
      case 'prompt_alchemist':
        return (
          <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono text-cinema-prompt">
            <Layers className="w-2.5 h-2.5" />
            <span>9 Layers (DiT Audio)</span>
          </div>
        );
      case 'gpu':
        return (
          <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono text-cinema-gpu">
            <Cpu className="w-2.5 h-2.5" />
            <span>T4: 4/4 Rendered</span>
          </div>
        );
      case 'auditor':
        return (
          <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono text-cinema-auditor">
            <Eye className="w-2.5 h-2.5" />
            <span>QC: 95/100 (1 Retry)</span>
          </div>
        );
      case 'editor':
        return (
          <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono text-cinema-editor">
            <Film className="w-2.5 h-2.5" />
            <span>Reel + .timeline</span>
          </div>
        );
    }
  };

  return (
    <div
      onClick={() => setSelectedAgent(agentId)}
      className={`group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? 'bg-cinema-surface border-cinema-gold shadow-lg shadow-cinema-gold/10 scale-[1.02]'
          : 'bg-cinema-surface/80 hover:bg-cinema-surface border-cinema-border hover:border-white/20'
      }`}
    >
      {/* Top Header: Avatar + Name + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          {/* Avatar Ring */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-xs font-bold border transition-transform duration-200 group-hover:scale-105"
            style={{
              borderColor: persona.color,
              backgroundColor: `${persona.color}18`,
              color: persona.color,
              boxShadow: isSelected ? `0 0 12px ${persona.color}40` : undefined,
            }}
          >
            {persona.avatarInitials}
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-200 flex items-center space-x-1">
              <span>{persona.name}</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono">{persona.role}</div>
          </div>
        </div>

        {/* Status Pill */}
        <div
          className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] uppercase font-mono border"
          style={{
            borderColor: `${persona.color}40`,
            backgroundColor: `${persona.color}10`,
          }}
        >
          {getStatusIcon(status)}
          <span style={{ color: persona.color }}>{status}</span>
        </div>
      </div>

      {/* Desk Name */}
      <div className="mt-2 text-[10px] text-gray-500 font-mono flex items-center justify-between">
        <span>{persona.deskName}</span>
        <span className="text-[9px] text-gray-600">ID: {agentId}</span>
      </div>

      {/* Live Teletype Thought */}
      <div className="mt-1.5 p-1.5 rounded bg-black/40 border border-white/5 font-mono text-[10px] text-gray-300 min-h-[34px] flex items-center overflow-hidden">
        <div className="truncate w-full italic" title={thought}>
          "{thought}"
        </div>
      </div>

      {/* Mini Artifact Preview Bar */}
      <div className="mt-1 flex items-center justify-between pt-1 border-t border-white/5">
        {renderMiniArtifact()}
      </div>
    </div>
  );
};
