const mongoose = require('mongoose');

const MedicalReportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    category: { type: String, default: 'medical' },
    description: { type: String },
    tags: { type: [String], default: [] },
    country: { type: String },
    travelDate: { type: String },
    isVaccination: { type: Boolean, default: false },
    isPrescription: { type: Boolean, default: false },
    userId: { type: String, default: null }
  },
  { timestamps: { createdAt: 'uploadDate', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('MedicalReport', MedicalReportSchema);
