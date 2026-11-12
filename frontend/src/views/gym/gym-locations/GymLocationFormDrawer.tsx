import React, { Suspense, lazy, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { Skeleton } from '@/components/ui/Skeleton';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { GymLocation } from '@gym/shared/types';
import {
  gymLocationFormSchema,
  type GymLocationFormValues,
} from '@gym/shared/validation/gym-locations';

// The map library is large, so it loads only when this drawer opens.
const MapPicker = lazy(() =>
  import('@/components/gym-locations/MapPicker').then((module) => ({
    default: module.MapPicker,
  }))
);

interface GymLocationFormDrawerProps {
  isOpen: boolean;
  location: GymLocation | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: GymLocationFormValues) => Promise<void>;
  onClose: () => void;
}

const emptyValues: DefaultValues<GymLocationFormValues> = {
  name: '',
  address: '',
  phone: '',
  mapUrl: '',
};

export const GymLocationFormDrawer: React.FC<GymLocationFormDrawerProps> = ({
  isOpen,
  location,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GymLocationFormValues>({
    resolver: zodResolver(gymLocationFormSchema),
    defaultValues: emptyValues,
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');

  useEffect(() => {
    if (isOpen) {
      reset(
        location
          ? {
              name: location.name,
              address: location.address,
              phone: location.phone,
              latitude: location.latitude ?? undefined,
              longitude: location.longitude ?? undefined,
              mapUrl: location.mapUrl,
            }
          : emptyValues
      );
    }
  }, [location, isOpen, reset]);

  const pickPoint = (lat: number, lng: number): void => {
    setValue('latitude', lat, { shouldValidate: true, shouldDirty: true });
    setValue('longitude', lng, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Drawer
      isOpen={isOpen}
      title={location ? t('Edit gym') : t('Add gym')}
      description={t('Members choose where to train from your gyms.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={location ? t('Update gym') : t('Add gym')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField id="name" label={t('Name')} error={errors.name?.message}>
          <input
            id="name"
            className={fieldInputClass}
            placeholder="HealthFIT Blloku"
            {...register('name')}
          />
        </FormField>
        <FormField
          id="address"
          label={t('Location')}
          error={errors.address?.message}
        >
          <input
            id="address"
            className={fieldInputClass}
            placeholder="Rruga Pjeter Bogdani 8, Tirana"
            {...register('address')}
          />
        </FormField>
        <FormField id="phone" label={t('Phone')} error={errors.phone?.message}>
          <input
            id="phone"
            type="tel"
            className={fieldInputClass}
            placeholder="+355 4 222 3344"
            {...register('phone')}
          />
        </FormField>

        <FormField
          id="map"
          label={t('Pin on the map')}
          error={errors.latitude?.message ?? errors.longitude?.message}
          hint={t("Click the map or drag the pin to the gym's entrance.")}
        >
          <Suspense fallback={<Skeleton className="h-[320px]" />}>
            <MapPicker
              key={location?.id ?? 'new'}
              latitude={latitude}
              longitude={longitude}
              initialCenter={
                location?.latitude != null && location.longitude != null
                  ? {
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }
                  : null
              }
              onChange={pickPoint}
            />
          </Suspense>
          {latitude != null && longitude != null ? (
            <p className="mt-2 text-xs tabular-nums text-bone/50">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          ) : null}
        </FormField>

        <FormField
          id="mapUrl"
          label={t('Google Maps link (optional)')}
          error={errors.mapUrl?.message}
          hint={t(
            'Paste the share link from Google Maps. Without it members get a link built from the pin.'
          )}
        >
          <input
            id="mapUrl"
            type="url"
            className={fieldInputClass}
            placeholder="https://maps.app.goo.gl/..."
            {...register('mapUrl')}
          />
        </FormField>
      </form>
    </Drawer>
  );
};
