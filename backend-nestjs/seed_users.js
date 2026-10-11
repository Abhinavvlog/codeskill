const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');

async function seed() {
  const dbUrl = process.env.DATABASE_URL || "postgres://postgres:password123@127.0.0.1:5432/codeskill";
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const password = "12345678";
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const csvLines = ["role,name,email,uid,password"];
  
  // 5 Admins
  for (let i = 1; i <= 5; i++) {
    const name = `Mustakim Admin ${i}`;
    const email = `mustakim_admin${i}@codeskill.com`;
    const uid = `ADM${i}`;
    csvLines.push(`admin,${name},${email},${uid},${password}`);
    
    try {
      await client.query(`
        INSERT INTO users (name, email, password, role, uid, "isAdmin") 
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
      `, [name, email, hashedPassword, 'admin', uid, true]);
    } catch (e) { console.error("Error inserting admin:", e); }
  }

  // 10 Students
  for (let i = 1; i <= 10; i++) {
    const name = `Student ${i}`;
    const email = `student${i}@codeskill.com`;
    const uid = `STU${i}`;
    csvLines.push(`student,${name},${email},${uid},${password}`);
    
    try {
      await client.query(`
        INSERT INTO users (name, email, password, role, uid, "isAdmin", "isAssessmentStudent") 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
      `, [name, email, hashedPassword, 'student', uid, false, true]);
    } catch (e) { console.error("Error inserting student:", e); }
  }

  fs.writeFileSync('../users_test_data.csv', csvLines.join('\n'));
  console.log("Seeding complete. CSV saved to users_test_data.csv");
  await client.end();
}

seed().catch(console.error);
