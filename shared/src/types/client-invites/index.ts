import type { CountryCode } from '../gyms';

// What the gym admin gets once; the server keeps only a hash, so the link cannot be shown again.
export interface ClientInvite {
  token: string;
  expiresAt: string;
}

// What the admin sees after emailing a link.
export interface ClientInviteSent {
  sentTo: string;
}

// What the invite page shows before the client chooses a password.
export interface ClientInvitePreview {
  clientName: string;
  email: string;
  gymName: string;
  gymCountry: CountryCode;
}
