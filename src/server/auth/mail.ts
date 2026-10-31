import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import type { validateEnvironment } from '../../config/env-schema';
export type AuthEnvironment = ReturnType<typeof validateEnvironment>;
export type AuthMail = {
  to: string;
  subject: string;
  text: string;
  kind: 'verify' | 'reset';
  url: string;
};
export function makeMailSender(env: AuthEnvironment) {
  return async (message: AuthMail) => {
    if (env.AUTH_EMAIL_TRANSPORT === 'local') {
      if (!['local', 'test'].includes(env.APP_ENV))
        throw new Error('Local mail transport is disabled outside development');
      const directory = env.APP_ENV === 'test' ? '.tools/mailbox-test' : '.tools/mailbox';
      await mkdir(directory, { recursive: true });
      await writeFile(
        `${directory}/${Date.now()}-${randomUUID()}.json`,
        JSON.stringify(message, null, 2),
        { mode: 0o600 },
      );
      return;
    }
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      requireTLS: !['local', 'test'].includes(env.APP_ENV),
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      connectionTimeout: 10000,
      socketTimeout: 15000,
      logger: false,
      debug: false,
    });
    try {
      await transport.sendMail({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    } finally {
      transport.close();
    }
  };
}
