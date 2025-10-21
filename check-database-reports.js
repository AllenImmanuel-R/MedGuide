/**
 * Check Database Reports Script
 * 
 * This script checks what reports exist in the database and their userId formats
 */

import mongoose from 'mongoose';

// MongoDB connection string (update if different)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medguide';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Report Schema - use the same as backend
const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Report name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true,
    unique: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.ObjectId, // Same as backend model
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['lab-report', 'prescription', 'scan', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

async function checkReports() {
  console.log('🔍 Checking existing reports in database...\n');
  
  try {
    // Get all reports
    const allReports = await Report.find({}).limit(10);
    console.log(`📋 Found ${allReports.length} reports total\n`);
    
    if (allReports.length > 0) {
      console.log('📄 Sample reports:');
      allReports.forEach((report, index) => {
        console.log(`${index + 1}. ${report.name}`);
        console.log(`   User ID: ${report.userId} (Type: ${typeof report.userId})`);
        console.log(`   Category: ${report.category}`);
        console.log(`   Upload Date: ${report.uploadDate}`);
        console.log(`   Active: ${report.isActive}`);
        console.log('');
      });
    }
    
    // Check for specific test user
    const testUserId = 'test_user_comprehensive';
    console.log(`🔍 Checking for reports with userId: "${testUserId}"`);
    
    // Try direct string search
    const stringReports = await Report.find({ userId: testUserId });
    console.log(`📋 Found ${stringReports.length} reports with string userId`);
    
    // Try ObjectId search (this will likely fail)
    try {
      const objectIdReports = await Report.find({ userId: new mongoose.Types.ObjectId() });
      console.log(`📋 ObjectId query worked - found ${objectIdReports.length} reports`);
    } catch (e) {
      console.log(`❌ ObjectId query failed: ${e.message}`);
    }
    
    // Show unique userIds
    const userIds = await Report.distinct('userId');
    console.log(`\n👥 Unique userIds in database (${userIds.length}):`);
    userIds.forEach((userId, index) => {
      console.log(`${index + 1}. ${userId} (Type: ${typeof userId}, Length: ${userId.toString().length})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking reports:', error);
  }
}

async function main() {
  console.log('🔍 Database Reports Check\n');
  console.log(`🔗 MongoDB URI: ${MONGODB_URI}\n`);
  
  await connectDB();
  await checkReports();
  
  await mongoose.disconnect();
  console.log('\n📊 Disconnected from MongoDB');
}

// Run the script
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });