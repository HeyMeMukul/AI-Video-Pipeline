import { create } from 'zustand';
import { StudioEvent, AgentId, AgentStatus, EventType } from '../types/events';
import { SceneModel, CharacterModel, EnvironmentModel, DirectorVision, ProjectModel } from '../types/pipeline';
import { MOCK_EVENT_TIMELINE, INITIAL_MOCK_PROJECT } from '../mock/mockEvents';

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

// Initial default scenes
const DEFAULT_SCENES: SceneModel[] = [
  {
    sceneId: 1,
    durationSeconds: 7,
    svale: { subject: 'The Navigator', verb: 'scans', atmosphere: 'Coastal twilight fog', location: 'Obsidian Shoreline', emotion: 'Quiet resolve' },
    storyBeat: 'A lone traveler in a weathered canvas coat stands atop an obsidian coastal cliff gazing into swirling twilight sea mist.',
    dialogue: 'EVERY HORIZON HOLDS A TRUTH WAITING TO BE UNVEILED.',
    voiceEmotion: 'calm contemplative cadence',
    audioCues: 'Deep ocean swell crashes, wet gravel rustle, soft coastal wind',
    locationId: 'obsidian_shoreline',
    characterIds: ['elena_vance'],
    camera: { tx: 0, ty: -1.0, tz: 2.2, pitch: -8, yaw: 0, roll: 0, lens: '35mm anamorphic prime', movement: 'Low-angle push-in', motionScore: 0.42 },
    videoPrompt: 'Low-angle slow cinematic push-in, solitary navigator in weathered canvas coat stands atop obsidian coastal cliff gazing into swirling twilight sea mist. Elena Vance speaks with contemplative calm: "EVERY HORIZON HOLDS A TRUTH WAITING TO BE UNVEILED." Sound design: Deep ocean swell crashes, wet gravel rustle, soft coastal wind. 35mm anamorphic prime lens, 3200K lantern glow opposing 6000K twilight sea mist. Avoid: morphing hands, camera jitter, watermark.',
    promptLayers: [
      { index: 1, name: 'Primary Action & Kinematics', text: 'Low-angle slow cinematic push-in, solitary navigator in weathered canvas coat stands atop obsidian cliff', agentId: 'screenplay', tokenCount: 16, attentionWeight: 'high' },
      { index: 2, name: 'Character Dialogue & Vocal Emotion', text: 'Elena Vance speaks with contemplative calm: "EVERY HORIZON HOLDS A TRUTH WAITING TO BE UNVEILED."', agentId: 'prompt_alchemist', tokenCount: 16, attentionWeight: 'high' },
      { index: 3, name: 'Sound Design & Foley', text: 'Sound design: Deep ocean swell crashes, wet gravel rustle, soft coastal wind', agentId: 'prompt_alchemist', tokenCount: 13, attentionWeight: 'medium' },
      { index: 4, name: 'Character Anchor', text: 'Weathered linen and waxed canvas coat, wind-blown dark hair, determined gaze', agentId: 'character', tokenCount: 12, attentionWeight: 'medium' },
      { index: 5, name: 'Setting & Props', text: 'Craggy basalt cliff edge overlooking crashing tide pools in heavy sea mist', agentId: 'world', tokenCount: 11, attentionWeight: 'medium' },
      { index: 6, name: '6DoF Optics & Camera Matrix', text: '35mm anamorphic prime lens, locked low-angle push vector [0, -1.0, 2.2]', agentId: 'cinematographer', tokenCount: 11, attentionWeight: 'medium' },
      { index: 7, name: 'Lighting & Kelvin Registers', text: '3200K warm lantern illumination opposing 6000K cool twilight ambient', agentId: 'world', tokenCount: 12, attentionWeight: 'low' },
      { index: 8, name: 'Directorial Style Finish', text: 'Cinematic wide-gamut film look, subtle grain, deep shadow roll-off', agentId: 'director', tokenCount: 10, attentionWeight: 'low' },
      { index: 9, name: 'Negative Constraints', text: 'Avoid: morphing limbs, camera jitter, extra fingers, text, watermark, logo', agentId: 'director', tokenCount: 11, attentionWeight: 'low' },
    ],
    qc: { anatomicalStability: 95, cameraStability: 94, opticalClarity: 92, promptConformity: 93, characterConsistency: 92, overallScore: 93, passed: true, issues: [], flaggedTimestamps: [] },
    status: 'qc_pass',
  },
  {
    sceneId: 2,
    durationSeconds: 7,
    svale: { subject: 'The Cartographer', verb: 'unearths', atmosphere: 'Wind-swept dunes', location: 'Sunken Tide Basin', emotion: 'Focused wonder' },
    storyBeat: 'Kneeling in the wet sand, hands carefully brush away fine sediment to reveal an intricate brass astrolabe inscribed with stellar glyphs.',
    dialogue: 'THE STARS HAVE NOT FORGOTTEN OUR PATH.',
    voiceEmotion: 'hushed reverent whisper',
    audioCues: 'Wet sand scraping, metallic brass gear click, wind gust',
    locationId: 'tide_basin',
    characterIds: ['marcus_reed'],
    camera: { tx: 0, ty: -2.0, tz: 1.2, pitch: -45, yaw: 10, roll: 0, lens: '50mm cinema prime', movement: 'Smooth downward pedestal', motionScore: 0.38 },
    videoPrompt: 'Smooth downward pedestal shot, cartographer kneeling in damp sand gently clears fine sediment from an antique brass astrolabe. Marcus Reed speaks with hushed reverence: "THE STARS HAVE NOT FORGOTTEN OUR PATH." Sound design: Wet sand scraping, metallic gear click, coastal breeze. 50mm cinema prime lens, warm 3400K sunset reflection opposing 6500K damp sand.',
    promptLayers: [
      { index: 1, name: 'Primary Action & Kinematics', text: 'Smooth downward pedestal shot, cartographer kneeling in damp sand gently clears fine sediment from brass relic', agentId: 'screenplay', tokenCount: 16, attentionWeight: 'high' },
      { index: 2, name: 'Character Dialogue & Vocal Emotion', text: 'Marcus Reed speaks with hushed reverence: "THE STARS HAVE NOT FORGOTTEN OUR PATH."', agentId: 'prompt_alchemist', tokenCount: 14, attentionWeight: 'high' },
      { index: 3, name: 'Sound Design & Foley', text: 'Sound design: Wet sand scraping, metallic brass gear click, coastal breeze', agentId: 'prompt_alchemist', tokenCount: 12, attentionWeight: 'medium' },
      { index: 4, name: 'Character Anchor', text: 'Heavy wool vest, roll-up sleeves with leather braces, brass field loupe', agentId: 'character', tokenCount: 11, attentionWeight: 'medium' },
      { index: 5, name: 'Setting & Props', text: 'Tide basin with ribbed black sand patterns, glistening saltwater pools', agentId: 'world', tokenCount: 10, attentionWeight: 'medium' },
      { index: 6, name: '6DoF Optics & Camera Matrix', text: '50mm cinema prime, pedestal vector [0, -2.0, 1.2]', agentId: 'cinematographer', tokenCount: 10, attentionWeight: 'medium' },
      { index: 7, name: 'Lighting & Kelvin Registers', text: '3400K golden specular highlights opposing 6500K cool shadows', agentId: 'world', tokenCount: 10, attentionWeight: 'low' },
      { index: 8, name: 'Directorial Style Finish', text: 'Atmospheric naturalism, shallow depth of field, organic bokeh', agentId: 'director', tokenCount: 9, attentionWeight: 'low' },
      { index: 9, name: 'Negative Constraints', text: 'Avoid: motion blur smear, shifting colors, facial distortion, jitter', agentId: 'director', tokenCount: 10, attentionWeight: 'low' },
    ],
    qc: { anatomicalStability: 94, cameraStability: 92, opticalClarity: 93, promptConformity: 94, characterConsistency: 91, overallScore: 93, passed: true, issues: [], flaggedTimestamps: [] },
    status: 'qc_pass',
  },
  {
    sceneId: 3,
    durationSeconds: 6,
    svale: { subject: 'Ancient Astrolabe', verb: 'awakens', atmosphere: 'Luminous golden radiance', location: 'Cliffside Sanctuary', emotion: 'Breathless revelation' },
    storyBeat: 'Concentric brass rings within the astrolabe begin to rotate, projecting intersecting beams of golden volumetric light into the twilight air.',
    dialogue: 'THE ALIGNMENT IS FINALLY COMPLETE.',
    voiceEmotion: 'awe-struck revelation',
    audioCues: 'Harmonic resonance chime, clockwork ticking, ambient swell',
    locationId: 'cliffside_sanctuary',
    characterIds: ['elena_vance'],
    camera: { tx: 1.2, ty: 0, tz: 1.8, pitch: 0, yaw: 35, roll: 0, lens: '35mm cinema prime', movement: '180 orbital arc', motionScore: 0.44 },
    videoPrompt: '180-degree orbital arc, ancient brass astrolabe held aloft as internal gears spin, casting warm geometric light rays across the stone sanctuary. Elena Vance speaks with breathless revelation: "THE ALIGNMENT IS FINALLY COMPLETE." Sound design: Resonant brass chime, gentle mechanical whir, coastal wind. 35mm lens, 3000K warm volumetric rays opposing 6000K stone interior.',
    promptLayers: [
      { index: 1, name: 'Primary Action & Kinematics', text: '180-degree orbital arc, antique brass astrolabe held aloft as internal gears spin casting warm geometric rays', agentId: 'screenplay', tokenCount: 17, attentionWeight: 'high' },
      { index: 2, name: 'Character Dialogue & Vocal Emotion', text: 'Elena Vance speaks with breathless revelation: "THE ALIGNMENT IS FINALLY COMPLETE."', agentId: 'prompt_alchemist', tokenCount: 14, attentionWeight: 'high' },
      { index: 3, name: 'Sound Design & Foley', text: 'Sound design: Resonant brass chime, gentle mechanical whir, coastal wind', agentId: 'prompt_alchemist', tokenCount: 12, attentionWeight: 'medium' },
      { index: 4, name: 'Character Anchor', text: 'Weathered travel mantle, illuminated facial profile, hands cradling brass ring', agentId: 'character', tokenCount: 11, attentionWeight: 'medium' },
      { index: 5, name: 'Setting & Props', text: 'Ancient stone sanctuary with arched openings framing coastal horizon', agentId: 'world', tokenCount: 10, attentionWeight: 'medium' },
      { index: 6, name: '6DoF Optics & Camera Matrix', text: '35mm cinema prime, orbital track vector [1.2, 0, 1.8]', agentId: 'cinematographer', tokenCount: 10, attentionWeight: 'medium' },
      { index: 7, name: 'Lighting & Kelvin Registers', text: '3000K motivated warm golden shafts opposing 6000K cool slate architecture', agentId: 'world', tokenCount: 11, attentionWeight: 'low' },
      { index: 8, name: 'Directorial Style Finish', text: 'Cinematic chiaroscuro, atmospheric volumetric haze, pristine color timing', agentId: 'director', tokenCount: 9, attentionWeight: 'low' },
      { index: 9, name: 'Negative Constraints', text: 'Avoid: anatomically incorrect fingers, shifting wrist joints, morphing limbs', agentId: 'director', tokenCount: 10, attentionWeight: 'low' },
    ],
    qc: { anatomicalStability: 96, cameraStability: 95, opticalClarity: 94, promptConformity: 96, characterConsistency: 94, overallScore: 95, passed: true, issues: [], flaggedTimestamps: [] },
    status: 'qc_pass',
  },
  {
    sceneId: 4,
    durationSeconds: 6,
    svale: { subject: 'The Expedition', verb: 'journeys', atmosphere: 'Golden dawn horizon', location: 'The Open Frontier', emotion: 'Triumphant hope' },
    storyBeat: 'Golden sunlight crests the horizon as the travelers set forth along the ridge, the illuminated beacon guiding their voyage into the new world.',
    dialogue: 'A NEW CHAPTER BEGINS BEYOND THE SEA.',
    voiceEmotion: 'uplifting cinematic crescendo',
    audioCues: 'Rising orchestral strings, surf reverberation, morning birdsong',
    locationId: 'obsidian_shoreline',
    characterIds: ['elena_vance', 'marcus_reed'],
    camera: { tx: 0, ty: 0, tz: -2.0, pitch: 0, yaw: 0, roll: 0, lens: '85mm cinema prime', movement: 'Slow crane elevation', motionScore: 0.35 },
    videoPrompt: 'Slow crane elevation shot, travelers embark along golden cliffside trail as brilliant morning sun breaks across endless shimmering ocean. Expedition voices deliver in quiet unity: "A NEW CHAPTER BEGINS BEYOND THE SEA." Sound design: Gentle rising orchestral swell, ocean surf, distant morning birdsong. 85mm prime lens, anamorphic horizontal flare, 3200K radiant morning light.',
    promptLayers: [
      { index: 1, name: 'Primary Action & Kinematics', text: 'Slow crane elevation shot, travelers embark along golden cliffside trail as morning sun breaks across ocean', agentId: 'screenplay', tokenCount: 17, attentionWeight: 'high' },
      { index: 2, name: 'Character Dialogue & Vocal Emotion', text: 'Expedition voices deliver in quiet unity: "A NEW CHAPTER BEGINS BEYOND THE SEA."', agentId: 'prompt_alchemist', tokenCount: 14, attentionWeight: 'high' },
      { index: 3, name: 'Sound Design & Foley', text: 'Sound design: Gentle rising orchestral swell, ocean surf, distant morning birdsong', agentId: 'prompt_alchemist', tokenCount: 13, attentionWeight: 'medium' },
      { index: 4, name: 'Character Anchor', text: 'Paired traveling silhouettes with walking staves against sunlit horizon', agentId: 'character', tokenCount: 10, attentionWeight: 'medium' },
      { index: 5, name: 'Setting & Props', text: 'High grassy coastal ridge overlooking panoramic sparkling ocean at sunrise', agentId: 'world', tokenCount: 10, attentionWeight: 'medium' },
      { index: 6, name: '6DoF Optics & Camera Matrix', text: '85mm cinema prime, crane vector [0, 0, -2.0]', agentId: 'cinematographer', tokenCount: 9, attentionWeight: 'medium' },
      { index: 7, name: 'Lighting & Kelvin Registers', text: '3200K radiant morning warmth with lifted specular atmospheric haze', agentId: 'world', tokenCount: 10, attentionWeight: 'low' },
      { index: 8, name: 'Directorial Style Finish', text: 'Grand cinematic tableau, wide latitude, gentle highlight diffusion', agentId: 'director', tokenCount: 9, attentionWeight: 'low' },
      { index: 9, name: 'Negative Constraints', text: 'Avoid: distortion, muddy artifacts, flickering horizons', agentId: 'director', tokenCount: 8, attentionWeight: 'low' },
    ],
    qc: { anatomicalStability: 95, cameraStability: 95, opticalClarity: 93, promptConformity: 95, characterConsistency: 93, overallScore: 94, passed: true, issues: [], flaggedTimestamps: [] },
    status: 'qc_pass',
  },
];

const DEFAULT_CHARACTERS: CharacterModel[] = [
  {
    id: 'elena_vance',
    name: 'Elena Vance',
    type: 'The Navigator',
    body: 'Athletic, deliberate posture with weathered explorer endurance.',
    face: 'Focused thoughtful gaze, wind-swept dark hair tied back, sharp determined jawline.',
    clothing: 'Waxed canvas dark coat, weathered linen undershirt, brass compass lanyard, durable leather trail boots.',
    visualKeywords: ['canvas coat', 'brass compass', 'determined gaze', 'wind-swept hair'],
    negativeConstraints: ['no modern tactical logos', 'no bright neon fabrics', 'no extra limbs'],
    scenes: [1, 3, 4],
    consistencyLock: true,
  },
  {
    id: 'marcus_reed',
    name: 'Dr. Marcus Reed',
    type: 'The Cartographer',
    body: 'Scholarly, steady frame with careful precision and observant mannerisms.',
    face: 'Warm weathered features, short graying beard, observant eyes behind wire-rim loupes.',
    clothing: 'Heavy wool field vest over charcoal tunic, leather arm bracers with chart compartments.',
    visualKeywords: ['field vest', 'wire loupes', 'leather bracers', 'cartographer instruments'],
    negativeConstraints: ['no fantasy armor', 'no futuristic tech gadgets', 'no morphing hands'],
    scenes: [2, 4],
    consistencyLock: true,
  },
];

const DEFAULT_ENVIRONMENTS: EnvironmentModel[] = [
  {
    id: 'obsidian_shoreline',
    name: 'Obsidian Shoreline',
    spatial: 'Expansive basalt cliffs overlooking churning ocean surf and sea caves.',
    materials: 'Black volcanic basalt, wet sea stone, weathered driftwood, maritime lichen.',
    lighting: 'Soft directional lantern warmth breaking through dense twilight marine layer.',
    weather: 'Swirling sea spray mist, crisp coastal breeze.',
    kelvinWarm: 3200,
    kelvinCool: 6000,
    scenes: [1, 4],
  },
  {
    id: 'tide_basin',
    name: 'Sunken Tide Basin',
    spatial: 'Receding tidal flats revealing sandbars, exposed reefs, and buried maritime relics.',
    materials: 'Ribbed black volcanic sand, glistening saltwater pools, weathered brass patina.',
    lighting: 'Low golden hour sunset grazing low across tidal sand ripples.',
    weather: 'Gentle coastal breeze carrying ocean scent.',
    kelvinWarm: 3400,
    kelvinCool: 6500,
    scenes: [2],
  },
  {
    id: 'cliffside_sanctuary',
    name: 'Cliffside Sanctuary',
    spatial: 'Ancient arched stone pavilion built into the headland cliff overlooking the horizon.',
    materials: 'Carved slate flagstones, weathered stone columns, ancient bronze fittings.',
    lighting: 'Warm volumetric light beams projecting from the relic against deep shadow.',
    weather: 'Protected interior with cool evening air circulating from arched ocean bays.',
    kelvinWarm: 3000,
    kelvinCool: 6000,
    scenes: [3],
  },
];

export const useStudioStore = create<StudioState>((set, get) => ({
  events: MOCK_EVENT_TIMELINE,
  currentStep: 21,
  isPlaying: false,
  playbackSpeed: 1,
  isConnected: true,

  activeView: 'floor', // Land directly on Studio Floor showcase
  selectedAgent: null,  // Inspector hidden by default
  selectedSceneId: 1,
  consoleOpen: false,
  commandPaletteOpen: false,
  consoleFilters: {
    agent: 'all',
    severity: 'all',
    search: '',
  },

  project: {
    ...INITIAL_MOCK_PROJECT,
    scenes: DEFAULT_SCENES,
    characters: DEFAULT_CHARACTERS,
    environments: DEFAULT_ENVIRONMENTS,
    finalReelUrl: '/api/media/your_project/output/final_reel.mp4',
    timelineUrl: '/api/media/your_project/output/your_project.timeline',
  },

  // Live backend library (filled by fetchProjects on boot)
  projects: [],
  projectsLoading: false,
  activeProjectName: INITIAL_MOCK_PROJECT.projectName,
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
