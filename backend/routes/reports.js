const express = require('express');
const router = express.Router();

// @desc    Get all reports
// @route   GET /api/v1/reports
// @access  Private
router.get('/', async (req, res) => {
  try {
    // Mock reports data
    const reports = [
      {
        id: '1',
        title: 'Blood Test Report',
        date: new Date().toISOString(),
        type: 'blood',
        status: 'completed'
      },
      {
        id: '2',
        title: 'X-Ray Report',
        date: new Date().toISOString(),
        type: 'imaging',
        status: 'pending'
      }
    ];

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single report
// @route   GET /api/v1/reports/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const reportId = req.params.id;

    // Mock report data
    const report = {
      id: reportId,
      title: 'Blood Test Report',
      date: new Date().toISOString(),
      type: 'blood',
      status: 'completed',
      results: {
        hemoglobin: '14.2 g/dL',
        whiteBloodCells: '7.5 K/μL',
        platelets: '250 K/μL'
      }
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new report
// @route   POST /api/v1/reports
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, type, data } = req.body;

    // Mock report creation
    const report = {
      id: Date.now().toString(),
      title: title || 'New Report',
      type: type || 'general',
      data,
      date: new Date().toISOString(),
      status: 'pending'
    };

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
