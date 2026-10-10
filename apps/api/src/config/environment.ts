export interface Env {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TTL: string;
  REFRESH_TTL: string;
  WEB_ORIGIN: string;
  TERMII_API_KEY?: string;
  TERMII_SENDER_ID?: string;
  UPLOAD_DIR: string;
}

export function env(): Env {
  return {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 3001),
    DATABASE_URL:
      process.env.DATABASE_URL ?? 'postgres://needit:needit@localhost:5432/needit',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    ACCESS_TTL: process.env.ACCESS_TTL ?? '15m',
    REFRESH_TTL: process.env.REFRESH_TTL ?? '7d',
    WEB_ORIGIN: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    TERMII_API_KEY: process.env.TERMII_API_KEY,
    TERMII_SENDER_ID: process.env.TERMII_SENDER_ID ?? 'NeedIt',
    UPLOAD_DIR: process.env.UPLOAD_DIR ?? 'uploads',
  };
}