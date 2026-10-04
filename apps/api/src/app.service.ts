import { Injectable } from '@nestjs/common';

const VERSION = '0.1.0';

@Injectable()
export class AppService {
  health() {
    return { status: 'ok', service: 'needit-api', version: VERSION, ts: new Date().toISOString() };
  }
}