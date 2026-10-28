import { useEffect, useRef } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { StudioEvent, AgentId, EventType } from '../types/events';

const AGENT_MAP: Record<string, AgentId> = {
  director: 'director',
  story_breakdown: 'screenplay',
  story: 'screenplay',
  screenplay: 'screenplay',
  character_bible: 'character',
  character: 'character',
  environment_bible: 'world',
  environment: 'world',
  world: 'world',
  cinematography: 'cinematographer',
  cinematographer: 'cinematographer',
  prompt_builder: 'prompt_alchemist',
  prompts: 'prompt_alchemist',
  prompt_alchemist: 'prompt_alchemist',
  video: 'gpu',
  video_generation: 'gpu',
  gpu: 'gpu',
  qc: 'auditor',
  auditor: 'auditor',
  editor: 'editor',
};

export function useWebSocketHub() {
  const addEvent = useStudioStore((s) => s.addEvent);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      console.log('[CineStorm Live WS] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[CineStorm Live WS] Connected successfully to backend engine.');
        useStudioStore.setState({ isConnected: true });
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.type === 'agent_event') {
            const agentKey: AgentId = (raw.data?.ui_agent && AGENT_MAP[raw.data.ui_agent])
              || AGENT_MAP[raw.agent]
              || 'director';

            let eventType: EventType = 'log';
            if (raw.event === 'agent.status' || raw.event === 'started') eventType = 'agent.status';
            else if (raw.event === 'agent.thought') eventType = 'agent.thought';
            else if (raw.event === 'agent.handoff') eventType = 'agent.handoff';
            else if (raw.event === 'artifact.created') eventType = 'artifact.created';
            else if (raw.event === 'qc.verdict') eventType = 'qc.verdict';
            else if (raw.event === 'stage.completed' || raw.event === 'completed') eventType = 'stage.completed';

            const toAgentKey: AgentId | undefined = raw.data?.to ? AGENT_MAP[raw.data.to] : undefined;

            const mappedEvent: StudioEvent = {
              id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              ts: Date.now() / 1000,
              project_id: raw.project_name || 'project',
              type: eventType,
              agent: agentKey,
              to_agent: toAgentKey,
              payload: raw.data || { status: raw.event },
              message: raw.text || `Agent [${agentKey}] live update`,
              severity: raw.event === 'error' ? 'error' : raw.event === 'agent.handoff' ? 'handoff' : 'info',
            };

            addEvent(mappedEvent);

            // Dynamically update project artifacts in store
            if (raw.data?.scenes && Array.isArray(raw.data.scenes)) {
              useStudioStore.setState((s) => ({
                project: { ...s.project, scenes: raw.data.scenes },
              }));
            }
            if (raw.data?.characters && Array.isArray(raw.data.characters)) {
              useStudioStore.setState((s) => ({
                project: { ...s.project, characters: raw.data.characters },
              }));
            }
            if (raw.data?.environments && Array.isArray(raw.data.environments)) {
              useStudioStore.setState((s) => ({
                project: { ...s.project, environments: raw.data.environments },
              }));
            }
            if (raw.data?.final_reel) {
              useStudioStore.setState((s) => ({
                project: {
                  ...s.project,
                  finalReelUrl: `/api/media/${raw.project_name}/output/final_reel.mp4`,
                  timelineUrl: `/api/media/${raw.project_name}/output/${raw.project_name}.timeline`,
                },
              }));
            }
          }
        } catch (err) {
          console.warn('[CineStorm Live WS] Parse error:', err);
        }
      };

      ws.onerror = (e) => {
        console.warn('[CineStorm Live WS] Error encountered:', e);
        useStudioStore.setState({ isConnected: false });
      };

      ws.onclose = () => {
        console.log('[CineStorm Live WS] Closed. Reconnecting in 2s…');
        useStudioStore.setState({ isConnected: false });
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [addEvent]);
}
