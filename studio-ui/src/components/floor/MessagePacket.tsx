import React from 'react';
import { AgentId } from '../../types/events';
import { AGENT_PERSONAS } from '../../mock/personas';
import { useStudioStore } from '../../store/useStudioStore';
import { RotateCw, ArrowRight } from 'lucide-react';

interface MessagePacketProps {
  from: AgentId;
  to: AgentId;
  note: string;
  isRetry?: boolean;
  packetId?: string;
}

export const MessagePacket: React.FC<MessagePacketProps> = ({
  from,
  to,
  note,
  isRetry = false,
  packetId,
}) => {
  const fromPersona = AGENT_PERSONAS[from];
  const toPersona = AGENT_PERSONAS[to];
  const setSelectedPacketId = useStudioStore((s) => s.setSelectedPacketId);

  return (
    <div
      onClick={() => setSelectedPacketId(packetId || `${from}-${to}`)}
      className={`group cursor-pointer p-2 rounded-lg border text-xs shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
        isRetry
          ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-amber-500/20'
          : 'bg-cinema-surface/90 border-cinema-gold/40 text-gray-200 shadow-cinema-gold/10'
      }`}
    >
      <div
        className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
        style={{
          backgroundColor: isRetry ? '#f59e0b' : fromPersona?.color || '#e5c07b',
        }}
      />

      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5 text-[10px] font-mono">
          <span style={{ color: fromPersona?.color }}>{fromPersona?.name.split(' ')[0]}</span>
          {isRetry ? (
            <RotateCw className="w-3 h-3 text-amber-400 animate-spin" />
          ) : (
            <ArrowRight className="w-3 h-3 text-gray-500" />
          )}
          <span style={{ color: toPersona?.color }}>{toPersona?.name.split(' ')[0]}</span>
          {isRetry && (
            <span className="ml-1 px-1 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px]">
              RETRY
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-300 font-medium truncate max-w-[220px]">
          {note}
        </div>
      </div>
    </div>
  );
};
