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
  selectedPacketId: string | null;
  inspectorOpen: boolean;
  consoleOpen: boolean;
  commandPaletteOpen: boolean;
  consoleFilters: {
    agent: string;
    severity: string;
    search: string;
  };

  // Project Info
  project: ProjectModel;
  elapsedSeconds: number;
  gpuQuotaHours: number;

  // Actions
  setActiveView: (view: StudioView) => void;
  setSelectedAgent: (agent: AgentId | null) => void;
  setSelectedSceneId: (sceneId: number) => void;
  setSelectedPacketId: (packetId: string | null) => void;
  setInspectorOpen: (open: boolean) => void;
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
  startProduction: (idea: string, styles: string[], ratio: '16:9' | '2.39:1' | '9:16') => void;
  resetProduction: () => void;
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
  selectedPacketId: null,
  inspectorOpen: false,
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
  elapsedSeconds: 0,
  gpuQuotaHours: 28.5,

  setActiveView: (view) => set({ activeView: view }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent, inspectorOpen: agent !== null }),
  setSelectedSceneId: (sceneId) => set({ selectedSceneId: sceneId }),
  setSelectedPacketId: (packetId) => set({ selectedPacketId: packetId, inspectorOpen: packetId !== null }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
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

  startProduction: (idea, styles, ratio) => {
    const safeName = (idea.slice(0, 24).toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'film_project');
    const newProject: ProjectModel = {
      ...get().project,
      projectName: safeName,
      story: idea || get().project.story,
      styleDna: styles.length ? styles : get().project.styleDna,
      aspectRatio: ratio || get().project.aspectRatio,
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
    });

    // Create project and trigger autonomous pipeline on the live backend
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: safeName,
        story: idea || get().project.story,
        style: styles.join(', '),
      }),
    })
      .then((r) => r.json())
      .then(() => {
        fetch(`/api/projects/${safeName}/run_all`, { method: 'POST' });
      })
      .catch((err) => console.warn('[CineStorm Live] Execution note:', err));
  },

  resetProduction: () => {
    set({
      currentStep: 0,
      isPlaying: false,
    });
  },
}));

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
