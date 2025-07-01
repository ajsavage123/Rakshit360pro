#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
}cess.exit(1);
}