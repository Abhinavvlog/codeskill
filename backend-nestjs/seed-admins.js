const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const crypto = require('crypto');

const uri = "mongodb+srv://mdshadabazamansari:123123123123@cluster0.gwcfd5x.mongodb.net/codeskill?retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: { type: String, select: false },
    role: String,
    isAdmin: Boolean,
    uid: String,
    isActive: Boolean,
    forcePasswordChange: Boolean,
    createdAt: Date,
    updatedAt: Date
  }, { strict: false });

  const User = mongoose.model('User', userSchema, 'users');
  const admins = [];

  for (let i = 1; i <= 5; i++) {
    const plainPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    const email = `admin${i}@codeskill.com`;
    
    let existing = await User.findOne({ email });
    if (!existing) {
      const u = new User({
        name: `System Admin ${i}`,
        email,
        password: hashedPassword,
        role: 'admin',
        isAdmin: true,
        uid: `ADM00${i}`,
        isActive: true,
        forcePasswordChange: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await u.save();
      admins.push({ email, name: u.name, uid: u.uid, password: plainPassword });
      console.log(`Created ${email}`);
    } else {
      console.log(`${email} already exists`);
    }
  }

  if (admins.length > 0) {
    const csv = 'Name,Email,UID,InitialPassword\n' + admins.map(a => `${a.name},${a.email},${a.uid},${a.password}`).join('\n');
    fs.writeFileSync('/Users/mdshadabazamansari/.gemini/antigravity-ide/brain/e9fd3d73-42f7-4523-9cf2-6a46f3f3f3a0/admins.csv', csv);
    console.log("Wrote admins.csv");
  }

  mongoose.disconnect();
}

run().catch(console.error);
