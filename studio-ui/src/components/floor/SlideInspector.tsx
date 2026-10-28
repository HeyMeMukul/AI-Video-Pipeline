import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudioStore, useDerivedStudioState } from '../../store/useStudioStore';
import { AGENT_PERSONAS } from '../../mock/personas';
import { X, Shield } from 'lucide-react';

export const SlideInspector: React.FC = () => {
  const selectedAgent = useStudioStore((s) => s.selectedAgent);
  const setSelectedAgent = useStudioStore((s) => s.setSelectedAgent);
  const { agentStatuses, agentThoughts } = useDerivedStudioState();

  const isOpen = Boolean(selectedAgent);
  const persona = selectedAgent ? AGENT_PERSONAS[selectedAgent] : null;
  const status = selectedAgent ? (agentStatuses[selectedAgent] || 'idle') : 'idle';
  const thought = selectedAgent ? (agentThoughts[selectedAgent] || '') : '';

  return (
    <AnimatePresence>
      {isOpen && persona && (
        <motion.div
          key={selectedAgent}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-72 bg-cinema-base/95 border-l border-white/[0.08] z-40 flex flex-col shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div
            className="px-4 py-4 border-b flex items-start justify-between"
            style={{ borderBottomColor: `${persona.color}25` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-playfair border-2 shrink-0"
                style={{
                  borderColor: persona.color,
                  backgroundColor: `${persona.color}15`,
                  color: persona.color,
                  boxShadow: `0 0 16px ${persona.color}30`,
                }}
              >
                {persona.avatarInitials || persona.avatar}
              </div>
              <div className="min-w-0">
                <h3
                  className="text-[15px] font-bold font-playfair text-cinema-paper truncate"
                >
                  {persona.name}
                </h3>
                <p className="text-[11px] text-cinema-faint truncate">{persona.role}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="p-1.5 rounded-lg text-cinema-faint hover:text-cinema-paper hover:bg-white/[0.06] transition-colors mt-0.5 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: 'thin' }}>
            {/* Status */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-cinema-faint uppercase tracking-widest">Current Status</span>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium"
                style={{
                  color: persona.color,
                  borderColor: `${persona.color}30`,
                  backgroundColor: `${persona.color}08`,
                }}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${status === 'working' || status === 'thinking' ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: persona.color }}
                />
                {status}
              </div>
            </div>

            {/* Live thought */}
            {thought && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-cinema-faint uppercase tracking-widest">Latest Thought</span>
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06]">
                  <p className="text-[13px] italic text-cinema-mist leading-relaxed">
                    "{thought}"
                  </p>
                </div>
              </div>
            )}

            {/* Persona description */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-cinema-faint uppercase tracking-widest">Role</span>
              <p className="text-[13px] text-cinema-mist leading-relaxed">{persona.description}</p>
            </div>

            {/* System constraints */}
            <div className="space-y-2">
              <span className="text-[11px] text-cinema-faint uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                System Constraints
              </span>
              <div className="space-y-2">
                {persona.systemConstraints?.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[12px] text-cinema-faint leading-relaxed"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: persona.color }}
                    />
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Zone badge */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-cinema-faint uppercase tracking-widest">Production Zone</span>
              <span
                className="inline-block text-[11px] px-2.5 py-1 rounded-full border font-medium"
                style={{
                  color: persona.color,
                  borderColor: `${persona.color}35`,
                  backgroundColor: `${persona.color}10`,
                }}
              >
                {persona.zone?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
