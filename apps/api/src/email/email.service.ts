import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private readonly isConfigured: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.isConfigured = true;
    } else {
      this.logger.warn('RESEND_API_KEY is not set. Emails will be mocked and printed to the console.');
      this.isConfigured = false;
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.isConfigured) {
      this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      const data = await this.resend.emails.send({
        from: 'KiddoCare <notifications@kiddocare.co.ke>',
        to,
        subject,
        html,
      });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw error;
    }
  }
}
