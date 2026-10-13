import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User as UserEntity } from './database/entities/user.entity';
import * as crypto from 'crypto';
import { validatePasswordPolicy } from './auth/password.util';

/**
 * Explicit administrator bootstrap procedure (AUD-001 / X-02).
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/create-admins.ts <email> [password] [name]
 * or via environment variables:
 *   ADMIN_BOOTSTRAP_EMAIL=admin@example.com ADMIN_BOOTSTRAP_PASSWORD=... npm run admin:bootstrap
 */
async function bootstrap() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  let password = args[1] || process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = args[2] || process.env.ADMIN_BOOTSTRAP_NAME || 'Super Administrator';

  if (!email || !email.includes('@')) {
    console.error('ERROR: A valid email address is required to bootstrap an administrator.');
    console.error('Usage: npm run admin:bootstrap <email> [password] [name]');
    process.exit(1);
  }

  let generatedPassword = false;
  if (!password) {
    // Generate a cryptographically secure random 24-character password
    password = crypto.randomBytes(18).toString('base64url');
    generatedPassword = true;
  } else {
    const policyErr = validatePasswordPolicy(password);
    if (policyErr) {
      console.error(`ERROR: Password does not meet security requirements: ${policyErr}`);
      process.exit(1);
    }
  }

  console.log(`Initializing application context to bootstrap admin for: ${email}`);
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get(getRepositoryToken(UserEntity));

  try {
    let user = await userRepository.findOne({ where: { email } });
    if (user) {
      user.isAdmin = true;
      user.role = 'super_admin';
      user.password = password;
      user.isActive = true;
      user.forcePasswordChange = generatedPassword;
      await userRepository.save(user);
      console.log(`[SUCCESS] Existing user ${email} upgraded to super_admin.`);
    } else {
      user = userRepository.create({
        name,
        email,
        password,
        role: 'super_admin',
        isAdmin: true,
        isActive: true,
        forcePasswordChange: generatedPassword,
        stats: {},
        profile: {},
        studentProfile: {},
      });
      await userRepository.save(user);
      console.log(`[SUCCESS] New super_admin account created for: ${email}`);
    }

    if (generatedPassword) {
      console.log('----------------------------------------------------');
      console.log('TEMPORARY GENERATED PASSWORD (SAVE SAFELY):');
      console.log(password);
      console.log('----------------------------------------------------');
    }
  } catch (err: any) {
    console.error(`[FAILURE] Admin bootstrap failed: ${err.message}`);
    await app.close();
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
