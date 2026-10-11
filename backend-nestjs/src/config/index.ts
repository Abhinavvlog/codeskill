import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}));

export const databaseConfig = registerAs('database', () => ({
  postgres: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'codeskill_pg',
    ssl: process.env.DATABASE_SSL === 'true',
    url: process.env.DATABASE_URL,
  },
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  url: process.env.REDIS_URL,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'supersecretcodeskilljwt',
  expiresIn: process.env.JWT_EXPIRE || '30d',
}));

export const awsConfig = registerAs('aws', () => ({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION || 'ap-south-1',
  sesSender: process.env.AWS_SES_SENDER || 'noreply@cuchd.in',
}));

export const oauthConfig = registerAs('oauth', () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID,
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
}));

export const adminConfig = registerAs('admin', () => ({
  emails:
    process.env.ADMIN_EMAILS ||
    process.env.ADMIN_EMAIL ||
    'admin@codeskill.com,admin@cuchd.in,md.shadab.azam.ansari@gmail.com,kanhamishra555@gmail.com,shaikhmustakim2942@gmail.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
}));
