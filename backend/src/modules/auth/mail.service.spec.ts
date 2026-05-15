import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

type ConfigValues = Record<string, string | undefined>;

const createMailService = (values: ConfigValues) => {
  const configService = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;

  return new MailService(configService);
};

describe('MailService', () => {
  const verificationEmail = {
    to: 'user@example.com',
    username: 'User',
    verificationUrl: 'http://localhost:3000/verify-email?token=test',
  };

  it('allows local development to continue without SMTP', async () => {
    const service = createMailService({ NODE_ENV: 'development' });

    await expect(
      service.sendVerificationEmail(verificationEmail),
    ).resolves.toEqual({ sent: false });
  });

  it('requires SMTP configuration in production', () => {
    const service = createMailService({ NODE_ENV: 'production' });

    expect(() => service.assertVerificationEmailReady()).toThrow(
      ServiceUnavailableException,
    );
  });

  it('can require SMTP outside production', () => {
    const service = createMailService({ SMTP_REQUIRED: 'true' });

    expect(() => service.assertVerificationEmailReady()).toThrow(
      ServiceUnavailableException,
    );
  });

  it('accepts a complete SMTP configuration', () => {
    const service = createMailService({
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_USER: 'owner@example.com',
      SMTP_PASS: 'app-password',
    });

    expect(() => service.assertVerificationEmailReady()).not.toThrow();
  });
});
