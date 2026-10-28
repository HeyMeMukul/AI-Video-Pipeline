import React, { useState } from 'react';
import { useStudioStore, useDerivedStudioState } from '../../store/useStudioStore';
import { AGENT_PERSONAS } from '../../mock/personas';
import { 
  X, 
  Send, 
  Terminal, 
  CheckCircle2, 
  Cpu, 
  Workflow, 
  ShieldAlert, 
  FileCode2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const InspectorDrawer: React.FC = () => {
  const inspectorOpen = useStudioStore((s) => s.inspectorOpen);
  const setInspectorOpen = useStudioStore((s) => s.setInspectorOpen);
  const selectedAgent = useStudioStore((s) => s.selectedAgent);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const project = useStudioStore((s) => s.project);
  const addEvent = useStudioStore((s) => s.addEvent);
  const { agentStatuses, agentThoughts } = useDerivedStudioState();

  const [humanNote, setHumanNote] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'json' | 'logs'>('details');
  const [jsonExpanded, setJsonExpanded] = useState(true);

  if (!inspectorOpen || !selectedAgent) return null;

  const persona = AGENT_PERSONAS[selectedAgent];
  const status = agentStatuses[selectedAgent];
  const thought = agentThoughts[selectedAgent];
  const scene = project.scenes.find((s) => s.sceneId === selectedSceneId) || project.scenes[0];

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!humanNote.trim()) return;

    addEvent({
      id: `human-${Date.now()}`,
      ts: Date.now() / 1000,
      project_id: project.projectId,
      type: 'agent.thought',
      agent: selectedAgent,
      payload: {
        human_note: humanNote,
        thought: `[Human Director Feedback]: "${humanNote}"`,
      },
      message: `Human director note dispatched to [${persona.name}]`,
      severity: 'warn',
    });

    setHumanNote('');
  };

  // Build deliverable payload preview
  const getDeliverablePayload = () => {
    if (selectedAgent === 'director') return project.directorVision;
    if (selectedAgent === 'screenplay') return project.scenes.map(s => ({ scene: s.sceneId, beat: s.storyBeat, svale: s.svale }));
    if (selectedAgent === 'character') return project.characters;
    if (selectedAgent === 'world') return project.environments;
    if (selectedAgent === 'cinematographer') return project.scenes.map(s => ({ scene: s.sceneId, camera: s.camera }));
    if (selectedAgent === 'prompt_alchemist') return scene.promptLayers;
    if (selectedAgent === 'gpu') return { status: '16GB VRAM Allocated', phase: 'Diffusion Clips', resolution: '1920x1080' };
    if (selectedAgent === 'auditor') return scene.qc;
    if (selectedAgent === 'editor') return { output: project.finalReelUrl, timeline: project.timelineUrl, format: '1080p @ 30 FPS' };
    return {};
  };

  return (
    <aside className="w-80 lg:w-96 h-[calc(100vh-4rem)] bg-[#0d0f16] border-l border-white/[0.06] flex flex-col justify-between shadow-2xl z-40 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#131620]/80">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shadow-lg font-mono"
            style={{
              backgroundColor: `${persona.color}15`,
              borderColor: persona.color,
              color: persona.color,
            }}
          >
            {persona.avatar}
          </div>
          <div>
            <h3 className="font-playfair text-base font-bold text-white flex items-center gap-2">
              {persona.name}
            </h3>
            <span
              className="text-[10px] font-mono tracking-wider uppercase font-semibold block"
              style={{ color: persona.color }}
            >
              {persona.role}
            </span>
          </div>
        </div>

        <button
          onClick={() => setInspectorOpen(false)}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-white/[0.06] bg-[#0c0e14] px-4">
        {(['details', 'json', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-mono capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#e5c07b] text-white font-semibold'
                : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-sans">
        {activeTab === 'details' && (
          <>
            {/* Status & Live Thought */}
            <div className="p-3.5 rounded-xl bg-[#131620] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Current Status</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  status === 'done'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : status === 'failed'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-white/90 italic font-mono text-[11px] leading-relaxed">
                "{thought}"
              </p>
            </div>

            {/* Role & Persona Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-semibold">
                Department Mandate
              </span>
              <p className="text-white/70 leading-relaxed text-xs">
                {persona.description}
              </p>
            </div>

            {/* System Constraints */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#e5c07b]" />
                Directorial Laws & Safeguards
              </span>
              <ul className="space-y-1.5 pl-1">
                {persona.systemConstraints.map((constraint, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/60 text-[11px] leading-normal">
                    <span className="text-[#e5c07b] font-bold">•</span>
                    <span>{constraint}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Active Deliverable Summary */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Active Deliverable
              </span>
              <div className="p-3 rounded-lg bg-[#181c28] border border-white/[0.06] font-mono text-[11px] text-white/80 space-y-1">
                <div>Artifact: <strong className="text-white">{persona.id}_output</strong></div>
                <div>Status: <span className="text-emerald-400">Signed Off & Invariant</span></div>
                <div>Target Scene: <span className="text-[#e5c07b]">Scene 0{selectedSceneId}</span></div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'json' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span>deliverables.json</span>
              <button 
                onClick={() => setJsonExpanded(!jsonExpanded)}
                className="hover:text-white"
              >
                {jsonExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {jsonExpanded && (
              <pre className="p-3 rounded-lg bg-[#08090d] border border-white/[0.06] font-mono text-[10px] text-sky-300 overflow-x-auto max-h-[350px]">
                {JSON.stringify(getDeliverablePayload(), null, 2)}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-semibold">
              Live Telemetry Stream
            </span>
            <div className="p-3 rounded-lg bg-[#08090d] border border-white/[0.06] font-mono text-[11px] space-y-2 max-h-[350px] overflow-y-auto">
              <div className="text-white/40 text-[10px]">[00:00.12] Initialized department stage</div>
              <div className="text-sky-300 text-[10px]">[00:02.40] Executed system prompt pass</div>
              <div className="text-emerald-400 text-[10px]">[00:05.10] Verified invariant constraints</div>
              <div className="text-white/70 text-[10px]">[00:08.20] Deliverable locked &rarr; transmitted</div>
            </div>
          </div>
        )}
      </div>

      {/* Human-in-the-Loop Feedback Input */}
      <form onSubmit={handleSendNote} className="p-3.5 border-t border-white/[0.06] bg-[#11131a] space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block font-semibold">
          Directorial Intervene / Send Note
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={humanNote}
            onChange={(e) => setHumanNote(e.target.value)}
            placeholder={`Instruct ${persona.name}…`}
            className="flex-1 bg-[#08090d] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#e5c07b]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#e5c07b] text-black font-semibold text-xs flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
            title="Dispatch revision note"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
