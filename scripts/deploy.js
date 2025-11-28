#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting deployment process...');

try {
  // Run database migrations
  console.log('📊 Running database migrations...');
  execSync('pnpm drizzle-kit push', { stdio: 'inherit' });
  console.log('✅ Database migrations completed successfully!');
  
  // Start the application using the standalone build
  console.log('🌟 Starting the application...');
  execSync('node .next/standalone/server.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}