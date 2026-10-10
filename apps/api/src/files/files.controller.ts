import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { AuthGuard } from '../auth/auth.guard';

interface UploadForm {
  purpose?: string;
  tags?: string;
}

@UseGuards(AuthGuard)
@Controller('files')
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly config: ConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    _form: UploadForm,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files provided');
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? 'uploads';
    const results = await Promise.all(files.map((f) => this.files.storeLocal(f, uploadDir)));
    return { items: results };
  }
}