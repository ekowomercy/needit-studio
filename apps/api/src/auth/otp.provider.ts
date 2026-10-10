import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SMS OTP delivery. In development the console impl is used so flows work
 * with no credentials; when TERMII_API_KEY is present it sends via Termii.
 */
export interface OtpProvider {
  send(phone: string, code: string, purpose: string): Promise<boolean>;
}

@Injectable()
export class SmsOtpProvider implements OtpProvider {
  private readonly logger = new Logger(SmsOtpProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, code: string, _purpose: string): Promise<boolean> {
    const apiKey = this.config.get<string>('TERMII_API_KEY');
    if (!apiKey) return false;

    try {
      const senderId = this.config.get<string>('TERMII_SENDER_ID') ?? 'NeedIt';
      const res = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          to: phone,
          from: senderId,
          sms: `NeedIt code: ${code}. Valid for 10 minutes.`,
          type: 'plain',
          channel: 'generic',
        }),
      });
      const data = (await res.json()) as { status?: string };
      if (data.status !== 'success' && data.status !== 'Success') {
        this.logger.warn(`Termii send failed: ${JSON.stringify(data)}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(`Termii send error: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }
}