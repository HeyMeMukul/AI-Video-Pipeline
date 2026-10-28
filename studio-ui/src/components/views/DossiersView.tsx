import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  BookOpen,
  User,
  MapPin,
  Compass,
  Lock,
  Thermometer,
  ShieldAlert,
  Sparkles,
  Layers,
} from 'lucide-react';

export const DossiersView: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const [tab, setTab] = useState<'characters' | 'environments' | 'director'>('characters');

  return (
    <div className="flex-1 overflow-y-auto bg-[#08090d] p-8 text-gray-200">
      <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cinema-border pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cinema-world/10 border border-cinema-world/30 text-cinema-world">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Studio Dossiers</span>
            </div>
            <h1 className="text-3xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Studio Dossiers
            </h1>
            <p className="text-[14px] text-[#A9AEC0]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Immutable visual contracts locked by Maya Lin (Characters) and Dorian Cruz (Environments).
            </p>
          </div>

          {/* Sub tabs */}
          <div className="flex items-center space-x-2 bg-cinema-surface p-1 rounded-xl border border-cinema-border">
            <button
              onClick={() => setTab('characters')}
              className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors flex items-center space-x-1.5 ${
                tab === 'characters'
                  ? 'bg-cinema-character/20 text-cinema-character border border-cinema-character/40'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <User className="w-3.5 h-3.5" />
              <span>Character Bible ({project.characters.length})</span>
            </button>
            <button
              onClick={() => setTab('environments')}
              className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors flex items-center space-x-1.5 ${
                tab === 'environments'
                  ? 'bg-cinema-world/20 text-cinema-world border border-cinema-world/40'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Environment Bible ({project.environments.length})</span>
            </button>
            <button
              onClick={() => setTab('director')}
              className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors flex items-center space-x-1.5 ${
                tab === 'director'
                  ? 'bg-cinema-gold/20 text-cinema-gold border border-cinema-gold/40'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Director Vision Lock</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Character Bible */}
        {tab === 'characters' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.characters.map((char) => (
              <div
                key={char.id}
                className="rounded-2xl border border-cinema-border bg-cinema-surface/70 p-5 space-y-4 hover:border-cinema-character/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top line with Consistency Lock */}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-cinema-character tracking-[0.08em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {char.type}
                    </span>
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cinema-character/15 border border-cinema-character/30 text-cinema-character text-[12px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <Lock className="w-2.5 h-2.5" />
                      <span>Consistency Lock</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-white">
                    {char.name}
                  </h3>

                  {/* Body & Facial Specs */}
                  <div className="text-xs space-y-2 text-gray-300">
                    <div>
                      <span className="font-mono text-gray-500 block text-[10px] uppercase">Face & Expression</span>
                      <p className="mt-0.5 leading-relaxed">{char.face}</p>
                    </div>
                    <div>
                      <span className="font-mono text-gray-500 block text-[10px] uppercase">Body Anatomy</span>
                      <p className="mt-0.5 leading-relaxed">{char.body}</p>
                    </div>
                    <div>
                      <span className="font-mono text-gray-500 block text-[10px] uppercase">Wardrobe Silhouette</span>
                      <p className="mt-0.5 leading-relaxed">{char.clothing}</p>
                    </div>
                  </div>

                  {/* Token chips */}
                  <div>
                    <span className="font-mono text-gray-500 block text-[10px] uppercase mb-1">Identity Tokens</span>
                    <div className="flex flex-wrap gap-1">
                      {char.visualKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-cinema-character"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Negative Avoid Constraints */}
                  {char.negativeConstraints && char.negativeConstraints.length > 0 && (
                    <div className="pt-2">
                      <span className="font-mono text-red-400 block text-[10px] uppercase mb-1 flex items-center space-x-1">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>Forbidden Attributes</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {char.negativeConstraints.map((nc) => (
                          <span
                            key={nc}
                            className="px-2 py-0.5 rounded bg-red-950/40 border border-red-500/20 text-[10px] font-mono text-red-300"
                          >
                            × {nc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Scene Appearances */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>Appears in scenes:</span>
                  <div className="flex space-x-1">
                    {char.scenes.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-black/40 text-cinema-gold font-bold">
                        S{s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Environment Bible */}
        {tab === 'environments' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.environments.map((env) => (
              <div
                key={env.id}
                className="rounded-2xl border border-cinema-border bg-cinema-surface/70 p-5 space-y-4 hover:border-cinema-world/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cinema-world uppercase font-bold tracking-wider">
                      Physical Stage
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">ID: {env.id}</span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-white">
                    {env.name}
                  </h3>

                  <div className="text-xs space-y-2 text-gray-300">
                    <div>
                      <span className="font-mono text-gray-500 block text-[10px] uppercase">Spatial Geometry</span>
                      <p className="mt-0.5 leading-relaxed">{env.spatial}</p>
                    </div>
                    <div>
                      <span className="font-mono text-gray-500 block text-[10px] uppercase">Materials & Surface Physics</span>
                      <p className="mt-0.5 leading-relaxed">{env.materials}</p>
                    </div>
                    <div>
                      <span className="font-mono text-gray-500 block text-[10px] uppercase">Atmospheric Weather</span>
                      <p className="mt-0.5 leading-relaxed">{env.weather}</p>
                    </div>
                  </div>

                  {/* Dual Register Kelvin Temperature Bar */}
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-amber-400 flex items-center space-x-1">
                        <Thermometer className="w-3 h-3" />
                        <span>Warm: {env.kelvinWarm}K</span>
                      </span>
                      <span className="text-blue-400">
                        Cool: {env.kelvinCool}K
                      </span>
                    </div>
                    <div className="h-2 rounded-full w-full bg-gradient-to-r from-amber-500 via-yellow-200 to-blue-500 shadow-inner" />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>Assigned scenes:</span>
                  <div className="flex space-x-1">
                    {env.scenes.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-black/40 text-cinema-world font-bold">
                        S{s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Director Vision Lock */}
        {tab === 'director' && (
          <div className="p-6 rounded-2xl border border-cinema-gold/30 bg-cinema-surface/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cinema-gold uppercase font-bold tracking-wider">
                  Aria Vance Directorial Vision
                </span>
                <h3 className="text-2xl font-serif font-bold text-white mt-1">
                  Master Style Lock & Harmonic Color Palette
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-cinema-gold/15 border border-cinema-gold/40 text-cinema-gold text-xs font-mono font-bold">
                LOCKED FOR PRODUCTION
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Color Palette */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
                  Harmonic Color Temperature Registers
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono">
                    <span className="text-gray-300">Warm Register (Motivated Rim Light)</span>
                    <span className="text-cinema-gold font-bold">3000K</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono">
                    <span className="text-gray-300">Cool Register (Dimensional Ambient Void)</span>
                    <span className="text-blue-400 font-bold">6500K</span>
                  </div>
                </div>
              </div>

              {/* Negative Constraints */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
                  Global Avoidance Constraints
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.directorVision.avoidConstraints.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono"
                    >
                      × {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pacing Curve */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>Directorial Energy Pacing Curve</span>
                <span className="text-cinema-gold">Crescendo Structure</span>
              </div>
              <div className="h-16 flex items-end space-x-2 pt-4">
                <div className="flex-1 bg-cinema-gold/40 hover:bg-cinema-gold rounded-t transition-all" style={{ height: '50%' }} title="S1: 50% Intro" />
                <div className="flex-1 bg-cinema-gold/60 hover:bg-cinema-gold rounded-t transition-all" style={{ height: '70%' }} title="S2: 70% Action" />
                <div className="flex-1 bg-cinema-gold/80 hover:bg-cinema-gold rounded-t transition-all" style={{ height: '85%' }} title="S3: 85% Climax" />
                <div className="flex-1 bg-cinema-gold hover:brightness-125 rounded-t transition-all" style={{ height: '100%' }} title="S4: 100% Grand Finale" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-1">
                <span>Scene 1 (7s)</span>
                <span>Scene 2 (7s)</span>
                <span>Scene 3 (6s)</span>
                <span>Scene 4 (6s)</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
