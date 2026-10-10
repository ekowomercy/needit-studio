import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

@Injectable()
export class FilesService {
  /**
   * Dev storage: keep files on local disk under <UPLOAD_DIR>.
   * Swap this body for Cloudinary upload when credentials are configured.
   */
  async storeLocal(file: Express.Multer.File, uploadDir: string): Promise<{ url: string }> {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(uploadDir, { recursive: true });
    const name = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    const { writeFile } = await import('node:fs/promises');
    await writeFile(`${uploadDir}/${name}`, file.buffer);
    return { url: `/uploads/${name}` };
  }
}