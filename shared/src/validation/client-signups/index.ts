import { z } from 'zod';
import { genderSchema, passwordSchema } from '../common';
import { COUNTRY_CODES } from '../gyms';

const email = z.email('Enter a valid email address.');

// The code in a gym's join link; empty means the visitor joins the HealthFIT community instead.
const joinCode = z.string().trim().min(1).max(100).optional();

const confirmPassword = z.string().min(1, 'Please confirm the new password.');

const passwordsMatch = {
  message: 'Confirmation must match the new password.',
  path: ['confirmPassword'],
};

// The 6-digit code emailed to the person; it proves the email is theirs.
const emailCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code.');

// Step 1: is this email already known? A new email, or a gym's client, is emailed a code.
export const clientSignupLookupSchema = z.object({ email });

// A person who is not a member anywhere yet; the gym asks for the same details when it adds a client.
const clientSignupDetailsSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Surname is required.'),
  email,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{6,20}$/, 'Enter a valid phone number.'),
  gender: genderSchema,
  // Where the member lives: the community suggests the gyms of that country first.
  country: z.enum(COUNTRY_CODES, { error: 'Choose the country.' }),
  password: passwordSchema,
  joinCode,
});

// What the API takes: the details plus the emailed code.
export const clientSignupSchema = clientSignupDetailsSchema.extend({
  code: emailCode,
});

// A client a gym already created: the code proves the email is theirs, then they choose a password.
export const clientClaimSchema = z.object({
  email,
  code: emailCode,
  password: passwordSchema,
});

// The details form adds a confirmation field; the code is asked in the next step.
export const clientSignupFormSchema = clientSignupDetailsSchema
  .extend({ confirmPassword })
  .refine(
    (values) => values.password === values.confirmPassword,
    passwordsMatch
  );

// The step that asks for the emailed code.
export const emailCodeFormSchema = z.object({ code: emailCode });

export type ClientSignupLookupValues = z.infer<typeof clientSignupLookupSchema>;
export type ClientSignupValues = z.infer<typeof clientSignupSchema>;
export type ClientClaimValues = z.infer<typeof clientClaimSchema>;
export type ClientSignupFormValues = z.infer<typeof clientSignupFormSchema>;
export type EmailCodeFormValues = z.infer<typeof emailCodeFormSchema>;
