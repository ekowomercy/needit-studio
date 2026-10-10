import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  closeDatabase,
  getDatabase,
  type Database,
} from '@needit/db';

export const DATABASE = 'DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        return getDatabase({ connectionString: config.getOrThrow('DATABASE_URL') });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {
  async onApplicationShutdown() {
    await closeDatabase();
  }
}