#!/usr/bin/env node

const { execSync } = require('child_process');

async function main() {
  console.log('🚀 Starting deployment process...');

  // Set environment variables for Railway
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';

  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.log('Available environment variables:');
    Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('PG')).forEach(key => {
      console.log(`${key}=${process.env[key]}`);
    });
    process.exit(1);
  }

  console.log('✅ Database URL found:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@')); // Hide password in logs
  console.log('🔍 Testing database connection before migration...');

  // Test database connection first
  try {
    const { Pool } = require('pg');
    
    // Parse DATABASE_URL to extract components
    const dbUrl = new URL(process.env.DATABASE_URL);
    const connectionConfig = {
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port),
      database: dbUrl.pathname.slice(1), // Remove leading /
      user: dbUrl.username,
      password: dbUrl.password,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      connectionTimeoutMillis: 30000,
      query_timeout: 30000,
    };
    
    console.log('🔧 Connection config:', {
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
      user: connectionConfig.user,
      ssl: connectionConfig.ssl,
    });
    
    const testPool = new Pool(connectionConfig);
    
    console.log('🔌 Attempting to connect to database...');
    const client = await testPool.connect();
    console.log('✅ Database connection successful!');
    
    console.log('🧪 Testing simple query...');
    const result = await client.query('SELECT 1 as test');
    console.log('✅ Query test successful:', result.rows[0]);
    
    client.release();
    await testPool.end();
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('Connection details:', {
      host: process.env.DATABASE_URL.match(/@([^:]+)/)?.[1],
      port: process.env.DATABASE_URL.match(/:(\d+)/)?.[1],
      database: process.env.DATABASE_URL.match(/\/([^?]+)/)?.[1],
    });
    console.error('Full error:', error);
    process.exit(1);
  }

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
    
    // Set PORT for Railway (Railway provides $PORT environment variable)
    const port = process.env.PORT || 5000;
    console.log(`🌐 Application will start on port: ${port}`);
    
    execSync('node .next/standalone/server.js', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        PORT: port,
        HOSTNAME: '0.0.0.0'
      }
    });
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Deployment script failed:', error);
  process.exit(1);
});