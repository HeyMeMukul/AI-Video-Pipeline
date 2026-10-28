import React, { useState, useEffect } from 'react';
import { useStudioStore, StudioView } from '../../store/useStudioStore';
import { AGENT_PERSONAS } from '../../mock/personas';
import { AgentId } from '../../types/events';
import {
  Search,
  Sparkles,
  LayoutGrid,
  GitFork,
  BookOpen,
  Film,
  FlaskConical,
  CheckCircle,
  Tv,
  Play,
  RotateCcw,
  Terminal,
  X,
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: 'Views' | 'Agents' | 'Playback' | 'System';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useStudioStore((s) => s.commandPaletteOpen);
  const setIsOpen = useStudioStore((s) => s.setCommandPaletteOpen);
  const setActiveView = useStudioStore((s) => s.setActiveView);
  const setSelectedAgent = useStudioStore((s) => s.setSelectedAgent);
  const togglePlay = useStudioStore((s) => s.togglePlay);
  const resetProduction = useStudioStore((s) => s.resetProduction);
  const setConsoleOpen = useStudioStore((s) => s.setConsoleOpen);
  const isPlaying = useStudioStore((s) => s.isPlaying);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Command items list
  const commands: CommandItem[] = [
    // Views
    {
      id: 'view-floor',
      category: 'Views',
      title: 'Studio Floor (Hero Floor Plan)',
      subtitle: 'Top-down multi-agent live command room',
      icon: <LayoutGrid className="w-4 h-4 text-cinema-gold" />,
      action: () => setActiveView('floor'),
      shortcut: '2',
    },
    {
      id: 'view-pitch',
      category: 'Views',
      title: 'Pitch Room',
      subtitle: 'Idea briefing and style DNA configuration',
      icon: <Sparkles className="w-4 h-4 text-cinema-screenplay" />,
      action: () => setActiveView('pitch'),
      shortcut: '1',
    },
    {
      id: 'view-journey',
      category: 'Views',
      title: 'Idea Journey',
      subtitle: 'Horizontal data lineage graph & diffs',
      icon: <GitFork className="w-4 h-4 text-cinema-character" />,
      action: () => setActiveView('journey'),
      shortcut: '3',
    },
    {
      id: 'view-dossiers',
      category: 'Views',
      title: 'Dossiers (Bibles)',
      subtitle: 'Character, Environment, and Director bibles',
      icon: <BookOpen className="w-4 h-4 text-cinema-world" />,
      action: () => setActiveView('dossiers'),
      shortcut: '4',
    },
    {
      id: 'view-scenes',
      category: 'Views',
      title: 'Scene Board',
      subtitle: 'Storyboard cards with SVALE and camera vectors',
      icon: <Film className="w-4 h-4 text-cinema-cinematographer" />,
      action: () => setActiveView('scenes'),
      shortcut: '5',
    },
    {
      id: 'view-prompt',
      category: 'Views',
      title: 'Prompt Lab',
      subtitle: '9-layer multimodal prompt inspect & 6DoF camera',
      icon: <FlaskConical className="w-4 h-4 text-cinema-prompt" />,
      action: () => setActiveView('prompt'),
      shortcut: '6',
    },
    {
      id: 'view-render',
      category: 'Views',
      title: 'Render & QC Deck',
      subtitle: 'GPU dispatch queue & 100-point rubric verification',
      icon: <CheckCircle className="w-4 h-4 text-cinema-gpu" />,
      action: () => setActiveView('render'),
      shortcut: '7',
    },
    {
      id: 'view-theater',
      category: 'Views',
      title: 'Screening Room',
      subtitle: 'Widescreen master reel preview & exports',
      icon: <Tv className="w-4 h-4 text-cinema-editor" />,
      action: () => setActiveView('theater'),
      shortcut: '8',
    },
    // Playback
    {
      id: 'playback-toggle',
      category: 'Playback',
      title: isPlaying ? 'Pause Production Timeline' : 'Play Production Timeline',
      subtitle: 'Step forward through multi-agent simulation',
      icon: <Play className="w-4 h-4 text-cinema-gold" />,
      action: () => togglePlay(),
      shortcut: 'Space',
    },
    {
      id: 'playback-reset',
      category: 'Playback',
      title: 'Rewind to Beginning',
      subtitle: 'Reset timeline to step 0',
      icon: <RotateCcw className="w-4 h-4 text-gray-400" />,
      action: () => resetProduction(),
    },
    // System
    {
      id: 'sys-console',
      category: 'System',
      title: 'Toggle Event Log Console',
      subtitle: 'View detailed system logs & telemetry',
      icon: <Terminal className="w-4 h-4 text-cinema-gold" />,
      action: () => setConsoleOpen(true),
      shortcut: '`',
    },
    // Agents
    ...Object.entries(AGENT_PERSONAS).map(([id, persona]) => ({
      id: `agent-${id}`,
      category: 'Agents' as const,
      title: `${persona.name} — ${persona.role}`,
      subtitle: persona.deskName,
      icon: (
        <span
          className="w-3.5 h-3.5 rounded-full inline-block border"
          style={{ borderColor: persona.color, backgroundColor: `${persona.color}33` }}
        />
      ),
      action: () => {
        setSelectedAgent(id as AgentId);
        setActiveView('floor');
      },
    })),
  ];

  const filtered = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (cmd: CommandItem) => {
    cmd.action();
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-cinema-surface border border-cinema-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-cinema-border bg-cinema-raised/40">
          <Search className="w-5 h-5 text-cinema-gold mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or jump to an agent/view..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-xs">
              No matching commands or agents found.
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-cinema-gold/15 text-white'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">{cmd.icon}</div>
                  <div>
                    <div className="text-xs font-medium text-gray-200">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className="text-[10px] text-gray-500">{cmd.subtitle}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                    {cmd.category}
                  </span>
                  {cmd.shortcut && (
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cinema-bg border border-cinema-border text-cinema-gold">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-cinema-border bg-cinema-raised/30 flex items-center justify-between text-[10px] text-gray-500">
          <span>Navigate with ↑ ↓, press Enter to execute</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
