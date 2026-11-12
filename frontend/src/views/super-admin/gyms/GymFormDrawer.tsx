import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import { countryConfig, countryNames } from '@/utils/constants/countries';
import type { CountryCode, Gym } from '@gym/shared/types';
import {
  COUNTRY_CODES,
  gymFormSchema,
  type GymFormValues,
} from '@gym/shared/validation/gyms';

interface GymFormDrawerProps {
  isOpen: boolean;
  gym: Gym | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: GymFormValues) => Promise<void>;
  onClose: () => void;
}

const emptyValues: GymFormValues = {
  name: '',
  location: '',
  country: 'AL',
  businessHours: '',
  opensAt: '06:00',
  closesAt: '22:00',
  timezone: 'Europe/Tirane',
  logoUrl: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  subdomain: '',
  customDomain: '',
};

const toValues = (gym: Gym): GymFormValues => ({
  name: gym.name,
  location: gym.location,
  country: gym.country,
  businessHours: gym.businessHours,
  opensAt: gym.opensAt,
  closesAt: gym.closesAt,
  timezone: gym.timezone,
  logoUrl: gym.logoUrl,
  address: gym.address,
  contactEmail: gym.contactEmail,
  contactPhone: gym.contactPhone,
  subdomain: gym.subdomain,
  customDomain: gym.customDomain,
});

export const GymFormDrawer: React.FC<GymFormDrawerProps> = ({
  isOpen,
  gym,
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
    formState: { errors },
  } = useForm<GymFormValues>({
    resolver: zodResolver(gymFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(gym ? toValues(gym) : emptyValues);
    }
  }, [gym, isOpen, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={gym ? t('Edit Gym') : t('Create Gym')}
      description={t('Fill in gym details and save your changes.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={gym ? t('Update gym') : t('Create gym')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField id="name" label={t('Gym Name')} error={errors.name?.message}>
          <input id="name" className={fieldInputClass} {...register('name')} />
        </FormField>

        <FormField
          id="location"
          label={t('Location')}
          error={errors.location?.message}
        >
          <input
            id="location"
            className={fieldInputClass}
            {...register('location')}
          />
        </FormField>

        <FormField
          id="country"
          label={t('Country')}
          hint={t(
            'Sets the language, currency and timezone members and staff start with.'
          )}
          error={errors.country?.message}
        >
          <select
            id="country"
            className={fieldInputClass}
            {...register('country', {
              // A new gym starts with the country's timezone; an existing one keeps its own.
              onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
                if (!gym) {
                  setValue(
                    'timezone',
                    countryConfig[event.target.value as CountryCode].timezone
                  );
                }
              },
            })}
          >
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {countryNames[code]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="businessHours"
          label={t('Business Hours')}
          error={errors.businessHours?.message}
        >
          <input
            id="businessHours"
            className={fieldInputClass}
            placeholder={t('Mon-Fri 06:00-22:00')}
            {...register('businessHours')}
          />
        </FormField>

        <div className="grid grid-cols-3 gap-3">
          <FormField
            id="opensAt"
            label={t('Opens')}
            error={errors.opensAt?.message}
          >
            <input
              id="opensAt"
              type="time"
              className={fieldInputClass}
              {...register('opensAt')}
            />
          </FormField>
          <FormField
            id="closesAt"
            label={t('Closes')}
            error={errors.closesAt?.message}
          >
            <input
              id="closesAt"
              type="time"
              className={fieldInputClass}
              {...register('closesAt')}
            />
          </FormField>
          <FormField
            id="timezone"
            label={t('Timezone')}
            error={errors.timezone?.message}
          >
            <input
              id="timezone"
              className={fieldInputClass}
              placeholder="Europe/Tirane"
              {...register('timezone')}
            />
          </FormField>
        </div>

        <FormField
          id="address"
          label={t('Address')}
          error={errors.address?.message}
        >
          <input
            id="address"
            className={fieldInputClass}
            placeholder={t('Street, City')}
            {...register('address')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="contactEmail"
            label={t('Contact Email')}
            error={errors.contactEmail?.message}
          >
            <input
              id="contactEmail"
              type="email"
              className={fieldInputClass}
              {...register('contactEmail')}
            />
          </FormField>
          <FormField
            id="contactPhone"
            label={t('Contact Phone')}
            error={errors.contactPhone?.message}
          >
            <input
              id="contactPhone"
              className={fieldInputClass}
              {...register('contactPhone')}
            />
          </FormField>
        </div>

        <FormField
          id="logoUrl"
          label={t('Logo URL')}
          error={errors.logoUrl?.message}
        >
          <input
            id="logoUrl"
            type="url"
            placeholder="https://..."
            className={fieldInputClass}
            {...register('logoUrl')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="subdomain"
            label={t('Subdomain')}
            error={errors.subdomain?.message}
          >
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] transition focus-within:border-signal/60 focus-within:ring-2 focus-within:ring-signal/20">
              <input
                id="subdomain"
                className="w-full rounded-l-xl border-0 bg-transparent px-3.5 py-2.5 text-sm text-bone outline-none placeholder:text-bone/30"
                placeholder="downtown"
                {...register('subdomain')}
              />
              <span className="whitespace-nowrap border-l border-white/10 px-2.5 py-2.5 text-xs text-bone/45">
                .platform.com
              </span>
            </div>
          </FormField>
          <FormField
            id="customDomain"
            label={t('Custom Domain')}
            error={errors.customDomain?.message}
          >
            <input
              id="customDomain"
              className={fieldInputClass}
              placeholder="yourgym.com"
              {...register('customDomain')}
            />
          </FormField>
        </div>
      </form>
    </Drawer>
  );
};
