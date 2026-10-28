import React, { useState } from 'react';
import { useStudioStore, StudioView } from '../../store/useStudioStore';
import {
  Clapperboard,
  LayoutGrid,
  GitFork,
  BookOpen,
  Film,
  FlaskConical,
  Cpu,
  Tv,
  Terminal,
} from 'lucide-react';

interface NavItem {
  view: StudioView;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'pitch', icon: <Clapperboard className="w-5 h-5" />, label: 'Pitch Room', shortcut: '1' },
  { view: 'floor', icon: <LayoutGrid className="w-5 h-5" />, label: 'Studio Floor', shortcut: '2' },
  { view: 'journey', icon: <GitFork className="w-5 h-5" />, label: 'Idea Journey', shortcut: '3' },
  { view: 'dossiers', icon: <BookOpen className="w-5 h-5" />, label: 'Dossiers', shortcut: '4' },
  { view: 'scenes', icon: <Film className="w-5 h-5" />, label: 'Scene Board', shortcut: '5' },
  { view: 'prompt', icon: <FlaskConical className="w-5 h-5" />, label: 'Prompt Lab', shortcut: '6' },
  { view: 'render', icon: <Cpu className="w-5 h-5" />, label: 'Render & QC', shortcut: '7' },
  { view: 'theater', icon: <Tv className="w-5 h-5" />, label: 'Screening Room', shortcut: '8' },
];

export const LeftRail: React.FC = () => {
  const activeView = useStudioStore((s) => s.activeView);
  const setActiveView = useStudioStore((s) => s.setActiveView);
  const consoleOpen = useStudioStore((s) => s.consoleOpen);
  const setConsoleOpen = useStudioStore((s) => s.setConsoleOpen);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <nav className="w-14 shrink-0 bg-[#08090D] border-r border-white/[0.06] flex flex-col items-center py-4 gap-1 z-40">
      {NAV_ITEMS.map((item) => {
        const isActive = activeView === item.view;
        const isHovered = hoveredItem === item.view;
        return (
          <div
            key={item.view}
            className="relative"
            onMouseEnter={() => setHoveredItem(item.view)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={() => {
                setActiveView(item.view);
                setHoveredItem(null); // Clear tooltip immediately on navigation
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-[#e5c07b]/15 text-[#e5c07b] shadow-[0_0_12px_rgba(229,192,123,0.2)]'
                  : 'text-white/30 hover:text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              {item.icon}
            </button>

            {/* Active indicator line */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#e5c07b] rounded-r-full -ml-[1px]" />
            )}

            {/* Tooltip on hover (hidden if active or on navigation) */}
            <div
              className={`absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-150 z-50 ${
                isHovered && !isActive ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center gap-2 bg-[#1A1E2C] border border-white/[0.1] rounded-lg px-3 py-2 shadow-2xl whitespace-nowrap">
                <span className="text-sm text-white font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-[#e5c07b] border border-white/[0.08]">
                  {item.shortcut}
                </kbd>
              </div>
              {/* Arrow */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1A1E2C]" />
            </div>
          </div>
        );
      })}

      {/* Bottom: Console toggle */}
      <div
        className="mt-auto relative"
        onMouseEnter={() => setHoveredItem('console')}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <button
          onClick={() => {
            setConsoleOpen(!consoleOpen);
            setHoveredItem(null);
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            consoleOpen
              ? 'bg-[#e5c07b]/15 text-[#e5c07b]'
              : 'text-white/30 hover:text-white/70 hover:bg-white/[0.06]'
          }`}
        >
          <Terminal className="w-5 h-5" />
        </button>
        <div
          className={`absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-150 z-50 ${
            hoveredItem === 'console' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-2 bg-[#1A1E2C] border border-white/[0.1] rounded-lg px-3 py-2 shadow-2xl whitespace-nowrap">
            <span className="text-sm text-white font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Event Log</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-[#e5c07b] border border-white/[0.08]">`</kbd>
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1A1E2C]" />
        </div>
      </div>
    </nav>
  );
};
