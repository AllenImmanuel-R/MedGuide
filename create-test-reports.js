/**
 * Create Test Reports Script
 * 
 * This script creates sample medical reports for testing comprehensive analysis
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection string (update if different)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medguide';

// Test user ID (string format, will be converted to ObjectId)
const TEST_USER_ID = 'test_user_comprehensive';

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

// Report Schema (replicate from backend/models/Report.js)
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
    type: String, // Use String to match our test user ID format
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

const Report = mongoose.model('TestReport', reportSchema);

// Sample report data
const sampleReports = [
  {
    name: 'Blood Test Results - January 2024',
    originalName: 'blood_test_jan_2024.pdf',
    fileName: 'test_blood_report_jan_2024.pdf',
    fileSize: 125000,
    fileType: 'application/pdf',
    description: 'Complete blood count and lipid panel results',
    category: 'lab-report',
    tags: ['blood test', 'CBC', 'lipid panel'],
    uploadDate: new Date('2024-01-15')
  },
  {
    name: 'X-Ray Chest - February 2024', 
    originalName: 'chest_xray_feb_2024.jpg',
    fileName: 'test_chest_xray_feb_2024.jpg',
    fileSize: 85000,
    fileType: 'image/jpeg',
    description: 'Routine chest X-ray examination',
    category: 'scan',
    tags: ['x-ray', 'chest', 'routine check'],
    uploadDate: new Date('2024-02-10')
  },
  {
    name: 'Prescription - Diabetes Medication',
    originalName: 'diabetes_prescription_march_2024.pdf',
    fileName: 'test_diabetes_prescription_march_2024.pdf', 
    fileSize: 45000,
    fileType: 'application/pdf',
    description: 'Updated diabetes medication prescription',
    category: 'prescription',
    tags: ['prescription', 'diabetes', 'medication'],
    uploadDate: new Date('2024-03-05')
  },
  {
    name: 'MRI Brain Scan - April 2024',
    originalName: 'brain_mri_april_2024.jpg',
    fileName: 'test_brain_mri_april_2024.jpg',
    fileSize: 200000, 
    fileType: 'image/jpeg',
    description: 'Brain MRI scan for headache investigation',
    category: 'scan',
    tags: ['MRI', 'brain', 'headache'],
    uploadDate: new Date('2024-04-20')
  },
  {
    name: 'Cardiac Stress Test - May 2024',
    originalName: 'cardiac_stress_test_may_2024.pdf',
    fileName: 'test_cardiac_stress_may_2024.pdf',
    fileSize: 95000,
    fileType: 'application/pdf', 
    description: 'Cardiac stress test and ECG results',
    category: 'lab-report',
    tags: ['cardiac', 'stress test', 'ECG'],
    uploadDate: new Date('2024-05-15')
  }
];

// Create test report files (dummy files)
async function createTestFiles() {
  const uploadsDir = path.join(__dirname, 'backend', 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }
  
  for (const report of sampleReports) {
    const filePath = path.join(uploadsDir, report.fileName);
    
    // Create dummy file content
    let content;
    if (report.fileType === 'application/pdf') {
      content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(${report.name} - Test Report) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000185 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
279
%%EOF`;
    } else {
      // For images, create a small placeholder
      content = `Test image file for ${report.name}`;
    }
    
    // Write test file
    report.filePath = filePath;
    fs.writeFileSync(filePath, content);
    console.log(`📄 Created test file: ${report.fileName}`);
  }
}

// Create test reports in database
async function createTestReports() {
  try {
    console.log('🧹 Cleaning existing test reports...');
    await Report.deleteMany({ userId: TEST_USER_ID });
    
    console.log('📋 Creating test reports...');
    
    for (const reportData of sampleReports) {
      const report = new Report({
        ...reportData,
        userId: TEST_USER_ID
      });
      
      await report.save();
      console.log(`✅ Created report: ${report.name}`);
    }
    
    console.log(`\\n🎉 Successfully created ${sampleReports.length} test reports for user: ${TEST_USER_ID}`);
    
  } catch (error) {
    console.error('❌ Error creating test reports:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Creating Test Reports for Comprehensive Analysis\\n');
  console.log(`👤 Test User ID: ${TEST_USER_ID}`);
  console.log(`🔗 MongoDB URI: ${MONGODB_URI}\\n`);
  
  await connectDB();
  await createTestFiles();
  await createTestReports();
  
  console.log('\\n✨ Test report creation completed!');
  console.log('\\n💡 You can now run comprehensive analysis tests with:');
  console.log('   node test-comprehensive-analysis.js');
  
  await mongoose.disconnect();
  console.log('\\n📊 Disconnected from MongoDB');
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