import React from 'react';
import { AgentId } from '../../types/events';
import { AGENT_PERSONAS } from '../../mock/personas';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface SpeechBubbleProps {
  agent: AgentId;
  text: string;
  to?: AgentId;
  isDissent?: boolean;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  agent,
  text,
  to,
  isDissent = false,
}) => {
  const fromPersona = AGENT_PERSONAS[agent];
  const toPersona = to ? AGENT_PERSONAS[to] : null;

  return (
    <div
      className={`relative max-w-xs p-2.5 rounded-xl border text-xs shadow-xl backdrop-blur-md animate-fadeIn transition-all duration-300 ${
        isDissent
          ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
          : 'bg-cinema-surface/90 border-cinema-border text-gray-200'
      }`}
    >
      {/* Header with speaker badge */}
      <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-mono">
        <span
          className="font-semibold px-1 py-0.2 rounded"
          style={{
            color: fromPersona?.color || '#e5c07b',
            backgroundColor: `${fromPersona?.color || '#e5c07b'}20`,
          }}
        >
          {fromPersona?.name.split(' ')[0] || agent}
        </span>

        {toPersona && (
          <>
            <ArrowRight className="w-2.5 h-2.5 text-gray-500" />
            <span
              className="font-semibold px-1 py-0.2 rounded"
              style={{
                color: toPersona.color,
                backgroundColor: `${toPersona.color}20`,
              }}
            >
              {toPersona.name.split(' ')[0]}
            </span>
          </>
        )}

        {isDissent && (
          <span className="flex items-center text-amber-400 font-bold ml-auto">
            <AlertTriangle className="w-3 h-3 mr-0.5" />
            REVISION / DISSENT
          </span>
        )}
      </div>

      {/* Bubble text */}
      <div className="line-clamp-2 text-[11px] leading-snug select-text">
        {text}
      </div>

      {/* Tiny speech bubble notch */}
      <div
        className="absolute -bottom-1.5 left-4 w-3 h-3 rotate-45 border-r border-b"
        style={{
          backgroundColor: isDissent ? '#291807' : '#131620',
          borderColor: isDissent ? 'rgba(245, 158, 11, 0.6)' : 'rgba(255, 255, 255, 0.06)',
        }}
      />
    </div>
  );
};
