import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class CredentialsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async saveOrUpdateCredentials(
    schoolId: string,
    credentials: {
      mpesaConsumerKey: string;
      mpesaConsumerSecret: string;
      mpesaShortcode: string;
      mpesaPasskey: string;
    },
    providedBy: UserRole,
  ) {
    const keyEnc = this.encryptionService.encrypt(credentials.mpesaConsumerKey);
    const secretEnc = this.encryptionService.encrypt(credentials.mpesaConsumerSecret);
    const passkeyEnc = this.encryptionService.encrypt(credentials.mpesaPasskey);

    const record = await this.prisma.schoolPaymentCredentials.upsert({
      where: { schoolId },
      update: {
        mpesaConsumerKeyEncrypted: keyEnc.encryptedEnvelope,
        mpesaConsumerSecretEncrypted: secretEnc.encryptedEnvelope,
        mpesaShortcode: credentials.mpesaShortcode,
        mpesaPasskeyEncrypted: passkeyEnc.encryptedEnvelope,
        encryptionKeyVersion: keyEnc.version,
        providedAt: new Date(),
        providedBy,
      },
      create: {
        schoolId,
        mpesaConsumerKeyEncrypted: keyEnc.encryptedEnvelope,
        mpesaConsumerSecretEncrypted: secretEnc.encryptedEnvelope,
        mpesaShortcode: credentials.mpesaShortcode,
        mpesaPasskeyEncrypted: passkeyEnc.encryptedEnvelope,
        encryptionKeyVersion: keyEnc.version,
        providedAt: new Date(),
        providedBy,
      },
    });

    return this.sanitize(record);
  }

  async getSanitizedStatus(schoolId: string) {
    const record = await this.prisma.schoolPaymentCredentials.findUnique({
      where: { schoolId },
    });
    return this.sanitize(record);
  }

  /**
   * INTERNAL ONLY - Decrypts credentials in-memory for M-Pesa STK Push execution.
   * MUST NEVER be exposed in any API controller!
   */
  async getDecryptedCredentialsInternal(schoolId: string) {
    const record = await this.prisma.schoolPaymentCredentials.findUnique({
      where: { schoolId },
    });

    if (
      !record ||
      !record.mpesaConsumerKeyEncrypted ||
      !record.mpesaConsumerSecretEncrypted ||
      !record.mpesaShortcode ||
      !record.mpesaPasskeyEncrypted
    ) {
      throw new NotFoundException(`M-Pesa payment credentials not configured for school ${schoolId}`);
    }

    return {
      consumerKey: this.encryptionService.decrypt(record.mpesaConsumerKeyEncrypted),
      consumerSecret: this.encryptionService.decrypt(record.mpesaConsumerSecretEncrypted),
      shortcode: record.mpesaShortcode,
      passkey: this.encryptionService.decrypt(record.mpesaPasskeyEncrypted),
    };
  }

  private sanitize(record: any) {
    if (!record || !record.mpesaShortcode) {
      return {
        isConfigured: false,
        shortcodeLast4: null,
        providedAt: null,
        providedBy: null,
      };
    }

    const shortcode = record.mpesaShortcode || '';
    const last4 = shortcode.length >= 4 ? shortcode.slice(-4) : shortcode;

    return {
      isConfigured: true,
      shortcodeLast4: last4,
      providedAt: record.providedAt,
      providedBy: record.providedBy,
    };
  }
}
