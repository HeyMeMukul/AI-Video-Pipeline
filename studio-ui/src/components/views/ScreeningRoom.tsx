import React, { useState, useRef } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Play, Pause, Download, Film, FileCode, Volume2, VolumeX, Maximize2 } from 'lucide-react';

// Gradient SVG placeholder frame — 2.39:1 letterbox look
const FilmFrame: React.FC<{ sceneId: number; storyBeat: string; small?: boolean }> = ({ sceneId, storyBeat, small }) => {
  const palettes = [
    ['#0D1B2A', '#1B4332', '#2D6A4F'],   // scene 1: teal forest
    ['#1A1A2E', '#16213E', '#E94560'],   // scene 2: noir blue/red
    ['#0F0C29', '#302B63', '#24243E'],   // scene 3: purple dusk
    ['#2C1810', '#4A2C2A', '#8B5E52'],   // scene 4: amber warm
  ];
  const pal = palettes[(sceneId - 1) % palettes.length];
  const h = small ? 54 : 220;
  const w = small ? 129 : 524;
  const lbH = small ? 8 : 24;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', aspectRatio: `${w}/${h}` }}>
      <defs>
        <linearGradient id={`fg-${sceneId}-${small ? 's' : 'l'}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal[0]} />
          <stop offset="50%" stopColor={pal[1]} />
          <stop offset="100%" stopColor={pal[2]} />
        </linearGradient>
        <filter id={`grain-${sceneId}-${small ? 's' : 'l'}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
      </defs>
      {/* Background gradient */}
      <rect width={w} height={h} fill={`url(#fg-${sceneId}-${small ? 's' : 'l'})`} />
      {/* Grain overlay */}
      <rect width={w} height={h} fill="rgba(255,255,255,0.03)" filter={`url(#grain-${sceneId}-${small ? 's' : 'l'})`} />
      {/* Silhouette shapes */}
      <ellipse cx={w * 0.5} cy={h * 0.7} rx={w * 0.3} ry={h * 0.25} fill="rgba(0,0,0,0.4)" />
      <rect x={w * 0.1} y={h * 0.5} width={w * 0.15} height={h * 0.4} fill="rgba(0,0,0,0.3)" />
      <rect x={w * 0.75} y={h * 0.45} width={w * 0.12} height={h * 0.45} fill="rgba(0,0,0,0.25)" />
      {/* Letterbox bars */}
      <rect width={w} height={lbH} fill="black" />
      <rect y={h - lbH} width={w} height={lbH} fill="black" />
      {/* Scene label */}
      {!small && (
        <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.15)" fontSize="13" fontFamily="Inter, sans-serif">
          Scene {sceneId}
        </text>
      )}
    </svg>
  );
};

const SCENE_START_TIMES = [0, 7, 14, 20];

export const ScreeningRoom: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const setSelectedSceneId = useStudioStore((s) => s.setSelectedSceneId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 26;
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const activeScene = project.scenes.find((s) => s.sceneId === selectedSceneId) || project.scenes[0];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#08090D]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#9ece6a]/10 border border-[#9ece6a]/30">
            <Film className="w-3.5 h-3.5 text-[#9ece6a]" />
            <span className="text-[12px] font-semibold text-[#9ece6a] tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Screening Room</span>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Final Master Reel
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={project.finalReelUrl || `/api/media/${project.projectName}/output/final_reel.mp4`}
            download={`${project.projectName}_master.mp4`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5c07b] text-[#08090D] text-[14px] font-semibold hover:brightness-110 transition-all"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Download className="w-3.5 h-3.5" />
            Download MP4
          </a>
          <a href={`/api/media/${project.projectName}/output/${project.projectName}.timeline`} download className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131620] border border-white/[0.08] text-[14px] text-[#D5D8E3] hover:bg-white/[0.05] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
            <FileCode className="w-3.5 h-3.5 text-[#9ece6a]" /> .timeline
          </a>
          <a href={`/api/media/${project.projectName}/output/timeline.json`} download className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131620] border border-white/[0.08] text-[14px] text-[#D5D8E3] hover:bg-white/[0.05] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
            <FileCode className="w-3.5 h-3.5 text-[#e5c07b]" /> JSON
          </a>
        </div>
      </div>

      {/* Main content: player + filmstrip */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6 py-4 gap-4">
        
        {/* Player */}
        <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden bg-black border border-white/[0.08] flex flex-col">
          {/* Frame placeholder */}
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              <FilmFrame sceneId={activeScene.sceneId} storyBeat={activeScene.storyBeat} />
            </div>
            {/* Hidden real video */}
            <video
              ref={videoRef}
              src={project.finalReelUrl || `/api/media/${project.projectName}/output/final_reel.mp4`}
              className="absolute inset-0 w-full h-full object-contain z-10 opacity-0"
              onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
              onLoadedData={() => { if (videoRef.current) videoRef.current.classList.remove('opacity-0'); }}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />
            {/* Subtitle — 8% above bottom */}
            <div className="absolute bottom-[8%] inset-x-0 flex justify-center pointer-events-none z-20">
              <span
                className="px-4 py-1 text-[18px] md:text-[22px] font-black text-center"
                style={{
                  color: '#FFE600',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 800,
                  textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 0 12px rgba(0,0,0,0.9)',
                  letterSpacing: '0.01em',
                }}
              >
                "{activeScene.dialogue}"
              </span>
            </div>
            {/* Scene badge */}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[11px] font-mono text-[#e5c07b] z-20">
              {project.projectName} · 1080p
            </div>
            <div className="absolute top-3 right-3 text-[12px] font-mono text-[#A9AEC0] bg-black/70 px-2 py-0.5 rounded z-20">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
          </div>

          {/* Transport controls */}
          <div className="shrink-0 bg-[#131620]/95 backdrop-blur border-t border-white/[0.06] px-4 py-2.5 space-y-2">
            {/* Progress bar with scene markers */}
            <div className="relative h-6 flex items-center">
              <input
                type="range" min={0} max={totalDuration} step={0.1} value={currentTime}
                onChange={(e) => {
                  const t = Number(e.target.value);
                  setCurrentTime(t);
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-[#e5c07b] bg-white/10"
              />
              {/* Scene markers */}
              {SCENE_START_TIMES.map((t, i) => (
                <div
                  key={i}
                  className="absolute top-0 w-0.5 h-3 bg-[#e5c07b]/60 rounded-full pointer-events-none"
                  style={{ left: `${(t / totalDuration) * 100}%` }}
                  title={`Scene ${i + 1}`}
                />
              ))}
            </div>
            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="w-8 h-8 rounded-lg bg-[#e5c07b] text-[#08090D] flex items-center justify-center hover:brightness-110 transition-all">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 rounded text-[#A9AEC0] hover:text-white transition-colors">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-[13px] font-mono text-[#D5D8E3]">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#D5D8E3]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {isPlaying ? 'Playing…' : 'Paused — click to play'}
                </span>
                <button className="p-1.5 rounded text-[#A9AEC0] hover:text-white transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filmstrip */}
        <div className="shrink-0 space-y-2">
          <p className="text-[12px] font-semibold text-[#A9AEC0] tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Scene filmstrip</p>
          <div className="grid grid-cols-4 gap-3">
            {project.scenes.map((s) => (
              <button
                key={s.sceneId}
                onClick={() => {
                  setSelectedSceneId(s.sceneId);
                  const t = SCENE_START_TIMES[s.sceneId - 1] || 0;
                  setCurrentTime(t);
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
                className={`rounded-xl overflow-hidden border transition-all ${
                  selectedSceneId === s.sceneId
                    ? 'border-[#e5c07b] shadow-lg shadow-[#e5c07b]/10 scale-[1.02]'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <FilmFrame sceneId={s.sceneId} storyBeat={s.storyBeat} small />
                <div className="px-2 py-1.5 bg-[#131620] text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono font-bold text-[#e5c07b]">S{s.sceneId}</span>
                    <span className="text-[11px] font-mono text-[#A9AEC0]">{s.durationSeconds}s</span>
                  </div>
                  <p className="text-[12px] text-[#D5D8E3] leading-snug mt-0.5 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {s.storyBeat}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
