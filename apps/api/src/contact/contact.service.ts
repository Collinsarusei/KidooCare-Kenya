import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ContactMessageDto, ContactTopic } from './contact.dto';

const TOPIC_LABEL: Record<ContactTopic, string> = {
  PARENT: 'Parent enquiry',
  DAYCARE: 'Daycare / school listing',
  PAYMENTS: 'Payments & billing',
  TECHNICAL: 'Technical support',
  PARTNERSHIP: 'Partnership',
  OTHER: 'Other',
};

const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  /** Simple in-memory rate limit: max 5 messages per IP per 15 minutes. */
  private readonly hits = new Map<string, number[]>();

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private rateLimit(ip: string) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const recent = (this.hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= 5) {
      throw new HttpException('Too many messages. Please try again in a few minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
    recent.push(now);
    this.hits.set(ip, recent);
  }

  private async resend(payload: Record<string, unknown>) {
    const apiKey = this.config.get<string>('RESEND_API_KEY') || process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_RESEND_API_KEY_HERE' || /^re_x+$/.test(apiKey.trim())) {
      return { ok: false, error: 'RESEND_API_KEY is not configured' };
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.text();
        this.logger.error(`Resend error (HTTP ${res.status}): ${detail}`);
        return { ok: false, error: `HTTP ${res.status}` };
      }
      return { ok: true, error: null };
    } catch (err: any) {
      this.logger.error(`Resend request failed: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  async submit(dto: ContactMessageDto, ip: string) {
    // Bots fill the hidden honeypot field — pretend success, send nothing
    if (dto.website && dto.website.trim() !== '') {
      return { success: true, message: 'Thank you! Your message has been sent.' };
    }
    this.rateLimit(ip || 'unknown');

    const from = this.config.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    const inbox = this.config.get<string>('CONTACT_TO_EMAIL') || process.env.CONTACT_TO_EMAIL || 'admin@kiddocare.co.ke';
    const topic = TOPIC_LABEL[dto.topic];
    const name = esc(dto.name.trim());
    const subject = dto.subject.trim();
    const body = esc(dto.message.trim()).replace(/\n/g, '<br/>');
    const phone = dto.phone?.trim() ? esc(dto.phone.trim()) : '—';

    // Keep a copy in the audit trail so no message is lost if email delivery fails
    const record = await this.prisma.auditLog.create({
      data: {
        entityType: 'ContactMessage',
        entityId: `contact-${Date.now()}`,
        action: 'CONTACT_FORM_SUBMITTED',
        actorId: 'PUBLIC_CONTACT_FORM',
        afterState: {
          name: dto.name.trim(),
          email: dto.email.trim(),
          phone: dto.phone?.trim() || null,
          topic,
          subject,
          message: dto.message.trim(),
        },
      },
    });

    const toTeam = await this.resend({
      from,
      to: [inbox],
      reply_to: dto.email.trim(),
      subject: `[KiddoCare Contact • ${topic}] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e6eeff;border-radius:16px;overflow:hidden">
          <div style="background:#004ac6;color:#fff;padding:16px 20px"><h2 style="margin:0">New contact message</h2>
            <p style="margin:4px 0 0;font-size:13px">${esc(topic)}</p></div>
          <div style="padding:20px;color:#121c2a;font-size:14px;line-height:1.6">
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
              <tr><td style="padding:4px 0;color:#737686;width:90px">Name</td><td><strong>${name}</strong></td></tr>
              <tr><td style="padding:4px 0;color:#737686">Email</td><td>${esc(dto.email.trim())}</td></tr>
              <tr><td style="padding:4px 0;color:#737686">Phone</td><td>${phone}</td></tr>
              <tr><td style="padding:4px 0;color:#737686">Subject</td><td>${esc(subject)}</td></tr>
            </table>
            <div style="background:#f8f9ff;border:1px solid #e6eeff;border-radius:12px;padding:14px">${body}</div>
            <p style="font-size:12px;color:#737686;margin-top:16px">Reply to this email to answer ${name} directly. Ref: ${record.id}</p>
          </div>
        </div>`,
    });

    if (!toTeam.ok) {
      this.logger.warn(`Contact message ${record.id} saved but not emailed: ${toTeam.error}`);
      return {
        success: true,
        emailed: false,
        message: 'Your message has been received. Our team will get back to you soon.',
      };
    }

    // Best-effort confirmation to the sender
    await this.resend({
      from,
      to: [dto.email.trim()],
      reply_to: inbox,
      subject: 'We received your message — KiddoCare Kenya',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e6eeff;border-radius:16px;overflow:hidden">
          <div style="background:#004ac6;color:#fff;padding:16px 20px"><h2 style="margin:0">KiddoCare Kenya</h2></div>
          <div style="padding:20px;color:#434655;font-size:14px;line-height:1.6">
            <p>Hi ${name},</p>
            <p>Thanks for contacting us about <strong>${esc(subject)}</strong>. Our team usually replies within one working day.</p>
            <p style="font-size:12px;color:#737686">Your message:</p>
            <div style="background:#f8f9ff;border:1px solid #e6eeff;border-radius:12px;padding:14px;font-size:13px">${body}</div>
          </div>
        </div>`,
    });

    return { success: true, emailed: true, message: 'Thank you! Your message has been sent. Check your inbox for a confirmation.' };
  }
}
