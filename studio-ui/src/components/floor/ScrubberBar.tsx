import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Sparkles,
} from 'lucide-react';

export const ScrubberBar: React.FC = () => {
  const isPlaying = useStudioStore((s) => s.isPlaying);
  const togglePlay = useStudioStore((s) => s.togglePlay);
  const currentStep = useStudioStore((s) => s.currentStep);
  const setCurrentStep = useStudioStore((s) => s.setCurrentStep);
  const stepForward = useStudioStore((s) => s.stepForward);
  const stepBackward = useStudioStore((s) => s.stepBackward);
  const resetProduction = useStudioStore((s) => s.resetProduction);
  const playbackSpeed = useStudioStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useStudioStore((s) => s.setPlaybackSpeed);
  const events = useStudioStore((s) => s.events);

  const totalSteps = events.length;
  const currentEvent = events[currentStep];

  const handleSpeedCycle = () => {
    const speeds = [0.5, 1, 2, 4];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  return (
    <div className="w-full bg-cinema-surface/90 backdrop-blur-md border border-cinema-border rounded-xl p-3 shadow-xl">
      <div className="flex items-center justify-between space-x-4">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={resetProduction}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Rewind to start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={stepBackward}
            disabled={currentStep === 0}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
            title="Step Back (J)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg bg-cinema-gold text-cinema-bg hover:brightness-110 font-bold transition-all shadow-md"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={stepForward}
            disabled={currentStep >= totalSteps - 1}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
            title="Step Forward (K)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Toggle */}
          <button
            onClick={handleSpeedCycle}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-cinema-gold text-xs font-mono font-medium border border-cinema-border"
            title="Cycle Playback Speed"
          >
            <Gauge className="w-3 h-3" />
            <span>{playbackSpeed}x</span>
          </button>
        </div>

        {/* Progress Slider Track */}
        <div className="flex-1 flex flex-col space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span className="flex items-center space-x-1.5">
              <span className="text-cinema-gold font-bold">Step {currentStep + 1}</span>
              <span>/</span>
              <span>{totalSteps}</span>
              {currentEvent && (
                <span className="text-gray-500 truncate max-w-xs ml-2">
                  • [{currentEvent.agent}] {currentEvent.message || currentEvent.type}
                </span>
              )}
            </span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={totalSteps - 1}
              value={currentStep}
              onChange={(e) => setCurrentStep(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cinema-gold focus:outline-none"
            />
          </div>
        </div>

        {/* Live vs Replay Badge */}
        <div className="shrink-0 flex items-center space-x-2">
          {currentStep === totalSteps - 1 ? (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full Output</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] uppercase">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Replay Step</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
