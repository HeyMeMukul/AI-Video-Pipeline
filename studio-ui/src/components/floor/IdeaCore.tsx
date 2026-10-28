import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Sparkles, Eye } from 'lucide-react';

export const IdeaCore: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const currentStep = useStudioStore((s) => s.currentStep);
  const totalEvents = useStudioStore((s) => s.events.length);
  const setActiveView = useStudioStore((s) => s.setActiveView);

  const progress = Math.min(100, Math.round(((currentStep + 1) / totalEvents) * 100));

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Outer ambient glow rings */}
      <div className="absolute w-36 h-36 rounded-full bg-cinema-gold/10 blur-xl animate-pulse pointer-events-none" />
      <div className="absolute w-24 h-24 rounded-full border border-cinema-gold/20 animate-spin pointer-events-none" style={{ animationDuration: '20s' }} />

      {/* Central Interactive Core Sphere */}
      <div
        onClick={() => setActiveView('journey')}
        className="group relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-[#131620] via-[#1a1e2c] to-[#242b3d] border-2 border-cinema-gold/60 shadow-xl flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110"
        title="Idea Core — Click to inspect Idea Journey"
      >
        <Sparkles className="w-5 h-5 text-cinema-gold group-hover:scale-125 transition-transform" />
        <span className="text-[10px] font-mono font-bold text-cinema-gold mt-0.5">
          {progress}%
        </span>
        <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">
          CORE
        </span>

        {/* Hover inspect pill */}
        <div className="absolute -bottom-6 px-2 py-0.5 rounded bg-black/80 border border-cinema-gold/40 text-[9px] font-mono text-cinema-gold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center space-x-1">
          <Eye className="w-2.5 h-2.5" />
          <span>Inspect Journey</span>
        </div>
      </div>

      {/* Story summary pill */}
      <div className="mt-4 max-w-[200px] text-center">
        <div className="text-[11px] font-serif text-gray-200 font-medium truncate">
          "{project.story}"
        </div>
        <div className="flex items-center justify-center space-x-1 mt-1">
          <span className="text-[9px] font-mono text-gray-500 uppercase">Aspect: {project.aspectRatio}</span>
          <span className="text-gray-600">•</span>
          <span className="text-[9px] font-mono text-cinema-gold">{project.styleDna[0]}</span>
        </div>
      </div>
    </div>
  );
};
