import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrapWorker() {
  if (process.env.PROCESS_ROLE !== 'judge') {
    throw new Error('The judge worker must start with PROCESS_ROLE=judge');
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  Logger.log('CodeSkill judge worker is ready', 'JudgeWorker');
}

bootstrapWorker().catch((error) => {
  Logger.error(error, 'JudgeWorker');
  process.exitCode = 1;
});
