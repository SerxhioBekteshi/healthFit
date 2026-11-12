import React from 'react';
import { WeeklySchedule } from '@/components/classes/WeeklySchedule';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useClasses } from '@/hooks/classes';
import { t } from '@/i18n';

export const ClientClassesPage: React.FC = () => {
  const { classes, isLoading, error } = useClasses();

  return (
    <>
      <PageHeader
        eyebrow={t('Member area')}
        title={t('Class')}
        accent={t('timetable')}
        description={t(
          'Classes your gym offers every week, with the time and instructor.'
        )}
      />

      {error ? <Alert>{error.message}</Alert> : null}
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-32" />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-bone/55">
          {t('Your gym has not published any classes yet.')}
        </div>
      ) : null}

      {classes.length > 0 ? <WeeklySchedule classes={classes} /> : null}
    </>
  );
};
