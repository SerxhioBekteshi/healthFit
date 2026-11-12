import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // Leaves out the default padding for tables and full-bleed content.
  flush?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  flush = false,
}) => (
  <section
    className={`rounded-xl border border-white/10 bg-panel shadow-sm ${
      flush ? '' : 'p-5 sm:p-6'
    } ${className}`}
  >
    {children}
  </section>
);

interface CardTitleProps {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  title,
  hint,
  action,
}) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div>
      <h3 className="text-base font-semibold text-bone">{title}</h3>
      {hint ? <p className="mt-1 text-sm text-bone/55">{hint}</p> : null}
    </div>
    {action}
  </div>
);
