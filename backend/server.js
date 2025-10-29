const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
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
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080'
];

if ((process.env.NODE_ENV || 'development') !== 'production') {
  app.use(cors({
    origin: function (_origin, callback) {
      return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200
  }));
} else {
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const lanRegex = /^http:\/\/(localhost|127\.0\.0\.1|10\.[0-9]+\.[0-9]+\.[0-9]+|192\.168\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+):[0-9]+$/;
      if (allowedOrigins.includes(origin) || lanRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 200
  }));
}

// Static: serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route files
const auth = require('./routes/auth');
const reports = require('./routes/reports');
const ai = require('./routes/ai');
const medicalReports = require('./routes/medicalReports');

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/reports', reports);
app.use('/api/v1/ai', ai);
app.use('/api/v1/medical-reports', medicalReports);

// Default route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MedGuide API is running'
  });
});

// Debug auth route
app.get('/debug/auth', require('./middleware/auth').protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'You are authenticated'
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
