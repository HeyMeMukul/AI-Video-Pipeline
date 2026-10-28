import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudioStore, useDerivedStudioState } from '../../store/useStudioStore';
import { StudioEvent } from '../../types/events';
import { ExternalLink, Film, User, Camera, Layers, Palette, ShieldCheck, Clapperboard } from 'lucide-react';

interface ShelfCard {
  id: string;
  kind: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  view: 'dossiers' | 'scenes' | 'prompt' | 'render' | 'pitch';
}

export const ArtifactShelf: React.FC = () => {
  const events = useStudioStore((s) => s.events);
  const currentStep = useStudioStore((s) => s.currentStep);
  const setActiveView = useStudioStore((s) => s.setActiveView);
  const project = useStudioStore((s) => s.project);

  // Derive visible artifact cards from events up to current step
  const activeEvents = events.slice(0, currentStep + 1);
  const cards: ShelfCard[] = [];

  const seenKinds = new Set<string>();
  activeEvents.forEach((evt) => {
    if (evt.type === 'artifact.created' && !seenKinds.has(evt.payload?.kind)) {
      seenKinds.add(evt.payload?.kind);
      const kind = evt.payload?.kind as string;

      if (kind === 'style_lock') {
        cards.push({
          id: evt.id, kind, icon: <Palette className="w-3.5 h-3.5" />,
          label: 'Style DNA', sub: project.styleDna[0],
          color: '#e5c07b', view: 'pitch',
        });
      } else if (kind === 'scene_list') {
        cards.push({
          id: evt.id, kind, icon: <Film className="w-3.5 h-3.5" />,
          label: 'Scene Board', sub: `${project.scenes.length} SVALE beats`,
          color: '#7aa2f7', view: 'scenes',
        });
      } else if (kind === 'character_bible') {
        cards.push({
          id: evt.id, kind, icon: <User className="w-3.5 h-3.5" />,
          label: 'Character Bible', sub: `${project.characters.length} heroes locked`,
          color: '#f7768e', view: 'dossiers',
        });
      } else if (kind === 'environment_bible') {
        cards.push({
          id: evt.id, kind, icon: <Camera className="w-3.5 h-3.5" />,
          label: 'World Bible', sub: `${project.environments.length} stage sets`,
          color: '#9ece6a', view: 'dossiers',
        });
      } else if (kind === 'prompt') {
        cards.push({
          id: evt.id, kind, icon: <Layers className="w-3.5 h-3.5" />,
          label: 'Prompt Layers', sub: `${project.scenes.length}-scene synthesis`,
          color: '#2ac3de', view: 'prompt',
        });
      } else if (kind === 'clip') {
        cards.push({
          id: evt.id, kind, icon: <Clapperboard className="w-3.5 h-3.5" />,
          label: 'Fresh Clips', sub: `${(evt.payload?.clips as unknown[] | undefined)?.length ?? project.scenes.length} clips rendered`,
          color: '#ff9e64', view: 'render',
        });
      } else if (kind === 'qc_report') {
        cards.push({
          id: evt.id, kind, icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'QC Verdict', sub: 'Auditor report filed',
          color: '#e0af68', view: 'render',
        });
      } else if (kind === 'timeline' || kind === 'final_reel') {
        const total = project.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
        cards.push({
          id: evt.id, kind, icon: <Film className="w-3.5 h-3.5" />,
          label: 'Master Reel', sub: total > 0 ? `${total}s · H.264 + timeline` : 'Conform ready',
          color: '#73daca', view: 'render',
        });
      }
    }
  });

  if (cards.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-white/[0.08] bg-cinema-input/90 px-4 py-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="kicker">Live artifacts</span>
      </div>
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence>
          {cards.map((card, idx) => {
            const isNewest = idx === cards.length - 1;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => setActiveView(card.view)}
                className={`shrink-0 flex items-center gap-3 px-3.5 h-[72px] rounded-xl border transition-all hover:brightness-110 active:scale-95 ${
                  isNewest
                    ? 'shadow-glow-gold'
                    : 'shadow-sm'
                }`}
                style={{
                  backgroundColor: isNewest ? `${card.color}18` : `${card.color}0d`,
                  borderColor: isNewest ? card.color : `${card.color}40`,
                  borderWidth: isNewest ? '1.5px' : '1px',
                  color: card.color,
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${card.color}20` }}>
                  {card.icon}
                </div>
                <div className="text-left min-w-0 pr-1">
                  <div className="text-[14px] font-semibold text-cinema-paper tracking-wide leading-snug truncate">
                    {card.label}
                  </div>
                  <div className="text-[12px] text-cinema-mist font-normal leading-snug mt-0.5 truncate">
                    {card.sub}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-auto shrink-0" />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
