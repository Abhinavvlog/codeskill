#!/bin/bash
set -e

echo "============================================="
echo "   CodeSkill EC2 Setup (NO DOCKER)           "
echo "============================================="

# 1. Update and install basic dependencies
echo "[1/8] Updating system..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential

# 2. Install Sandbox Execution Dependencies
echo "[2/8] Installing sandbox dependencies (Java, Python, G++)..."
sudo apt-get install -y openjdk-17-jdk python3 g++

# 3. Install Node.js
echo "[3/8] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 4. Install PostgreSQL & Redis directly on host
echo "[4/8] Installing PostgreSQL and Redis..."
sudo apt-get install -y postgresql postgresql-contrib redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 5. Setup Project Env Files (Placeholder)
echo "[5/8] Setting up environment files..."
if [ ! -f backend-nestjs/.env ]; then
  echo "PORT=5001" > backend-nestjs/.env
  echo "DATABASE_URL=postgresql://postgres:password123@localhost:5432/codeskill" >> backend-nestjs/.env
  echo "REDIS_HOST=localhost" >> backend-nestjs/.env
  echo "REDIS_PORT=6379" >> backend-nestjs/.env
  echo "JWT_SECRET=super_secret_jwt_key_here" >> backend-nestjs/.env
  echo "# AWS_REGION=us-east-1" >> backend-nestjs/.env
  echo "# AWS_ACCESS_KEY_ID=" >> backend-nestjs/.env
  echo "# AWS_SECRET_ACCESS_KEY=" >> backend-nestjs/.env
  echo "# AWS_S3_BUCKET_NAME=" >> backend-nestjs/.env
fi

if [ ! -f frontend-v2/.env.local ]; then
  echo "NEXT_PUBLIC_API_URL=http://your-ec2-ip:5001" > frontend-v2/.env.local
fi

# 6. Build Backend
echo "[6/8] Building Backend..."
cd backend-nestjs
npm install
npm run build
cd ..

# 7. Build Frontend
echo "[7/8] Building Frontend..."
cd frontend-v2
npm install
npm run build
cd ..

# 8. Start with PM2
echo "[8/8] Starting applications with PM2..."
mkdir -p logs
pm2 start ecosystem.config.js

# Save PM2 process list so they start on reboot
pm2 save
pm2 startup | sudo bash || true

echo "============================================="
echo "   Setup Complete!                           "
echo "============================================="
echo "Backend running on port 5001"
echo "Frontend running on port 3000"
echo "Remember to edit your .env files and add your AWS S3 credentials!"
