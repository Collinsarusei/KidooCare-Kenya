import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailSendResult {
  sent: boolean;
  message: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendSchoolCredentialsEmail(
    schoolName: string,
    recipientEmail: string,
    initialPassword: string,
  ): Promise<EmailSendResult> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || process.env.RESEND_API_KEY;
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

    // Detect unconfigured / placeholder key
    const PLACEHOLDER = 'YOUR_RESEND_API_KEY_HERE';
    const isPlaceholder = !apiKey || apiKey.trim() === '' || apiKey === PLACEHOLDER;

    const emailSubject = `Welcome to KiddoCare Kenya — Initial Login Credentials for ${schoolName}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6eeff; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #004ac6; padding: 16px; border-radius: 12px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0;">KiddoCare Kenya</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px;">Verified Daycares Platform</p>
        </div>
        <div style="padding: 20px 0;">
          <h3 style="color: #121c2a;">Welcome, ${schoolName}!</h3>
          <p style="color: #434655; line-height: 1.5;">
            Your childcare facility has been onboarded onto the KiddoCare Kenya platform. Below are your initial portal login credentials:
          </p>
          <div style="background-color: #f8f9ff; border: 1px solid #c3c6d7; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Portal Email:</strong> ${recipientEmail}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Initial Temporary Password:</strong> <code style="background: #e6eeff; padding: 4px 8px; border-radius: 4px; color: #004ac6; font-weight: bold;">${initialPassword}</code></p>
          </div>
          <p style="color: #c2410c; font-size: 13px; font-weight: bold;">
            🔒 Security Notice: You will be required to update your password immediately upon your first login.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:5173" style="background-color: #004ac6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-weight: bold; display: inline-block;">
              Log In to Portal &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    if (isPlaceholder) {
      this.logger.warn(
        `[EMAIL NOT SENT] RESEND_API_KEY is not configured. ` +
        `Set a real API key in apps/api/.env (RESEND_API_KEY=re_xxxxx) to enable email delivery.`,
      );
      this.logger.log(
        `[MANUAL DELIVERY REQUIRED] Recipient: ${recipientEmail} | School: ${schoolName} | TempPassword: ${initialPassword}`,
      );
      return {
        sent: false,
        message:
          'RESEND_API_KEY is not configured in apps/api/.env. Credentials were NOT emailed — deliver them manually.',
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          subject: emailSubject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Resend API Error (HTTP ${response.status}): ${errText}`);
        return {
          sent: false,
          message: `Resend API rejected the request (HTTP ${response.status}). Check your API key and sender domain configuration.`,
        };
      }

      const data = await response.json();
      this.logger.log(`📧 Onboarding email sent via Resend to ${recipientEmail}. Resend ID: ${data.id}`);
      return { sent: true, message: `Credentials email delivered to ${recipientEmail} via Resend.` };
    } catch (err: any) {
      this.logger.error(`Failed to send email via Resend: ${err.message}`);
      return { sent: false, message: `Email delivery error: ${err.message}` };
    }
  }

  async sendTutorCredentialsEmail(
    schoolName: string,
    recipientEmail: string,
    initialPassword: string,
  ): Promise<EmailSendResult> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || process.env.RESEND_API_KEY;
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

    // Detect unconfigured / placeholder key
    const PLACEHOLDER = 'YOUR_RESEND_API_KEY_HERE';
    const isPlaceholder = !apiKey || apiKey.trim() === '' || apiKey === PLACEHOLDER;

    const emailSubject = `Welcome to KiddoCare Kenya — Tutor Login Credentials`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6eeff; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #004ac6; padding: 16px; border-radius: 12px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0;">KiddoCare Kenya</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px;">Verified Daycares Platform</p>
        </div>
        <div style="padding: 20px 0;">
          <h3 style="color: #121c2a;">Welcome to the Team!</h3>
          <p style="color: #434655; line-height: 1.5;">
            You have been added as a Tutor/Caregiver for <strong>${schoolName}</strong> on the KiddoCare Kenya platform. Below are your initial portal login credentials:
          </p>
          <div style="background-color: #f8f9ff; border: 1px solid #c3c6d7; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Portal Email:</strong> ${recipientEmail}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Initial Temporary Password:</strong> <code style="background: #e6eeff; padding: 4px 8px; border-radius: 4px; color: #004ac6; font-weight: bold;">${initialPassword}</code></p>
          </div>
          <p style="color: #c2410c; font-size: 13px; font-weight: bold;">
            🔒 Security Notice: You will be required to update your password immediately upon your first login.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:5173" style="background-color: #004ac6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-weight: bold; display: inline-block;">
              Log In to Portal &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    if (isPlaceholder) {
      this.logger.warn(
        `[EMAIL NOT SENT] RESEND_API_KEY is not configured. ` +
        `Set a real API key in apps/api/.env (RESEND_API_KEY=re_xxxxx) to enable email delivery.`,
      );
      this.logger.log(
        `[MANUAL DELIVERY REQUIRED] Recipient: ${recipientEmail} | School: ${schoolName} | TempPassword: ${initialPassword}`,
      );
      return {
        sent: false,
        message:
          'RESEND_API_KEY is not configured in apps/api/.env. Credentials were NOT emailed — deliver them manually.',
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          subject: emailSubject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Resend API Error (HTTP ${response.status}): ${errText}`);
        return {
          sent: false,
          message: `Resend API rejected the request (HTTP ${response.status}). Check your API key and sender domain configuration.`,
        };
      }

      const data = await response.json();
      this.logger.log(`📧 Tutor credentials email sent via Resend to ${recipientEmail}. Resend ID: ${data.id}`);
      return { sent: true, message: `Credentials email delivered to ${recipientEmail} via Resend.` };
    } catch (err: any) {
      this.logger.error(`Failed to send email via Resend: ${err.message}`);
      return { sent: false, message: `Email delivery error: ${err.message}` };
    }
  }
}
