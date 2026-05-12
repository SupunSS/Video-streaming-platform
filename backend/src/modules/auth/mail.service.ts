import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

type VerificationEmailParams = {
  to: string;
  username: string;
  verificationUrl: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(params: VerificationEmailParams) {
    const transporter = this.getTransporter();
    const safeUsername = this.escapeHtml(params.username);

    if (!transporter) {
      this.logger.warn(
        `SMTP is not configured. Verification URL for ${params.to}: ${params.verificationUrl}`,
      );
      return { sent: false };
    }

    const from =
      this.configService.get<string>('SMTP_FROM') ??
      this.configService.get<string>('SMTP_USER') ??
      'Flux <no-reply@flux.local>';

    await transporter.sendMail({
      from,
      to: params.to,
      subject: 'Verify your FLUX email',
      text: `Hi ${params.username}, verify your FLUX account: ${params.verificationUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#060814;color:#ffffff;padding:32px">
          <div style="max-width:520px;margin:0 auto;background:#0b1020;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:28px">
            <h1 style="margin:0 0 12px;font-size:24px">Verify your FLUX account</h1>
            <p style="color:rgba(255,255,255,.72);line-height:1.6">Hi ${safeUsername}, click the button below to verify your email address and approve your account.</p>
            <a href="${params.verificationUrl}" style="display:inline-block;margin-top:18px;background:#ffffff;color:#060814;text-decoration:none;font-weight:700;border-radius:10px;padding:12px 18px">Verify Email</a>
            <p style="margin-top:22px;color:rgba(255,255,255,.45);font-size:12px;line-height:1.6">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
          </div>
        </div>
      `,
    });

    return { sent: true };
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure:
        this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
