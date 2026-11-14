import React from 'react';

// Heading block of a configuration page section.
export const Section: React.FC<{
  title: string;
  hint: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, hint, action, children }) => (
  <section className="mb-10">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-bone">{title}</h2>
        <p className="mt-0.5 text-sm text-bone/50">{hint}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
);
