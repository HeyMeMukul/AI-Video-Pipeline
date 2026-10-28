export type AgentId =
  | 'director'
  | 'screenplay'
  | 'character'
  | 'world'
  | 'cinematographer'
  | 'prompt_alchemist'
  | 'gpu'
  | 'auditor'
  | 'editor';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'done'
  | 'failed'
  | 'retrying';

export type EventType =
  | 'agent.status'
  | 'agent.thought'
  | 'agent.handoff'
  | 'artifact.created'
  | 'artifact.revised'
  | 'stage.completed'
  | 'qc.verdict'
  | 'render.progress'
  | 'log';

export type ArtifactKind =
  | 'style_lock'
  | 'scene_list'
  | 'character_bible'
  | 'environment_bible'
  | 'camera_plan'
  | 'prompt'
  | 'keyframe'
  | 'clip'
  | 'qc_report'
  | 'timeline';

export type Severity = 'info' | 'warn' | 'error' | 'handoff';

export interface StudioEvent {
  id: string;
  ts: number;
  project_id: string;
  type: EventType;
  agent: AgentId;
  to_agent?: AgentId;
  scene_id?: number;
  payload: Record<string, any>;
  message?: string;
  severity?: Severity;
}

export interface AgentPersona {
  id: AgentId;
  name: string;
  role: string;
  zone: 'pre_production' | 'optics_prompt' | 'execution_finishing';
  color: string;
  avatar: string; // initials
  avatarInitials?: string;
  deskName?: string;
  description: string;
  systemConstraints: string[];
}
