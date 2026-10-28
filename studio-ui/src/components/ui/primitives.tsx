import React from 'react';
import { cn } from './cn';

/** Page header — one recipe for every view. Kicker encodes info (counts, state). */
export const SectionHeader: React.FC<{
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  className?: string;
}> = ({ kicker, title, sub, right, className }) => (
  <div className={cn('flex items-start justify-between gap-4', className)}>
    <div className="space-y-1.5 min-w-0">
      <p className="kicker">{kicker}</p>
      <h1 className="view-title">{title}</h1>
      {sub && <p className="view-sub max-w-[68ch]">{sub}</p>}
    </div>
    {right && <div className="flex items-center gap-2 shrink-0 pt-1">{right}</div>}
  </div>
);

/** Card — the single card recipe. Use tone="raised" only for emphasis. */
export const Card: React.FC<{
  tone?: 'base' | 'raised';
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'base', className, children }) => (
  <div className={cn(tone === 'raised' ? 'surface-raised' : 'surface-card', className)}>
    {children}
  </div>
);

/** Empty state — an invitation to act, never a dead end. */
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, body, action, className }) => (
  <div className={cn('surface-card flex flex-col items-center text-center px-6 py-10 gap-2', className)}>
    <div className="w-10 h-10 rounded-full bg-cinema-gold/10 border border-cinema-gold/25 flex items-center justify-center text-cinema-gold mb-1">
      {icon}
    </div>
    <p className="text-[15px] font-semibold text-cinema-paper">{title}</p>
    <p className="view-sub max-w-[52ch]">{body}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
);

/** Small labelled value row for dossiers / inspectors. */
export const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <div className={cn('space-y-1', className)}>
    <p className="font-mono text-[10.5px] tracking-[0.12em] text-cinema-faint">{label}</p>
    <div className="text-[13.5px] leading-relaxed text-cinema-paper">{children}</div>
  </div>
);
