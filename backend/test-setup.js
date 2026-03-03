/**
 * Basic setup test for PawBridge Backend
 * Run this to verify your environment is configured correctly
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testSetup() {
  console.log('🔍 Testing PawBridge Backend Setup...\n');

  // Test 1: Environment Variables
  console.log('1. Checking environment variables...');
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    console.log('   Please check your .env file\n');
    return;
  }
  console.log('✅ Environment variables configured\n');

  // Test 2: Database Connection
  console.log('2. Testing database connection...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Test basic query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables in database`);
    } else {
      console.log('⚠️  No tables found. Run: mysql -u root -p pawbridge < database/schema.sql');
    }
    
    await connection.end();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('   Please check your database configuration and ensure MySQL is running\n');
    return;
  }
  console.log('');

  // Test 3: Required Dependencies
  console.log('3. Checking dependencies...');
  try {
    require('express');
    require('mysql2');
    require('bcrypt');
    require('jsonwebtoken');
    require('multer');
    require('nodemailer');
    console.log('✅ All required dependencies installed\n');
  } catch (error) {
    console.log('❌ Missing dependencies:', error.message);
    console.log('   Run: npm install\n');
    return;
  }

  // Test 4: File Upload Directory
  console.log('4. Checking upload directory...');
  const fs = require('fs');
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`✅ Created upload directory: ${uploadDir}`);
    } catch (error) {
      console.log(`❌ Failed to create upload directory: ${error.message}`);
    }
  } else {
    console.log(`✅ Upload directory exists: ${uploadDir}`);
  }
  console.log('');

  // Test 5: Services
  console.log('5. Testing service modules...');
  try {
    const aiService = require('./src/services/aiService');
    const geoService = require('./src/services/geoService');
    const mediaService = require('./src/services/mediaService');
    const emailService = require('./src/services/emailService');
    const notificationService = require('./src/services/notificationService');
    
    console.log('✅ All service modules loaded successfully\n');
  } catch (error) {
    console.log('❌ Service module error:', error.message);
    return;
  }

  console.log('🎉 Setup test completed successfully!');
  console.log('You can now start the server with: npm run dev');
}

// Run the test
testSetup().catch(console.error);