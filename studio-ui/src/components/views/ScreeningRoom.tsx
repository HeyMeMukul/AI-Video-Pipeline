import React, { useState, useRef } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Play, Pause, Download, FileCode, Volume2, VolumeX, Maximize2, Popcorn } from 'lucide-react';
import { SectionHeader, EmptyState } from '../ui/primitives';
import { cn } from '../ui/cn';

// Gradient SVG placeholder frame — letterboxed look
const FilmFrame: React.FC<{ sceneId: number; frameUrl?: string; small?: boolean }> = ({ sceneId, frameUrl, small }) => {
  const palettes = [
    ['#0D1B2A', '#1B4332', '#2D6A4F'],
    ['#1A1A2E', '#16213E', '#E94560'],
    ['#0F0C29', '#302B63', '#24243E'],
    ['#2C1810', '#4A2C2A', '#8B5E52'],
  ];
  const pal = palettes[(sceneId - 1) % palettes.length];
  const h = small ? 54 : 220;
  const w = small ? 129 : 524;
  const lbH = small ? 8 : 24;

  if (frameUrl) {
    return <img src={frameUrl} alt={`Frame for scene ${sceneId}`} className="block w-full object-cover bg-black" style={{ aspectRatio: `${w}/${h}` }} loading="lazy" />;
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', aspectRatio: `${w}/${h}` }} role="img" aria-label={`Placeholder frame for scene ${sceneId}`}>
      <defs>
        <linearGradient id={`fg-${sceneId}-${small ? 's' : 'l'}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal[0]} />
          <stop offset="50%" stopColor={pal[1]} />
          <stop offset="100%" stopColor={pal[2]} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#fg-${sceneId}-${small ? 's' : 'l'})`} />
      <ellipse cx={w * 0.5} cy={h * 0.7} rx={w * 0.3} ry={h * 0.25} fill="rgba(0,0,0,0.4)" />
      <rect width={w} height={lbH} fill="black" />
      <rect y={h - lbH} width={w} height={lbH} fill="black" />
      {!small && (
        <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.15)" fontSize="13">
          Scene {sceneId}
        </text>
      )}
    </svg>
  );
};

export const ScreeningRoom: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const selectedSceneId = useStudioStore((s) => s.selectedSceneId);
  const setSelectedSceneId = useStudioStore((s) => s.setSelectedSceneId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const totalDuration = project.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) || 1;
  const sceneStarts: number[] = [];
  project.scenes.reduce((acc, s) => {
    sceneStarts.push(acc);
    return acc + (s.durationSeconds || 0);
  }, 0);

  const togglePlay = () => {
    if (videoRef.current && videoReady) {
      if (isPlaying) videoRef.current.pause();
      else void videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (playerRef.current) {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void playerRef.current.requestFullscreen();
    }
  };

  const activeScene = project.scenes.find((s) => s.sceneId === selectedSceneId) || project.scenes[0];
  const reelUrl = project.finalReelUrl || `/api/media/${project.projectName}/output/final_reel.mp4`;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (project.scenes.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-cinema-bg p-8">
        <div className="max-w-3xl mx-auto space-y-6 view-enter">
          <SectionHeader
            kicker="Screening room · no production loaded"
            title="Master Reel"
            sub="The conformed reel premieres here once the Editor assembles it."
          />
          <EmptyState
            icon={<Popcorn className="w-5 h-5" />}
            title="The house lights are still up"
            body="Load a production from the vault, or pitch a new film and run the pipeline to the final conform."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-cinema-bg">
      <div className="shrink-0 px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
        <SectionHeader
          kicker={`Screening room · ${project.projectName} · ${project.aspectRatio}`}
          title="Master Reel"
        />
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={reelUrl}
            download={`${project.projectName}_master.mp4`}
            className="btn-gold px-3 py-1.5 text-[14px]"
          >
            <Download className="w-3.5 h-3.5" />
            Download MP4
          </a>
          <a href={`/api/media/${project.projectName}/output/${project.projectName}.timeline`} download className="btn-ghost px-3 py-1.5 text-[14px]">
            <FileCode className="w-3.5 h-3.5 text-cinema-world" /> .timeline
          </a>
          <a href={`/api/media/${project.projectName}/output/timeline.json`} download className="btn-ghost px-3 py-1.5 text-[14px]">
            <FileCode className="w-3.5 h-3.5 text-cinema-gold" /> JSON
          </a>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6 py-4 gap-4 view-enter">

        {/* Player */}
        <div ref={playerRef} className="flex-1 min-h-0 relative rounded-xl overflow-hidden bg-black border border-white/[0.08] flex flex-col">
          <div className="flex-1 min-h-0 relative">
            {!videoReady && (
              <div className="absolute inset-0">
                <FilmFrame sceneId={activeScene.sceneId} frameUrl={activeScene.keyframeUrl} />
              </div>
            )}
            <video
              ref={videoRef}
              src={reelUrl}
              muted={isMuted}
              className={cn('absolute inset-0 w-full h-full object-contain z-10', !videoReady && 'opacity-0')}
              onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
              onLoadedData={() => { setVideoReady(true); }}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />
            {activeScene.dialogue && (
              <div className="absolute bottom-[8%] inset-x-0 flex justify-center pointer-events-none z-20 px-8">
                <span className="px-4 py-1 text-[18px] md:text-[22px] font-extrabold text-center text-cinema-paper [text-shadow:0_2px_0_#000,0_-2px_0_#000,2px_0_0_#000,-2px_0_0_#000,0_0_12px_rgba(0,0,0,0.9)]">
                  “{activeScene.dialogue}”
                </span>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 timecode text-[11px] text-cinema-gold z-20">
              {project.projectName} · 1080p
            </div>
            <div className="absolute top-3 right-3 timecode text-[12px] text-cinema-mist bg-black/70 px-2 py-0.5 rounded z-20">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
          </div>

          {/* Transport */}
          <div className="shrink-0 bg-cinema-surface/95 backdrop-blur border-t border-white/[0.06] px-4 py-2.5 space-y-2">
            <div className="relative h-6 flex items-center">
              <input
                type="range" min={0} max={totalDuration} step={0.1} value={currentTime}
                onChange={(e) => {
                  const t = Number(e.target.value);
                  setCurrentTime(t);
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
                className="slider-gold"
                aria-label="Seek"
              />
              {sceneStarts.map((t, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-cinema-gold/60 rounded-full pointer-events-none"
                  style={{ left: `${(t / totalDuration) * 100}%` }}
                  title={`Scene ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="w-8 h-8 rounded-lg bg-cinema-gold text-cinema-bg flex items-center justify-center hover:brightness-110 transition-all" aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 rounded text-cinema-mist hover:text-cinema-paper transition-colors" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="timecode text-[13px]">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-cinema-faint">
                  {!videoReady ? 'Reel not conformed yet — showing keyframes' : isPlaying ? 'Now screening' : 'Paused'}
                </span>
                <button onClick={toggleFullscreen} className="p-1.5 rounded text-cinema-mist hover:text-cinema-paper transition-colors" aria-label="Fullscreen">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filmstrip */}
        <div className="shrink-0 space-y-2">
          <p className="kicker">Scene filmstrip</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {project.scenes.map((s) => (
              <button
                key={s.sceneId}
                onClick={() => {
                  setSelectedSceneId(s.sceneId);
                  const t = sceneStarts[s.sceneId - 1] || 0;
                  setCurrentTime(t);
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
                aria-pressed={selectedSceneId === s.sceneId}
                className={cn(
                  'rounded-xl overflow-hidden border transition-all text-left',
                  selectedSceneId === s.sceneId
                    ? 'border-cinema-gold shadow-glow-gold scale-[1.02]'
                    : 'border-white/[0.08] hover:border-white/20'
                )}
              >
                <FilmFrame sceneId={s.sceneId} frameUrl={s.keyframeUrl} small />
                <div className="px-2 py-1.5 bg-cinema-surface text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono font-bold text-cinema-gold">S{s.sceneId}</span>
                    <span className="timecode text-[11px]">{s.durationSeconds}s</span>
                  </div>
                  <p className="text-[12px] text-cinema-mist leading-snug mt-0.5 line-clamp-2">
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
