import React from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Alert } from '@/components/ui/Alert';
import { BrandMark } from '@/components/ui/BrandMark';
import { BrandName } from '@/components/ui/BrandName';
import { Button } from '@/components/ui/Button';
import { useSubmitSignupRequest } from '@/hooks/signup-requests';
import type { CountryCode, CurrencyCode } from '@gym/shared/types';
import { COUNTRY_CODES, COUNTRY_CURRENCIES } from '@gym/shared/validation/gyms';
import {
  signupRequestSchema,
  type SignupRequestValues,
} from '@gym/shared/validation/signup-requests';

// English only, like the landing page it is reached from.
const countryNames: Record<CountryCode, string> = {
  AL: 'Albania',
  GB: 'United Kingdom',
  IT: 'Italy',
  DE: 'Germany',
  GR: 'Greece',
};

const currencyNames: Record<CurrencyCode, string> = {
  ALL: 'Albanian lek (ALL)',
  EUR: 'euro (EUR)',
  GBP: 'pound sterling (GBP)',
};

const Confirmation: React.FC = () => (
  <div className="text-center">
    <h1 className="text-3xl font-semibold tracking-tight">Request received</h1>
    <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-bone/60">
      Thank you. We check every gym before opening it on the platform and will
      review your request shortly. Once it is approved you can sign in with the
      email and password you just chose.
    </p>
    <div className="mt-8 flex justify-center gap-3">
      <Link
        to="/"
        className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-bone/80 transition hover:bg-white/10"
      >
        Back to home
      </Link>
      <Link
        to="/login"
        className="rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90"
      >
        Go to sign in
      </Link>
    </div>
  </div>
);

export const SignUpPage: React.FC = () => {
  const submitRequest = useSubmitSignupRequest();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupRequestValues>({
    resolver: zodResolver(signupRequestSchema),
    defaultValues: {
      ownerName: '',
      email: '',
      phone: '',
      password: '',
      gymName: '',
      country: 'AL',
      location: '',
      address: '',
      locationsCount: 1,
      notes: '',
      company: '',
    },
  });

  const field = { translate: false } as const;

  return (
    <div className="app-shell min-h-screen bg-ink text-bone">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark className="h-7 w-7" />
          <BrandName className="text-base" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-bone/70 transition hover:text-bone"
          >
            Sign in
          </Link>
          <ThemeToggle variant="icon" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        {submitRequest.isSuccess ? (
          <Confirmation />
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              Register your gym
            </h1>
            <p className="mb-8 mt-3 max-w-xl text-sm leading-relaxed text-bone/60">
              For gym owners. Tell us about yourself and your gym; we verify
              every request before opening an account.
            </p>

            <form
              className="space-y-8"
              noValidate
              onSubmit={handleSubmit((values) => submitRequest.mutate(values))}
            >
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold text-bone">
                  About you
                </legend>
                <FormField
                  id="ownerName"
                  label="Full name"
                  error={errors.ownerName?.message}
                  {...field}
                >
                  <input
                    id="ownerName"
                    autoComplete="name"
                    className={fieldInputClass}
                    {...register('ownerName')}
                  />
                </FormField>
                <FormField
                  id="phone"
                  label="Phone"
                  error={errors.phone?.message}
                  {...field}
                >
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+355 69 123 4567"
                    className={fieldInputClass}
                    {...register('phone')}
                  />
                </FormField>
                <FormField
                  id="email"
                  label="Email"
                  error={errors.email?.message}
                  {...field}
                >
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@gym.com"
                    className={fieldInputClass}
                    {...register('email')}
                  />
                </FormField>
                <FormField
                  id="password"
                  label="Password"
                  hint="At least 8 characters, with a number and an uppercase letter. You will sign in with it."
                  error={errors.password?.message}
                  {...field}
                >
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className={fieldInputClass}
                    {...register('password')}
                  />
                </FormField>
              </fieldset>

              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold text-bone">
                  Your gym
                </legend>
                <FormField
                  id="gymName"
                  label="Gym name"
                  error={errors.gymName?.message}
                  {...field}
                >
                  <input
                    id="gymName"
                    className={fieldInputClass}
                    {...register('gymName')}
                  />
                </FormField>
                <FormField
                  id="country"
                  label="Country"
                  hint={`Your members pay in ${currencyNames[COUNTRY_CURRENCIES[watch('country')]]}. It follows the country and cannot be changed once you add prices.`}
                  error={errors.country?.message}
                  {...field}
                >
                  <select
                    id="country"
                    className={fieldInputClass}
                    {...register('country')}
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>
                        {countryNames[code]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  id="location"
                  label="City"
                  error={errors.location?.message}
                  {...field}
                >
                  <input
                    id="location"
                    className={fieldInputClass}
                    {...register('location')}
                  />
                </FormField>
                <FormField
                  id="locationsCount"
                  label="Number of locations"
                  error={errors.locationsCount?.message}
                  {...field}
                >
                  <input
                    id="locationsCount"
                    type="number"
                    min={1}
                    max={50}
                    className={fieldInputClass}
                    {...register('locationsCount', { valueAsNumber: true })}
                  />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField
                    id="address"
                    label="Address of your main location"
                    error={errors.address?.message}
                    {...field}
                  >
                    <input
                      id="address"
                      autoComplete="street-address"
                      placeholder="Street, number"
                      className={fieldInputClass}
                      {...register('address')}
                    />
                  </FormField>
                </div>
                <div className="sm:col-span-2">
                  <FormField
                    id="notes"
                    label="Anything we should know? (optional)"
                    hint="For example your website, social pages or how many members you have."
                    error={errors.notes?.message}
                    {...field}
                  >
                    <textarea
                      id="notes"
                      rows={4}
                      className={fieldInputClass}
                      {...register('notes')}
                    />
                  </FormField>
                </div>
              </fieldset>

              {/* Hidden from people; bots fill it in and are ignored by the server. */}
              <div
                aria-hidden
                className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
              >
                <label>
                  Company
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    {...register('company')}
                  />
                </label>
              </div>

              {submitRequest.error ? (
                <Alert>{submitRequest.error.message}</Alert>
              ) : null}

              <Button
                type="submit"
                className="w-full sm:w-auto"
                loading={submitRequest.isPending}
              >
                {submitRequest.isPending ? 'Sending' : 'Send request'}
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};
