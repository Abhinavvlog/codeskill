const path = require('path');
const fs = require('fs');

// Load environment variables from backend-nestjs/.env
const envPath = path.join(__dirname, '../backend-nestjs/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const backendModules = path.join(__dirname, '../backend-nestjs/node_modules');
const { Pool } = require(path.join(backendModules, 'pg'));
const bcrypt = require(path.join(backendModules, 'bcryptjs'));

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:password123@127.0.0.1:5432/codeskill';

async function main() {
  console.log('Connecting to PostgreSQL / AWS RDS...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  console.log('Connected to PostgreSQL successfully!');

  try {
    // List existing admins
    const res = await client.query(
      `SELECT id, name, email, role, "isAdmin", "isActive" FROM users WHERE "isAdmin" = true OR role = 'admin' OR role = 'super_admin'`
    );
    console.log(`\n--- EXISTING ADMINS (${res.rows.length}) ---`);
    for (const a of res.rows) {
      console.log(`- ${a.name} | ${a.email} | role: ${a.role || 'admin'} | isAdmin: ${a.isAdmin}`);
    }

    // CLI Arguments or Default list of admins to seed
    const cliEmail = process.argv[2];
    const cliPassword = process.argv[3];
    const cliName = process.argv[4];

    const adminList = [
      {
        email: 'admin@codeskill.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        name: 'System Administrator',
        role: 'super_admin'
      },
      {
        email: 'admin@cuchd.in',
        password: process.env.ADMIN_CUCHD_PASSWORD || 'Admin@CodeSkill2026',
        name: 'Chandigarh University Administrator',
        role: 'super_admin'
      },
      {
        email: 'md.shadab.azam.ansari@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        name: 'Md Shadab Azam Ansari',
        role: 'super_admin'
      }
    ];

    if (cliEmail && cliPassword) {
      adminList.unshift({
        email: cliEmail.trim().toLowerCase(),
        password: cliPassword.trim(),
        name: cliName || 'Administrator',
        role: 'super_admin'
      });
    }

    console.log('\n--- SEEDING / UPDATING ADMIN ACCOUNTS ---');
    for (const item of adminList) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(item.password, salt);
      const email = item.email.toLowerCase();

      const existing = await client.query('SELECT id, name FROM users WHERE LOWER(email) = $1', [email]);

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO users (id, name, email, password, role, "isAdmin", "isActive", "authProvider", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, true, 'local', NOW(), NOW())`,
          [item.name, email, hashedPassword, item.role]
        );
        console.log(`✅ Created Admin: ${email} (Password: ${item.password})`);
      } else {
        await client.query(
          `UPDATE users SET password = $1, "isAdmin" = true, role = $2, "isActive" = true, name = COALESCE(NULLIF(name, ''), $3), "updatedAt" = NOW()
           WHERE LOWER(email) = $4`,
          [hashedPassword, item.role, item.name, email]
        );
        console.log(`✅ Updated Admin: ${email} (Password: ${item.password})`);
      }
    }

    console.log('\n========================================');
    console.log('ACTIVE ADMIN LOGIN CREDENTIALS:');
    console.log('----------------------------------------');
    for (const item of adminList) {
      console.log(`Email:    ${item.email}`);
      console.log(`Password: ${item.password}`);
      console.log(`Role:     ${item.role}`);
      console.log('----------------------------------------');
    }
    console.log('Login URL: /login or /admin/login');
    console.log('========================================\n');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
