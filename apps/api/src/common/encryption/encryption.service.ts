import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyVersion = 1;
  private readonly masterKey: Buffer;

  constructor(private configService: ConfigService) {
    const rawKey = this.configService.get<string>('MASTER_ENCRYPTION_KEY') || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    if (rawKey.length === 64) {
      this.masterKey = Buffer.from(rawKey, 'hex');
    } else {
      this.masterKey = crypto.createHash('sha256').update(rawKey).digest();
    }
  }

  /**
   * Encrypts a plaintext secret using AES-256-GCM envelope encryption.
   * Returns serialized envelope payload: v1:masterIv:masterTag:dataKeyEnc:iv:tag:ciphertext
   */
  encrypt(plaintext: string): { encryptedEnvelope: string; version: number } {
    if (!plaintext) {
      throw new InternalServerErrorException('Plaintext cannot be empty for encryption');
    }

    try {
      // 1. Generate random 32-byte data key & 12-byte IV for content
      const dataKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(12);

      // 2. Encrypt content with dataKey
      const cipher = crypto.createCipheriv(this.algorithm, dataKey, iv);
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      // 3. Encrypt dataKey with masterKey (Envelope)
      const masterIv = crypto.randomBytes(12);
      const masterCipher = crypto.createCipheriv(this.algorithm, this.masterKey, masterIv);
      let dataKeyEncrypted = masterCipher.update(dataKey.toString('hex'), 'utf8', 'hex');
      dataKeyEncrypted += masterCipher.final('hex');
      const masterAuthTag = masterCipher.getAuthTag().toString('hex');

      // 4. Serialize envelope
      const envelope = `v${this.keyVersion}:${masterIv.toString('hex')}:${masterAuthTag}:${dataKeyEncrypted}:${iv.toString('hex')}:${authTag}:${ciphertext}`;

      return {
        encryptedEnvelope: envelope,
        version: this.keyVersion,
      };
    } catch (err: any) {
      throw new InternalServerErrorException(`Encryption failed: ${err.message}`);
    }
  }

  /**
   * Decrypts an envelope payload back into plaintext secret in-memory.
   */
  decrypt(envelope: string): string {
    if (!envelope) return '';

    try {
      const parts = envelope.split(':');
      if (parts.length !== 7 || !parts[0].startsWith('v')) {
        throw new Error('Invalid envelope format');
      }

      const [versionStr, masterIvHex, masterAuthTagHex, dataKeyEncHex, ivHex, authTagHex, ciphertextHex] = parts;

      // Decrypt dataKey using masterKey
      const masterIv = Buffer.from(masterIvHex, 'hex');
      const masterAuthTag = Buffer.from(masterAuthTagHex, 'hex');
      const masterDecipher = crypto.createDecipheriv(this.algorithm, this.masterKey, masterIv);
      masterDecipher.setAuthTag(masterAuthTag);
      let dataKeyHex = masterDecipher.update(dataKeyEncHex, 'hex', 'utf8');
      dataKeyHex += masterDecipher.final('utf8');

      // Decrypt content using restored dataKey
      const dataKey = Buffer.from(dataKeyHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, dataKey, iv);
      decipher.setAuthTag(authTag);
      let plaintext = decipher.update(ciphertextHex, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (err: any) {
      throw new InternalServerErrorException(`Decryption failed: ${err.message}`);
    }
  }
}
