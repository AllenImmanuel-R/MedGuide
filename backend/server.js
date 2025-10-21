const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Route files
const auth = require('./routes/auth');
const reports = require('./routes/reports');
const ai = require('./routes/ai');
const medicalReports = require('./routes/medicalReports');

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/reports', reports);
app.use('/api/v1/ai', ai);
app.use('/api/medical-reports', medicalReports);

// Default route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MedGuide API is running'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;