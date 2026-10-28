import { AgentId } from './events';

export interface SVALE {
  subject: string;
  verb: string;
  atmosphere: string;
  location: string;
  emotion: string;
}

export interface Camera6DoF {
  tx: number;
  ty: number;
  tz: number;
  pitch: number;
  yaw: number;
  roll: number;
  lens: string;
  movement: string;
  motionScore: number;
}

export interface PromptLayer {
  index: number;
  name: string;
  text: string;
  agentId: AgentId;
  tokenCount: number;
  attentionWeight: 'high' | 'medium' | 'low';
}

export interface QCRubric {
  anatomicalStability: number;
  cameraStability: number;
  opticalClarity: number;
  promptConformity: number;
  characterConsistency: number;
  overallScore: number;
  passed: boolean;
  issues: string[];
  flaggedTimestamps: number[];
}

export interface SceneModel {
  sceneId: number;
  durationSeconds: number;
  svale: SVALE;
  storyBeat: string;
  dialogue: string;
  voiceEmotion: string;
  audioCues: string;
  locationId: string;
  characterIds: string[];
  camera: Camera6DoF;
  videoPrompt: string;
  promptLayers: PromptLayer[];
  keyframeUrl?: string;
  clipUrl?: string;
  qc: QCRubric;
  status: 'planned' | 'prompted' | 'keyframed' | 'rendered' | 'qc_pass' | 'qc_fail' | 'retrying';
}

export interface CharacterModel {
  id: string;
  name: string;
  type: string;
  body: string;
  face: string;
  clothing: string;
  visualKeywords: string[];
  negativeConstraints: string[];
  scenes: number[];
  consistencyLock: boolean;
  referenceImageUrl?: string;
}

export interface EnvironmentModel {
  id: string;
  name: string;
  spatial: string;
  materials: string;
  lighting: string;
  weather: string;
  kelvinWarm: number;
  kelvinCool: number;
  scenes: number[];
}

export interface DirectorVision {
  visualStyle: string;
  cameraStyle: string;
  styleLock: string;
  pacingPoints: number[]; // Sparkline data (e.g. 1-10 intensity curve)
  kelvinRegister: { warm: number; cool: number };
  avoidConstraints: string[];
}

export interface ProjectModel {
  projectId: string;
  projectName: string;
  story: string;
  duration: number;
  aspectRatio: '16:9' | '2.39:1' | '9:16';
  platform: string;
  styleDna: string[];
  tone: string;
  directorVision: DirectorVision;
  scenes: SceneModel[];
  characters: CharacterModel[];
  environments: EnvironmentModel[];
  finalReelUrl?: string;
  timelineUrl?: string;
}
