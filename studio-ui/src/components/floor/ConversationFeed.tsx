import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudioStore } from '../../store/useStudioStore';
import { AGENT_PERSONAS } from '../../mock/personas';
import { StudioEvent, AgentId } from '../../types/events';
import {
  ArrowRight, CheckCircle, XCircle, ChevronDown, Send,
  Clapperboard, FileText, User, Globe, Camera, Sparkles, Cpu, ShieldCheck, Scissors,
} from 'lucide-react';

const AGENT_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  director: Clapperboard,
  screenplay: FileText,
  character: User,
  world: Globe,
  cinematographer: Camera,
  prompt_alchemist: Sparkles,
  gpu: Cpu,
  auditor: ShieldCheck,
  editor: Scissors,
};

function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const STAGE_DIVIDERS: Record<string, string> = {
  'evt-04': 'Act I · Creative Pre-Production',
  'evt-12': 'Act II · World & Character Lock',
  'evt-18': 'Act III · Optics & Prompt Synthesis',
  'evt-24': 'Act IV · GPU Render Dispatch',
  'evt-33': 'Act V · Quality Audit Loop',
  'evt-40': 'Act VI · Finishing & Master Assembly',
};

interface MessageProps {
  event: StudioEvent;
  index: number;
  onClick: () => void;
}

function FeedMessage({ event, index, onClick }: MessageProps) {
  const persona = AGENT_PERSONAS[event.agent];
  if (!persona) return null;

  const AgentIcon = AGENT_ICONS[event.agent] || User;

  const isHandoff = event.type === 'agent.handoff';
  const isQC = event.type === 'qc.verdict';
  const isThought = event.type === 'agent.thought';
  const isArtifact = event.type === 'artifact.created';
  const isRetry = isHandoff && Boolean(event.payload?.retry_count);
  const isComplete = event.type === 'stage.completed';

  const toPersona = event.to_agent ? AGENT_PERSONAS[event.to_agent] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.15) }}
      onClick={onClick}
      className={`group flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 ${
        isRetry
          ? 'bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30'
          : isComplete
          ? 'bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30'
          : isQC && !event.payload?.passed
          ? 'bg-red-950/25 hover:bg-red-950/40 border border-red-500/25'
          : 'bg-[#10131d]/60 hover:bg-[#151926] border border-white/[0.05] hover:border-white/[0.12]'
      }`}
    >
      {/* Agent Icon Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
        style={{
          backgroundColor: `${persona.color}1c`,
          borderColor: `${persona.color}60`,
        }}
        title={`${persona.name} (${persona.role})`}
      >
        <AgentIcon className="w-4 h-4" style={{ color: persona.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[15px] font-semibold text-[#F2F0EA] tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {persona.name}
          </span>
          {toPersona && (
            <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: toPersona.color }}>
              <ArrowRight className="w-3.5 h-3.5" />
              {toPersona.name}
            </span>
          )}
          {isRetry && (
            <span className="text-[12px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
              revision
            </span>
          )}
          {isArtifact && (
            <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#2ac3de]/20 text-[#2ac3de] border border-[#2ac3de]/30 font-medium">
              artifact
            </span>
          )}
          <span className="ml-auto text-[12px] font-mono text-[#A9AEC0] shrink-0">
            {formatTime(event.ts)}
          </span>
        </div>

        {/* Message body */}
        {isThought ? (
          <p className="text-[14px] italic text-[#D5D8E3]/85 leading-relaxed">
            {event.payload?.thought || event.message}
          </p>
        ) : isQC ? (
          <div className="flex items-center gap-2">
            {event.payload?.passed ? (
              <span className="flex items-center gap-1.5 text-[13px] text-emerald-400 font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" />
                QC Pass — Score {event.payload?.score || event.payload?.rubric?.overall || '94'}/100
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[13px] text-red-400 font-medium">
                <XCircle className="w-4 h-4 shrink-0" />
                QC Fail — Score {event.payload?.score || '68'}/100 · {event.payload?.issues?.[0] || 'Anatomical instability'}
              </span>
            )}
          </div>
        ) : isHandoff ? (
          <div className="space-y-1">
            <p className="text-[14px] text-[#D5D8E3] leading-relaxed">
              {event.payload?.handoff_note || event.message}
            </p>
            {isRetry && (
              <p className="text-[12px] text-amber-300/90 italic">
                Auditor → Prompt Alchemist: Rewriting negative constraints and re-dispatching…
              </p>
            )}
          </div>
        ) : isComplete ? (
          <p className="text-[14px] text-emerald-400 font-semibold leading-relaxed">
            {event.message}
          </p>
        ) : (
          <p className="text-[14px] text-[#D5D8E3] leading-relaxed">
            {event.message}
          </p>
        )}

        {/* Payload chip for handoffs */}
        {isHandoff && event.payload?.handoff_note && (
          <div
            className="inline-flex items-center gap-1.5 text-[12px] font-mono px-2.5 py-0.5 rounded border mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              color: persona.color,
              borderColor: `${persona.color}40`,
              backgroundColor: `${persona.color}12`,
            }}
          >
            <span>View payload</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const ConversationFeed: React.FC = () => {
  const events = useStudioStore((s) => s.events);
  const currentStep = useStudioStore((s) => s.currentStep);
  const setCurrentStep = useStudioStore((s) => s.setCurrentStep);
  const setSelectedAgent = useStudioStore((s) => s.setSelectedAgent);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [noteAgent, setNoteAgent] = useState<AgentId>('director');
  const [noteText, setNoteText] = useState('');

  const visibleEvents = events.slice(0, currentStep + 1);

  // Auto scroll to bottom when new events come in
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleEvents.length, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 48);
  };

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteText('');
  };

  const agentOptions = Object.entries(AGENT_PERSONAS).map(([id, p]) => ({ id: id as AgentId, label: p.name }));

  return (
    <div className="flex flex-col h-full bg-[#0c0e16] border-l border-white/[0.08] relative">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/[0.08] shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#F2F0EA]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Production Floor Chat
          </h2>
          <p className="text-[12px] text-[#A9AEC0] mt-0.5">
            {visibleEvents.length} events · all agents
          </p>
        </div>
        {/* Live dot */}
        <div className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Messages - consistent 12px spacing */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3.5 space-y-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1e2c transparent' }}
      >
        {visibleEvents.map((event, idx) => {
          const divider = STAGE_DIVIDERS[event.id];
          return (
            <React.Fragment key={event.id || idx}>
              {divider && (
                <div className="flex items-center gap-2.5 py-1 px-1">
                  <div className="flex-1 h-px bg-white/[0.1]" />
                  <span className="text-[12px] font-medium text-[#A9AEC0] shrink-0 px-2 tracking-wide">
                    {divider}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.1]" />
                </div>
              )}
              <FeedMessage
                event={event}
                index={idx}
                onClick={() => {
                  setCurrentStep(idx);
                  setSelectedAgent(event.agent);
                }}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Jump to live pill */}
      <AnimatePresence>
        {!autoScroll && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
          >
            <button
              onClick={() => {
                setAutoScroll(true);
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e5c07b] text-[#08090d] text-[13px] font-semibold shadow-xl hover:brightness-110 active:scale-95 transition-all"
            >
              <ChevronDown className="w-4 h-4" />
              Jump to live
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Input */}
      <form
        onSubmit={handleSendNote}
        className="px-3.5 py-3 border-t border-white/[0.08] shrink-0 space-y-2.5 bg-[#0a0c13]"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#A9AEC0] shrink-0 font-medium">Send note to</span>
          <select
            value={noteAgent}
            onChange={(e) => setNoteAgent(e.target.value as AgentId)}
            className="flex-1 bg-[#131620] border border-white/[0.12] text-[#F2F0EA] rounded-lg text-[13px] px-2.5 py-1 focus:outline-none focus:border-[#e5c07b]/70"
          >
            {agentOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type a human-in-the-loop note…"
            className="flex-1 bg-[#131620] border border-white/[0.12] text-[#F2F0EA] rounded-lg text-[14px] px-3.5 py-2 focus:outline-none focus:border-[#e5c07b]/70 placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!noteText.trim()}
            className="px-3.5 py-2 rounded-lg bg-[#e5c07b]/20 border border-[#e5c07b]/40 text-[#e5c07b] hover:bg-[#e5c07b]/30 disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
