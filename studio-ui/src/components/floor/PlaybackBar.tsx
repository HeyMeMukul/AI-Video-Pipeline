import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudioStore } from '../../store/useStudioStore';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, FastForward } from 'lucide-react';
import { AGENT_PERSONAS } from '../../mock/personas';

export const PlaybackBar: React.FC = () => {
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
  const persona = currentEvent ? AGENT_PERSONAS[currentEvent.agent] : null;

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 2, 4];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
  };

  const skipToEnd = () => setCurrentStep(totalSteps - 1);
  const isAtEnd = currentStep === totalSteps - 1;

  return (
    <div className="h-12 shrink-0 px-4 bg-cinema-input/95 border-t border-white/[0.06] flex items-center gap-4 backdrop-blur-xl">
      {/* Transport buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={resetProduction} className="p-1.5 rounded text-cinema-faint hover:text-cinema-paper hover:bg-white/[0.06] transition-colors" title="Rewind">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={stepBackward}
          disabled={currentStep === 0}
          className="p-1.5 rounded text-cinema-faint hover:text-cinema-paper hover:bg-white/[0.06] disabled:opacity-20 transition-colors"
          title="Step Back (J)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={togglePlay}
          className="mx-1 p-2 rounded-lg bg-cinema-gold text-cinema-bg hover:brightness-110 active:scale-95 transition-all shadow-glow-gold"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={stepForward}
          disabled={isAtEnd}
          className="p-1.5 rounded text-cinema-faint hover:text-cinema-paper hover:bg-white/[0.06] disabled:opacity-20 transition-colors"
          title="Step Forward (K)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
        {!isAtEnd && (
          <button
            onClick={skipToEnd}
            className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded text-[12px] text-cinema-mist hover:text-cinema-paper hover:bg-white/[0.08] transition-colors"
            title="Skip to end"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip</span>
          </button>
        )}
      </div>

      {/* Scrub slider */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStep}
          onChange={(e) => setCurrentStep(Number(e.target.value))}
          className="w-full h-1.5 rounded-full bg-white/[0.08] accent-cinema-gold cursor-pointer focus:outline-none"
          style={{
            background: `linear-gradient(to right, #e5c07b ${((currentStep / (totalSteps - 1)) * 100).toFixed(1)}%, rgba(255,255,255,0.08) 0%)`,
          }}
        />
      </div>

      {/* Current event label & counter */}
      <div className="flex items-center gap-2.5 min-w-0 max-w-sm shrink-0">
        {persona && (
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: persona.color }}
          />
        )}
        <span className="font-mono text-[12px] text-cinema-mist shrink-0 font-medium">
          {currentStep + 1}/{totalSteps}
        </span>
        {currentEvent && (
          <span className="text-[13px] text-cinema-mist truncate">
            {currentEvent.message}
          </span>
        )}
      </div>

      {/* Speed toggle */}
      <button
        onClick={cycleSpeed}
        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.12] text-[12px] font-mono text-cinema-gold hover:bg-white/[0.08] transition-colors"
        title="Cycle playback speed"
      >
        <Gauge className="w-3.5 h-3.5" />
        {playbackSpeed}×
      </button>
    </div>
  );
};
