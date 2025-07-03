#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const __dirname = __dirname;

try {
  console.log('🔨 Building Medical AI Assistant for Vercel...');
  
  // Install client dependencies
  console.log('📦 Installing client dependencies...');
  execSync('npm install', { 
    cwd: path.join(__dirname, 'client'), 
    stdio: 'inherit' 
  });
  
  // Build the client
  console.log('🏗️ Building client application...');
  execSync('npm run build', { 
    cwd: path.join(__dirname, 'client'), 
    stdio: 'inherit' 
  });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
