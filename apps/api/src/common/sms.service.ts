import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendParentHealthAlert(phone: string, childName: string, message: string): Promise<boolean> {
    const username = this.config.get<string>('AFRICASTALKING_USERNAME');
    const apiKey = this.config.get<string>('AFRICASTALKING_API_KEY');
    const senderId = this.config.get<string>('AFRICASTALKING_SENDER_ID');

    if (!username || !apiKey) {
      this.logger.warn(`Health SMS not sent for ${childName}: configure AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY`);
      return false;
    }

    const normalizedPhone = phone.replace(/[^0-9+]/g, '').replace(/^0/, '+254');
    const body = new URLSearchParams({
      username,
      to: normalizedPhone,
      message,
    });
    if (senderId) body.set('from', senderId);

    try {
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          apiKey,
        },
        body,
      });

      if (!response.ok) {
        this.logger.error(`Health SMS failed for ${childName}: HTTP ${response.status}`);
        return false;
      }

      this.logger.log(`Health SMS sent to parent of ${childName}`);
      return true;
    } catch (error) {
      this.logger.error(`Health SMS failed for ${childName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
}