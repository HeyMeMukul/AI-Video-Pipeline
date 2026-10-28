import { create } from 'zustand';
import { StudioEvent, AgentId, AgentStatus, EventType } from '../types/events';
import { SceneModel, CharacterModel, EnvironmentModel, DirectorVision, ProjectModel } from '../types/pipeline';

export type StudioView =
  | 'pitch'
  | 'floor'
  | 'journey'
  | 'dossiers'
  | 'scenes'
  | 'prompt'
  | 'render'
  | 'theater';

interface StudioState {
  // Event sourcing
  events: StudioEvent[];
  currentStep: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5, 1, 2, 4
  isConnected: boolean;

  // Navigation & UI state
  activeView: StudioView;
  selectedAgent: AgentId | null;
  selectedSceneId: number;
  consoleOpen: boolean;
  commandPaletteOpen: boolean;
  consoleFilters: {
    agent: string;
    severity: string;
    search: string;
  };

  // Project Info
  project: ProjectModel;

  // Live backend: project library + engine status
  projects: ProjectListItem[];
  projectsLoading: boolean;
  activeProjectName: string | null;
  systemStatus: SystemStatusInfo | null;
  statusLoading: boolean;

  // Actions
  setActiveView: (view: StudioView) => void;
  setSelectedAgent: (agent: AgentId | null) => void;
  setSelectedSceneId: (sceneId: number) => void;
  setConsoleOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setConsoleFilter: (key: 'agent' | 'severity' | 'search', value: string) => void;
  
  // Playback & Event controls
  setCurrentStep: (step: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  addEvent: (event: StudioEvent) => void;
  startProduction: (idea: string, styles: string[], ratio: '16:9' | '2.39:1' | '9:16', tone?: string, avoid?: string[]) => void;
  resetProduction: () => void;

  // Live backend actions
  fetchProjects: () => Promise<void>;
  loadProject: (name: string) => Promise<void>;
  fetchSystemStatus: () => Promise<void>;
  runStage: (stage: string) => Promise<void>;
}

export interface ProjectListItem {
  project_id: string;
  project_name: string;
  duration: number;
  platform: string;
  aspect_ratio: string;
  style: string;
  tone: string;
  scene_count: number;
  has_final_reel: boolean;
  final_reel_path: string;
  updated_at: string;
}

export interface SystemStatusInfo {
  kaggle: string;
  gpuModel: string;
  tier: string;
  rea: string;
  ffmpeg: string;
  tts: string;
}

const EMPTY_PROJECT: ProjectModel = {
  projectId: '',
  projectName: '',
  story: '',
  duration: 30,
  aspectRatio: '16:9',
  platform: 'cinematic',
  styleDna: [],
  tone: '',
  directorVision: {
    visualStyle: '',
    cameraStyle: '',
    styleLock: '',
    pacingPoints: [],
    kelvinRegister: { warm: 3200, cool: 6000 },
    avoidConstraints: [],
  },
  scenes: [],
  characters: [],
  environments: [],
  finalReelUrl: undefined,
  timelineUrl: undefined,
};

export const useStudioStore = create<StudioState>((set, get) => ({
  events: [],
  currentStep: 0,
  isPlaying: false,
  playbackSpeed: 1,
  isConnected: false,

  activeView: 'pitch', // Clean start: pitch a film or open the vault
  selectedAgent: null,  // Inspector hidden by default
  selectedSceneId: 1,
  consoleOpen: false,
  commandPaletteOpen: false,
  consoleFilters: {
    agent: 'all',
    severity: 'all',
    search: '',
  },

  project: EMPTY_PROJECT,

  // Live backend library (filled by fetchProjects on boot)
  projects: [],
  projectsLoading: false,
  activeProjectName: null,
  systemStatus: null,
  statusLoading: false,

  setActiveView: (view) => set({ activeView: view }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setSelectedSceneId: (sceneId) => set({ selectedSceneId: sceneId }),
  setConsoleOpen: (open) => set({ consoleOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setConsoleFilter: (key, value) =>
    set((state) => ({
      consoleFilters: { ...state.consoleFilters, [key]: value },
    })),

  setCurrentStep: (step) => {
    const events = get().events;
    if (events.length === 0) {
      set({ currentStep: 0 });
      return;
    }
    const clamped = Math.max(0, Math.min(step, events.length - 1));
    set({ currentStep: clamped });
  },

  stepForward: () => {
    const { currentStep, events } = get();
    if (currentStep < events.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  stepBackward: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  addEvent: (event) =>
    set((state) => {
      const newEvents = [...state.events, event];
      return {
        events: newEvents,
        currentStep: newEvents.length - 1,
      };
    }),

  startProduction: (idea, styles, ratio, tone = 'dramatic, emotional, cinematic', avoid = []) => {
    const safeName = (idea.slice(0, 24).toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'film_project');
    const newProject: ProjectModel = {
      ...get().project,
      projectName: safeName,
      story: idea || get().project.story,
      styleDna: styles.length ? styles : get().project.styleDna,
      aspectRatio: ratio || get().project.aspectRatio,
      tone,
    };

    const kickoffEvent: StudioEvent = {
      id: `kickoff-${Date.now()}`,
      ts: Date.now() / 1000,
      project_id: safeName,
      type: 'agent.status',
      agent: 'director',
      payload: { status: 'working' },
      message: `Directorial vision initiated for "${safeName}". Aria Vance reviewing brief…`,
      severity: 'info',
    };

    // Reset store state and transition to Studio Floor
    set({
      project: newProject,
      events: [kickoffEvent],
      currentStep: 0,
      isPlaying: true,
      activeView: 'floor',
      activeProjectName: safeName,
    });

    // Create project and trigger autonomous pipeline on the live backend
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: safeName,
        story: idea || get().project.story,
        style: styles.join(', '),
        tone,
        avoid,
        platform: ratio === '9:16' ? 'instagram_reel' : 'cinematic',
      }),
    })
      .then((r) => r.json())
      .then(() => {
        fetch(`/api/projects/${safeName}/run_all`, { method: 'POST' });
        get().fetchProjects();
      })
      .catch((err) => console.warn('[CineStorm Live] Execution note:', err));
  },

  resetProduction: () => {
    set({
      currentStep: 0,
      isPlaying: false,
    });
  },

  // ── Live backend: project library ──────────────────────────
  fetchProjects: async () => {
    set({ projectsLoading: true });
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ projects: Array.isArray(data.projects) ? data.projects : [], projectsLoading: false });
    } catch (err) {
      console.warn('[CineStorm] Project library unreachable:', err);
      set({ projectsLoading: false });
    }
  },

  loadProject: async (name: string) => {
    try {
      const res = await fetch(`/api/project/${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped = mapBackendProject(data);
      const loadedEvent: StudioEvent = {
        id: `loaded-${Date.now()}`,
        ts: Date.now() / 1000,
        project_id: mapped.projectId,
        type: 'agent.status',
        agent: 'director',
        payload: { status: 'done' },
        message: `Loaded "${mapped.projectName}" from the studio vault — ${mapped.scenes.length} scenes, live media linked.`,
        severity: 'info',
      };
      set({
        project: mapped,
        events: [loadedEvent],
        currentStep: 0,
        isPlaying: false,
        activeProjectName: mapped.projectName,
      });
    } catch (err) {
      console.warn('[CineStorm] Load project failed:', err);
    }
  },

  // ── Live backend: engine status ────────────────────────────
  fetchSystemStatus: async () => {
    set({ statusLoading: true });
    try {
      const res = await fetch('/api/system/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({
        systemStatus: {
          kaggle: String(data?.kaggle_cloud_gpu?.status ?? 'Unknown'),
          gpuModel: String(data?.kaggle_cloud_gpu?.gpu_model ?? ''),
          tier: String(data?.kaggle_cloud_gpu?.tier ?? ''),
          rea: String(data?.rea_engine ?? 'Unknown'),
          ffmpeg: String(data?.ffmpeg ?? ''),
          tts: String(data?.audio_tts ?? ''),
        },
        statusLoading: false,
      });
    } catch (err) {
      console.warn('[CineStorm] System status unreachable:', err);
      set({ statusLoading: false });
    }
  },

  // ── Live backend: dispatch one agent stage ─────────────────
  runStage: async (stage: string) => {
    const name = get().activeProjectName || get().project.projectName;
    if (!name) return;
    const evt: StudioEvent = {
      id: `dispatch-${Date.now()}`,
      ts: Date.now() / 1000,
      project_id: name,
      type: 'agent.status',
      agent: 'director',
      payload: { status: 'working' },
      message: `Dispatched stage "${stage}" on "${name}" — watch the floor for live telemetry.`,
      severity: 'info',
    };
    get().addEvent(evt);
    try {
      await fetch(`/api/project/${encodeURIComponent(name)}/run-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
    } catch (err) {
      console.warn('[CineStorm] Stage dispatch failed:', err);
    }
  },
}));

/** Lenient parse: backend persists some blocks as JSON strings (or Python-repr). */
function parseLenient<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw !== 'string') return raw as T;
  const text = raw.trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    try {
      // Tolerate Python-repr single quotes when no double quotes present
      if (!text.includes('"')) return JSON.parse(text.replace(/'/g, '"')) as T;
    } catch { /* fall through */ }
    return fallback;
  }
}

function mediaUrl(projectName: string, folder: string, absPath: string): string | undefined {
  if (!absPath) return undefined;
  const base = absPath.split('/').pop();
  if (!base) return undefined;
  return `/api/media/${projectName}/${folder}/${base}`;
}

/** Map raw backend project.json shape onto the frontend ProjectModel. Guards everywhere. */
function mapBackendProject(data: any): ProjectModel {
  const name: string = String(data?.project_name ?? 'untitled');
  const rawRatio: string = String(data?.aspect_ratio ?? '16:9');
  const aspectRatio = (['16:9', '2.39:1', '9:16'] as const).includes(rawRatio as any)
    ? (rawRatio as ProjectModel['aspectRatio'])
    : '16:9';

  const notes = parseLenient<Record<string, any>>(data?.director_notes, {});
  const sceneList: any[] = Array.isArray(data?.scenes) ? data.scenes : [];
  const scenes: SceneModel[] = sceneList.map((s: any, i: number) => {
    const score = typeof s?.qc_score === 'number' ? s.qc_score : 0;
    const passed = s?.qc_passed === true;
    const cam = s?.camera ?? {};
    const vec = cam?.camera_vector ?? {};
    const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
    return {
      sceneId: typeof s?.scene_id === 'number' ? s.scene_id : i + 1,
      durationSeconds: typeof s?.duration_seconds === 'number' ? s.duration_seconds : 6,
      svale: {
        subject: Array.isArray(s?.character_ids) && s.character_ids.length ? String(s.character_ids[0]) : 'Ensemble cast',
        verb: String(cam?.camera_movement ?? 'holds frame'),
        atmosphere: String(s?.emotion ?? ''),
        location: String(s?.location_id ?? ''),
        emotion: String(s?.emotion ?? ''),
      },
      storyBeat: String(s?.story_beat ?? ''),
      dialogue: String(s?.dialogue ?? ''),
      voiceEmotion: String(s?.voice_emotion ?? ''),
      audioCues: String(s?.audio_cues ?? ''),
      locationId: String(s?.location_id ?? ''),
      characterIds: Array.isArray(s?.character_ids) ? s.character_ids.map(String) : [],
      camera: {
        tx: num(vec.x, 0), ty: num(vec.y, 0), tz: num(vec.z, 0),
        pitch: num(vec.pitch, 0), yaw: num(vec.yaw, 0), roll: num(vec.roll, 0),
        lens: String(cam?.lens ?? '35mm cinema prime'),
        movement: String(cam?.camera_movement ?? 'static lock-off'),
        motionScore: num(s?.motion_score, 0.4),
      },
      videoPrompt: String(s?.video_prompt ?? ''),
      promptLayers: [],
      keyframeUrl: mediaUrl(name, 'references', String(s?.reference_image_path ?? '')),
      clipUrl: mediaUrl(name, 'clips', String(s?.clip_path ?? '')),
      qc: {
        anatomicalStability: score, cameraStability: score, opticalClarity: score,
        promptConformity: score, characterConsistency: score,
        overallScore: score, passed,
        issues: Array.isArray(s?.qc_issues) ? s.qc_issues.map(String) : [],
        flaggedTimestamps: [],
      },
      status: passed ? 'qc_pass' : s?.clip_path ? 'rendered' : s?.video_prompt ? 'prompted' : 'planned',
    } as SceneModel;
  });

  const charDict = parseLenient<Record<string, any>>(data?.characters, {});
  const characters: CharacterModel[] = Object.entries(charDict).map(([key, c]: [string, any]) => ({
    id: String(c?.character_id ?? key),
    name: String(c?.name ?? key),
    type: String(c?.type ?? 'Principal'),
    body: String(c?.body ?? ''),
    face: String(c?.face ?? ''),
    clothing: String(c?.clothing_or_accessories ?? c?.clothing ?? ''),
    visualKeywords: Array.isArray(c?.visual_keywords) ? c.visual_keywords.map(String) : [],
    negativeConstraints: Array.isArray(c?.negative_constraints) ? c.negative_constraints.map(String) : [],
    scenes: [] as number[],
    consistencyLock: true,
  }));

  const locDict = parseLenient<Record<string, any>>(data?.locations, {});
  const environments: EnvironmentModel[] = Object.entries(locDict).map(([key, l]: [string, any]) => ({
    id: String(l?.location_id ?? key),
    name: String(l?.name ?? key),
    spatial: String(l?.prompt_block ?? ''),
    materials: String(l?.color_palette ?? ''),
    lighting: String(l?.lighting ?? ''),
    weather: String(l?.weather ?? l?.time_of_day ?? ''),
    kelvinWarm: 3200,
    kelvinCool: 6000,
    scenes: [] as number[],
  }));

  const styleText = String(data?.style ?? 'cinematic');
  const finalReel = mediaUrl(name, 'output', String(data?.final_reel_path ?? ''));

  return {
    projectId: String(data?.project_id ?? name),
    projectName: name,
    story: String(data?.story ?? ''),
    duration: typeof data?.target_duration_seconds === 'number' ? data.target_duration_seconds : 30,
    aspectRatio,
    platform: String(data?.platform ?? 'cinematic'),
    styleDna: styleText.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 6),
    tone: String(data?.tone ?? ''),
    directorVision: {
      visualStyle: String(notes?.visual_style ?? styleText),
      cameraStyle: String(notes?.camera_style ?? ''),
      styleLock: String(notes?.style_lock ?? styleText),
      pacingPoints: Array.isArray(notes?.pacing_points) ? notes.pacing_points : [4, 6, 8, 8, 6],
      kelvinRegister: { warm: 3200, cool: 6000 },
      avoidConstraints: Array.isArray(notes?.avoid) ? notes.avoid.map(String) : [],
    },
    scenes,
    characters,
    environments,
    finalReelUrl: finalReel,
    timelineUrl: `/api/media/${name}/output/${name}.timeline`,
  };
}

export interface ActiveHandoff {
  id: string;
  from: AgentId;
  to: AgentId;
  note: string;
  isRetry?: boolean;
}

export interface DerivedStudioState {
  agentStatuses: Record<AgentId, AgentStatus>;
  agentThoughts: Record<AgentId, string>;
  activeHandoff: ActiveHandoff | null;
  speechBubbles: Array<{
    id: string;
    agent: AgentId;
    text: string;
    isDissent?: boolean;
    to?: AgentId;
  }>;
  retryCount: number;
  finalReelReady: boolean;
  project: ProjectModel;
}

// Helper selector: Derive agent status and thoughts up to currentStep
export function useDerivedStudioState(): DerivedStudioState {
  const events = useStudioStore((s) => s.events);
  const currentStep = useStudioStore((s) => s.currentStep);
  const project = useStudioStore((s) => s.project);

  const activeEvents = events.slice(0, currentStep + 1);

  // Compute status per agent
  const agentStatuses: Record<AgentId, AgentStatus> = {
    director: 'idle',
    screenplay: 'idle',
    character: 'idle',
    world: 'idle',
    cinematographer: 'idle',
    prompt_alchemist: 'idle',
    gpu: 'idle',
    auditor: 'idle',
    editor: 'idle',
  };

  const agentThoughts: Record<AgentId, string> = {
    director: 'Waiting for directorial pitch…',
    screenplay: 'Standby for narrative concept…',
    character: 'Awaiting screenplay scene breakdown…',
    world: 'Standby for location parameters…',
    cinematographer: 'Awaiting world spatial geometries…',
    prompt_alchemist: 'Standby for 6DoF camera vectors…',
    gpu: 'Tesla T4 cluster idle. Ready for dispatch.',
    auditor: 'Compliance rules loaded. Standing by.',
    editor: 'Master timeline engine ready.',
  };

  let activeHandoff: {
    id: string;
    from: AgentId;
    to: AgentId;
    note: string;
    isRetry?: boolean;
  } | null = null;

  const speechBubbles: Array<{
    id: string;
    agent: AgentId;
    text: string;
    isDissent?: boolean;
    to?: AgentId;
  }> = [];

  let retryCount = 0;
  let finalReelReady = false;

  activeEvents.forEach((evt) => {
    if (evt.type === 'agent.status' && evt.payload.status) {
      agentStatuses[evt.agent] = evt.payload.status;
    } else if (evt.type === 'agent.thought' && evt.payload.thought) {
      agentThoughts[evt.agent] = evt.payload.thought;
      speechBubbles.push({
        id: evt.id,
        agent: evt.agent,
        text: evt.payload.thought,
      });
    } else if (evt.type === 'agent.handoff' && evt.to_agent) {
      const isRetry = Boolean(evt.payload.retry_count);
      if (isRetry) retryCount += 1;
      activeHandoff = {
        id: evt.id,
        from: evt.agent,
        to: evt.to_agent,
        note: evt.payload.handoff_note || evt.message || '',
        isRetry,
      };
      speechBubbles.push({
        id: evt.id,
        agent: evt.agent,
        to: evt.to_agent,
        text: evt.payload.handoff_note || evt.message || '',
        isDissent: isRetry,
      });
      // Mark from as done, to as working
      agentStatuses[evt.agent] = 'done';
      agentStatuses[evt.to_agent] = isRetry ? 'retrying' : 'working';
    } else if (evt.type === 'qc.verdict') {
      if (evt.payload.passed) {
        agentStatuses['auditor'] = 'done';
      } else {
        agentStatuses['auditor'] = 'failed';
        speechBubbles.push({
          id: evt.id,
          agent: 'auditor',
          text: `Scene ${evt.scene_id} FAILED: ${evt.payload.issues?.[0] || 'Quality defect'}`,
          isDissent: true,
        });
      }
    } else if (evt.type === 'stage.completed') {
      finalReelReady = true;
      agentStatuses['editor'] = 'done';
    }
  });

  return {
    agentStatuses,
    agentThoughts,
    activeHandoff,
    speechBubbles: speechBubbles.slice(-4), // Last 4 speech bubbles
    retryCount,
    finalReelReady,
    project,
  };
}
