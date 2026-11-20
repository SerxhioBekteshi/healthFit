import type { CountryCode } from '../gyms';

export type ClientSignupStatus = 'new' | 'registered' | 'gym_client';

// What the sign-up form learns from an email before asking for anything else.
export interface ClientSignupLookup {
  status: ClientSignupStatus;
  // For `gym_client`: the gym that already has this email as a client.
  gymName: string | null;
  // For `new` and `gym_client` a 6-digit code was emailed; it is good until this moment (ISO), about
  // one minute. Ask for it again with the same lookup call. Null for `registered`.
  expiresAt: string | null;
}

// What the join page shows before the visitor fills in the form.
export interface GymJoinPreview {
  gymName: string;
  gymCountry: CountryCode;
}

// The gym admin's permanent join link is `<web origin>/join/<joinCode>`.
export interface GymJoinCode {
  joinCode: string;
}

export interface ClientSignupResult {
  // The gym the new member belongs to; null means they joined the HealthFIT community without one.
  gymName: string | null;
}
