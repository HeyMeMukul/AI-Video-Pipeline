import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentId } from '../../types/events';
import { AGENT_PERSONAS } from '../../mock/personas';
import { useStudioStore, useDerivedStudioState } from '../../store/useStudioStore';
import { Check, X, RotateCw, ArrowRight } from 'lucide-react';

const ORDERED_AGENTS: AgentId[] = [
  'director', 'screenplay', 'character', 'world',
  'cinematographer', 'prompt_alchemist', 'gpu', 'auditor', 'editor',
];

const AVATAR_R = 20; // 40px avatar circle diameter

export const ProductionTable: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const { agentStatuses, activeHandoff, speechBubbles, retryCount } = useDerivedStudioState();
  const selectedAgent = useStudioStore((s) => s.selectedAgent);
  const setSelectedAgent = useStudioStore((s) => s.setSelectedAgent);
  const project = useStudioStore((s) => s.project);
  const currentStep = useStudioStore((s) => s.currentStep);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setDimensions({ width, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { width, height } = dimensions;

  // The Live Caption panel docks at the bottom and requires ~110px.
  // Center the ellipse slightly above the mid-point of the available space.
  const cx = width / 2;
  const cy = (height - 110) / 2 + 10;

  // Ellipse dimensions per spec:
  // rx = 0.40 * width, ry = 0.36 * height. Table is rx*0.78, ry*0.78.
  // Clamp seatRx to prevent left/right outward labels (width ~150px) from exiting the viewport.
  // Clamp seatRy so bottom seats stay completely above the docked Live Caption panel.
  const maxSeatRx = (width / 2) - 170;
  const maxSeatRy = Math.min(215, cy - 85);
  const seatRx = Math.max(130, Math.min(width * 0.40, maxSeatRx));
  const seatRy = Math.max(110, Math.min(height * 0.34, maxSeatRy));

  const tableRx = seatRx * 0.78;
  const tableRy = seatRy * 0.78;
  const orbRadius = 48; // ~96px orb

  const total = ORDERED_AGENTS.length;
  // Progress reflects departments finished, not feed length (a fresh
  // load carries one event but zero completed work).
  const doneCount = ORDERED_AGENTS.filter((id) => agentStatuses[id] === 'done').length;
  const progress = Math.round((doneCount / Math.max(1, total)) * 100);

  const activeAgentId = ORDERED_AGENTS.find(
    (id) => agentStatuses[id] === 'working' || agentStatuses[id] === 'thinking'
  ) || null;

  // Seat positions around the ellipse
  const seatPositions = useMemo(() => {
    return ORDERED_AGENTS.map((agentId, idx) => {
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
      return {
        agentId,
        x: cx + seatRx * Math.cos(angle),
        y: cy + seatRy * Math.sin(angle),
        angle,
      };
    });
  }, [cx, cy, seatRx, seatRy, total]);

  const agentToPos = useMemo(() => {
    const map: Record<string, { x: number; y: number; angle: number; idx: number }> = {};
    seatPositions.forEach((pos, idx) => { map[pos.agentId] = { ...pos, idx }; });
    return map;
  }, [seatPositions]);

  // Radial label placement logic
  // Spec:
  // - seats with x > center + 10%: label to the RIGHT of avatar (left-aligned)
  // - seats with x < center - 10%: label to the LEFT of avatar (right-aligned)
  // - top/bottom center seats: label above/below (centered)
  function getLabelStyle(x: number, y: number, angle: number): {
    style: React.CSSProperties;
    textAlign: 'left' | 'right' | 'center';
  } {
    const sinA = Math.sin(angle);
    const distX = x - cx;
    const threshold = width * 0.10;

    if (Math.abs(distX) <= threshold) {
      if (sinA < 0) {
        // Top center (Director): label ABOVE avatar
        return {
          textAlign: 'center',
          style: {
            left: `${x}px`,
            top: `${y - AVATAR_R - 14}px`,
            transform: 'translate(-50%, -100%)',
          },
        };
      } else {
        // Bottom center: label BELOW avatar
        return {
          textAlign: 'center',
          style: {
            left: `${x}px`,
            top: `${y + AVATAR_R + 14}px`,
            transform: 'translate(-50%, 0)',
          },
        };
      }
    }

    if (distX > 0) {
      // Right side: label to the RIGHT of avatar (left-aligned)
      return {
        textAlign: 'left',
        style: {
          left: `${x + AVATAR_R + 18}px`,
          top: `${y}px`,
          transform: 'translate(0, -50%)',
        },
      };
    } else {
      // Left side: label to the LEFT of avatar (right-aligned)
      return {
        textAlign: 'right',
        style: {
          left: `${x - AVATAR_R - 18}px`,
          top: `${y}px`,
          transform: 'translate(-100%, -50%)',
        },
      };
    }
  }

  // Handoff arc & traveling packet
  const handoffData = useMemo(() => {
    if (!activeHandoff) return null;
    const from = agentToPos[activeHandoff.from];
    const to = agentToPos[activeHandoff.to];
    if (!from || !to) return null;

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    let arcCtrlX: number, arcCtrlY: number;

    if (activeHandoff.isRetry) {
      // Retry: straight chord through center
      arcCtrlX = cx;
      arcCtrlY = cy;
    } else {
      // Handoff arc bows slightly inward along table
      const dirX = midX - cx;
      const dirY = midY - cy;
      const len = Math.hypot(dirX, dirY) || 1;
      arcCtrlX = midX - (dirX / len) * (tableRx * 0.20);
      arcCtrlY = midY - (dirY / len) * (tableRy * 0.20);
    }

    const pathD = `M ${from.x} ${from.y} Q ${arcCtrlX} ${arcCtrlY} ${to.x} ${to.y}`;
    const fromColor = AGENT_PERSONAS[activeHandoff.from]?.color || '#e5c07b';

    return { pathD, fromColor, isRetry: activeHandoff.isRetry, midX, midY };
  }, [activeHandoff, agentToPos, cx, cy, tableRx, tableRy]);

  // Core artifact reflects the live production, not fixed demo copy
  const totalRuntime = project.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const getCoreArtifact = () => {
    if (currentStep < 3) return { name: 'Directorial Vision', metric: `${progress}% locked` };
    if (currentStep < 6) return { name: 'Scene Architecture', metric: `${project.scenes.length} SVALE beats` };
    if (currentStep < 10) return { name: 'Character Anchors', metric: `${project.characters.length} heroes locked` };
    if (currentStep < 14) return { name: 'World Geometries', metric: `${project.environments.length} stage sets` };
    if (currentStep < 18) return { name: 'Camera 6DoF', metric: 'Optics vectors' };
    if (currentStep < 22) return { name: 'DiT Prompts', metric: 'Layered synthesis' };
    if (currentStep < 28) return { name: 'GPU Cluster', metric: 'Render farm' };
    if (currentStep < 36) return { name: 'Compliance QC', metric: 'Rubric audit' };
    return { name: 'Master Reel', metric: totalRuntime > 0 ? `${totalRuntime}s conformed` : 'Conform ready' };
  };
  const coreArtifact = getCoreArtifact();

  // Live caption: most recent message
  const liveCaption = speechBubbles.length > 0 ? speechBubbles[speechBubbles.length - 1] : null;
  const liveCaptionPersona = liveCaption ? AGENT_PERSONAS[liveCaption.agent] : null;

  // Real story for the Idea chip (first 60 chars)
  const PLACEHOLDER_PREFIXES = ['Your story idea', 'Waiting for'];
  const rawStory = project.story || '';
  const isPlaceholder = PLACEHOLDER_PREFIXES.some(p => rawStory.startsWith(p)) || !rawStory;
  const ideaDisplay = isPlaceholder ? 'Waiting for an idea…' : (rawStory.length > 60 ? rawStory.slice(0, 58) + '…' : rawStory);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-cinema-bg">
      {/* Background radial ambiance */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(229,192,123,0.05) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 95% 95% at 50% 50%, transparent 55%, rgba(8,9,13,0.85) 100%)',
        }}
      />

      {/* ── SVG LAYER: Table surface, rim light, arcs, traveling packets, seat circles (NO text) ── */}
      <svg
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <defs>
          <radialGradient id="tableOvalGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1D2233" />
            <stop offset="65%" stopColor="#1A1E2C" />
            <stop offset="100%" stopColor="#151824" />
          </radialGradient>
          <radialGradient id="orbGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e5c07b" stopOpacity="0.38" />
            <stop offset="50%" stopColor="#e5c07b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="spotlightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>

        {/* Table ellipse surface (rx * 0.78, ry * 0.78) */}
        <ellipse cx={cx} cy={cy} rx={tableRx} ry={tableRy} fill="url(#tableOvalGrad)" />

        {/* 1px rim light so table reads against dark background */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={tableRx}
          ry={tableRy}
          fill="none"
          stroke="rgba(229,192,123,0.25)"
          strokeWidth={1.5}
        />

        {/* Inner concentric ring */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={tableRx * 0.65}
          ry={tableRy * 0.65}
          fill="none"
          stroke="rgba(255,255,255,0.035)"
          strokeWidth={1}
        />

        {/* Ambient dust specks */}
        {[...Array(6)].map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const pr = 0.28 + (i % 3) * 0.12;
          const px = cx + tableRx * pr * Math.cos(a);
          const py = cy + tableRy * pr * Math.sin(a);
          return (
            <motion.circle
              key={`speck-${i}`}
              cx={px}
              cy={py}
              r={1.5}
              fill="#e5c07b"
              opacity={0.2}
              animate={{ cy: [py, py - 6, py], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
            />
          );
        })}

        {/* Spotlight cone from center to active seat */}
        {activeAgentId && agentToPos[activeAgentId] && (() => {
          const p = agentToPos[activeAgentId];
          const color = AGENT_PERSONAS[activeAgentId]?.color || '#e5c07b';
          return (
            <line
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={color}
              strokeWidth={64}
              strokeOpacity={0.06}
              style={{ filter: 'url(#spotlightGlow)' }}
            />
          );
        })()}

        {/* Handoff path + glowing animated packet */}
        {handoffData && (
          <g>
            <path
              d={handoffData.pathD}
              fill="none"
              stroke={handoffData.isRetry ? '#e0af68' : handoffData.fromColor}
              strokeWidth={handoffData.isRetry ? 2 : 1.5}
              strokeDasharray={handoffData.isRetry ? '6 4' : undefined}
              opacity={handoffData.isRetry ? 0.9 : 0.6}
              style={{ filter: `drop-shadow(0 0 6px ${handoffData.fromColor}80)` }}
            />
            <circle
              r={5}
              fill={handoffData.isRetry ? '#e0af68' : handoffData.fromColor}
              opacity={0.95}
              style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}
            >
              <animateMotion
                dur={handoffData.isRetry ? '1.4s' : '1.8s'}
                repeatCount="indefinite"
                path={handoffData.pathD}
              />
            </circle>
          </g>
        )}

        {/* Idea Core Orb shape (120px diameter) */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={orbRadius * 1.45}
          fill="url(#orbGlowGrad)"
          animate={{ r: [orbRadius * 1.4, orbRadius * 1.5, orbRadius * 1.4], opacity: [0.65, 0.95, 0.65] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx={cx} cy={cy} r={orbRadius} fill="#0d0f17" />
        <circle cx={cx} cy={cy} r={orbRadius} fill="none" stroke="#e5c07b" strokeWidth={1.5} opacity={0.45} />
        <motion.circle
          cx={cx}
          cy={cy}
          r={orbRadius - 6}
          fill="none"
          stroke="#e5c07b"
          strokeWidth={0.9}
          strokeDasharray="4 7"
          animate={{ rotate: 360 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        />
        {/* Core Progress Arc */}
        <circle
          cx={cx}
          cy={cy}
          r={orbRadius + 5}
          fill="none"
          stroke="#e5c07b"
          strokeWidth={3}
          strokeDasharray={`${(progress / 100) * (2 * Math.PI * (orbRadius + 5))} ${2 * Math.PI * (orbRadius + 5)}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={0.7}
        />

        {/* Seat avatar rings */}
        {seatPositions.map(({ agentId, x, y }) => {
          const persona = AGENT_PERSONAS[agentId];
          const status = agentStatuses[agentId];
          const isActive = agentId === activeAgentId;
          const isSelected = selectedAgent === agentId;
          const isWorking = status === 'working' || status === 'thinking';

          return (
            <g key={`ring-${agentId}`}>
              {/* Working spinning halo */}
              {isWorking && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={AVATAR_R + 7}
                  fill="none"
                  stroke={persona.color}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  animate={{ rotate: 360 }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                />
              )}
              {/* Active soft glow */}
              {isActive && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={AVATAR_R + 9}
                  fill={`${persona.color}20`}
                  animate={{ r: [AVATAR_R + 6, AVATAR_R + 12, AVATAR_R + 6], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {/* Main ring */}
              <circle
                cx={x}
                cy={y}
                r={AVATAR_R}
                fill="#131620"
                stroke={isSelected ? '#e5c07b' : persona.color}
                strokeWidth={isSelected ? 2.5 : isActive ? 2.5 : 1.5}
                opacity={isActive ? 1 : 0.35} // Idle seats rest at 35% until they work
                style={{
                  filter: isActive ? `drop-shadow(0 0 12px ${persona.color}a0)` : undefined,
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* ── HTML OVERLAY LAYER: true pixel typography, zero scaling ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>

        {/* 1. Idea chip ABOVE the orb (max 2 lines, nothing overlaps the orb) */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: `${cx}px`,
            top: `${cy - orbRadius - 52}px`,
            transform: 'translateX(-50%)',
            maxWidth: '280px',
            width: 'max-content',
          }}
        >
          <div
            className="bg-cinema-surface border border-cinema-gold/25 rounded-xl px-3 py-1 text-[11.5px] font-medium text-cinema-mist text-center shadow-lift overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.35,
            }}
          >
            <span style={{ color: '#e5c07b', marginRight: '6px', fontWeight: 600 }}>Idea</span>
            {ideaDisplay}
          </div>
        </div>

        {/* Progress % centered in orb */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: `${cx}px`,
            top: `${cy}px`,
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <span
            className="font-mono text-[16px] font-bold text-cinema-gold"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
          >
            {progress}%
          </span>
        </div>

        {/* 2. Core label pill BELOW the orb (Line 1 = Playfair 16px, Line 2 = Inter 13px) */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: `${cx}px`,
            top: `${cy + orbRadius + 14}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="bg-cinema-surface border border-cinema-gold/30 rounded-xl px-[18px] py-2 text-center whitespace-nowrap shadow-lift"
          >
            <div
              className="font-playfair text-[14px] font-semibold text-cinema-gold"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)', lineHeight: 1.2 }}
            >
              {coreArtifact.name}
            </div>
            <div
              className="text-[12px] text-cinema-mist mt-[2px]"
              style={{ lineHeight: 1.2 }}
            >
              {coreArtifact.metric}
            </div>
          </div>
        </div>

        {/* Retry ×2 counter badge if revision chord is active */}
        {activeHandoff?.isRetry && handoffData && (
          <div
            className="absolute pointer-events-none select-none"
            style={{
              left: `${cx}px`,
              top: `${cy - 20}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="bg-amber-950 border border-amber-500/60 rounded-full px-2.5 py-0.5 text-[12px] font-bold text-amber-300 shadow-lift"
            >
              ×{Math.max(1, retryCount)} revision{retryCount > 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* 3. Seat Avatars (interactive) */}
        {seatPositions.map(({ agentId, x, y }) => {
          const persona = AGENT_PERSONAS[agentId];
          const status = agentStatuses[agentId];
          const isActive = agentId === activeAgentId;
          const isDone = status === 'done';
          const isFailed = status === 'failed';
          const isRetrying = status === 'retrying';

          const avatarDiam = AVATAR_R * 2; // 48px

          return (
            <div
              key={`avatar-${agentId}`}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(-50%, -50%)${isActive ? ' scale(1.10)' : ''}`,
                transition: 'transform 0.25s ease',
                zIndex: 25,
                width: `${avatarDiam}px`,
                height: `${avatarDiam}px`,
              }}
              onClick={() => setSelectedAgent(agentId)}
              title={`${persona.name} (${persona.role})`}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center relative select-none"
              >
                {/* Avatar Initials — fully visible in persona.color */}
                <span
                  className="font-playfair text-[12.5px] font-bold"
                  style={{ color: persona.color, letterSpacing: '0.02em' }}
                >
                  {persona.avatarInitials || persona.avatar}
                </span>

                {/* Status Badges */}
                {isDone && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full border flex items-center justify-center bg-cinema-surface" style={{ borderColor: '#e5c07b' }}
                  >
                    <Check className="w-3 h-3 text-cinema-gold" strokeWidth={3} />
                  </div>
                )}
                {isFailed && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full border flex items-center justify-center bg-cinema-surface" style={{ borderColor: '#f7768e' }}
                  >
                    <X className="w-3 h-3 text-cinema-error" strokeWidth={3} />
                  </div>
                )}
                {isRetrying && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full border flex items-center justify-center animate-spin bg-cinema-surface" style={{ borderColor: '#e0af68' }}
                  >
                    <RotateCw className="w-3 h-3 text-amber-300" strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 4. Radial Seat Labels (Name + Role) — placed outward from seat coordinates */}
        {seatPositions.map(({ agentId, x, y, angle }) => {
          const persona = AGENT_PERSONAS[agentId];
          const { style: placementStyle, textAlign } = getLabelStyle(x, y, angle);
          const seatStatus = agentStatuses[agentId];
          const seatIdle = seatStatus === 'idle';

          return (
            <div
              key={`label-${agentId}`}
              className="absolute pointer-events-none select-none"
              style={{
                ...placementStyle,
                zIndex: 26,
                opacity: seatIdle ? 0.55 : 1,
              }}
            >
              {/* Seat Name: Playfair Display 16px, weight 600, #F2F0EA, no truncation */}
              <div
                className="font-playfair text-[13.5px] font-semibold text-cinema-paper whitespace-nowrap"
                style={{ lineHeight: 1.2, textAlign, textShadow: '0 2px 8px rgba(0,0,0,0.95)' }}
              >
                {persona.name.split(' ')[0]}
              </div>
              {/* Seat Role: Inter 12px, #A9AEC0, no truncation */}
              <div
                className="text-[11px] text-cinema-mist whitespace-nowrap mt-[2px]"
                style={{ lineHeight: 1.2, textAlign, textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}
              >
                {persona.role}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 5. LIVE CAPTION PANEL: Docked at bottom center, above Artifact Shelf ── */}
      <div
        className="absolute bottom-2.5 inset-x-0 flex justify-center px-4 pointer-events-none"
        style={{ zIndex: 40 }}
      >
        <AnimatePresence mode="wait">
          {liveCaption && liveCaptionPersona && (
            <motion.div
              key={liveCaption.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[620px] pointer-events-auto select-none"
            >
              <div
                className="bg-cinema-raised rounded-xl px-4 py-2.5 shadow-overlay"
                style={{
                  border: `1px solid ${liveCaptionPersona.color}`,
                  boxShadow: `0 16px 48px rgba(0,0,0,0.65), 0 0 20px ${liveCaptionPersona.color}25`,
                }}
              >
                {/* Header: avatar + name + optional handoff chip */}
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${liveCaptionPersona.color}20`,
                      borderColor: liveCaptionPersona.color,
                    }}
                  >
                    <span
                      className="font-playfair text-[11px] font-bold"
                      style={{ color: liveCaptionPersona.color }}
                    >
                      {liveCaptionPersona.avatarInitials || liveCaptionPersona.avatar}
                    </span>
                  </div>
                  <span
                    className="font-playfair text-[13.5px] font-semibold"
                    style={{ color: liveCaptionPersona.color }}
                  >
                    {liveCaptionPersona.name}
                  </span>
                  {liveCaption.to && AGENT_PERSONAS[liveCaption.to] && (
                    <div
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[13px] font-sans"
                      style={{
                        backgroundColor: `${AGENT_PERSONAS[liveCaption.to].color}18`,
                        borderColor: `${AGENT_PERSONAS[liveCaption.to].color}50`,
                        color: AGENT_PERSONAS[liveCaption.to].color,
                      }}
                    >
                      <span className="text-cinema-mist flex items-center"><ArrowRight className="w-3 h-3" /></span>
                      <span className="font-medium">{AGENT_PERSONAS[liveCaption.to].name.split(' ')[0]}</span>
                    </div>
                  )}
                </div>

                {/* Message body: FULL message, Inter 15px, up to 3 lines */}
                <p
                  className="text-[13.5px] text-cinema-paper m-0 overflow-hidden"
                  style={{
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {liveCaption.text}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
