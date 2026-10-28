import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  User,
  MapPin,
  Compass,
  Lock,
  Thermometer,
  ShieldAlert,
  Layers,
  Ghost,
} from 'lucide-react';
import { SectionHeader, EmptyState } from '../ui/primitives';
import { cn } from '../ui/cn';

function SpecLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-cinema-faint block text-[10.5px] tracking-[0.12em]">
      {children}
    </span>
  );
}

export const DossiersView: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const [tab, setTab] = useState<'characters' | 'environments' | 'director'>('characters');

  const tabs = [
    { id: 'characters' as const, label: `Character Bible (${project.characters.length})`, icon: User, active: 'bg-cinema-character/20 text-cinema-character border-cinema-character/40' },
    { id: 'environments' as const, label: `Environment Bible (${project.environments.length})`, icon: MapPin, active: 'bg-cinema-world/20 text-cinema-world border-cinema-world/40' },
    { id: 'director' as const, label: 'Director Vision Lock', icon: Compass, active: 'bg-cinema-gold/20 text-cinema-gold border-cinema-gold/40' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-cinema-bg p-8">
      <div className="max-w-6xl mx-auto space-y-6 view-enter">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <SectionHeader
            kicker={`Dossiers · ${project.characters.length} characters · ${project.environments.length} environments`}
            title="Bible Lock"
            sub="Immutable visual contracts — Maya Lin holds the cast, Dorian Cruz holds the sets."
          />
          <div className="flex items-center gap-1 surface-card p-1 shrink-0">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-pressed={active}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 border border-transparent',
                    active ? t.active : 'text-cinema-faint hover:text-cinema-paper'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Character Bible */}
        {tab === 'characters' && (
          project.characters.length === 0 ? (
            <EmptyState
              icon={<Ghost className="w-5 h-5" />}
              title="No cast locked yet"
              body="Run the Character Bible stage and the ensemble will appear here with biometric anchors."
            />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.characters.map((char) => (
              <div
                key={char.id}
                className="surface-card p-5 space-y-4 hover:border-cinema-character/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-cinema-character tracking-[0.08em] truncate">
                      {char.type}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cinema-character/15 border border-cinema-character/30 text-cinema-character text-[12px] shrink-0 whitespace-nowrap">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Consistency Lock</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-playfair font-bold text-cinema-paper">
                    {char.name}
                  </h3>

                  <div className="text-xs space-y-2 text-cinema-mist">
                    <div>
                      <SpecLabel>Face and expression</SpecLabel>
                      <p className="mt-0.5 leading-relaxed">{char.face || '—'}</p>
                    </div>
                    <div>
                      <SpecLabel>Body anatomy</SpecLabel>
                      <p className="mt-0.5 leading-relaxed">{char.body || '—'}</p>
                    </div>
                    <div>
                      <SpecLabel>Wardrobe silhouette</SpecLabel>
                      <p className="mt-0.5 leading-relaxed">{char.clothing || '—'}</p>
                    </div>
                  </div>

                  {char.visualKeywords.length > 0 && (
                    <div>
                      <SpecLabel>Identity tokens</SpecLabel>
                      <div className="flex flex-wrap gap-1 mt-1">
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
                  )}

                  {char.negativeConstraints && char.negativeConstraints.length > 0 && (
                    <div className="pt-2">
                      <span className="font-mono text-cinema-error block text-[10.5px] tracking-[0.12em] mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>Forbidden attributes</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {char.negativeConstraints.map((nc) => (
                          <span
                            key={nc}
                            className="px-2 py-0.5 rounded bg-cinema-error/10 border border-cinema-error/25 text-[10px] font-mono text-cinema-error"
                          >
                            × {nc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between timecode text-[11px]">
                  <span>Appears in scenes</span>
                  <div className="flex gap-1">
                    {char.scenes.length === 0 && <span className="text-cinema-faint">—</span>}
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
          )
        )}

        {/* Tab 2: Environment Bible */}
        {tab === 'environments' && (
          project.environments.length === 0 ? (
            <EmptyState
              icon={<Ghost className="w-5 h-5" />}
              title="No sets locked yet"
              body="Run the Environment Bible stage and the physical stages will appear here with Kelvin registers."
            />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.environments.map((env) => (
              <div
                key={env.id}
                className="surface-card p-5 space-y-4 hover:border-cinema-world/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-mono tracking-[0.12em] text-cinema-world font-bold">
                      Physical stage
                    </span>
                    <span className="timecode text-[10.5px]">ID · {env.id}</span>
                  </div>

                  <h3 className="text-xl font-playfair font-bold text-cinema-paper">
                    {env.name}
                  </h3>

                  <div className="text-xs space-y-2 text-cinema-mist">
                    <div>
                      <SpecLabel>Spatial geometry</SpecLabel>
                      <p className="mt-0.5 leading-relaxed">{env.spatial || '—'}</p>
                    </div>
                    <div>
                      <SpecLabel>Materials and surface physics</SpecLabel>
                      <p className="mt-0.5 leading-relaxed">{env.materials || '—'}</p>
                    </div>
                    <div>
                      <SpecLabel>Atmospheric weather</SpecLabel>
                      <p className="mt-0.5 leading-relaxed">{env.weather || '—'}</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-between timecode text-[10.5px]">
                      <span className="text-amber-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        <span>Warm · {env.kelvinWarm}K</span>
                      </span>
                      <span className="text-blue-400">
                        Cool · {env.kelvinCool}K
                      </span>
                    </div>
                    <div className="h-2 rounded-full w-full bg-gradient-to-r from-amber-500 via-yellow-200 to-blue-500 shadow-inner" />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between timecode text-[11px]">
                  <span>Assigned scenes</span>
                  <div className="flex gap-1">
                    {env.scenes.length === 0 && <span className="text-cinema-faint">—</span>}
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
          )
        )}

        {/* Tab 3: Director Vision Lock */}
        {tab === 'director' && (
          <div className="surface-raised p-6 space-y-6 border-cinema-gold/25">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="kicker">Aria Vance · directorial vision</p>
                <h3 className="text-2xl font-playfair font-bold text-cinema-paper mt-1">
                  Master style lock and harmonic palette
                </h3>
              </div>
              <span className="chip chip-active font-mono shrink-0">
                <Layers className="w-3 h-3" />
                Locked for production
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <SpecLabel>Harmonic color temperature registers</SpecLabel>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono">
                    <span className="text-cinema-mist">Warm register · motivated rim light</span>
                    <span className="text-cinema-gold font-bold">{project.directorVision.kelvinRegister.warm}K</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono">
                    <span className="text-cinema-mist">Cool register · dimensional ambient void</span>
                    <span className="text-blue-400 font-bold">{project.directorVision.kelvinRegister.cool}K</span>
                  </div>
                </div>
                {project.directorVision.styleLock && (
                  <p className="text-[13px] leading-relaxed text-cinema-mist border-l-2 border-cinema-gold/50 pl-3">
                    {project.directorVision.styleLock}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <SpecLabel>Global avoidance constraints</SpecLabel>
                {project.directorVision.avoidConstraints.length === 0 ? (
                  <p className="text-[13px] text-cinema-faint">No avoidance rules recorded for this production.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {project.directorVision.avoidConstraints.map((item) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 rounded-lg bg-cinema-error/10 border border-cinema-error/25 text-cinema-error text-xs font-mono"
                      >
                        × {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2">
              <div className="flex items-center justify-between timecode text-[11px]">
                <span>Directorial energy pacing curve</span>
                <span className="text-cinema-gold">Crescendo structure</span>
              </div>
              <div className="h-16 flex items-end gap-2 pt-4">
                {project.directorVision.pacingPoints.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-cinema-gold/50 hover:bg-cinema-gold rounded-t transition-all"
                    style={{ height: `${Math.max(8, Math.min(100, v * 10))}%` }}
                    title={`Beat ${i + 1}: ${v}/10`}
                  />
                ))}
              </div>
              <div className="flex justify-between timecode text-[10.5px] pt-1">
                {project.scenes.map((s) => (
                  <span key={s.sceneId}>Scene {s.sceneId} ({s.durationSeconds}s)</span>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
