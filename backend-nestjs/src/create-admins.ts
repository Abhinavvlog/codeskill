import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User as UserEntity } from './database/entities/user.entity';
import * as fs from 'fs';
import * as crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get(getRepositoryToken(UserEntity));

  console.log('Generating 5 admin accounts...');
  
  const admins = [];
  
  for (let i = 1; i <= 5; i++) {
    const password = crypto.randomBytes(8).toString('hex'); // 16 char secure password
    const email = `admin${i}@codeskill.com`;
    const name = `System Admin ${i}`;
    
    // Check if exists
    let admin = await userRepository.findOne({ where: { email } });
    
    if (!admin) {
      admin = userRepository.create({
        name,
        email,
        password,
        role: 'admin',
        isAdmin: true,
        uid: `ADM00${i}`,
        isActive: true,
        forcePasswordChange: true
      });
      
      await userRepository.save(admin);
      admins.push({ name, email, password, uid: admin.uid });
      console.log(`Created admin: ${email}`);
    } else {
      console.log(`Admin ${email} already exists.`);
    }
  }

  if (admins.length > 0) {
    const csvHeader = 'Name,Email,UID,InitialPassword\n';
    const csvContent = admins.map(a => `${a.name},${a.email},${a.uid},${a.password}`).join('\n');
    
    fs.writeFileSync('admins.csv', csvHeader + csvContent);
    console.log('Credentials saved to admins.csv (KEEP THIS SECURE AND DO NOT COMMIT TO GIT)');
  }

  await app.close();
  process.exit(0);
}

bootstrap();
