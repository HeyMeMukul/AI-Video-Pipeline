import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { ProductionTable } from '../floor/ProductionTable';
import { ConversationFeed } from '../floor/ConversationFeed';
import { PlaybackBar } from '../floor/PlaybackBar';
import { ArtifactShelf } from '../floor/ArtifactShelf';
import { SlideInspector } from '../floor/SlideInspector';

export const StudioFloor: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#08090d]" style={{ minHeight: 0 }}>
      {/* 2-Column Main Area */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Column 1: THE STAGE (62%) */}
        <div className="relative flex flex-col overflow-hidden" style={{ flex: '0 0 62%', minWidth: 0 }}>
          {/* Stage fills all space above shelf */}
          <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
            <ProductionTable />
          </div>
          {/* Artifact shelf at bottom */}
          <ArtifactShelf />
          {/* Slide inspector overlay */}
          <div className="absolute inset-0 pointer-events-none z-50">
            <div className="pointer-events-auto">
              <SlideInspector />
            </div>
          </div>
        </div>
        {/* Column 2: CONVERSATION FEED (38%) */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          <ConversationFeed />
        </div>
      </div>
      {/* Playback Bar */}
      <PlaybackBar />
    </div>
  );
};
