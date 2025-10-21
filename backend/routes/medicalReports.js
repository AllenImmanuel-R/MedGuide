const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MedicalReport = require('../models/MedicalReport');
const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'medical-reports');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// @desc    Upload medical report
// @route   POST /api/v1/medical-reports/upload
// @access  Private
router.post('/upload', require('../middleware/auth').protect, upload.single('report'), async (req, res) => {
  try {
    console.log('Upload request from user:', req.user?.email, 'User ID:', req.user?._id);
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let metadata = {};
    if (req.body?.metadata) {
      try { metadata = JSON.parse(req.body.metadata); } catch (_) {}
    }

    const doc = await MedicalReport.create({
      name: metadata.name || req.file.originalname,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: path.join('uploads', 'medical-reports', req.file.filename),
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      category: metadata.category || 'medical',
      description: metadata.description,
      tags: metadata.tags || [],
      country: metadata.country,
      travelDate: metadata.travelDate,
      isVaccination: Boolean(metadata.isVaccination),
      isPrescription: Boolean(metadata.isPrescription),
      userId: req.user._id.toString()
    });

    console.log('Created report for user:', req.user._id, 'Report ID:', doc._id);

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      data: {
        id: doc._id,
        _id: doc._id,
        name: doc.name,
        originalName: doc.originalName,
        filename: doc.fileName,
        fileName: doc.fileName,
        size: doc.fileSize,
        fileSize: doc.fileSize,
        mimetype: doc.fileType,
        fileType: doc.fileType,
        uploadedAt: doc.uploadDate,
        readableSize: `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB`,
        category: doc.category,
        description: doc.description,
        tags: doc.tags,
        country: doc.country,
        travelDate: doc.travelDate,
        url: `/${doc.filePath.replace(/\\/g, '/')}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'File upload error: ' + error.message });
  }
});

// @desc    Get all uploaded reports
// @route   GET /api/v1/medical-reports
// @access  Private
router.get('/', require('../middleware/auth').protect, async (req, res) => {
  try {
    const docs = await MedicalReport.find({ userId: req.user._id.toString() }).sort({ uploadDate: -1 });
    const data = docs.map(doc => ({
      _id: doc._id,
      name: doc.name,
      originalName: doc.originalName,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      uploadDate: doc.uploadDate,
      readableSize: `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB`,
      category: doc.category,
      description: doc.description,
      tags: doc.tags,
      country: doc.country,
      travelDate: doc.travelDate,
      isVaccination: doc.isVaccination,
      isPrescription: doc.isPrescription,
      url: `/${doc.filePath.replace(/\\/g, '/')}`
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get single report
// @route   GET /api/v1/medical-reports/:id
// @access  Private
router.get('/:id', require('../middleware/auth').protect, async (req, res) => {
  try {
    const doc = await MedicalReport.findOne({ _id: req.params.id, userId: req.user._id.toString() });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete report
// @route   DELETE /api/v1/medical-reports/:id
// @access  Private
router.delete('/:id', require('../middleware/auth').protect, async (req, res) => {
  try {
    const doc = await MedicalReport.findOne({ _id: req.params.id, userId: req.user._id.toString() });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    // Remove file from disk if exists
    const abs = path.join(__dirname, '..', doc.filePath);
    if (fs.existsSync(abs)) {
      try { fs.unlinkSync(abs); } catch (_) {}
    }
    await doc.deleteOne();

    res.status(200).json({ success: true, message: 'Report deleted successfully', data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Download report file
// @route   GET /api/v1/medical-reports/:id/download
router.get('/:id/download', require('../middleware/auth').protect, async (req, res) => {
  try {
    const doc = await MedicalReport.findOne({ _id: req.params.id, userId: req.user._id.toString() });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    const abs = path.join(__dirname, '..', doc.filePath);
    if (!fs.existsSync(abs)) return res.status(404).json({ success: false, message: 'File not found' });
    res.download(abs, doc.originalName);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
