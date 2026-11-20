import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@/config/env';
import { AppError } from '@/errors';

interface Mail {
  to: string;
  subject: string;
  text: string;
}

let transport: Transporter | null = null;

const smtp = (): Transporter => {
  transport ??= nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: env.mail.user
      ? { user: env.mail.user, pass: env.mail.pass }
      : undefined,
  });
  return transport;
};

// Sends through SMTP when SMTP_HOST is set. Without it development only logs the mail (tests stay
// silent) and production fails loudly instead of pretending a message went out.
export const sendMail = async (mail: Mail): Promise<void> => {
  if (env.mail.host) {
    await smtp().sendMail({ from: env.mail.from, ...mail });
    return;
  }
  if (env.nodeEnv === 'production') {
    throw new AppError(
      'Email is not available right now. Please try again later.',
      503,
      'EMAIL_UNAVAILABLE'
    );
  }
  if (env.nodeEnv !== 'test') {
    console.info(
      `[mail] NOT SENT (set SMTP_HOST in backend/.env to send real email) to ${mail.to}: ${mail.subject}\n${mail.text}`
    );
  }
};
