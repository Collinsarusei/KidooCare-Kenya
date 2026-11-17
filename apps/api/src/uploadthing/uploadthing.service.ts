import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';

/** Absolute folder where uploaded files are stored (apps/api/uploads). */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class UploadthingService {
  private readonly logger = new Logger(UploadthingService.name);

  /**
   * Persists a base64 / data-URL encoded file to disk and returns a URL the
   * frontend can open directly (served by express static at /api/uploads).
   */
  async uploadFile(
    fileName: string,
    fileData: string,
    fileType: string,
  ): Promise<{ url: string; key: string; name: string; size: number; type: string }> {
    if (!fileData) throw new BadRequestException('No file data received');

    let mime = fileType;
    let base64 = fileData;
    const match = /^data:([^;]+);base64,(.*)$/s.exec(fileData);
    if (match) {
      mime = mime || match[1];
      base64 = match[2];
    }

    const ext = ALLOWED_TYPES[mime] || extname(fileName).toLowerCase();
    if (!Object.values(ALLOWED_TYPES).includes(ext)) {
      throw new BadRequestException('Only PDF, JPG, PNG, WEBP or GIF files are allowed');
    }

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length === 0) throw new BadRequestException('Uploaded file is empty');
    if (buffer.length > MAX_BYTES) throw new BadRequestException('File exceeds the 10MB limit');

    if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

    const safeBase = fileName
      .replace(extname(fileName), '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 50) || 'file';
    const key = `${Date.now()}-${randomBytes(4).toString('hex')}-${safeBase}${ext}`;
    writeFileSync(join(UPLOADS_DIR, key), buffer);

    this.logger.log(`Stored upload ${key} (${buffer.length} bytes)`);
    return {
      url: `/api/uploads/${key}`,
      key,
      name: fileName,
      size: buffer.length,
      type: mime,
    };
  }
}
