import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  // Rendered in a muted tone after the title.
  accent?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  accent,
  description,
  actions,
}) => (
  <header className="mb-6 flex flex-col gap-4 sm:mb-7 md:flex-row md:items-end md:justify-between">
    <div className="min-w-0">
      {eyebrow ? (
        <p className="mb-2 text-sm font-medium text-signal">{eyebrow}</p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-bone sm:text-3xl">
        {title}
        {accent ? <span className="text-bone/45"> {accent}</span> : null}
      </h1>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-bone/60">
          {description}
        </p>
      ) : null}
    </div>
    {actions ? (
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {actions}
      </div>
    ) : null}
  </header>
);
