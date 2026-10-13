import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'CRITICAL: Running dataSource.synchronize() in production is strictly forbidden (AUD-011). Exiting.',
    );
    process.exit(1);
  }

  console.log('Connecting to app module to sync database...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  console.log('Synchronizing database schema...');
  await dataSource.synchronize();
  console.log('Schema synchronized successfully!');

  await app.close();
  process.exit(0);
}

bootstrap();
