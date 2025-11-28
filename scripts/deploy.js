#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting deployment process...');

// Set environment variables for Railway
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.log('Available environment variables:');
  Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES')).forEach(key => {
    console.log(`${key}=${process.env[key]}`);
  });
  process.exit(1);
}

console.log('✅ Database URL found, proceeding with migration...');

try {
  // Run database migrations with explicit environment
  console.log('📊 Running database migrations...');
  execSync('pnpm drizzle-kit push', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL
    }
  });
  console.log('✅ Database migrations completed successfully!');
  
  // Start the application using the standalone build
  console.log('🌟 Starting the application...');
  execSync('node .next/standalone/server.js', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL
    }
  });
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}