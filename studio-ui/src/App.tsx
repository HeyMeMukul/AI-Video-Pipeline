import React, { useEffect } from 'react';
import { useStudioStore, StudioView } from './store/useStudioStore';
import { useWebSocketHub } from './services/websocket';
import { TopBar } from './components/layout/TopBar';
import { LeftRail } from './components/layout/LeftRail';
import { EventLogConsole } from './components/layout/EventLogConsole';
import { CommandPalette } from './components/layout/CommandPalette';

// Views
import { PitchRoom } from './components/views/PitchRoom';
import { StudioFloor } from './components/views/StudioFloor';
import { IdeaJourney } from './components/views/IdeaJourney';
import { DossiersView } from './components/views/DossiersView';
import { SceneBoardView } from './components/views/SceneBoardView';
import { PromptLabView } from './components/views/PromptLabView';
import { RenderQCView } from './components/views/RenderQCView';
import { ScreeningRoom } from './components/views/ScreeningRoom';

export const App: React.FC = () => {
  const activeView = useStudioStore((s) => s.activeView);
  const setActiveView = useStudioStore((s) => s.setActiveView);
  const togglePlay = useStudioStore((s) => s.togglePlay);
  const stepForward = useStudioStore((s) => s.stepForward);
  const stepBackward = useStudioStore((s) => s.stepBackward);
  const setConsoleOpen = useStudioStore((s) => s.setConsoleOpen);
  const consoleOpen = useStudioStore((s) => s.consoleOpen);

  // Background WebSocket connection to FastAPI backend
  useWebSocketHub();

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'j' || e.key === 'J') {
        stepBackward();
      } else if (e.key === 'k' || e.key === 'K') {
        stepForward();
      } else if (e.key === '`') {
        e.preventDefault();
        setConsoleOpen(!consoleOpen);
      } else if (e.key >= '1' && e.key <= '8') {
        const viewMap: Record<string, StudioView> = {
          '1': 'pitch', '2': 'floor', '3': 'journey',
          '4': 'dossiers', '5': 'scenes', '6': 'prompt',
          '7': 'render', '8': 'theater',
        };
        const v = viewMap[e.key];
        if (v) setActiveView(v);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useStudioStore.setState({ commandPaletteOpen: !useStudioStore.getState().commandPaletteOpen });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepForward, stepBackward, consoleOpen, setConsoleOpen, setActiveView]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'pitch':    return <PitchRoom />;
      case 'floor':    return <StudioFloor />;
      case 'journey':  return <IdeaJourney />;
      case 'dossiers': return <DossiersView />;
      case 'scenes':   return <SceneBoardView />;
      case 'prompt':   return <PromptLabView />;
      case 'render':   return <RenderQCView />;
      case 'theater':  return <ScreeningRoom />;
      default:         return <StudioFloor />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#08090d] text-gray-100 overflow-hidden font-sans">
      {/* Film grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
      />

      {/* Top Masthead */}
      <TopBar />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left Navigation Rail */}
        <LeftRail />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          {renderActiveView()}
          {/* Collapsible Bottom Event Console (only shows if open) */}
          <EventLogConsole />
        </main>
      </div>

      {/* Global Command Palette (Cmd/Ctrl + K) */}
      <CommandPalette />
    </div>
  );
};
