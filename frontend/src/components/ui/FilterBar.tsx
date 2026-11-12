import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { t } from '@/i18n';

interface FilterBarProps {
  title: string;
  // How many filters are set; shown on the button.
  activeCount: number;
  onClear: () => void;
  // Layout classes for the title row, which depend on the card it sits in.
  className?: string;
  children: React.ReactNode;
}

// Card title with a Filter button; the inputs open as a panel over the list below.
export const FilterBar: React.FC<FilterBarProps> = ({
  title,
  activeCount,
  onClear,
  className = '',
  children,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center justify-between gap-3 ${className}`}>
        <h2 className="text-base font-semibold text-bone">{title}</h2>
        <Button
          size="sm"
          variant={activeCount > 0 ? 'success' : 'secondary'}
          icon="filter"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {activeCount > 0
            ? t('Filter ({{n}})', { n: activeCount })
            : t('Filter')}
        </Button>
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-full z-20 space-y-3 rounded-lg border border-white/10 bg-panel p-4 shadow-lg">
          {children}
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={activeCount === 0}
              onClick={onClear}
            >
              {t('Clear')}
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              {t('Done')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
